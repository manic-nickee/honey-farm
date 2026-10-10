import contextvars
import functools
import inspect
import json
import logging


logger = logging.getLogger("config.service")
_current_request = contextvars.ContextVar("current_service_request", default=None)
_service_call_depth = contextvars.ContextVar("service_call_depth", default=0)
MAX_USERNAME_LENGTH = 100
MAX_REQUEST_BODY_BYTES = 8192


def bind_service_request(request):
    return _current_request.set(request)


def reset_service_request(token):
    _current_request.reset(token)


def _username_from_request(request):
    if request is None:
        return None

    content_type = getattr(request, "content_type", "") or ""
    if content_type == "application/x-www-form-urlencoded":
        username = request.POST.get("username")
        if username:
            return username
    elif content_type == "application/json" or content_type.endswith("+json"):
        body = request.body
        if len(body) <= MAX_REQUEST_BODY_BYTES:
            try:
                data = json.loads(body)
            except (UnicodeDecodeError, ValueError):
                data = None
            if isinstance(data, dict) and isinstance(data.get("username"), str):
                return data["username"]

    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        return user.get_username()
    return None


def _username_for_call(function, args, kwargs):
    try:
        bound_arguments = inspect.signature(function).bind_partial(*args, **kwargs)
    except (TypeError, ValueError):
        bound_arguments = None

    if bound_arguments is not None:
        username = bound_arguments.arguments.get("username")
        if isinstance(username, str) and username:
            return username

    request = _current_request.get()
    return _username_from_request(request)


def _format_username(username):
    if not username:
        return "unknown"
    return json.dumps(username[:MAX_USERNAME_LENGTH], ensure_ascii=True)


def log_service_exception(error, service, operation, username=None):
    if username is None:
        username = _username_from_request(_current_request.get())

    logger.error(
        "service_exception service=%s operation=%s username=%s error_type=%s",
        service,
        operation,
        _format_username(username),
        type(error).__name__,
        exc_info=(type(error), error, error.__traceback__),
    )


def log_service_rejection(service, operation, error_type, username=None):
    logger.warning(
        "service_rejection service=%s operation=%s username=%s error_type=%s",
        service,
        operation,
        _format_username(username),
        error_type,
    )


def log_service_errors(function):
    service = function.__module__

    @functools.wraps(function)
    def wrapped(*args, **kwargs):
        depth_token = _service_call_depth.set(_service_call_depth.get() + 1)
        try:
            return function(*args, **kwargs)
        except Exception as error:
            if _service_call_depth.get() == 1:
                log_service_exception(
                    error,
                    service=service,
                    operation=function.__name__,
                    username=_username_for_call(function, args, kwargs),
                )
            raise
        finally:
            _service_call_depth.reset(depth_token)

    return wrapped
