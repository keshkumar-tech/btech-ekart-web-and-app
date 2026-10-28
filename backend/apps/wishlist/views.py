"""Per-user wishlist APIs, plus move-to-cart."""
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Product

from .models import Wishlist
from .serializers import WishlistSerializer, WishlistToggleSerializer


def _get_wishlist(user):
    wl, _ = Wishlist.objects.get_or_create(user=user)
    return wl


@extend_schema(responses=WishlistSerializer, tags=["wishlist"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def wishlist_detail(request):
    wl = _get_wishlist(request.user)
    return Response(WishlistSerializer(wl).data)


@extend_schema(request=WishlistToggleSerializer, responses=WishlistSerializer, tags=["wishlist"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def wishlist_add(request):
    serializer = WishlistToggleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    product = Product.objects.filter(id=serializer.validated_data["product_id"], is_active=True).first()
    if not product:
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
    wl = _get_wishlist(request.user)
    wl.products.add(product)
    return Response(WishlistSerializer(wl).data, status=status.HTTP_201_CREATED)


@extend_schema(responses=WishlistSerializer, tags=["wishlist"])
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def wishlist_remove(request, product_id):
    wl = _get_wishlist(request.user)
    wl.products.remove(product_id)
    return Response(WishlistSerializer(wl).data)


@extend_schema(request=WishlistToggleSerializer, responses=WishlistSerializer, tags=["wishlist"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def wishlist_move_to_cart(request):
    """Move a wishlisted product into the cart and remove it from the wishlist."""
    serializer = WishlistToggleSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    product = Product.objects.filter(id=serializer.validated_data["product_id"], is_active=True).first()
    if not product:
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    cart, _ = Cart.objects.get_or_create(user=request.user)
    item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": 1})
    if not created:
        item.quantity = min(item.quantity + 1, CartItem.MAX_QTY)
        item.save(update_fields=["quantity"])

    wl = _get_wishlist(request.user)
    wl.products.remove(product)
    return Response(WishlistSerializer(wl).data)
