# Aggregation helpers for the admin dashboard (kept out of the views).
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDate, TruncMonth, TruncWeek
from django.utils import timezone

from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem, Coupon

# Only PAID orders count as revenue.
PAID = Order.Status.PAID
ZERO = Value(Decimal("0"), output_field=DecimalField(max_digits=12, decimal_places=2))


def _paid_orders():
    return Order.objects.filter(status=PAID)


def overview_stats():
    # Headline numbers for the dashboard cards.
    paid = _paid_orders()
    revenue = paid.aggregate(total=Coalesce(Sum("total_amount"), ZERO))["total"]

    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    revenue_today = paid.filter(paid_at__date=today).aggregate(
        total=Coalesce(Sum("total_amount"), ZERO)
    )["total"]
    revenue_week = paid.filter(paid_at__date__gte=week_ago).aggregate(
        total=Coalesce(Sum("total_amount"), ZERO)
    )["total"]
    revenue_month = paid.filter(paid_at__date__gte=month_ago).aggregate(
        total=Coalesce(Sum("total_amount"), ZERO)
    )["total"]

    from apps.accounts.models import User

    return {
        "total_revenue": revenue,
        "revenue_today": revenue_today,
        "revenue_week": revenue_week,
        "revenue_month": revenue_month,
        "total_orders": Order.objects.count(),
        "paid_orders": paid.count(),
        "pending_orders": Order.objects.filter(status=Order.Status.PENDING).count(),
        "pending_verification": Order.objects.filter(status=Order.Status.PENDING_VERIFICATION).count(),
        "refunded_orders": Order.objects.filter(status=Order.Status.REFUNDED).count(),
        "total_customers": User.objects.filter(role="customer").count(),
        "total_products": Product.objects.filter(is_active=True).count(),
        "products_sold": OrderItem.objects.filter(order__status=PAID).aggregate(
            total=Coalesce(Sum("quantity"), Value(0))
        )["total"],
    }


def revenue_series(period="daily", days=30):
    # Revenue time-series for the dashboard chart.
    paid = _paid_orders().filter(paid_at__isnull=False)
    if period == "monthly":
        trunc = TruncMonth("paid_at")
        since = timezone.now() - timedelta(days=365)
    elif period == "weekly":
        trunc = TruncWeek("paid_at")
        since = timezone.now() - timedelta(weeks=12)
    else:
        trunc = TruncDate("paid_at")
        since = timezone.now() - timedelta(days=days)

    rows = (
        paid.filter(paid_at__gte=since)
        .annotate(bucket=trunc)
        .values("bucket")
        .annotate(revenue=Coalesce(Sum("total_amount"), ZERO), orders=Count("id"))
        .order_by("bucket")
    )
    return [
        {
            "period": r["bucket"].isoformat() if r["bucket"] else None,
            "revenue": r["revenue"],
            "orders": r["orders"],
        }
        for r in rows
    ]


def top_products(limit=10):
    rows = (
        OrderItem.objects.filter(order__status=PAID)
        .values("product_id", "title")
        .annotate(
            units_sold=Coalesce(Sum("quantity"), Value(0)),
            revenue=Coalesce(Sum(F("price") * F("quantity")), ZERO),
        )
        .order_by("-units_sold")[:limit]
    )
    return list(rows)


def top_branches(limit=6):
    rows = (
        OrderItem.objects.filter(order__status=PAID)
        .values(branch_short=F("product__branch__short_name"))
        .annotate(
            units_sold=Coalesce(Sum("quantity"), Value(0)),
            revenue=Coalesce(Sum(F("price") * F("quantity")), ZERO),
        )
        .order_by("-revenue")[:limit]
    )
    return list(rows)


def category_breakdown():
    rows = (
        OrderItem.objects.filter(order__status=PAID)
        .values(product_type=F("product__type"))
        .annotate(
            units_sold=Coalesce(Sum("quantity"), Value(0)),
            revenue=Coalesce(Sum(F("price") * F("quantity")), ZERO),
        )
        .order_by("-revenue")
    )
    return list(rows)


def coupon_performance():
    return list(
        Coupon.objects.annotate(
            times_used=Count("orders", filter=Q(orders__status=PAID)),
        ).values("code", "discount_type", "value", "used_count", "times_used")[:20]
    )
