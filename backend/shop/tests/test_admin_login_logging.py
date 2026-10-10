from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase
from django.urls import ResolverMatch

from config.middleware import RequestLoggingMiddleware


class AdminLoginLoggingTests(SimpleTestCase):
    def test_rejection_logs_admin_form_error_without_form_values(self):
        request = RequestFactory().post(
            "/admin/login/",
            data={
                "username": "sarava338",
                "password": "private-password",
            },
        )
        request.resolver_match = ResolverMatch(
            func=lambda request: None,
            args=(),
            kwargs={},
            url_name="admin:login",
            route="admin/login/",
        )
        response = HttpResponse(
            '<p class="errornote">'
            "Please enter the correct username and password for a staff account."
            "</p>"
        )

        with self.assertLogs("config.request", level="WARNING") as captured:
            RequestLoggingMiddleware(lambda request: response)(request)

        logs = "\n".join(record.getMessage() for record in captured.records)
        self.assertIn("admin_login_rejected", logs)
        self.assertIn("Please enter the correct username and password", logs)
        self.assertNotIn("private-password", logs)
