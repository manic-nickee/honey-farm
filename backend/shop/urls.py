from django.urls import path

from .views import (
    product_list_api,
    product_detail_api,
    csrf_token_api,
    current_user_api,
    login_api,
    register_api,
    logout_api,
    order_create_api,
    order_list_api,
    order_detail_api,
)


urlpatterns = [
    # API
    path("api/products/", product_list_api, name="product_list_api"),
    path("api/products/<int:id>/", product_detail_api, name="product_detail_api"),
    path("api/auth/csrf/", csrf_token_api, name="csrf_token_api"),
    path("api/auth/user/", current_user_api, name="current_user_api"),
    path("api/auth/login/", login_api, name="login_api"),
    path("api/auth/register/", register_api, name="register_api"),
    path("api/auth/logout/", logout_api, name="logout_api"),
    path("api/orders/", order_list_api, name="order_list_api"),
    path("api/orders/create/", order_create_api, name="order_create_api"),
    path("api/orders/<int:id>/", order_detail_api, name="order_detail_api"),
]

