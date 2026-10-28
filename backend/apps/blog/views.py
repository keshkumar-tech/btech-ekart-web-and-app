from django.db.models import F
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.dashboard.permissions import IsAdminRole
from .models import BlogCategory, BlogPost
from .serializers import (
    BlogCategorySerializer,
    BlogCategoryWriteSerializer,
    BlogPostDetailSerializer,
    BlogPostListSerializer,
    BlogPostWriteSerializer,
)


class BlogCategoryListAPI(generics.ListAPIView):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [AllowAny]


class BlogPostListAPI(generics.ListAPIView):
    queryset = BlogPost.objects.filter(is_published=True).select_related("category", "author")
    serializer_class = BlogPostListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {"category__slug": ["exact"]}
    search_fields = ["title", "excerpt", "content", "tags"]
    ordering_fields = ["published_at", "views", "created_at"]
    ordering = ["-published_at"]
    lookup_field = "slug"
    search_param = "q"


class BlogPostDetailAPI(generics.RetrieveAPIView):
    queryset = BlogPost.objects.filter(is_published=True).select_related("category", "author")
    serializer_class = BlogPostDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count atomically without racing.
        BlogPost.objects.filter(pk=instance.pk).update(views=F("views") + 1)
        instance.refresh_from_db(fields=["views"])
        return super().retrieve(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Admin blog CRUD — custom admin panel (posts + categories).
# ---------------------------------------------------------------------------


class AdminBlogCategoryListCreateAPI(generics.ListCreateAPIView):
    queryset = BlogCategory.objects.all()
    permission_classes = [IsAdminRole]
    pagination_class = None

    def get_serializer_class(self):
        return BlogCategoryWriteSerializer if self.request.method == "POST" else BlogCategorySerializer


class AdminBlogCategoryDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlogCategory.objects.all()
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return BlogCategoryWriteSerializer
        return BlogCategorySerializer


class AdminBlogPostListCreateAPI(generics.ListCreateAPIView):
    queryset = BlogPost.objects.select_related("category", "author").all()
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_published", "category"]
    search_fields = ["title", "excerpt", "content", "tags"]
    ordering_fields = ["created_at", "published_at", "views"]
    ordering = ["-created_at"]
    search_param = "q"

    def get_serializer_class(self):
        return BlogPostWriteSerializer if self.request.method == "POST" else BlogPostDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class AdminBlogPostDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlogPost.objects.select_related("category", "author").all()
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return BlogPostWriteSerializer
        return BlogPostDetailSerializer
