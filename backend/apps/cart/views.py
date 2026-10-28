"""Per-user cart APIs. Every user only ever sees their own cart."""
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalog.models import Product

from .models import Cart, CartItem
from .serializers import AddToCartSerializer, CartSerializer, UpdateCartItemSerializer


def _get_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


@extend_schema(responses=CartSerializer, tags=["cart"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def cart_detail(request):
    """Return the logged-in user's cart with live counts and totals."""
    cart = _get_cart(request.user)
    return Response(CartSerializer(cart).data)


@extend_schema(request=AddToCartSerializer, responses=CartSerializer, tags=["cart"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cart_add(request):
    """Add a product to the user's cart (or bump quantity if already present)."""
    serializer = AddToCartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    product = Product.objects.filter(id=serializer.validated_data["product_id"], is_active=True).first()
    if not product:
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    cart = _get_cart(request.user)
    item, created = CartItem.objects.get_or_create(
        cart=cart, product=product, defaults={"quantity": serializer.validated_data["quantity"]}
    )
    if not created:
        item.quantity = min(item.quantity + serializer.validated_data["quantity"], CartItem.MAX_QTY)
        item.save(update_fields=["quantity"])
    return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@extend_schema(request=UpdateCartItemSerializer, responses=CartSerializer, tags=["cart"])
@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def cart_item_detail(request, item_id):
    """Update quantity or remove a single item from the user's own cart."""
    cart = _get_cart(request.user)
    item = cart.items.filter(id=item_id).first()
    if not item:
        return Response({"detail": "Item not in your cart."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        item.delete()
        return Response(CartSerializer(cart).data)

    serializer = UpdateCartItemSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    item.quantity = serializer.validated_data["quantity"]
    item.save(update_fields=["quantity"])
    return Response(CartSerializer(cart).data)


@extend_schema(responses=CartSerializer, tags=["cart"])
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cart_clear(request):
    """Empty the user's cart."""
    cart = _get_cart(request.user)
    cart.items.all().delete()
    return Response(CartSerializer(cart).data)
