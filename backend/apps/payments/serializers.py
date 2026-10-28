"""Payment serializers."""
from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    gateway_display = serializers.CharField(source="get_gateway_display", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "gateway", "gateway_display", "status", "status_display",
            "amount", "currency", "razorpay_order_id", "razorpay_payment_id",
            "method", "utr_number", "created_at", "updated_at",
        ]
        read_only_fields = fields


class RazorpayCreateSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=30)


class RazorpayVerifySerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=30)
    razorpay_order_id = serializers.CharField(max_length=80)
    razorpay_payment_id = serializers.CharField(max_length=80)
    razorpay_signature = serializers.CharField(max_length=200)
