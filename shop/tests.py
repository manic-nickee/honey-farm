from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Product, Order


class OrderAPITestCase(APITestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="testuser",
            password="TestPassword123"
        )

        self.product = Product.objects.create(
            name="Test Honey",
            description="Test product",
            price=500,
            available=True,
            stock=10
        )

        self.product_two = Product.objects.create(
            name="Test Wild Honey",
            description="Second test product",
            price=300,
            available=True,
            stock=5
        )

        self.url = "/api/orders/"

    def test_unauthenticated_user_cannot_create_order(self):

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 1
                }
            ]
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            403
        )

    def test_authenticated_user_can_create_order(self):

        self.client.force_authenticate(
            user=self.user
        )

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 2
                }
            ]
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            201
        )

        self.assertEqual(
            Order.objects.count(),
            1
        )

    def test_order_reduces_product_stock(self):

        self.client.force_authenticate(
            user=self.user
        )

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 3
                }
            ]
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            201
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock,
            7
        )

    def test_empty_order_is_rejected(self):

        self.client.force_authenticate(
            user=self.user
        )

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": []
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            400
        )

    def test_quantity_greater_than_stock_is_rejected(self):

        self.client.force_authenticate(
            user=self.user
        )

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 999
                }
            ]
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock,
            10
        )

    def test_invalid_product_is_rejected(self):

        self.client.force_authenticate(
            user=self.user
        )

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": [
                {
                    "product": 999999,
                    "quantity": 1
                }
            ]
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            404
        )

    def test_unavailable_product_is_rejected(self):

        self.product.available = False
        self.product.save()

        self.client.force_authenticate(
            user=self.user
        )

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 1
                }
            ]
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.product.refresh_from_db()

        self.assertEqual(
            self.product.stock,
            10
        )

    def test_duplicate_product_is_rejected(self):

        self.client.force_authenticate(
            user=self.user
        )

        data = {
            "customer_name": "Test Customer",
            "phone": "9876543210",
            "address": "Test Address",
            "items": [
                {
                    "product": self.product.id,
                    "quantity": 1
                },
                {
                    "product": self.product.id,
                    "quantity": 2
                }
            ]
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            400
        )

        self.assertEqual(
            Order.objects.count(),
            0
        )
