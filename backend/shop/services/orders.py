from django.db import transaction

from ..models import Order, OrderItem, Product
from ..serializers import CreateOrderSerializer, OrderSerializer
from .result import ServiceResult


class OrderServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code


def list_customer_orders(customer):
    return Order.objects.filter(
        customer=customer
    ).order_by("-created_at")


def get_customer_order(customer, order_id):
    return Order.objects.filter(
        id=order_id,
        customer=customer,
    ).first()


def create_order(customer, data):
    if not data["items"]:
        raise OrderServiceError("Order must contain at least one item.")

    with transaction.atomic():
        total = 0
        order_items = []
        product_ids = set()

        for item in data["items"]:
            product_id = item["product"]
            quantity = item["quantity"]

            if product_id in product_ids:
                raise OrderServiceError(
                    f"Product {product_id} appears more than once."
                )

            product_ids.add(product_id)

            product = (
                Product.objects
                .select_for_update()
                .filter(id=product_id)
                .first()
            )

            if product is None:
                raise OrderServiceError(
                    f"Product {product_id} does not exist.",
                    status_code=404,
                )

            if not product.available:
                raise OrderServiceError(
                    f"{product.name} is currently unavailable."
                )

            if quantity > product.stock:
                raise OrderServiceError(
                    f"Only {product.stock} units of {product.name} are available."
                )

            total += product.price * quantity
            order_items.append({
                "product": product,
                "quantity": quantity,
                "price": product.price,
            })

        order = Order.objects.create(
            customer=customer,
            customer_name=data["customer_name"],
            phone=data["phone"],
            address=data["address"],
            total=total,
        )

        for item in order_items:
            OrderItem.objects.create(
                order=order,
                product=item["product"],
                quantity=item["quantity"],
                price=item["price"],
            )

            item["product"].stock -= item["quantity"]
            item["product"].save(update_fields=["stock"])

    return order


def order_list_result(customer):
    serializer = OrderSerializer(
        list_customer_orders(customer),
        many=True,
    )
    return ServiceResult(serializer.data)


def order_create_result(customer, data):
    serializer = CreateOrderSerializer(data=data)
    if not serializer.is_valid():
        return ServiceResult(
            serializer.errors,
            status_code=400,
        )

    try:
        order = create_order(customer, serializer.validated_data)
    except OrderServiceError as error:
        return ServiceResult(
            {"error": str(error)},
            status_code=error.status_code,
        )

    return ServiceResult(
        OrderSerializer(order).data,
        status_code=201,
    )


def order_detail_result(customer, order_id):
    order = get_customer_order(customer, order_id)
    if order is None:
        return ServiceResult(
            {"detail": "Not found."},
            status_code=404,
        )

    return ServiceResult(OrderSerializer(order).data)