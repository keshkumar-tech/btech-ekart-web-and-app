"""Order + OrderItem models.

Digital-goods orders. An order is only fulfilled (products unlocked in the
buyer's Library) once payment is verified — either via a verified Razorpay
signature/webhook or an admin-approved manual QR/UTR payment.
"""
import secrets
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.catalog.models import Product


def generate_order_number():
    """Human-readable, unique-enough order number, e.g. EK-20261017-A1B2C3."""
    stamp = timezone.now().strftime("%Y%m%d")
    return f"EK-{stamp}-{secrets.token_hex(3).upper()}"


class Coupon(models.Model):
    DISCOUNT_TYPE = [("percent", "Percentage"), ("flat", "Flat amount")]

    code = models.CharField(max_length=40, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE, default="percent")
    value = models.DecimalField(max_digits=8, decimal_places=2, help_text="Percent (0-100) or flat Rs. amount")
    min_order_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total redemptions allowed")
    used_count = models.PositiveIntegerField(default=0)
    per_user_limit = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    @property
    def is_valid_now(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_to and now > self.valid_to:
            return False
        if self.usage_limit is not None and self.used_count >= self.usage_limit:
            return False
        return True

    def compute_discount(self, amount):
        """Return the discount for a given cart amount (never exceeds the amount)."""
        if self.discount_type == "percent":
            discount = (Decimal(amount) * self.value) / Decimal(100)
        else:
            discount = self.value
        if self.max_discount is not None:
            discount = min(discount, self.max_discount)
        return min(discount, Decimal(amount)).quantize(Decimal("0.01"))


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending payment"
        PENDING_VERIFICATION = "pending_verification", "Pending verification"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        RAZORPAY = "razorpay", "Razorpay"
        MANUAL_QR = "manual_qr", "Manual UPI / QR"
        FREE = "free", "Free"

    order_number = models.CharField(max_length=30, unique=True, default=generate_order_number, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")

    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING, db_index=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.RAZORPAY)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    coupon_code = models.CharField(max_length=40, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Manual QR payment evidence
    utr_number = models.CharField(max_length=60, blank=True)
    payment_screenshot = models.ImageField(upload_to="payments/screenshots/", null=True, blank=True)
    admin_note = models.CharField(max_length=300, blank=True)

    # Billing / contact snapshot
    customer_name = models.CharField(max_length=150, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=15, blank=True)

    invoice_number = models.CharField(max_length=40, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "status"])]

    def __str__(self):
        return self.order_number

    @property
    def is_paid(self):
        return self.status == self.Status.PAID

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    def recalculate(self, save=True):
        self.subtotal = sum((item.total_price for item in self.items.all()), Decimal("0"))
        self.total_amount = max(self.subtotal - self.discount_amount, Decimal("0"))
        if save:
            self.save(update_fields=["subtotal", "total_amount"])
        return self.total_amount

    def mark_paid(self, method=None):
        """Unlock the order: mark paid, set paid_at, bump product sold counts."""
        if self.status == self.Status.PAID:
            return False
        self.status = self.Status.PAID
        if method:
            self.payment_method = method
        self.paid_at = timezone.now()
        if not self.invoice_number:
            self.invoice_number = f"INV-{self.order_number}"
        self.save(update_fields=["status", "payment_method", "paid_at", "invoice_number"])
        for item in self.items.all():
            Product.objects.filter(pk=item.product_id).update(sold_count=models.F("sold_count") + item.quantity)
        return True


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    # Snapshot fields so history survives later product edits/deletions.
    title = models.CharField(max_length=250)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.PositiveSmallIntegerField(default=1)
    download_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.title} x{self.quantity}"

    @property
    def total_price(self):
        return self.price * self.quantity

    @property
    def downloads_remaining(self):
        limit = getattr(settings, "MAX_DOWNLOADS_PER_ORDER_ITEM", 5)
        return max(limit - self.download_count, 0)
