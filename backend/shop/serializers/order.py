from rest_framework import serializers

from ..models import Order
from .order_item import OrderItemSerializer


class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "customer_name",
            "phone",
            "address",
            "total",
            "status",
            "created_at",
            "items",
        ]