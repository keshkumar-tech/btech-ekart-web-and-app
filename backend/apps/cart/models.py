"""Cart models — one cart per user, digital items only (no stock/quantity limits beyond a sane cap)."""
from django.conf import settings
from django.db import models

from apps.catalog.models import Product


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart<{self.user.email}>"

    @property
    def item_count(self):
        return self.items.aggregate(total=models.Sum("quantity"))["total"] or 0

    @property
    def subtotal(self):
        return sum((item.total_price for item in self.items.all()), 0)

    @property
    def mrp_total(self):
        return sum((item.mrp_price for item in self.items.all()), 0)

    @property
    def you_save(self):
        return self.mrp_total - self.subtotal


class CartItem(models.Model):
    MAX_QTY = 10  # digital goods: keep it sane, but allow a few copies for gifting/combos

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveSmallIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("cart", "product")]
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.product.title} x{self.quantity}"

    @property
    def total_price(self):
        return self.product.price * self.quantity

    @property
    def mrp_price(self):
        return self.product.mrp * self.quantity
