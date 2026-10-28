"""Create admin notifications for reviews that are still awaiting approval.

Runs once after deploying the notifications feature so the admin bell already
has the existing backlog. Safe to re-run: it skips reviews that already have a
NEW_REVIEW notification.
"""
from django.contrib.auth import get_user_model

from apps.notifications.models import Notification
from apps.notifications.services import models_q_admin, notify_admins
from apps.reviews.models import Review

User = get_user_model()

already = set(
    Notification.objects.filter(kind=Notification.Kind.NEW_REVIEW).values_list(
        "url", "body"
    )
)

pending = Review.objects.filter(is_approved=False).select_related("user", "product")
count = 0
for review in pending:
    who = review.user.name or review.user.email
    body = f"{review.rating}* on \"{review.product.title}\" - {(review.comment or '')[:120]}"
    if ("/admin/reviews", body) in already:
        continue
    notify_admins(
        kind=Notification.Kind.NEW_REVIEW,
        title=f"New review from {who}",
        body=body,
        url="/admin/reviews",
        actor=review.user,
    )
    count += 1

admins = User.objects.filter(models_q_admin()).count()
print(f"Backfill done - {count} pending review notification(s) created for {admins} admin(s).")
