from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from ..services import orders as order_service
from ._response import to_response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_list_api(request):
    return to_response(order_service.order_list_result(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def order_create_api(request):
    return to_response(
        order_service.order_create_result(request.user, request.data)
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail_api(request, id):
    return to_response(order_service.order_detail_result(request.user, id))