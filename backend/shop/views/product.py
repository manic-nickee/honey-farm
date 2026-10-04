from rest_framework.decorators import api_view

from ..services import products as product_service
from ._response import to_response


@api_view(["GET"])
def product_list_api(request):
    return to_response(product_service.product_list_result())


@api_view(["GET"])
def product_detail_api(request, id):
    return to_response(product_service.product_detail_result(id))