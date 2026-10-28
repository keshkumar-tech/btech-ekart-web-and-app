"""Catalog serializers."""
from rest_framework import serializers

from .models import Banner, Branch, Category, Product, SiteSetting, Subject


class ProductWriteSerializer(serializers.ModelSerializer):
    """Create/update serializer for the custom admin product CRUD.

    `cover_image` is OPTIONAL. When it is not uploaded, the Product model
    auto-generates a cover from the first page of the uploaded PDF.
    """

    cover_image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "title", "slug", "description", "type",
            "category", "branch", "subject", "year", "semester", "subject_code",
            "price", "mrp", "discount", "cover_image", "cover_image_url",
            "preview_pdf", "main_pdf", "page_count",
            "rating", "rating_count", "sold_count", "tags",
            "is_active", "is_trending", "is_new_arrival", "created_at",
        ]
        read_only_fields = ("slug", "rating", "rating_count", "sold_count", "discount")
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "cover_image": {"required": False, "allow_null": True},
            "preview_pdf": {"required": False, "allow_null": True},
            "main_pdf": {"required": False, "allow_null": True},
        }

    def get_cover_image_url(self, obj) -> str | None:
        return obj.get_cover_image_url()

    def to_internal_value(self, data):
        # Guard against clients that send the existing file path as a plain
        # string (e.g. a stale value in a JSON payload). A file can only arrive
        # via multipart uploads, so drop any non-file string for the file fields
        # instead of failing with "The submitted data was not a file".
        if hasattr(data, "copy"):
            for field in ("cover_image", "preview_pdf", "main_pdf"):
                value = data.get(field)
                if isinstance(value, str):
                    data = data.copy()
                    data.pop(field, None)
        return super().to_internal_value(data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "description", "is_active"]

class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "description", "is_active", "order"]
        read_only_fields = ("slug",)
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True},
            "icon": {"required": False, "allow_blank": True},
        }

class BranchWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "short_name", "slug", "is_active"]
        read_only_fields = ("slug",)

class SubjectWriteSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.short_name", read_only=True)

    class Meta:
        model = Subject
        fields = ["id", "name", "code", "slug", "branch", "branch_name", "semester"]
        read_only_fields = ("slug",)
        extra_kwargs = {"code": {"required": False, "allow_blank": True}}


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "short_name", "slug", "is_active"]


class SubjectSerializer(serializers.ModelSerializer):
    branch = BranchSerializer(read_only=True)

    class Meta:
        model = Subject
        fields = ["id", "name", "code", "branch", "semester"]


class ProductSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    category = CategorySerializer(read_only=True)
    branch = BranchSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    tags_list = serializers.SerializerMethodField()
    you_save = serializers.SerializerMethodField()
    # Override the raw ImageField so the URL carries a version tag (file mtime).
    # Covers can be regenerated in place under the same filename during dev;
    # without this a browser keeps serving the stale cached image.
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "title", "slug", "description", "type", "type_display",
            "category", "branch", "subject", "year", "semester", "subject_code",
            "price", "mrp", "discount", "you_save", "cover_image", "page_count",
            "rating", "rating_count", "sold_count", "tags", "tags_list",
            "is_active", "is_trending", "is_new_arrival", "created_at",
        ]
        read_only_fields = ("rating", "rating_count", "sold_count", "discount")

    def get_tags_list(self, obj) -> list:
        return obj.tag_list
    def get_cover_image(self, obj):
        # Return the cover URL with a ?v=<mtime> cache-busting tag.
        if not obj.cover_image:
            return None
        url = obj.cover_image.url
        try:
            version = int(obj.cover_image.storage.get_modified_time(obj.cover_image.name).timestamp())
            sep = "&" if "?" in url else "?"
            return f"{url}{sep}v={version}"
        except (OSError, NotImplementedError, ValueError):
            return url

    def get_you_save(self, obj) -> float:
        return float(obj.mrp - obj.price) if obj.mrp and obj.mrp > obj.price else 0


class ProductDetailSerializer(ProductSerializer):
    related_products = serializers.SerializerMethodField()

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ["related_products"]

    def get_related_products(self, obj) -> list:
        # Return genuinely related products, closest matches first.
        #
        # The match is progressively relaxed so the row is almost never empty:
        #   1. same subject + branch (other types: Notes -> its PYQ/Quantum/Combo)
        #   2. same branch + same type, other subjects
        #   3. same type, any branch
        #   4. same branch, any type
        # Results are de-duplicated and capped.
        base = Product.objects.filter(is_active=True).exclude(pk=obj.pk)
        ordered: list = []
        seen: set[int] = set()

        tiers = [
            base.filter(subject=obj.subject, branch=obj.branch) if obj.subject else None,
            base.filter(branch=obj.branch, type=obj.type) if obj.branch else None,
            base.filter(type=obj.type),
            base.filter(branch=obj.branch) if obj.branch else None,
        ]
        for qs in tiers:
            if qs is None:
                continue
            for p in qs.select_related("category", "branch", "subject").order_by("-rating", "-sold_count"):
                if p.pk in seen:
                    continue
                seen.add(p.pk)
                ordered.append(p)
                if len(ordered) >= 12:
                    break
            if len(ordered) >= 12:
                break

        return ProductSerializer(ordered, many=True, context=self.context).data


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "image", "link", "badge_text", "order", "is_active"]

class BannerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ["id", "title", "subtitle", "image", "link", "badge_text", "order", "is_active"]
        extra_kwargs = {
            "subtitle": {"required": False, "allow_blank": True},
            "link": {"required": False, "allow_blank": True},
            "badge_text": {"required": False, "allow_blank": True},
            "image": {"required": False, "allow_null": True},
        }

    def to_internal_value(self, data):
        # Ignore a stale image path sent as a plain string (see ProductWriteSerializer).
        if hasattr(data, "copy") and isinstance(data.get("image"), str):
            data = data.copy()
            data.pop("image", None)
        return super().to_internal_value(data)


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ["id", "key", "value", "image"]

class SiteSettingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ["id", "key", "value", "image"]
        extra_kwargs = {
            "value": {"required": False, "allow_blank": True},
            "image": {"required": False, "allow_null": True},
        }

    def to_internal_value(self, data):
        # Ignore a stale image path sent as a plain string (see ProductWriteSerializer).
        if hasattr(data, "copy") and isinstance(data.get("image"), str):
            data = data.copy()
            data.pop("image", None)
        return super().to_internal_value(data)
