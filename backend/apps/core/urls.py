from django.urls import path

from .library_views import my_library, product_preview, secure_download
from .views import HealthCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    # My Library (purchased products) + secure PDF delivery
    path("library/", my_library, name="my-library"),
    path("library/download/<int:order_item_id>/", secure_download, name="secure-download"),
    path("catalog/products/<slug:slug>/preview/", product_preview, name="product-preview"),
]
