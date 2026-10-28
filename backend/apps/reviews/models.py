"""Review models. Any logged-in user may review any product; admins moderate."""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.catalog.models import Product


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=150, blank=True)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(
        default=False,
        help_text="Reviews stay hidden until an admin approves them",
    )
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("product", "user")]  # one review per user per product
        indexes = [models.Index(fields=["product", "is_approved"])]

    def __str__(self):
        return f"{self.product.title} — {self.rating}* by {self.user.email}"


def recompute_product_rating(product):
    """Recompute the cached average rating + count on a product (approved reviews only)."""
    from django.db.models import Avg, Count

    agg = Review.objects.filter(product=product, is_approved=True).aggregate(
        avg=Avg("rating"), count=Count("id")
    )
    product.rating = round(agg["avg"] or 0, 2)
    product.rating_count = agg["count"] or 0
    product.save(update_fields=["rating", "rating_count"])
