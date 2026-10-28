"""In-app notifications.

Two audiences share one table:
  * staff (admin panel) — e.g. a new review is waiting for moderation
  * customers (storefront) — e.g. a new PDF/quantum was published

A row is always addressed to one user, so the same API serves both sides:
each client just asks for its own notifications and unread count.
"""
from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Kind(models.TextChoices):
        # Admin-facing
        NEW_REVIEW = "new_review", "New review awaiting approval"
        NEW_ORDER = "new_order", "New order"
        PAYMENT_SUBMITTED = "payment_submitted", "Manual payment submitted"
        # Customer-facing
        NEW_PRODUCT = "new_product", "New product published"
        REVIEW_APPROVED = "review_approved", "Review approved"
        REVIEW_REJECTED = "review_rejected", "Review hidden"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    title = models.CharField(max_length=180)
    body = models.TextField(blank=True)
    url = models.CharField(max_length=300, blank=True, help_text="Where clicking it should go")
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        state = "read" if self.is_read else "unread"
        return f"[{state}] {self.kind} -> {self.recipient_id}"
