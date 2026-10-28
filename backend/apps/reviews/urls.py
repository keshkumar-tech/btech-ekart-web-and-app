from django.urls import path

from . import views

urlpatterns = [
    path("product/<slug:slug>/", views.product_reviews, name="product-reviews"),
    path("public/", views.public_reviews, name="public-reviews"),
    path("mine/", views.my_reviews, name="my-reviews"),
    # Admin moderation (custom admin panel)
    path("admin/reviews/", views.AdminReviewListAPI.as_view(), name="admin-review-list"),
    path("admin/reviews/<int:pk>/", views.AdminReviewDetailAPI.as_view(), name="admin-review-detail"),
    path("<int:review_id>/", views.delete_own_review, name="delete-review"),
]
