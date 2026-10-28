"""Order + Coupon serializers."""
from rest_framework import serializers

from apps.catalog.serializers import ProductSerializer

from .models import Coupon, Order, OrderItem


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id", "code", "description", "discount_type", "value",
            "min_order_amount", "max_discount", "valid_from", "valid_to",
            "usage_limit", "used_count", "per_user_limit", "is_active",
            "created_at",
        ]

class CouponWriteSerializer(serializers.ModelSerializer):
    """Full coupon CRUD for the custom admin panel."""

    class Meta:
        model = Coupon
        fields = [
            "id", "code", "description", "discount_type", "value",
            "min_order_amount", "max_discount", "valid_from", "valid_to",
            "usage_limit", "used_count", "per_user_limit", "is_active", "created_at",
        ]
        read_only_fields = ("used_count", "created_at")
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "max_discount": {"required": False, "allow_null": True},
            "valid_to": {"required": False, "allow_null": True},
            "usage_limit": {"required": False, "allow_null": True},
            "valid_from": {"required": False},
        }


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    downloads_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "title", "price", "mrp", "quantity",
            "total_price", "download_count", "downloads_remaining",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "status_display",
            "payment_method", "payment_method_display",
            "subtotal", "discount_amount", "coupon_code", "total_amount",
            "utr_number", "admin_note", "customer_name", "customer_email", "customer_phone",
            "invoice_number", "paid_at", "total_items", "items", "created_at", "updated_at",
        ]
        read_only_fields = fields


class CheckoutSerializer(serializers.Serializer):
    """Payload for creating an order from the current cart."""

    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    customer_name = serializers.CharField(required=False, allow_blank=True)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)


class ManualPaymentSubmitSerializer(serializers.Serializer):
    utr_number = serializers.CharField(max_length=60)


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=40)
