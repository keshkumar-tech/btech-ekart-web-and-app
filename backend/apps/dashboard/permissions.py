# Admin-only permission used across the dashboard API.
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    # Allow only users whose role is admin (or Django superusers).
    message = "Admin access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_admin_role", False))
