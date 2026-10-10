import json
import logging
import time
import traceback
from html.parser import HTMLParser
from urllib.parse import parse_qs

from django.urls import Resolver404, resolve

from .service_logging import bind_service_request, reset_service_request


logger = logging.getLogger("config.request")
MAX_LOGGED_BODY_BYTES = 8192
MAX_SHAPE_DEPTH = 5
MAX_SHAPE_ITEMS = 20
MAX_VISIBLE_VALUE_LENGTH = 100
VISIBLE_LOGIN_FIELDS = frozenset({"username", "is_staff"})


def _redacted_shape(
    value,
    depth=0,
    reveal_value=False,
    visible_fields=frozenset(),
):
    if depth >= MAX_SHAPE_DEPTH:
        return "<max-depth>"
    if isinstance(value, dict):
        return {
            str(key)[:80]: _redacted_shape(
                item,
                depth + 1,
                reveal_value=depth == 0 and str(key).lower() in visible_fields,
                visible_fields=visible_fields,
            )
            for key, item in list(value.items())[:MAX_SHAPE_ITEMS]
        }
    if isinstance(value, list):
        shape = [
            _redacted_shape(
                item,
                depth + 1,
                reveal_value=reveal_value,
                visible_fields=visible_fields,
            )
            for item in value[:MAX_SHAPE_ITEMS]
        ]
        if len(value) > MAX_SHAPE_ITEMS:
            shape.append("<items-omitted>")
        return shape
    if reveal_value and isinstance(value, (str, int, float, bool)):
        if isinstance(value, str):
            return value[:MAX_VISIBLE_VALUE_LENGTH]
        return value
    return "<redacted>"


def _payload_shape(content_type, body, reveal_login_fields=False):
    if len(body) > MAX_LOGGED_BODY_BYTES:
        return "<omitted:body-too-large>"

    try:
        visible_fields = VISIBLE_LOGIN_FIELDS if reveal_login_fields else frozenset()
        if content_type == "application/json" or content_type.endswith("+json"):
            return _redacted_shape(json.loads(body), visible_fields=visible_fields)
        if content_type == "application/x-www-form-urlencoded":
            fields = parse_qs(body.decode("utf-8"), keep_blank_values=True)
            return _redacted_shape(fields, visible_fields=visible_fields)
    except (UnicodeDecodeError, ValueError):
        return "<unavailable:invalid-payload>"

    return "<omitted:unsupported-content-type>"


def _request_body_shape(request, reveal_login_fields=False):
    content_type = request.content_type or ""
    if content_type == "multipart/form-data":
        if request.META.get("CONTENT_LENGTH", "0").isdigit() and int(
            request.META.get("CONTENT_LENGTH", "0")
        ) > MAX_LOGGED_BODY_BYTES:
            return "<omitted:body-too-large>"
        return _redacted_shape(
            {key: request.POST.getlist(key) for key in request.POST.keys()},
            visible_fields=VISIBLE_LOGIN_FIELDS if reveal_login_fields else frozenset(),
        )
    if content_type not in {
        "application/json",
        "application/x-www-form-urlencoded",
    } and not content_type.endswith("+json"):
        return "<omitted:unsupported-content-type>"

    content_length = request.META.get("CONTENT_LENGTH", "")
    if content_length.isdigit() and int(content_length) > MAX_LOGGED_BODY_BYTES:
        return "<omitted:body-too-large>"

    body = request.body
    return _payload_shape(content_type, body, reveal_login_fields)


def _response_body_shape(response, reveal_login_fields=False):
    content_type = response.get("Content-Type", "").split(";", 1)[0].strip()
    if not (content_type == "application/json" or content_type.endswith("+json")):
        return "<omitted:non-json-response>"
    if getattr(response, "streaming", False):
        return "<omitted:streaming-response>"

    body = response.content
    return _payload_shape(content_type, body, reveal_login_fields)


def _route_for_request(request):
    resolver_match = getattr(request, "resolver_match", None)
    if resolver_match is not None:
        return resolver_match.route
    try:
        return resolve(request.path_info).route
    except Resolver404:
        return "unmatched"


class _AdminErrorNoteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._error_note_depth = 0
        self._text_parts = []

    def handle_starttag(self, tag, attrs):
        classes = dict(attrs).get("class", "").split()
        if "errornote" in classes:
            self._error_note_depth += 1

    def handle_endtag(self, tag):
        if self._error_note_depth:
            self._error_note_depth -= 1

    def handle_data(self, data):
        if self._error_note_depth:
            text = " ".join(data.split())
            if text:
                self._text_parts.append(text)


def _admin_login_error(response):
    if getattr(response, "streaming", False):
        return None

    parser = _AdminErrorNoteParser()
    parser.feed(response.content.decode("utf-8", errors="replace"))
    message = " ".join(parser._text_parts)
    return message[:500] if message else None


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        started_at = time.perf_counter()
        route = _route_for_request(request)
        reveal_login_fields = route in {"admin/login/", "api/auth/login/"}
        request_body = _request_body_shape(request, reveal_login_fields)
        request_token = bind_service_request(request)
        try:
            response = self.get_response(request)
        finally:
            reset_service_request(request_token)

        duration_ms = (time.perf_counter() - started_at) * 1000
        request_bytes = request.META.get("CONTENT_LENGTH", "-")
        response_bytes = response.get("Content-Length", "-")
        response_body = _response_body_shape(response, reveal_login_fields)

        logger.info(
            "http_request method=%s route=%s status=%s duration_ms=%.2f "
            "request_bytes=%s request_body_shape=%s response_bytes=%s "
            "response_body_shape=%s",
            request.method,
            route,
            response.status_code,
            duration_ms,
            request_bytes,
            json.dumps(request_body, separators=(",", ":"), ensure_ascii=True),
            response_bytes,
            json.dumps(response_body, separators=(",", ":"), ensure_ascii=True),
        )

        if (
            request.method == "POST"
            and route == "admin/login/"
            and response.status_code == 200
        ):
            error_message = _admin_login_error(response)
            logger.warning(
                "admin_login_rejected route=%s form_error=%s",
                route,
                json.dumps(error_message or "no admin error note found"),
            )

        return response

    def process_exception(self, request, exception):
        route = _route_for_request(request)
        stack = " > ".join(
            f"{frame.filename}:{frame.lineno}:{frame.name}"
            for frame in traceback.extract_tb(exception.__traceback__)
        )
        logger.error(
            "http_exception method=%s route=%s error_type=%s stack=%s",
            request.method,
            route,
            type(exception).__name__,
            stack,
            exc_info=(
                type(exception),
                exception,
                exception.__traceback__,
            ),
        )
