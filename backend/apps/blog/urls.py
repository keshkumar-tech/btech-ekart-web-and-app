from django.urls import path
from .views import (
    AdminBlogCategoryDetailAPI,
    AdminBlogCategoryListCreateAPI,
    AdminBlogPostDetailAPI,
    AdminBlogPostListCreateAPI,
    BlogCategoryListAPI,
    BlogPostDetailAPI,
    BlogPostListAPI,
)

urlpatterns = [
    path("categories/", BlogCategoryListAPI.as_view(), name="blog-category-list"),
    # Admin CRUD (custom admin panel) — before the slug route.
    path("admin/categories/", AdminBlogCategoryListCreateAPI.as_view(), name="admin-blog-category-list"),
    path("admin/categories/<int:pk>/", AdminBlogCategoryDetailAPI.as_view(), name="admin-blog-category-detail"),
    path("admin/posts/", AdminBlogPostListCreateAPI.as_view(), name="admin-blog-post-list"),
    path("admin/posts/<int:pk>/", AdminBlogPostDetailAPI.as_view(), name="admin-blog-post-detail"),
    path("posts/", BlogPostListAPI.as_view(), name="blog-post-list"),
    path("posts/<slug:slug>/", BlogPostDetailAPI.as_view(), name="blog-post-detail"),
]
