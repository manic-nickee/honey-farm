from ..models import Product
from ..serializers import ProductSerializer
from .result import ServiceResult


def list_products():
    return Product.objects.all()


def get_product(product_id):
    return Product.objects.filter(id=product_id).first()


def product_list_result():
    serializer = ProductSerializer(
        list_products(),
        many=True,
    )
    return ServiceResult(serializer.data)


def product_detail_result(product_id):
    product = get_product(product_id)
    if product is None:
        return ServiceResult(
            {"detail": "Not found."},
            status_code=404,
        )

    return ServiceResult(ProductSerializer(product).data)