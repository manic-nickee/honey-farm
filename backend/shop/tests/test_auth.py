from django.contrib.auth.models import User
from rest_framework.test import APITestCase


class AuthAPITestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="customer",
            password="TestPassword123",
        )
        self.staff_user = User.objects.create_user(
            username="manager",
            password="TestPassword123",
            is_staff=True,
        )

    def test_current_user_reports_staff_status(self):
        self.client.force_authenticate(user=self.staff_user)

        response = self.client.get("/api/auth/user/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_staff"])

    def test_login_reports_non_staff_status(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "customer", "password": "TestPassword123"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_staff"])