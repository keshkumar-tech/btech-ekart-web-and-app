"""Order services: create an order from the cart, apply coupons, send emails."""
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMessage, send_mail
from django.db import transaction

from apps.cart.models import Cart
from apps.core.utils import generate_invoice_pdf

from .models import Coupon, Order, OrderItem


class CheckoutError(Exception):
    """Raised when a checkout cannot be completed (empty cart, bad coupon...)."""


@transaction.atomic
def create_order_from_cart(user, payment_method, coupon_code="", **contact):
    """Create a PENDING order from the user's cart and clear the cart.

    The order is NOT fulfilled here — payment verification unlocks it later.
    """
    cart = Cart.objects.filter(user=user).first()
    if not cart or not cart.items.exists():
        raise CheckoutError("Your cart is empty.")

    order = Order.objects.create(
        user=user,
        payment_method=payment_method,
        customer_name=contact.get("customer_name") or user.name,
        customer_email=contact.get("customer_email") or user.email,
        customer_phone=contact.get("customer_phone") or user.phone,
    )

    for cart_item in cart.items.select_related("product"):
        product = cart_item.product
        OrderItem.objects.create(
            order=order,
            product=product,
            title=product.title,
            price=product.price,
            mrp=product.mrp,
            quantity=cart_item.quantity,
        )

    order.recalculate(save=False)

    # Apply a coupon if supplied and valid.
    if coupon_code:
        coupon = Coupon.objects.filter(code__iexact=coupon_code.strip()).first()
        if not coupon or not coupon.is_valid_now:
            raise CheckoutError("This coupon is invalid or has expired.")
        if order.subtotal < coupon.min_order_amount:
            raise CheckoutError(
                f"Add items worth Rs. {coupon.min_order_amount} to use this coupon."
            )
        already = Order.objects.filter(
            user=user, coupon=coupon, status=Order.Status.PAID
        ).count()
        if already >= coupon.per_user_limit:
            raise CheckoutError("You have already used this coupon.")
        order.coupon = coupon
        order.coupon_code = coupon.code
        order.discount_amount = coupon.compute_discount(order.subtotal)

    order.total_amount = max(order.subtotal - order.discount_amount, Decimal("0"))
    order.save()

    # Cart is consumed; the order now owns the items.
    cart.items.all().delete()
    return order


def send_order_confirmation_email(order):
    """Email the buyer a confirmation + PDF invoice (best-effort, never fatal)."""
    try:
        invoice = generate_invoice_pdf(order)
        email = EmailMessage(
            subject=f"Order confirmed — {order.order_number} | B.Tech eKart",
            body=(
                f"Hi {order.customer_name or order.user.name},\n\n"
                f"Your payment was successful. Order {order.order_number} is confirmed.\n"
                f"Total paid: Rs. {order.total_amount}\n\n"
                "You can now access all purchased material from 'My Library'.\n\n"
                "— B.Tech eKart Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.customer_email or order.user.email],
        )
        email.attach(f"{order.invoice_number or order.order_number}.pdf", invoice, "application/pdf")
        email.send(fail_silently=True)
    except Exception:
        pass


def notify_admin_new_manual_payment(order):
    """Tell the owner a manual QR payment needs review (best-effort)."""
    try:
        send_mail(
            subject=f"[Action needed] Manual payment for {order.order_number}",
            message=(
                f"Order {order.order_number} by {order.customer_email} is awaiting verification.\n"
                f"UTR: {order.utr_number}\nAmount: Rs. {order.total_amount}\n"
                "Review it in the admin dashboard → Orders."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
            fail_silently=True,
        )
    except Exception:
        pass
