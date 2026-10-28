from django.urls import path

from . import views

urlpatterns = [
    path("", views.cart_detail, name="cart-detail"),
    path("add/", views.cart_add, name="cart-add"),
    path("clear/", views.cart_clear, name="cart-clear"),
    path("items/<int:item_id>/", views.cart_item_detail, name="cart-item-detail"),
]
