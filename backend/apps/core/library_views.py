"""My Library: everything a user has purchased, with secure download links."""
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.serializers import DetailSerializer
from apps.core.storage import read_private_file
from apps.core.utils import build_signed_download_url, verify_signed_token, watermark_pdf
from apps.orders.models import Order, OrderItem


def _purchased_items(user):
    """Order items from the user's PAID orders only."""
    return (
        OrderItem.objects.filter(order__user=user, order__status=Order.Status.PAID)
        .select_related("product", "order")
        .order_by("-order__paid_at", "-id")
    )


@extend_schema(responses=DetailSerializer, tags=["library"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_library(request):
    """List the logged-in user's purchased products (My Library)."""
    items = _purchased_items(request.user)
    data = []
    for item in items:
        data.append(
            {
                "order_item_id": item.id,
                "order_number": item.order.order_number,
                "purchased_at": item.order.paid_at,
                "title": item.title,
                "product_slug": item.product.slug,
                "cover_image": item.product.cover_image.url if item.product.cover_image else None,
                "type": item.product.type,
                "subject_code": item.product.subject_code,
                "page_count": item.product.page_count,
                "download_count": item.download_count,
                "downloads_remaining": item.downloads_remaining,
                "download_url": build_signed_download_url(request, item.id),
                "has_pdf": bool(item.product.main_pdf),
            }
        )
    return Response({"count": len(data), "results": data})


@extend_schema(responses=DetailSerializer, tags=["library"])
@api_view(["GET"])
@permission_classes([AllowAny])
def secure_download(request, order_item_id):
    """Stream a purchased PDF.

    Security: the request must be from the buyer (JWT) AND carry a valid,
    un-expired signed token. A per-item download cap is enforced. An optional
    dynamic watermark (buyer email) is stamped on every page.
    """
    token = request.query_params.get("token", "")
    if not verify_signed_token(token, order_item_id):
        return Response({"detail": "Invalid or expired download link."}, status=status.HTTP_403_FORBIDDEN)

    item = OrderItem.objects.select_related("order", "product").filter(id=order_item_id).first()
    if not item or item.order.status != Order.Status.PAID:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    # Only the owner (or an admin) may download.
    user = request.user
    if not user.is_authenticated or (item.order.user_id != user.id and not getattr(user, "is_admin_role", False)):
        return Response({"detail": "You do not have access to this file."}, status=status.HTTP_403_FORBIDDEN)

    from django.conf import settings as dj_settings
    limit = dj_settings.MAX_DOWNLOADS_PER_ORDER_ITEM
    if item.download_count >= limit:
        return Response(
            {"detail": f"Download limit reached ({limit} downloads). Contact support if you need more."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    if not item.product.main_pdf:
        return Response({"detail": "File not available yet."}, status=status.HTTP_404_NOT_FOUND)

    raw = read_private_file(item.product.main_pdf)
    if not raw:
        return Response({"detail": "File missing on storage."}, status=status.HTTP_404_NOT_FOUND)

    if dj_settings.WATERMARK_PDFS:
        try:
            raw = watermark_pdf(raw, item.order.customer_email or item.order.user.email)
        except Exception:
            pass  # never block a paying customer because watermarking failed

    item.download_count += 1
    item.save(update_fields=["download_count"])

    response = HttpResponse(raw, content_type="application/pdf")
    safe_name = "".join(c for c in item.title if c.isalnum() or c in " -_").strip() or "material"
    response["Content-Disposition"] = f'inline; filename="{safe_name}.pdf"'
    response["Cache-Control"] = "private, no-store"
    return response


@extend_schema(responses=DetailSerializer, tags=["library"])
@api_view(["GET"])
@permission_classes([AllowAny])
def product_preview(request, slug):
    """Public preview of a product's sample PDF (never the full paid file)."""
    from apps.catalog.models import Product

    product = Product.objects.filter(slug=slug, is_active=True).first()
    if not product or not product.preview_pdf:
        return Response({"detail": "No preview available."}, status=status.HTTP_404_NOT_FOUND)
    try:
        with product.preview_pdf.open("rb") as fh:
            raw = fh.read()
    except Exception:
        return Response({"detail": "Preview file missing."}, status=status.HTTP_404_NOT_FOUND)

    response = HttpResponse(raw, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{product.slug}-preview.pdf"'
    return response
