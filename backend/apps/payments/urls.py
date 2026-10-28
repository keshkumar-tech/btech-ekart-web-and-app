from django.urls import path

from . import views

urlpatterns = [
    path("razorpay/create/", views.razorpay_create, name="razorpay-create"),
    path("razorpay/verify/", views.razorpay_verify, name="razorpay-verify"),
    path("razorpay/webhook/", views.razorpay_webhook, name="razorpay-webhook"),
    path("settings/", views.payment_settings, name="payment-settings"),
    path("manual/<str:order_number>/", views.manual_qr_details, name="manual-qr-details"),
    path("", views.payment_list, name="payment-list"),
]
