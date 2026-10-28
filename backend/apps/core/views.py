from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import DetailSerializer


@extend_schema(responses=DetailSerializer, tags=["core"])
class HealthCheckView(APIView):
    """Simple health endpoint for uptime monitoring / Render checks."""

    permission_classes = []
    throttle_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "btech-ekart-api"})
