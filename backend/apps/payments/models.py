"""Payment models: a full audit trail of every payment attempt."""
from django.db import models

from apps.orders.models import Order


class Payment(models.Model):
    class Gateway(models.TextChoices):
        RAZORPAY = "razorpay", "Razorpay"
        MANUAL_QR = "manual_qr", "Manual UPI / QR"

    class Status(models.TextChoices):
        CREATED = "created", "Created"
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    gateway = models.CharField(max_length=20, choices=Gateway.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED, db_index=True)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, default="INR")

    # Razorpay identifiers
    razorpay_order_id = models.CharField(max_length=80, blank=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=80, blank=True)
    razorpay_signature = models.CharField(max_length=200, blank=True)
    method = models.CharField(max_length=40, blank=True, help_text="card / upi / netbanking ...")

    # Manual QR evidence
    utr_number = models.CharField(max_length=60, blank=True)

    # Raw payloads for debugging / reconciliation
    gateway_response = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["order", "status"])]

    def __str__(self):
        return f"{self.gateway}:{self.order.order_number}:{self.status}"


class WebhookEvent(models.Model):
    """Idempotency log for incoming gateway webhooks."""

    event_id = models.CharField(max_length=120, unique=True)
    event_type = models.CharField(max_length=80)
    payload = models.JSONField(default=dict)
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_type} ({self.event_id})"
