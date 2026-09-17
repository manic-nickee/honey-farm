from django.urls import path

from .views import (
    home,
    product_detail,
    add_to_cart,
    remove_from_cart,
    decrease_quantity,
    checkout,
    register,
    user_login,
    user_logout,
    my_orders,
)

urlpatterns = [
    path("", home, name="home"),

    path(
        "products/<int:id>/",
        product_detail,
        name="product_detail"
    ),

    path(
        "cart/add/<int:id>/",
        add_to_cart,
        name="add_to_cart"
    ),

    path(
        "cart/remove/<int:id>/",
        remove_from_cart,
        name="remove_from_cart"
    ),

    path(
        "cart/decrease/<int:id>/",
        decrease_quantity,
        name="decrease_quantity"
    ),

    path(
        "checkout/",
        checkout,
        name="checkout"
    ),
    path(
        "register/",
        register,
        name="register"
    ),

    path(
        "login/",
        user_login,
        name="login"
    ),

    path(
        "logout/",
        user_logout,
        name="logout"
    ),

    path(
            "my-orders/",
            my_orders,
            name="my_orders"
        ),
]