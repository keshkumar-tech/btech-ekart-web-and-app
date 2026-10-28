"""Payment APIs: Razorpay (create/verify/webhook) + manual QR helpers."""
import json
import logging

from django.conf import settings
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.catalog.models import SiteSetting
from apps.core.serializers import DetailSerializer
from apps.orders.models import Order
from apps.orders.services import send_order_confirmation_email

from .models import Payment, WebhookEvent
from .razorpay_client import (
    RazorpayError,
    create_gateway_order,
    public_key,
    verify_payment_signature,
    verify_webhook_signature,
)
from .serializers import (
    PaymentSerializer,
    RazorpayCreateSerializer,
    RazorpayVerifySerializer,
)

logger = logging.getLogger(__name__)


@extend_schema(request=RazorpayCreateSerializer, responses=DetailSerializer, tags=["payments"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def razorpay_create(request):
    """Create (or reuse) a Razorpay order for one of the user's own PENDING orders."""
    serializer = RazorpayCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order = Order.objects.filter(
        order_number=serializer.validated_data["order_number"], user=request.user
    ).first()
    if not order:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    if order.is_paid:
        return Response({"detail": "This order is already paid."}, status=status.HTTP_400_BAD_REQUEST)
    if order.status not in (Order.Status.PENDING, Order.Status.FAILED):
        return Response({"detail": "This order is not awaiting payment."}, status=status.HTTP_400_BAD_REQUEST)

    # Reuse an existing un-expired gateway order if present (prevents duplicate payments).
    existing = order.payments.filter(
        gateway=Payment.Gateway.RAZORPAY, status__in=[Payment.Status.CREATED, Payment.Status.PENDING]
    ).exclude(razorpay_order_id="").first()
    if existing:
        return Response(
            {
                "razorpay_order_id": existing.razorpay_order_id,
                "amount": int(existing.amount * 100),
                "currency": existing.currency,
                "key_id": public_key(),
                "order_number": order.order_number,
                "name": "B.Tech eKart",
                "description": f"Order {order.order_number}",
                "prefill": {"name": order.customer_name, "email": order.customer_email, "contact": order.customer_phone},
            }
        )

    try:
        gateway_order = create_gateway_order(order)
    except RazorpayError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    Payment.objects.create(
        order=order,
        gateway=Payment.Gateway.RAZORPAY,
        status=Payment.Status.CREATED,
        amount=order.total_amount,
        razorpay_order_id=gateway_order["id"],
        gateway_response={"created": gateway_order},
    )
    return Response(
        {
            "razorpay_order_id": gateway_order["id"],
            "amount": gateway_order["amount"],
            "currency": gateway_order["currency"],
            "key_id": public_key(),
            "order_number": order.order_number,
            "name": "B.Tech eKart",
            "description": f"Order {order.order_number}",
            "prefill": {"name": order.customer_name, "email": order.customer_email, "contact": order.customer_phone},
        }
    )


@extend_schema(request=RazorpayVerifySerializer, responses=DetailSerializer, tags=["payments"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def razorpay_verify(request):
    """Verify the checkout signature. Unlocks the order ONLY on a valid signature."""
    serializer = RazorpayVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    order = Order.objects.filter(order_number=data["order_number"], user=request.user).first()
    if not order:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    if not verify_payment_signature(
        data["razorpay_order_id"], data["razorpay_payment_id"], data["razorpay_signature"]
    ):
        Payment.objects.create(
            order=order,
            gateway=Payment.Gateway.RAZORPAY,
            status=Payment.Status.FAILED,
            amount=order.total_amount,
            razorpay_order_id=data["razorpay_order_id"],
            razorpay_payment_id=data["razorpay_payment_id"],
            gateway_response={"error": "signature mismatch"},
        )
        return Response({"detail": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        payment, _ = Payment.objects.get_or_create(
            order=order,
            razorpay_payment_id=data["razorpay_payment_id"],
            defaults={
                "gateway": Payment.Gateway.RAZORPAY,
                "amount": order.total_amount,
                "razorpay_order_id": data["razorpay_order_id"],
            },
        )
        payment.status = Payment.Status.SUCCESS
        payment.razorpay_signature = data["razorpay_signature"]
        payment.save(update_fields=["status", "razorpay_signature"])

        was_unpaid = not order.is_paid
        order.mark_paid(method=Order.PaymentMethod.RAZORPAY)

    if was_unpaid:
        send_order_confirmation_email(order)
    return Response({"detail": "Payment verified. Your material is unlocked.", "order": order.order_number})


@extend_schema(
    request=inline_serializer("RazorpayWebhookPayload", {"event": serializers.CharField()}),
    responses=DetailSerializer,
    tags=["payments"],
)
@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def razorpay_webhook(request):
    """Idempent Razorpay webhook handler (payment.captured / payment.failed)."""
    raw = request.body
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not verify_webhook_signature(raw, signature):
        return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return Response({"detail": "Invalid payload."}, status=status.HTTP_400_BAD_REQUEST)

    event_type = payload.get("event", "")
    # Razorpay doesn't always send a top-level unique id; use event + entity ids.
    entity = (payload.get("payload", {}).get("payment", {}) or {}).get("entity", {})
    event_id = payload.get("id") or f"{event_type}:{entity.get('id', '')}"
    if not event_id:
        return Response({"detail": "Missing event id."}, status=status.HTTP_400_BAD_REQUEST)

    event, created = WebhookEvent.objects.get_or_create(
        event_id=event_id, defaults={"event_type": event_type, "payload": payload}
    )
    if not created and event.processed:
        return Response({"detail": "Already processed."})  # idempotent no-op

    gateway_order_id = entity.get("order_id", "")
    payment_id = entity.get("id", "")
    order = None
    if gateway_order_id:
        payment = Payment.objects.filter(razorpay_order_id=gateway_order_id).select_related("order").first()
        order = payment.order if payment else None
    if order is None:
        # Fall back to notes.receipt → our order number.
        notes = entity.get("notes", {}) or {}
        receipt = notes.get("order_number") or entity.get("receipt")
        if receipt:
            order = Order.objects.filter(order_number=receipt).first()

    if order:
        if event_type == "payment.captured":
            with transaction.atomic():
                Payment.objects.update_or_create(
                    order=order,
                    razorpay_payment_id=payment_id or gateway_order_id,
                    defaults={
                        "gateway": Payment.Gateway.RAZORPAY,
                        "status": Payment.Status.SUCCESS,
                        "amount": order.total_amount,
                        "razorpay_order_id": gateway_order_id,
                        "method": entity.get("method", ""),
                        "gateway_response": payload,
                    },
                )
                was_unpaid = not order.is_paid
                order.mark_paid(method=Order.PaymentMethod.RAZORPAY)
            if was_unpaid:
                send_order_confirmation_email(order)
        elif event_type == "payment.failed":
            Payment.objects.create(
                order=order,
                gateway=Payment.Gateway.RAZORPAY,
                status=Payment.Status.FAILED,
                amount=order.total_amount,
                razorpay_order_id=gateway_order_id,
                razorpay_payment_id=payment_id,
                gateway_response=payload,
            )
            if not order.is_paid:
                order.status = Order.Status.FAILED
                order.save(update_fields=["status"])
        elif event_type in ("refund.created", "refund.processed"):
            Payment.objects.create(
                order=order,
                gateway=Payment.Gateway.RAZORPAY,
                status=Payment.Status.REFUNDED,
                amount=order.total_amount,
                razorpay_order_id=gateway_order_id,
                razorpay_payment_id=payment_id,
                gateway_response=payload,
            )
            order.status = Order.Status.REFUNDED
            order.save(update_fields=["status"])

    event.processed = True
    event.save(update_fields=["processed"])
    return Response({"detail": "ok"})


@extend_schema(responses=DetailSerializer, tags=["payments"])
@api_view(["GET"])
@permission_classes([AllowAny])
def payment_settings(request):
    """Public payment configuration: owner QR, UPI id and instructions.

    The mobile checkout reads this to preview the QR before an order exists,
    so it must work for signed-in and anonymous visitors alike. Only display
    data is exposed — never keys or secrets.
    """
    qr_url = SiteSetting.get("upi_qr_image", "")
    if qr_url and not qr_url.startswith("http"):
        qr_url = request.build_absolute_uri(qr_url)
    return Response(
        {
            "upi_qr_image": qr_url,
            "upi_id": SiteSetting.get("upi_id", ""),
            "payment_instructions": SiteSetting.get("payment_instructions", ""),
            "manual_qr_enabled": SiteSetting.get("manual_qr_enabled", True),
            "support_email": SiteSetting.get("support_email", ""),
            "support_phone": SiteSetting.get("support_phone", ""),
            "whatsapp_link": SiteSetting.get("whatsapp_link", ""),
        }
    )


@extend_schema(responses=DetailSerializer, tags=["payments"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def manual_qr_details(request, order_number):
    """Return the owner's QR image + exact amount for a manual-QR order."""
    order = Order.objects.filter(order_number=order_number, user=request.user).first()
    if not order:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    qr_url = SiteSetting.get("upi_qr_image", "")
    if qr_url and not qr_url.startswith("http"):
        qr_url = request.build_absolute_uri(qr_url)
    return Response(
        {
            "order_number": order.order_number,
            "amount": order.total_amount,
            "upi_qr_image": qr_url,
            "support_email": SiteSetting.get("support_email", ""),
            "support_phone": SiteSetting.get("support_phone", ""),
            "whatsapp_link": SiteSetting.get("whatsapp_link", ""),
            "payment_instructions": SiteSetting.get("payment_instructions", ""),
            "status": order.status,
        }
    )


@extend_schema(responses=PaymentSerializer(many=True), tags=["payments"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_list(request):
    """All payment records for the user's own orders."""
    payments = Payment.objects.filter(order__user=request.user).select_related("order")
    return Response(PaymentSerializer(payments, many=True).data)
