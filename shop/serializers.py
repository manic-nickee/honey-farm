from rest_framework import serializers

from .models import Product, Order, OrderItem


class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "available",
            "stock",
        ]


class OrderItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderItem
        fields = [
            "product",
            "quantity",
        ]


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


class CreateOrderSerializer(serializers.Serializer):

    customer_name = serializers.CharField(
        max_length=200
    )

    phone = serializers.CharField(
        max_length=10,
        min_length=10
    )

    address = serializers.CharField()

    items = serializers.ListField(
        allow_empty=False
    )

    def validate_phone(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if not value.startswith(("6", "7", "8", "9")):
            raise serializers.ValidationError(
                "Enter a valid Indian mobile number."
            )

        return value

    def validate_items(self, items):

        validated_items = []

        for item in items:

            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    "Each item must be an object."
                )

            if "product" not in item:
                raise serializers.ValidationError(
                    "Each item must contain a product ID."
                )

            if "quantity" not in item:
                raise serializers.ValidationError(
                    "Each item must contain a quantity."
                )

            product_id = item["product"]
            quantity = item["quantity"]

            if not isinstance(product_id, int):
                raise serializers.ValidationError(
                    "Product ID must be an integer."
                )

            if not isinstance(quantity, int):
                raise serializers.ValidationError(
                    "Quantity must be an integer."
                )

            if quantity <= 0:
                raise serializers.ValidationError(
                    "Quantity must be greater than zero."
                )

            validated_items.append({
                "product": product_id,
                "quantity": quantity,
            })

        return validated_items
