"""Remove reviews created by the automated end-to-end checks.

Only deletes reviews whose comment contains the QA marker text, so genuine
reviews are never touched. Recomputes affected product ratings afterwards.
"""
from django.db.models import Q

from apps.reviews.models import Review, recompute_product_rating

MARKERS = [
    "automated end-to-end check",
    "Reviewed product 1 from an automated",
    "Reviewed product 2 from an automated",
]

qs = (
    Review.objects.filter(
        Q(comment__icontains=MARKERS[0])
        | Q(comment__icontains=MARKERS[1])
        | Q(comment__icontains=MARKERS[2])
    )
    .select_related("product")
)

products = {r.product for r in qs}
count = qs.count()
qs.delete()

for product in products:
    recompute_product_rating(product)

print(f"Cleanup done - removed {count} test review(s) from {len(products)} product(s).")
