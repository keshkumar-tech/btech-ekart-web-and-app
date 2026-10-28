"""Tests for the secure Library / signed PDF delivery (Phase 5)."""
import io

from django.core.files.base import ContentFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Product
from apps.core.utils import make_signed_token, verify_signed_token
from apps.orders.models import Order, OrderItem


def _tiny_pdf():
    """A minimal valid single-page PDF (enough for pypdf/reportlab to merge)."""
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(100, 750, "Sample study material")
    c.showPage()
    c.save()
    return buf.getvalue()


class LibraryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="lib@b.com", password="StrongPass1", name="Lib")
        self.other = User.objects.create_user(email="other@b.com", password="StrongPass1", name="Other")

        self.product = Product.objects.create(title="DSA Notes", type="notes", price=100, mrp=200)
        self.product.main_pdf.save("dsa.pdf", ContentFile(_tiny_pdf()), save=True)

        # A PAID order unlocks the product for this user.
        self.order = Order.objects.create(user=self.user, payment_method="razorpay")
        self.item = OrderItem.objects.create(
            order=self.order, product=self.product, title=self.product.title, price=100, quantity=1
        )
        self.order.recalculate()
        self.order.mark_paid()

        self.client.force_authenticate(self.user)

    def test_signed_token_roundtrip(self):
        token = make_signed_token(self.item.id)
        self.assertTrue(verify_signed_token(token, self.item.id))
        self.assertFalse(verify_signed_token(token, self.item.id + 1))  # wrong resource
        self.assertFalse(verify_signed_token("garbage", self.item.id))

    def test_library_lists_purchased_items(self):
        res = self.client.get("/api/library/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 1)
        row = res.data["results"][0]
        self.assertEqual(row["title"], "DSA Notes")
        self.assertIn("token=", row["download_url"])
        self.assertTrue(row["has_pdf"])

    def test_library_is_per_user(self):
        self.client.force_authenticate(self.other)
        res = self.client.get("/api/library/")
        self.assertEqual(res.data["count"], 0)

    def test_unpaid_order_does_not_appear(self):
        pending = Order.objects.create(user=self.other, payment_method="razorpay")
        OrderItem.objects.create(order=pending, product=self.product, title="X", price=100, quantity=1)
        self.client.force_authenticate(self.other)
        res = self.client.get("/api/library/")
        self.assertEqual(res.data["count"], 0)

    def test_download_with_valid_token(self):
        token = make_signed_token(self.item.id)
        res = self.client.get(f"/api/library/download/{self.item.id}/?token={token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.item.refresh_from_db()
        self.assertEqual(self.item.download_count, 1)

    def test_download_without_token_forbidden(self):
        res = self.client.get(f"/api/library/download/{self.item.id}/")
        self.assertEqual(res.status_code, 403)

    def test_download_with_bad_token_forbidden(self):
        res = self.client.get(f"/api/library/download/{self.item.id}/?token=abc.def")
        self.assertEqual(res.status_code, 403)

    def test_non_buyer_cannot_download(self):
        token = make_signed_token(self.item.id)
        self.client.force_authenticate(self.other)
        res = self.client.get(f"/api/library/download/{self.item.id}/?token={token}")
        self.assertEqual(res.status_code, 403)

    def test_download_limit_enforced(self):
        from django.test import override_settings
        with override_settings(MAX_DOWNLOADS_PER_ORDER_ITEM=2):
            token = make_signed_token(self.item.id)
            for _ in range(2):
                res = self.client.get(f"/api/library/download/{self.item.id}/?token={token}")
                self.assertEqual(res.status_code, 200)
            res = self.client.get(f"/api/library/download/{self.item.id}/?token={token}")
            self.assertEqual(res.status_code, 429)
