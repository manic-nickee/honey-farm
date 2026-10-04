from rest_framework import serializers

from ..models import Product

class ProductSerializer(serializers.ModelSerializer):

    image = serializers.ImageField(
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "available",
            "stock",
            "image",
        ]