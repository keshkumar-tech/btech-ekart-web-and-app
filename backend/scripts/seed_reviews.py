"""Seed a handful of approved reviews so the storefront carousel has content.

Idempotent: reviews are matched on (product, user), so re-running only updates
the existing rows instead of creating duplicates.

Usage:
    python manage.py shell < scripts/seed_reviews.py
"""
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.catalog.models import Product
from apps.reviews.models import Review

User = get_user_model()

SAMPLES = [
    ("CSE", "Ananya Sharma", "ananya.sharma@example.com", 5,
     "Combo pack is worth every rupee",
     "Bought the Sem 5 combo and it covered my whole backlog. The quantums are spot on - most questions actually came in the exam."),
    ("IT", "Rohit Verma", "rohit.verma@example.com", 5,
     "Instant delivery, clean PDFs",
     "Payment done and the file was in My Library within seconds. Notes are neatly formatted and easy to read on mobile."),
    ("ECE", "Priya Mishra", "priya.mishra@example.com", 4,
     "PYQs with solutions are gold",
     "Solved previous year papers saved me a lot of time. Would love a few more years covered, otherwise perfect."),
    ("ME", "Aditya Nair", "aditya.nair@example.com", 5,
     "Cleared my supply exam with this",
     "Studied only the quantum and important questions for two weeks and cleared the paper comfortably. Highly recommended."),
    ("CE", "Sneha Gupta", "sneha.gupta@example.com", 4,
     "Good value for the price",
     "Syllabus PDF is updated and the notes match it well. Support replied on WhatsApp within minutes when I asked a doubt."),
    ("EE", "Karan Singh", "karan.singh@example.com", 5,
     "Best study material for AKTU",
     "I have bought material from other sellers before - this one is far better organised. Diagrams are clear and topic-wise."),
]


def run():
    products = list(Product.objects.filter(is_active=True).order_by("id")[:6])
    if not products:
        print("No active products found — skipping review seed.")
        return

    created = updated = 0
    for product, (_, name, email, rating, title, comment) in zip(products, SAMPLES):
        user, made = User.objects.get_or_create(
            email=email,
            defaults={"name": name, "is_active": True},
        )
        if made:
            user.set_unusable_password()
            user.save(update_fields=["password"])

        _, was_created = Review.objects.update_or_create(
            product=product,
            user=user,
            defaults={
                "rating": rating,
                "title": title,
                "comment": comment,
                "is_approved": True,
                "is_verified_purchase": True,
            },
        )
        created += int(was_created)
        updated += int(not was_created)

    # Keep the product rating averages in sync with the new reviews.
    from apps.reviews.views import recompute_product_rating

    for product in products:
        recompute_product_rating(product)

    print(f"Reviews seeded — created {created}, updated {updated} (as of {timezone.now():%Y-%m-%d}).")


run()
