from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from ..services import auth as auth_service
from ._response import to_response


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token_api(request):
    return to_response(auth_service.csrf_token_result(request))


@api_view(["GET"])
@permission_classes([AllowAny])
def current_user_api(request):
    return to_response(auth_service.current_user_result(request.user))


@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    return to_response(auth_service.login_result(request))


@api_view(["POST"])
@permission_classes([AllowAny])
def register_api(request):
    return to_response(auth_service.register_result(request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_api(request):
    return to_response(auth_service.logout_result(request))