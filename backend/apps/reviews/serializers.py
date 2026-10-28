from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_avatar = serializers.CharField(source="user.avatar", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "product", "product_title", "user", "user_name", "user_avatar",
            "rating", "title", "comment", "is_verified_purchase", "is_approved",
            "helpful_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "is_verified_purchase", "is_approved", "helpful_count", "created_at", "updated_at"]


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["product", "rating", "title", "comment"]

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
class AdminReviewSerializer(serializers.ModelSerializer):
    """Review moderation for the custom admin panel."""

    user_name = serializers.CharField(source="user.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "product", "product_title", "product_slug",
            "user", "user_name", "user_email",
            "rating", "title", "comment", "is_verified_purchase",
            "is_approved", "helpful_count", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "product", "user", "user_name", "user_email",
            "product_title", "product_slug", "helpful_count",
            "created_at", "updated_at",
        ]
