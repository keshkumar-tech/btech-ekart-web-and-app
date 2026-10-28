"""Cart serializers."""
from rest_framework import serializers

from apps.catalog.models import Product
from apps.catalog.serializers import ProductSerializer

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True), source="product", write_only=True
    )
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    mrp_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity", "total_price", "mrp_price", "added_at"]
        read_only_fields = ["id", "added_at"]

    def validate_quantity(self, value):
        if value < 1 or value > CartItem.MAX_QTY:
            raise serializers.ValidationError(f"Quantity must be between 1 and {CartItem.MAX_QTY}.")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    mrp_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    you_save = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "item_count", "subtotal", "mrp_total", "you_save", "updated_at"]


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=CartItem.MAX_QTY, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=CartItem.MAX_QTY)
