from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"

    def ready(self):
        # Register the signal receivers that create notifications.
        from . import receivers_catalog, signals  # noqa: F401
