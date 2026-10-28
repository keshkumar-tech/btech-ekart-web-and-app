# Serializers for admin dashboard responses (read-only, informational).
from rest_framework import serializers

from apps.accounts.models import User
from apps.orders.models import OrderItem


class AdminCustomerSerializer(serializers.ModelSerializer):
    # Basic customer row for the admin customer list.
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    orders_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "name", "phone", "role", "college", "branch", "year",
            "email_verified", "is_active", "date_joined", "total_spent", "orders_count",
        ]


class AdminPurchaseRowSerializer(serializers.ModelSerializer):
    # One purchased line item within a customer's purchase history.
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    payment_method = serializers.CharField(source="order.get_payment_method_display", read_only=True)
    payment_method_key = serializers.CharField(source="order.payment_method", read_only=True)
    status = serializers.CharField(source="order.status", read_only=True)
    purchased_at = serializers.DateTimeField(source="order.paid_at", read_only=True)
    order_created_at = serializers.DateTimeField(source="order.created_at", read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "order_number", "title", "price", "quantity", "total_price",
            "payment_method", "payment_method_key", "status", "purchased_at", "order_created_at",
        ]
