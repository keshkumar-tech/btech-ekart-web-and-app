# Admin-only dashboard API: analytics, customers, orders, moderation, CSV exports.
import csv

from django.db.models import Count, DecimalField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.cart.models import CartItem
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import OrderSerializer
from apps.orders.services import send_order_confirmation_email
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer
from apps.wishlist.models import Wishlist

from . import services
from .permissions import IsAdminRole
from .serializers import AdminCustomerSerializer, AdminPurchaseRowSerializer

ZERO = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))


class AdminBaseMixin:
    # Every dashboard endpoint is admin-only.
    permission_classes = [IsAdminRole]


@extend_schema(tags=["dashboard"], responses=inline_serializer("OverviewStats", {"total_revenue": serializers.DecimalField(max_digits=12, decimal_places=2)}))
class OverviewAPI(AdminBaseMixin, APIView):
    def get(self, request):
        return Response(services.overview_stats())


@extend_schema(tags=["dashboard"], responses=inline_serializer("RevenueChart", {"period": serializers.CharField(), "series": serializers.ListField()}))
class RevenueChartAPI(AdminBaseMixin, APIView):
    def get(self, request):
        period = request.query_params.get("period", "daily")
        try:
            days = int(request.query_params.get("days", 30))
        except (TypeError, ValueError):
            days = 30
        return Response(
            {
                "period": period,
                "series": services.revenue_series(period=period, days=days),
                "top_products": services.top_products(10),
                "top_branches": services.top_branches(6),
                "category_breakdown": services.category_breakdown(),
                "coupons": list(services.coupon_performance()),
            }
        )


@extend_schema(tags=["dashboard"], responses=OrderSerializer(many=True))
class RecentOrdersAPI(AdminBaseMixin, APIView):
    def get(self, request):
        try:
            limit = min(int(request.query_params.get("limit", 10)), 50)
        except (TypeError, ValueError):
            limit = 10
        qs = Order.objects.select_related("user").prefetch_related("items__product")[:limit]
        return Response(OrderSerializer(qs, many=True).data)


class AdminCustomerListView(AdminBaseMixin, ListAPIView):
    # All customers with search, filters, and their lifetime spend.
    serializer_class = AdminCustomerSerializer
    filter_backends = []
    search_fields = ["email", "name", "phone", "college"]

    def get_queryset(self):
        qs = (
            User.objects.filter(role=User.Role.CUSTOMER)
            .annotate(
                total_spent=Coalesce(
                    Sum("orders__total_amount", filter=Q(orders__status=Order.Status.PAID)),
                    ZERO,
                ),
                orders_count=Count("orders", distinct=True),
            )
            .order_by("-date_joined")
        )
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(email__icontains=q) | Q(name__icontains=q) | Q(phone__icontains=q))
        if self.request.query_params.get("verified") == "true":
            qs = qs.filter(email_verified=True)
        if self.request.query_params.get("active") == "true":
            qs = qs.filter(is_active=True)
        return qs


