from django.urls import path

from .views import (
    AdminBannerDetailAPI,
    AdminBannerListCreateAPI,
    AdminBranchDetailAPI,
    AdminBranchListCreateAPI,
    AdminCategoryDetailAPI,
    AdminCategoryListCreateAPI,
    AdminProductDetailAPI,
    AdminProductListCreateAPI,
    AdminSiteSettingDetailAPI,
    AdminSiteSettingListCreateAPI,
    AdminSubjectDetailAPI,
    AdminSubjectListCreateAPI,
    BannerListAPI,
    BranchListAPI,
    CategoryListAPI,
    ProductDetailAPI,
    ProductListAPI,
    SubjectListAPI,
)

urlpatterns = [
    path("categories/", CategoryListAPI.as_view(), name="category-list"),
    path("branches/", BranchListAPI.as_view(), name="branch-list"),
    path("subjects/", SubjectListAPI.as_view(), name="subject-list"),
    # Admin CRUD routes must precede the public slug route so "admin" is not
    # matched as a product slug.
    path("admin/products/", AdminProductListCreateAPI.as_view(), name="admin-product-list"),
    path("admin/products/<int:pk>/", AdminProductDetailAPI.as_view(), name="admin-product-detail"),
    # Taxonomy
    path("admin/categories/", AdminCategoryListCreateAPI.as_view(), name="admin-category-list"),
    path("admin/categories/<int:pk>/", AdminCategoryDetailAPI.as_view(), name="admin-category-detail"),
    path("admin/branches/", AdminBranchListCreateAPI.as_view(), name="admin-branch-list"),
    path("admin/branches/<int:pk>/", AdminBranchDetailAPI.as_view(), name="admin-branch-detail"),
    path("admin/subjects/", AdminSubjectListCreateAPI.as_view(), name="admin-subject-list"),
    path("admin/subjects/<int:pk>/", AdminSubjectDetailAPI.as_view(), name="admin-subject-detail"),
    # Banners
    path("admin/banners/", AdminBannerListCreateAPI.as_view(), name="admin-banner-list"),
    path("admin/banners/<int:pk>/", AdminBannerDetailAPI.as_view(), name="admin-banner-detail"),
    # Site settings
    path("admin/settings/", AdminSiteSettingListCreateAPI.as_view(), name="admin-setting-list"),
    path("admin/settings/<int:pk>/", AdminSiteSettingDetailAPI.as_view(), name="admin-setting-detail"),
    path("products/", ProductListAPI.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailAPI.as_view(), name="product-detail"),
    path("banners/", BannerListAPI.as_view(), name="banner-list"),
]
