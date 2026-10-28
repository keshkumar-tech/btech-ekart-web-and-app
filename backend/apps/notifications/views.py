"""Notification API — one set of endpoints used by both the admin panel and
the storefront. Everything is scoped to `request.user`, so a client can only
ever read or clear its own notifications."""
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.serializers import DetailSerializer

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListAPI(generics.ListAPIView):
    """Newest first. `?unread=true` limits it to unread rows."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get("unread") in ("1", "true", "True"):
            qs = qs.filter(is_read=False)
        try:
            limit = min(int(self.request.query_params.get("limit", 30)), 100)
        except (TypeError, ValueError):
            limit = 30
        return qs[:limit]


@extend_schema(responses={200: dict}, tags=["notifications"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Badge count. Sent as `{count, latest}` so the bell can render instantly."""
    qs = Notification.objects.filter(recipient=request.user, is_read=False)
    latest = qs.order_by("-created_at").values("id", "title", "kind").first()
    return Response({"count": qs.count(), "latest": latest})


@extend_schema(request=None, responses=NotificationSerializer, tags=["notifications"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    notification = Notification.objects.filter(
        pk=pk, recipient=request.user
    ).first()
    if not notification:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at"])
    return Response(NotificationSerializer(notification).data)


@extend_schema(request=None, responses=DetailSerializer, tags=["notifications"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    updated = Notification.objects.filter(
        recipient=request.user, is_read=False
    ).update(is_read=True, read_at=timezone.now())
    return Response({"detail": f"{updated} notification(s) marked read.", "updated": updated})
