from django.urls import path

from . import views

urlpatterns = [
    path("checkout/", views.checkout, name="checkout"),
    path("coupon/apply/", views.apply_coupon, name="apply-coupon"),
    # Admin coupon CRUD (custom admin panel)
    path("admin/coupons/", views.AdminCouponListCreateAPI.as_view(), name="admin-coupon-list"),
    path("admin/coupons/<int:pk>/", views.AdminCouponDetailAPI.as_view(), name="admin-coupon-detail"),
    path("", views.order_list, name="order-list"),
    path("<str:order_number>/", views.order_detail, name="order-detail"),
    path("<str:order_number>/invoice/", views.download_invoice, name="order-invoice"),
    path("<str:order_number>/manual-payment/", views.submit_manual_payment, name="manual-payment"),
]
