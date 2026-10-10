from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token

from config.service_logging import (
    log_service_errors,
    log_service_exception,
    log_service_rejection,
)

from .result import ServiceResult


class RegistrationError(Exception):
    pass


@log_service_errors
def authenticate_user(request, username, password):
    return authenticate(
        request,
        username=username,
        password=password,
    )


@log_service_errors
def register_user(username, password):
    if not username or not password:
        raise RegistrationError("Username and password are required.")

    if User.objects.filter(username=username).exists():
        raise RegistrationError("That username is already in use.")

    return User.objects.create_user(
        username=username,
        password=password,
    )


@log_service_errors
def login_user(request, user):
    login(request, user)


@log_service_errors
def logout_user(request):
    logout(request)


@log_service_errors
def csrf_token_result(request):
    return ServiceResult({"csrfToken": get_token(request)})


@log_service_errors
def current_user_result(user):
    if not user.is_authenticated:
        return ServiceResult({"authenticated": False})

    return ServiceResult({
        "authenticated": True,
        "username": user.username,
        "is_staff": user.is_staff,
    })


@log_service_errors
def login_result(request):
    user = authenticate_user(
        request,
        username=request.data.get("username", ""),
        password=request.data.get("password", ""),
    )

    if user is None:
        log_service_rejection(
            service=__name__,
            operation="login_result",
            error_type="AuthenticationRejected",
            username=request.data.get("username", ""),
        )
        return ServiceResult(
            {"error": "Invalid username or password."},
            status_code=400,
        )

    login_user(request, user)
    return ServiceResult({
        "authenticated": True,
        "username": user.username,
        "is_staff": user.is_staff,
    })


@log_service_errors
def register_result(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    try:
        user = register_user(username, password)
    except RegistrationError as error:
        log_service_exception(
            error,
            service=__name__,
            operation="register_user",
            username=username,
        )
        return ServiceResult(
            {"error": str(error)},
            status_code=400,
        )

    return ServiceResult(
        {"authenticated": False, "username": user.username},
        status_code=201,
    )


@log_service_errors
def logout_result(request):
    logout_user(request)
    return ServiceResult({"authenticated": False})