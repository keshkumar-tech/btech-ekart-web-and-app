from django.urls import path

from . import views

urlpatterns = [
    path("", views.wishlist_detail, name="wishlist-detail"),
    path("add/", views.wishlist_add, name="wishlist-add"),
    path("move-to-cart/", views.wishlist_move_to_cart, name="wishlist-move-to-cart"),
    path("remove/<int:product_id>/", views.wishlist_remove, name="wishlist-remove"),
]
