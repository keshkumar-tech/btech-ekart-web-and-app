from rest_framework import serializers

from .models import BlogCategory, BlogPost


class BlogCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.IntegerField(source="posts.count", read_only=True)

    class Meta:
        model = BlogCategory
        fields = ["id", "name", "slug", "description", "order", "post_count"]
class BlogCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ["id", "name", "slug", "description", "order"]
        read_only_fields = ["slug"]
        extra_kwargs = {"description": {"required": False, "allow_blank": True}}


class BlogPostListSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source="author.name", read_only=True, default="")
    tags_list = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "category", "author_name", "excerpt",
            "cover_image", "tags_list", "read_minutes", "views",
            "is_published", "published_at", "created_at",
        ]

    def get_tags_list(self, obj) -> list:
        return obj.tag_list


class BlogPostDetailSerializer(BlogPostListSerializer):
    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + ["content", "updated_at"]


class BlogPostWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "category", "excerpt", "content",
            "cover_image", "tags", "read_minutes", "is_published", "published_at",
        ]
        read_only_fields = ["id", "slug", "published_at"]
        extra_kwargs = {
            "excerpt": {"required": False, "allow_blank": True},
            "tags": {"required": False, "allow_blank": True},
            "cover_image": {"required": False, "allow_null": True},
            "category": {"required": False, "allow_null": True},
        }

    def to_internal_value(self, data):
        # Ignore a stale cover path sent as a plain string (see ProductWriteSerializer).
        if hasattr(data, "copy") and isinstance(data.get("cover_image"), str):
            data = data.copy()
            data.pop("cover_image", None)
        return super().to_internal_value(data)
