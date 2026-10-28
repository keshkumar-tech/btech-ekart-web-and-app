"""Per-user order APIs: checkout, list/detail, coupon validation, invoice download."""
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.cart.models import Cart
from apps.core.serializers import DetailSerializer
from apps.core.utils import generate_invoice_pdf
from apps.dashboard.permissions import IsAdminRole
from .models import Coupon, Order
from .serializers import (
    ApplyCouponSerializer,
    CheckoutSerializer,
    CouponSerializer,
    CouponWriteSerializer,
    ManualPaymentSubmitSerializer,
    OrderSerializer,
)
from .services import CheckoutError, create_order_from_cart, notify_admin_new_manual_payment


@extend_schema(request=CheckoutSerializer, responses=OrderSerializer, tags=["orders"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    """Create a PENDING order from the user's cart.

    For Razorpay the client then opens Checkout and calls /payments/razorpay/verify/.
    For manual QR the client shows the owner QR and calls /payments/manual/submit/.
    """
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    try:
        order = create_order_from_cart(
            request.user,
            data["payment_method"],
            data.get("coupon_code", ""),
            customer_name=data.get("customer_name", ""),
            customer_email=data.get("customer_email", ""),
            customer_phone=data.get("customer_phone", ""),
        )
    except CheckoutError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@extend_schema(responses=OrderSerializer(many=True), tags=["orders"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_list(request):
    """List the logged-in user's own orders only."""
    orders = Order.objects.filter(user=request.user).prefetch_related("items__product")
    return Response(OrderSerializer(orders, many=True).data)


@extend_schema(responses=OrderSerializer, tags=["orders"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_number):
    """Order detail — scoped to the owner (admins may also fetch any order)."""
    qs = Order.objects.prefetch_related("items__product")
    order = qs.filter(order_number=order_number).first()
    if not order or (order.user_id != request.user.id and not request.user.is_admin_role):
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order).data)


@extend_schema(request=ApplyCouponSerializer, responses=DetailSerializer, tags=["orders"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_coupon(request):
    """Validate a coupon against the current cart and preview the discount."""
    serializer = ApplyCouponSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code = serializer.validated_data["code"].strip()

    cart = Cart.objects.filter(user=request.user).first()
    if not cart or not cart.items.exists():
        return Response({"detail": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

    coupon = Coupon.objects.filter(code__iexact=code).first()
    if not coupon or not coupon.is_valid_now:
        return Response({"detail": "This coupon is invalid or has expired."}, status=status.HTTP_400_BAD_REQUEST)

    subtotal = cart.subtotal
    if subtotal < coupon.min_order_amount:
        return Response(
            {"detail": f"Add items worth Rs. {coupon.min_order_amount} to use this coupon."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    already = Order.objects.filter(user=request.user, coupon=coupon, status=Order.Status.PAID).count()
    if already >= coupon.per_user_limit:
        return Response({"detail": "You have already used this coupon."}, status=status.HTTP_400_BAD_REQUEST)

    discount = coupon.compute_discount(subtotal)
    return Response(
        {
            "code": coupon.code,
            "discount_amount": discount,
            "subtotal": subtotal,
            "payable": subtotal - discount,
        }
    )


@extend_schema(responses=DetailSerializer, tags=["orders"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_invoice(request, order_number):
    """Stream the PDF invoice for one of the user's own paid orders."""
    order = Order.objects.prefetch_related("items__product").filter(
        order_number=order_number, user=request.user
    ).first()
    if not order:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    if not order.is_paid:
        return Response({"detail": "Invoice is available once the order is paid."}, status=status.HTTP_400_BAD_REQUEST)

    pdf = generate_invoice_pdf(order)
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{order.invoice_number or order.order_number}.pdf"'
    return response


@extend_schema(request=ManualPaymentSubmitSerializer, responses=OrderSerializer, tags=["orders"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_manual_payment(request, order_number):
    """Attach UTR + screenshot to a manual-QR order and move it to Pending verification."""
    order = Order.objects.filter(order_number=order_number, user=request.user).first()
    if not order:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
    if order.status not in (Order.Status.PENDING, Order.Status.FAILED):
        return Response({"detail": "This order is not awaiting payment."}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ManualPaymentSubmitSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order.utr_number = serializer.validated_data["utr_number"]
    if "payment_screenshot" in request.FILES:
        order.payment_screenshot = request.FILES["payment_screenshot"]
    order.status = Order.Status.PENDING_VERIFICATION
    order.save(update_fields=["utr_number", "payment_screenshot", "status"])
    notify_admin_new_manual_payment(order)
    return Response(OrderSerializer(order).data)


# ---------------------------------------------------------------------------
# Admin coupon CRUD — managed from the custom admin panel (no Django admin).
# ---------------------------------------------------------------------------


class AdminCouponListCreateAPI(generics.ListCreateAPIView):
    queryset = Coupon.objects.all()
    permission_classes = [IsAdminRole]
    pagination_class = None

    def get_serializer_class(self):
        return CouponWriteSerializer if self.request.method == "POST" else CouponSerializer


class AdminCouponDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    queryset = Coupon.objects.all()
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CouponWriteSerializer
        return CouponSerializer
