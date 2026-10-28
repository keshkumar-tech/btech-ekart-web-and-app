from django.contrib import admin

from .models import Payment, WebhookEvent


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "gateway", "status", "amount", "razorpay_payment_id", "method", "created_at")
    list_filter = ("gateway", "status", "method", "created_at")
    search_fields = ("order__order_number", "razorpay_order_id", "razorpay_payment_id", "utr_number")
    readonly_fields = ("gateway_response", "created_at", "updated_at")


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_id", "event_type", "processed", "created_at")
    list_filter = ("event_type", "processed")
    search_fields = ("event_id",)
    readonly_fields = ("payload",)
