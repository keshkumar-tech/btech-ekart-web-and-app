# Core serializers used across apps (OpenAPI docs + simple responses).
from rest_framework import serializers


class DetailSerializer(serializers.Serializer):
    # A simple {"detail": "..."} acknowledgement response.
    detail = serializers.CharField()


class MessageSerializer(serializers.Serializer):
    # A generic message payload.
    message = serializers.CharField()
