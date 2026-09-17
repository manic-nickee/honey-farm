from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import transaction

from .models import Product, Order, OrderItem
from .forms import CheckoutForm, RegisterForm

def register(request):

    if request.method == "POST":

        form = RegisterForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect("login")

    else:

        form = RegisterForm()

    return render(
        request,
        "shop/register.html",
        {"form": form}
    )


def user_login(request):

    if request.method == "POST":

        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:

            login(request, user)

            return redirect("home")

        else:

            return render(
                request,
                "shop/login.html",
                {
                    "error": "Invalid username or password."
                }
            )

    return render(
        request,
        "shop/login.html"
    )


def user_logout(request):

    logout(request)

    return redirect("home")


def home(request):
    products = Product.objects.filter(available=True)

    return render(
        request,
        "shop/home.html",
        {"products": products}
    )


def product_detail(request, id):
    product = get_object_or_404(Product, id=id)

    return render(
        request,
        "shop/product_detail.html",
        {"product": product}
    )


def add_to_cart(request, id):

    product = get_object_or_404(
        Product,
        id=id
    )

    if not product.available:
        return redirect("home")

    cart = request.session.get("cart", {})

    product_id = str(id)

    current_quantity = cart.get(
        product_id,
        0
    )

    if current_quantity >= product.stock:

        cart_items = []

        total = 0

        for product_id, quantity in cart.items():

            cart_product = get_object_or_404(
                Product,
                id=product_id
            )

            subtotal = cart_product.price * quantity

            cart_items.append({
                "product": cart_product,
                "quantity": quantity,
                "subtotal": subtotal,
            })

            total += subtotal

        return render(
            request,
            "shop/cart.html",
            {
                "cart_items": cart_items,
                "total": total,
                "error": (
                    f"Only {product.stock} units "
                    f"of {product.name} are available."
                ),
            }
        )

    cart[product_id] = current_quantity + 1

    request.session["cart"] = cart

    return render_cart(request, cart)


def remove_from_cart(request, id):
    cart = request.session.get("cart", {})

    product_id = str(id)

    if product_id in cart:
        del cart[product_id]

    request.session["cart"] = cart

    return render_cart(request, cart)


def decrease_quantity(request, id):
    cart = request.session.get("cart", {})

    product_id = str(id)

    if product_id in cart:
        cart[product_id] -= 1

        if cart[product_id] <= 0:
            del cart[product_id]

    request.session["cart"] = cart

    return render_cart(request, cart)


def render_cart(request, cart):
    cart_items = []
    total = 0

    for product_id, quantity in cart.items():

        product = get_object_or_404(Product, id=product_id)

        subtotal = product.price * quantity

        cart_items.append({
            "product": product,
            "quantity": quantity,
            "subtotal": subtotal,
        })

        total += subtotal

    return render(
        request,
        "shop/cart.html",
        {
            "cart_items": cart_items,
            "total": total,
        }
    )

@login_required
def checkout(request):

    cart = request.session.get("cart", {})

    if not cart:
        return redirect("home")

    cart_items = []
    total = 0

    for product_id, quantity in cart.items():

        product = get_object_or_404(
            Product,
            id=product_id
        )

        if not product.available:
            return render(
                request,
                "shop/cart.html",
                {
                    "cart_items": [],
                    "total": 0,
                    "error": (
                        f"{product.name} is currently unavailable."
                    ),
                }
            )

        if quantity > product.stock:
            return render(
                request,
                "shop/cart.html",
                {
                    "cart_items": [],
                    "total": 0,
                    "error": (
                        f"Only {product.stock} units "
                        f"of {product.name} are available."
                    ),
                }
            )

        subtotal = product.price * quantity

        cart_items.append({
            "product": product,
            "quantity": quantity,
            "subtotal": subtotal,
        })

        total += subtotal


    if request.method == "POST":

        form = CheckoutForm(request.POST)

        if form.is_valid():

            with transaction.atomic():
            
                order = Order.objects.create(
                    customer=request.user,
                    customer_name=form.cleaned_data["customer_name"],
                    phone=form.cleaned_data["phone"],
                    address=form.cleaned_data["address"],
                    total=total,
                )
        
                for item in cart_items:
                
                    OrderItem.objects.create(
                        order=order,
                        product=item["product"],
                        quantity=item["quantity"],
                        price=item["product"].price,
                    )
        
                    item["product"].stock -= item["quantity"]
        
                    item["product"].save()

            request.session["cart"] = {}

            return render(
                request,
                "shop/order_success.html",
                {"order": order}
            )

    else:

        form = CheckoutForm()


    return render(
        request,
        "shop/checkout.html",
        {
            "cart_items": cart_items,
            "total": total,
            "form": form,
        }
    )


@login_required
def my_orders(request):

    orders = Order.objects.filter(
        customer=request.user
    ).order_by("-created_at")

    return render(
        request,
        "shop/my_orders.html",
        {
            "orders": orders
        }
    )