from django.contrib import admin

from .models import Review, recompute_product_rating


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "is_verified_purchase", "is_approved", "helpful_count", "created_at")
    list_filter = ("rating", "is_approved", "is_verified_purchase", "created_at")
    search_fields = ("product__title", "user__email", "title", "comment")
    list_editable = ("is_approved",)
    actions = ["approve", "reject"]

    def _recompute(self, queryset):
        for product_id in queryset.values_list("product_id", flat=True).distinct():
            from apps.catalog.models import Product
            product = Product.objects.filter(id=product_id).first()
            if product:
                recompute_product_rating(product)

    @admin.action(description="Approve selected reviews")
    def approve(self, request, queryset):
        queryset.update(is_approved=True)
        self._recompute(queryset)
        self.message_user(request, "Selected reviews approved.")

    @admin.action(description="Reject / hide selected reviews")
    def reject(self, request, queryset):
        queryset.update(is_approved=False)
        self._recompute(queryset)
        self.message_user(request, "Selected reviews hidden.")
