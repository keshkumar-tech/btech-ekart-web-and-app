"""Catalog signals — new published material reaches every customer's bell."""
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.catalog.models import Product

from .models import Notification
from .services import notify

User = get_user_model()

KIND_LABEL = {
    "notes": "Notes",
    "pyq": "Previous year papers",
    "quantum": "Quantum",
    "syllabus": "Syllabus",
    "combo": "Combo pack",
}


@receiver(post_save, sender=Product)
def product_published(sender, instance: Product, created, **kwargs):
    """Notify customers when a product becomes visible in the store.

    Fires on create and on the "hidden -> published" transition, never on an
    edit to an already-live product (so tweaking a price does not spam every
    student's bell).
    """
    if not instance.is_active:
        return

    if created:
        should_notify = True
    else:
        update_fields = kwargs.get("update_fields")
        # Only act when this save explicitly touched `is_active`.
        should_notify = bool(update_fields) and "is_active" in set(update_fields)
        if not should_notify:
            return

    label = KIND_LABEL.get(instance.type, "New material")
    customer_ids = (
        User.objects.filter(is_active=True)
        .exclude(role="admin")
        .values_list("id", flat=True)
    )
    rows = [
        Notification(
            recipient_id=user_id,
            kind=Notification.Kind.NEW_PRODUCT,
            title=f"New {label.lower()}: {instance.title}",
            body="Freshly published study material - download it instantly.",
            url=f"/product/{instance.slug}",
        )
        for user_id in customer_ids
    ]
    if rows:
        Notification.objects.bulk_create(rows, batch_size=500)
