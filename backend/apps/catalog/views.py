"""Catalog views: public taxonomy + products + filters/search/ordering."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.dashboard.permissions import IsAdminRole

from .models import Banner, Branch, Category, Product, SiteSetting, Subject
from .serializers import (
    BannerSerializer,
    BannerWriteSerializer,
    BranchSerializer,
    BranchWriteSerializer,
    CategorySerializer,
    CategoryWriteSerializer,
    ProductDetailSerializer,
    ProductSerializer,
    ProductWriteSerializer,
    SiteSettingSerializer,
    SiteSettingWriteSerializer,
    SubjectSerializer,
    SubjectWriteSerializer,
)


class CategoryListAPI(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class BranchListAPI(generics.ListAPIView):
    queryset = Branch.objects.filter(is_active=True)
    serializer_class = BranchSerializer
    permission_classes = [AllowAny]


class SubjectListAPI(generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "code", "branch__short_name"]


PRODUCT_FILTERS = {
    "type", "branch", "branch__short_name", "subject", "year", "semester", "category", "is_trending", "is_new_arrival"
}


class ProductListAPI(generics.ListAPIView):
    queryset = Product.objects.select_related("category", "branch", "subject").filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "type": ["exact"],
        "branch__short_name": ["exact"],
        "year": ["exact"],
        "semester": ["exact"],
        "category__slug": ["exact"],
        "is_trending": ["exact"],
        "is_new_arrival": ["exact"],
        "price": ["gte", "lte"],
        "rating": ["gte", "lte"],
    }
    search_fields = ["title", "description", "subject_code", "tags"]
    ordering_fields = ["price", "mrp", "rating", "sold_count", "created_at", "discount"]
    ordering = ["-created_at"]
    search_param = "q"


class ProductDetailAPI(generics.RetrieveAPIView):
    lookup_field = "slug"
    queryset = Product.objects.select_related("category", "branch", "subject").filter(is_active=True)
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]


class BannerListAPI(generics.ListAPIView):
    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]


# ---------------------------------------------------------------------------
# Admin write API — used by the custom admin panel (no Django admin involved).
# ---------------------------------------------------------------------------


class AdminProductListCreateAPI(generics.ListCreateAPIView):
    """List all products (incl. inactive) and create new ones. Admin only."""

    queryset = Product.objects.select_related("category", "branch", "subject").all()
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["type", "is_active", "is_trending", "is_new_arrival", "branch", "semester", "category"]
    search_fields = ["title", "description", "subject_code", "tags"]
    ordering_fields = ["price", "mrp", "rating", "sold_count", "created_at", "discount", "title"]
    ordering = ["-created_at"]
    search_param = "q"

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductWriteSerializer
        return ProductSerializer

    def create(self, request, *args, **kwargs):
        # Accept multipart/form-data so cover/preview/main PDFs can be uploaded.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(ProductSerializer(product, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)


class AdminProductDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a single product by id. Admin only."""

    queryset = Product.objects.select_related("category", "branch", "subject").all()
    permission_classes = [IsAdminRole]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProductWriteSerializer
        return ProductSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(ProductSerializer(product, context=self.get_serializer_context()).data)


# ---------------------------------------------------------------------------
# Admin CRUD — taxonomy (Category / Branch / Subject), used through the custom
# admin panel only. Django admin is NOT required for any of these operations.
# ---------------------------------------------------------------------------


class AdminTaxonomyMixin:
    permission_classes = [IsAdminRole]
    pagination_class = None  # taxonomy lists are small; return plain arrays


class AdminCategoryListCreateAPI(AdminTaxonomyMixin, generics.ListCreateAPIView):
    queryset = Category.objects.all()

    def get_serializer_class(self):
        return CategoryWriteSerializer if self.request.method == "POST" else CategorySerializer


class AdminCategoryDetailAPI(AdminTaxonomyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CategoryWriteSerializer
        return CategorySerializer


class AdminBranchListCreateAPI(AdminTaxonomyMixin, generics.ListCreateAPIView):
    queryset = Branch.objects.all()

    def get_serializer_class(self):
        return BranchWriteSerializer if self.request.method == "POST" else BranchSerializer


class AdminBranchDetailAPI(AdminTaxonomyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Branch.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return BranchWriteSerializer
        return BranchSerializer


class AdminSubjectListCreateAPI(AdminTaxonomyMixin, generics.ListCreateAPIView):
    queryset = Subject.objects.select_related("branch").all()

    def get_serializer_class(self):
        return SubjectWriteSerializer if self.request.method == "POST" else SubjectSerializer


class AdminSubjectDetailAPI(AdminTaxonomyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.select_related("branch").all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return SubjectWriteSerializer
        return SubjectSerializer


# --- Banners ---------------------------------------------------------------


class AdminBannerListCreateAPI(AdminTaxonomyMixin, generics.ListCreateAPIView):
    queryset = Banner.objects.all()

    def get_serializer_class(self):
        return BannerWriteSerializer if self.request.method == "POST" else BannerSerializer


class AdminBannerDetailAPI(AdminTaxonomyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Banner.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return BannerWriteSerializer
        return BannerSerializer


# --- Site settings ---------------------------------------------------------


class AdminSiteSettingListCreateAPI(AdminTaxonomyMixin, generics.ListCreateAPIView):
    queryset = SiteSetting.objects.all()

    def get_serializer_class(self):
        return SiteSettingWriteSerializer if self.request.method == "POST" else SiteSettingSerializer


class AdminSiteSettingDetailAPI(AdminTaxonomyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = SiteSetting.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return SiteSettingWriteSerializer
        return SiteSettingSerializer
