"""Signal receivers that turn domain events into notifications.

Kept deliberately small and defensive: creating a notification must never be
able to break the write that caused it.
"""
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.reviews.models import Review

from .models import Notification
from .services import notify, notify_admins

User = get_user_model()


@receiver(post_save, sender=Review)
def review_created(sender, instance: Review, created, **kwargs):
    """A new review lands in the moderation queue -> ping every admin."""
    if not created:
        return
    who = instance.user.name or instance.user.email
    notify_admins(
        kind=Notification.Kind.NEW_REVIEW,
        title=f"New review from {who}",
        body=(
            f"{instance.rating}★ on “{instance.product.title}” — "
            f"{(instance.comment or '')[:120]}"
        ),
        url="/admin/reviews",
        actor=instance.user,
    )


@receiver(post_save, sender=User)
def user_welcome(sender, instance, created, **kwargs):
    """Give brand-new customers a first notification so the bell is not empty."""
    if not created or getattr(instance, "role", None) == "admin":
        return
    notify(
        instance,
        kind=Notification.Kind.NEW_PRODUCT,
        title="Welcome to B.Tech eKart 🎓",
        body="Browse notes, PYQs and quantums for your branch — instant download after payment.",
        url="/shop",
    )
