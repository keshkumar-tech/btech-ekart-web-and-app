"""Razorpay integration helpers.

Everything sensitive (keys, signature verification) happens server-side.
The client only ever receives the public key id + the gateway order id.
"""
import hmac
import hashlib
from decimal import Decimal

from django.conf import settings


class RazorpayError(Exception):
    pass


def _client():
    if not (settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET):
        raise RazorpayError("Razorpay is not configured (missing keys).")
    import razorpay
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_gateway_order(order):
    """Create a Razorpay order for our Order. Amount is in paise (INR * 100)."""
    amount_paise = int(Decimal(order.total_amount) * 100)
    if amount_paise <= 0:
        raise RazorpayError("Order amount must be greater than zero.")
    try:
        return _client().order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": order.order_number,
                "notes": {"order_number": order.order_number, "user_email": order.user.email},
            }
        )
    except Exception as exc:  # pragma: no cover - network/SDK errors
        raise RazorpayError(f"Could not create Razorpay order: {exc}") from exc


def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """Verify the checkout callback signature (HMAC-SHA256 of order_id|payment_id)."""
    if not settings.RAZORPAY_KEY_SECRET:
        return False
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature or "")


def verify_webhook_signature(raw_body: bytes, signature: str):
    """Verify a Razorpay webhook body against RAZORPAY_WEBHOOK_SECRET."""
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        return False
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def public_key():
    return settings.RAZORPAY_KEY_ID