@extend_schema(tags=["dashboard"], responses=inline_serializer("CustomerDetail", {"total_spent": serializers.DecimalField(max_digits=12, decimal_places=2)}))
class AdminCustomerDetailView(AdminBaseMixin, APIView):
    # Full profile: purchases, cart, wishlist, payments and lifetime spend.
    def get(self, request, user_id):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

        orders = (
            Order.objects.filter(user=user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )
        paid = orders.filter(status=Order.Status.PAID)
        total_spent = paid.aggregate(total=Coalesce(Sum("total_amount"), ZERO))["total"]

        purchases = OrderItem.objects.filter(order__user=user, order__status=Order.Status.PAID).select_related(
            "order", "product"
        ).order_by("-order__paid_at", "-id")

        cart = getattr(user, "cart", None)
        wishlist = getattr(user, "wishlist", None)

        return Response(
            {
                "profile": AdminCustomerSerializer(user).data,
                "total_spent": total_spent,
                "orders_count": orders.count(),
                "paid_orders_count": paid.count(),
                "purchases": AdminPurchaseRowSerializer(purchases, many=True).data,
                "orders": OrderSerializer(orders, many=True).data,
                "cart": (
                    [
                        {
                            "product_id": i.product_id,
                            "title": i.product.title,
                            "quantity": i.quantity,
                            "price": i.product.price,
                        }
                        for i in cart.items.select_related("product")
                    ]
                    if cart
                    else []
                ),
                "wishlist": (
                    [
                        {"product_id": p.id, "title": p.title, "price": p.price, "slug": p.slug}
                        for p in wishlist.products.all()
                    ]
                    if wishlist
                    else []
                ),
                "payments": PaymentSerializer(
                    Payment.objects.filter(order__user=user).select_related("order"), many=True
                ).data,
            }
        )


class AdminOrderListView(AdminBaseMixin, ListAPIView):
    # All orders with filters (status, payment method, date range) + search.
    serializer_class = OrderSerializer
    search_fields = ["order_number", "user__email", "user__name", "utr_number", "customer_email"]

    def get_queryset(self):
        qs = Order.objects.select_related("user").prefetch_related("items__product")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("payment_method"):
            qs = qs.filter(payment_method=p["payment_method"])
        if p.get("needs_review") == "true":
            qs = qs.filter(status=Order.Status.PENDING_VERIFICATION)
        if p.get("date_from"):
            qs = qs.filter(created_at__date__gte=p["date_from"])
        if p.get("date_to"):
            qs = qs.filter(created_at__date__lte=p["date_to"])
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(order_number__icontains=q)
                | Q(user__email__icontains=q)
                | Q(user__name__icontains=q)
                | Q(utr_number__icontains=q)
            )
        return qs.order_by("-created_at")


@extend_schema(tags=["dashboard"], responses=OrderSerializer)
class AdminOrderDetailView(AdminBaseMixin, APIView):
    def get(self, request, order_number):
        order = (
            Order.objects.select_related("user").prefetch_related("items__product").filter(order_number=order_number).first()
        )
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                **OrderSerializer(order).data,
                "payments": PaymentSerializer(order.payments.all(), many=True).data,
                "user": AdminCustomerSerializer(order.user).data,
            }
        )


