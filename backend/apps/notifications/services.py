"""Helpers for creating notifications."""
from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


def notify(recipient, *, kind, title, body="", url="", actor=None):
    """Create one notification. Never raises — a failed notification must not
    break the user action that triggered it."""
    if recipient is None:
        return None
    try:
        if getattr(recipient, "pk", None) == getattr(actor, "pk", None):
            return None  # don't notify yourself about your own action
        return Notification.objects.create(
            recipient=recipient,
            actor=actor,
            kind=kind,
            title=title,
            body=body,
            url=url,
        )
    except Exception:  # pragma: no cover - defensive
        return None


def notify_admins(*, kind, title, body="", url="", actor=None):
    """Fan a notification out to every admin (role='admin' or superuser)."""
    admins = User.objects.filter(models_q_admin()).distinct()
    created = []
    for admin in admins:
        n = notify(admin, kind=kind, title=title, body=body, url=url, actor=actor)
        if n:
            created.append(n)
    return created


def models_q_admin():
    """Q object matching staff/admin accounts (kept in one place)."""
    from django.db.models import Q

    return Q(role="admin") | Q(is_superuser=True) | Q(is_staff=True)
