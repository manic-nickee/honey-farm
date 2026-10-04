from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token

from .result import ServiceResult


class RegistrationError(Exception):
    pass


def authenticate_user(request, username, password):
    return authenticate(
        request,
        username=username,
        password=password,
    )


def register_user(username, password):
    if not username or not password:
        raise RegistrationError("Username and password are required.")

    if User.objects.filter(username=username).exists():
        raise RegistrationError("That username is already in use.")

    return User.objects.create_user(
        username=username,
        password=password,
    )


def login_user(request, user):
    login(request, user)


def logout_user(request):
    logout(request)


def csrf_token_result(request):
    return ServiceResult({"csrfToken": get_token(request)})


def current_user_result(user):
    if not user.is_authenticated:
        return ServiceResult({"authenticated": False})

    return ServiceResult({
        "authenticated": True,
        "username": user.username,
        "is_staff": user.is_staff,
    })


def login_result(request):
    user = authenticate_user(
        request,
        username=request.data.get("username", ""),
        password=request.data.get("password", ""),
    )

    if user is None:
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


def register_result(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    try:
        user = register_user(username, password)
    except RegistrationError as error:
        return ServiceResult(
            {"error": str(error)},
            status_code=400,
        )

    return ServiceResult(
        {"authenticated": False, "username": user.username},
        status_code=201,
    )


def logout_result(request):
    logout_user(request)
    return ServiceResult({"authenticated": False})