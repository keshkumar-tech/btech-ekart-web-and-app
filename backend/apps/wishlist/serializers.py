"""Wishlist serializers."""
from rest_framework import serializers

from apps.catalog.models import Product
from apps.catalog.serializers import ProductSerializer

from .models import Wishlist


class WishlistSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Wishlist
        fields = ["id", "products", "item_count", "updated_at"]


class WishlistToggleSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