@extend_schema(request=inline_serializer("OrderActionNote", {"note": serializers.CharField(required=False)}), responses=OrderSerializer, tags=["dashboard"])
class ApproveManualPaymentView(AdminBaseMixin, APIView):
    # Approve a manual QR/UTR payment -> unlock the order + email the buyer.
    def post(self, request, order_number):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        if order.status not in (Order.Status.PENDING_VERIFICATION, Order.Status.PENDING, Order.Status.FAILED):
            return Response(
                {"detail": f"Order is '{order.status}', not awaiting review."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        Payment.objects.create(
            order=order,
            gateway=Payment.Gateway.MANUAL_QR,
            status=Payment.Status.SUCCESS,
            amount=order.total_amount,
            utr_number=order.utr_number,
            gateway_response={"approved_by": request.user.email},
        )
        order.mark_paid(method=Order.PaymentMethod.MANUAL_QR)
        order.admin_note = request.data.get("note", "Approved by admin")
        order.save(update_fields=["admin_note"])
        send_order_confirmation_email(order)
        return Response(OrderSerializer(order).data)


@extend_schema(request=inline_serializer("OrderRejectReason", {"reason": serializers.CharField(required=False)}), responses=OrderSerializer, tags=["dashboard"])
class RejectManualPaymentView(AdminBaseMixin, APIView):
    def post(self, request, order_number):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        Payment.objects.create(
            order=order,
            gateway=Payment.Gateway.MANUAL_QR,
            status=Payment.Status.FAILED,
            amount=order.total_amount,
            utr_number=order.utr_number,
            gateway_response={"rejected_by": request.user.email, "reason": request.data.get("reason", "")},
        )
        order.status = Order.Status.FAILED
        order.admin_note = request.data.get("reason", "Rejected by admin")
        order.save(update_fields=["status", "admin_note"])
        return Response(OrderSerializer(order).data)


@extend_schema(request=inline_serializer("OrderRefundReason", {"reason": serializers.CharField(required=False)}), responses=OrderSerializer, tags=["dashboard"])
class MarkRefundView(AdminBaseMixin, APIView):
    def post(self, request, order_number):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        Payment.objects.create(
            order=order,
            gateway=order.payment_method,
            status=Payment.Status.REFUNDED,
            amount=order.total_amount,
            gateway_response={"refunded_by": request.user.email, "reason": request.data.get("reason", "")},
        )
        order.status = Order.Status.REFUNDED
        order.admin_note = request.data.get("reason", "Refund marked by admin")
        order.save(update_fields=["status", "admin_note"])
        return Response(OrderSerializer(order).data)


# ------------------------------------------------------------------
# CSV exports
# ------------------------------------------------------------------
def _csv_response(filename, header, rows):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(header)
    for row in rows:
        writer.writerow(row)
    return response


@extend_schema(tags=["dashboard"], responses=inline_serializer("OrdersCSV", {"file": serializers.CharField()}))
class ExportOrdersCSV(AdminBaseMixin, APIView):
    def get(self, request):
        qs = Order.objects.select_related("user").order_by("-created_at")
        if request.query_params.get("status"):
            qs = qs.filter(status=request.query_params["status"])
        rows = [
            [
                o.order_number, o.user.email, o.customer_name, o.status, o.payment_method,
                o.subtotal, o.discount_amount, o.total_amount, o.utr_number,
                o.paid_at.isoformat() if o.paid_at else "", o.created_at.isoformat(),
            ]
            for o in qs
        ]
        return _csv_response(
            "orders.csv",
            ["order_number", "email", "name", "status", "payment_method", "subtotal",
             "discount", "total", "utr", "paid_at", "created_at"],
            rows,
        )


@extend_schema(tags=["dashboard"], responses=inline_serializer("CustomersCSV", {"file": serializers.CharField()}))
class ExportCustomersCSV(AdminBaseMixin, APIView):
    def get(self, request):
        qs = (
            User.objects.filter(role=User.Role.CUSTOMER)
            .annotate(
                total_spent=Coalesce(Sum("orders__total_amount", filter=Q(orders__status=Order.Status.PAID)), ZERO),
                orders_count=Count("orders", distinct=True),
            )
            .order_by("-date_joined")
        )
        rows = [
            [u.email, u.name, u.phone, u.college, u.branch, u.year,
             u.total_spent, u.orders_count, u.email_verified, u.date_joined.isoformat()]
            for u in qs
        ]
        return _csv_response(
            "customers.csv",
            ["email", "name", "phone", "college", "branch", "year",
             "total_spent", "orders_count", "verified", "joined"],
            rows,
        )


@extend_schema(tags=["dashboard"], responses=inline_serializer("SalesCSV", {"file": serializers.CharField()}))
class ExportSalesCSV(AdminBaseMixin, APIView):
    # Line-item level sales export (one row per product sold).
    def get(self, request):
        qs = OrderItem.objects.filter(order__status=Order.Status.PAID).select_related("order", "product")
        rows = [
            [
                item.order.order_number,
                item.order.paid_at.isoformat() if item.order.paid_at else "",
                item.order.user.email,
                item.title,
                item.product.type,
                item.product.branch.short_name if item.product.branch else "",
                item.price,
                item.quantity,
                item.total_price,
            ]
            for item in qs
        ]
        return _csv_response(
            "sales.csv",
            ["order_number", "paid_at", "email", "product", "type", "branch",
             "unit_price", "quantity", "line_total"],
            rows,
        )
