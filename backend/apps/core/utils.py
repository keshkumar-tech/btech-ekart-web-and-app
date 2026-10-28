"""Shared utilities: PDF watermarking, invoice generation, signed URLs."""
import hashlib
import hmac
import io
import time
from urllib.parse import urlencode

from django.conf import settings


def _signing_key() -> bytes:
    return (settings.SECRET_KEY or "insecure").encode()


def make_signed_token(*parts, expires_in=None) -> str:
    """Create a short-lived HMAC token binding the given parts (e.g. order item id).

    Format: <expiry_ts>.<hex_digest>  — the digest covers parts + expiry so a
    token cannot be replayed after it expires or reused for another resource.
    """
    expires_in = expires_in or settings.PRIVATE_PDF_URL_EXPIRY
    expiry = int(time.time()) + int(expires_in)
    msg = "|".join([str(p) for p in parts] + [str(expiry)]).encode()
    digest = hmac.new(_signing_key(), msg, hashlib.sha256).hexdigest()
    return f"{expiry}.{digest}"


def verify_signed_token(token: str, *parts) -> bool:
    """Validate a token produced by make_signed_token for the same parts."""
    if not token or "." not in token:
        return False
    expiry_str, _, digest = token.partition(".")
    try:
        expiry = int(expiry_str)
    except ValueError:
        return False
    if expiry < int(time.time()):
        return False
    msg = "|".join([str(p) for p in parts] + [str(expiry)]).encode()
    expected = hmac.new(_signing_key(), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, digest)


def build_signed_download_url(request, order_item_id) -> str:
    """Absolute URL to the secure download endpoint, carrying a signed token."""
    token = make_signed_token(order_item_id)
    path = f"/api/library/download/{order_item_id}/"
    query = urlencode({"token": token})
    return request.build_absolute_uri(f"{path}?{query}")


def watermark_pdf(pdf_bytes: bytes, email: str) -> bytes:
    """Overlay buyer email diagonally on every page of a PDF."""
    from pypdf import PdfReader, PdfWriter
    from reportlab.lib.colors import Color
    from reportlab.pdfgen import canvas as rl_canvas

    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()

    for page in reader.pages:
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        buf = io.BytesIO()
        c = rl_canvas.Canvas(buf, pagesize=(w, h))
        c.setFillColor(Color(0, 0, 0, alpha=0.12))
        c.setFont("Helvetica", 22)
        c.translate(w / 2, h / 2)
        c.rotate(35)
        c.drawCentredString(0, 0, email)
        c.drawCentredString(0, -40, "B.Tech eKart — licensed to " + email)
        c.save()
        buf.seek(0)
        overlay = PdfReader(buf).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)

    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def pdf_first_page_image(pdf_bytes: bytes, width: int = 900) -> bytes:
    """Render the FIRST page of a PDF to a PNG image (used as a fallback cover).

    Uses pypdfium2 (pure-python, no external binaries like poppler). Returns the
    raw PNG bytes, or b"" if the PDF cannot be read/rendered.
    """
    if not pdf_bytes:
        return b""
    try:
        import pypdfium2 as pdfium
    except Exception:
        return b""
    try:
        pdf = pdfium.PdfDocument(pdf_bytes)
        if len(pdf) == 0:
            return b""
        page = pdf[0]
        scale = max(1.0, width / max(1.0, float(page.get_width())))
        bitmap = page.render(scale=scale)
        image = bitmap.to_pil()
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        out = io.BytesIO()
        image.save(out, format="PNG", optimize=True)
        return out.getvalue()
    except Exception:
        return b""


def generate_invoice_pdf(order) -> bytes:
    """Build a simple branded PDF invoice for an order."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas as rl_canvas

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 20 * mm

    c.setFont("Helvetica-Bold", 20)
    c.drawString(20 * mm, y, "B.Tech eKart")
    c.setFont("Helvetica", 10)
    y -= 8 * mm
    c.drawString(20 * mm, y, "Digital study material for AKTU B.Tech students")
    y -= 12 * mm

    c.setFont("Helvetica-Bold", 14)
    c.drawString(20 * mm, y, f"Invoice — Order {order.order_number}")
    y -= 8 * mm
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, f"Date: {order.created_at.strftime('%d %b %Y %H:%M')}")
    y -= 6 * mm
    c.drawString(20 * mm, y, f"Customer: {order.user.name} ({order.user.email})")
    y -= 6 * mm
    c.drawString(20 * mm, y, f"Payment method: {order.get_payment_method_display()} — Status: {order.status}")
    y -= 10 * mm

    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, y, "Item")
    c.drawString(120 * mm, y, "Qty")
    c.drawString(135 * mm, y, "Price")
    c.drawString(160 * mm, y, "Total")
    y -= 6 * mm

    c.setFont("Helvetica", 10)
    for item in order.items.all():
        c.drawString(20 * mm, y, item.product.title[:45])
        c.drawString(120 * mm, y, str(item.quantity))
        c.drawString(135 * mm, y, f"Rs. {item.price}")
        c.drawString(160 * mm, y, f"Rs. {item.total_price}")
        y -= 6 * mm

    y -= 4 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, f"Subtotal: Rs. {order.subtotal}")
    y -= 6 * mm
    if order.discount_amount:
        c.drawString(20 * mm, y, f"Discount: -Rs. {order.discount_amount}")
        y -= 6 * mm
    c.drawString(20 * mm, y, f"TOTAL PAID: Rs. {order.total_amount}")
    y -= 10 * mm
    c.setFont("Helvetica", 8)
    c.drawString(20 * mm, y, "This is a computer-generated invoice for digital goods. Thank you for shopping with B.Tech eKart!")

    c.showPage()
    c.save()
    return buf.getvalue()
