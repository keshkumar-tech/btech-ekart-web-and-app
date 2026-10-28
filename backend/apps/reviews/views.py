"""Review APIs. Public read of APPROVED reviews; only buyers can write.

Flow: a signed-in user who owns the product submits a review -> it is stored
and published right away (with a "Verified purchase" badge), the cached product
rating is recomputed, and admins are notified so they can hide abuse.
"""
from drf_spectacular.utils import extend_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.catalog.models import Product
from apps.core.serializers import DetailSerializer
from apps.dashboard.permissions import IsAdminRole
from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.orders.models import Order, OrderItem
from .models import Review, recompute_product_rating
from .serializers import AdminReviewSerializer, ReviewCreateSerializer, ReviewSerializer


def _user_bought_product(user, product):
    """True when the user has a paid order containing this product."""
    return OrderItem.objects.filter(
        order__user=user, order__status=Order.Status.PAID, product=product
    ).exists()


@extend_schema(request=ReviewCreateSerializer, responses=ReviewSerializer(many=True), tags=["reviews"])
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def product_reviews(request, slug):
    product = Product.objects.filter(slug=slug, is_active=True).first()
    if not product:
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        reviews = product.reviews.filter(is_approved=True).select_related("user")
        return Response(ReviewSerializer(reviews, many=True).data)

    # POST — create/update this user's review for this product.
    #
    # Only buyers may review (one review per user per product, enforced by
    # unique_together). This keeps the star rating honest and lets every
    # accepted review carry the "Verified purchase" badge.
    if not request.user.is_authenticated:
        return Response({"detail": "Log in to write a review."}, status=status.HTTP_401_UNAUTHORIZED)

    bought = _user_bought_product(request.user, product)
    if not bought and not getattr(request.user, "is_admin_role", False):
        return Response(
            {"detail": "Only customers who bought this product can review it."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = ReviewCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    existing = Review.objects.filter(product=product, user=request.user).first()

    if existing:
        existing.rating = serializer.validated_data["rating"]
        existing.title = serializer.validated_data.get("title", "")
        existing.comment = serializer.validated_data["comment"]
        existing.is_verified_purchase = True
        existing.save()
        review, created = existing, False
    else:
        review = Review.objects.create(
            product=product,
            user=request.user,
            rating=serializer.validated_data["rating"],
            title=serializer.validated_data.get("title", ""),
            comment=serializer.validated_data["comment"],
            is_verified_purchase=True,
            is_approved=True,
        )
        created = True

    # Publish immediately — the buyer check above is the gate.
    recompute_product_rating(product)

    payload = ReviewSerializer(review).data
    payload["pending_approval"] = False
    payload["detail"] = "Thanks! Your review is live."
    return Response(
        payload,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@extend_schema(responses=ReviewSerializer(many=True), tags=["reviews"])
@api_view(["GET"])
@permission_classes([AllowAny])
def public_reviews(request):
    """Approved reviews across all products — powers the storefront
    testimonial carousel. `limit` caps the number returned (max 50)."""
    try:
        limit = min(int(request.query_params.get("limit", 20)), 50)
    except (TypeError, ValueError):
        limit = 20

    reviews = (
        Review.objects.filter(is_approved=True)
        .select_related("user", "product")
        .order_by("-is_verified_purchase", "-created_at")[:limit]
    )
    return Response(ReviewSerializer(reviews, many=True).data)


@extend_schema(responses=ReviewSerializer(many=True), tags=["reviews"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_reviews(request):
    reviews = Review.objects.filter(user=request.user).select_related("product")
    return Response(ReviewSerializer(reviews, many=True).data)


@extend_schema(responses=DetailSerializer, tags=["reviews"])
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_own_review(request, review_id):
    review = Review.objects.filter(id=review_id, user=request.user).first()
    if not review:
        return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
    product = review.product
    review.delete()
    recompute_product_rating(product)
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Admin review moderation — custom admin panel (approve / hide / delete).
# ---------------------------------------------------------------------------


class AdminReviewListAPI(generics.ListAPIView):
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_approved", "is_verified_purchase", "rating", "product"]
    search_fields = ["comment", "title", "user__email", "user__name", "product__title"]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]
    search_param = "q"

    def get_queryset(self):
        return Review.objects.select_related("user", "product").all()


class AdminReviewDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.select_related("user", "product").all()
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminRole]

    def perform_update(self, serializer):
        review = serializer.save()
        # Keep the cached product rating in sync when approval changes.
        recompute_product_rating(review.product)
        # Let the author know the outcome of moderation.
        if "is_approved" in serializer.validated_data:
            if review.is_approved:
                notify(
                    review.user,
                    kind=Notification.Kind.REVIEW_APPROVED,
                    title="Your review is live",
                    body=f"Your review on \"{review.product.title}\" is now visible to everyone.",
                    url=f"/product/{review.product.slug}",
                    actor=self.request.user,
                )
            else:
                notify(
                    review.user,
                    kind=Notification.Kind.REVIEW_REJECTED,
                    title="Your review was hidden",
                    body=f"Your review on \"{review.product.title}\" was hidden by a moderator.",
                    url=f"/product/{review.product.slug}",
                    actor=self.request.user,
                )

    def perform_destroy(self, instance):
        product = instance.product
        instance.delete()
        recompute_product_rating(product)
