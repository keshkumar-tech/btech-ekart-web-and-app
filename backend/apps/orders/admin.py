from django.contrib import admin

from .models import Coupon, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "title", "price", "mrp", "quantity", "download_count")
    can_delete = False


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "value", "min_order_amount", "used_count", "usage_limit", "is_active", "valid_to")
    list_filter = ("discount_type", "is_active")
    search_fields = ("code", "description")
    list_editable = ("is_active",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "payment_method", "total_amount", "paid_at", "created_at")
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("order_number", "user__email", "user__name", "utr_number", "customer_email")
    readonly_fields = ("order_number", "subtotal", "discount_amount", "total_amount", "paid_at", "created_at", "updated_at")
    inlines = [OrderItemInline]
    actions = ["mark_paid"]

    @admin.action(description="Mark selected orders as PAID and unlock access")
    def mark_paid(self, request, queryset):
        count = 0
        for order in queryset:
            if order.mark_paid():
                count += 1
        self.message_user(request, f"{count} order(s) marked as paid.")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "title", "price", "quantity", "download_count")
    search_fields = ("order__order_number", "title")
