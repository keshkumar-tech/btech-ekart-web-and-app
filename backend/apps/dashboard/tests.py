from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Branch, Product
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment


class DashboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@x.com", password="StrongPass1", name="Admin", role=User.Role.ADMIN
        )
        self.customer = User.objects.create_user(email="cust@x.com", password="StrongPass1", name="Cust")
        self.branch = Branch.objects.create(name="Computer Science & Engineering", short_name="CSE")
        self.product = Product.objects.create(
            title="Notes", type="notes", price=100, mrp=200, branch=self.branch
        )

        # One paid order + one pending-verification (manual QR) order.
        self.paid = Order.objects.create(
            user=self.customer, payment_method="razorpay", status=Order.Status.PENDING,
            customer_name="Cust", customer_email="cust@x.com",
        )
        OrderItem.objects.create(order=self.paid, product=self.product, title="Notes", price=100, quantity=2)
        self.paid.recalculate()
        self.paid.mark_paid()

        self.manual = Order.objects.create(
            user=self.customer, payment_method="manual_qr", status=Order.Status.PENDING_VERIFICATION,
            utr_number="UTR999",
        )
        OrderItem.objects.create(order=self.manual, product=self.product, title="Notes", price=100, quantity=1)
        self.manual.recalculate()

    def _login_admin(self):
        self.client.force_authenticate(self.admin)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(self.customer)
        res = self.client.get("/api/dashboard/overview/")
        self.assertEqual(res.status_code, 403)

    def test_anonymous_forbidden(self):
        res = self.client.get("/api/dashboard/overview/")
        self.assertEqual(res.status_code, 401)

    def test_overview_stats(self):
        self._login_admin()
        res = self.client.get("/api/dashboard/overview/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(float(res.data["total_revenue"]), 200.0)
        self.assertEqual(res.data["paid_orders"], 1)
        self.assertEqual(res.data["pending_verification"], 1)
        self.assertEqual(res.data["total_customers"], 1)
        self.assertEqual(res.data["products_sold"], 2)

    def test_revenue_chart(self):
        self._login_admin()
        res = self.client.get("/api/dashboard/revenue/?period=daily")
        self.assertEqual(res.status_code, 200)
        self.assertIn("series", res.data)
        self.assertIn("top_products", res.data)
        self.assertEqual(res.data["top_products"][0]["units_sold"], 2)

    def test_customer_list_and_detail(self):
        self._login_admin()
        res = self.client.get("/api/dashboard/customers/")
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(float(res.data["results"][0]["total_spent"]), 200.0)

        res = self.client.get(f"/api/dashboard/customers/{self.customer.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["purchases"]), 1)
        self.assertEqual(float(res.data["total_spent"]), 200.0)

    def test_order_filters(self):
        self._login_admin()
        res = self.client.get("/api/dashboard/orders/?needs_review=true")
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["order_number"], self.manual.order_number)

    def test_approve_manual_payment_unlocks(self):
        self._login_admin()
        res = self.client.post(f"/api/dashboard/orders/{self.manual.order_number}/approve/")
        self.assertEqual(res.status_code, 200)
        self.manual.refresh_from_db()
        self.assertEqual(self.manual.status, Order.Status.PAID)
        self.assertTrue(self.manual.invoice_number)
        # A success Payment row was recorded for the manual QR flow.
        self.assertTrue(
            Payment.objects.filter(order=self.manual, gateway="manual_qr", status="success").exists()
        )

    def test_reject_manual_payment(self):
        self._login_admin()
        res = self.client.post(
            f"/api/dashboard/orders/{self.manual.order_number}/reject/", {"reason": "UTR not found"}
        )
        self.assertEqual(res.status_code, 200)
        self.manual.refresh_from_db()
        self.assertEqual(self.manual.status, Order.Status.FAILED)

    def test_mark_refund(self):
        self._login_admin()
        res = self.client.post(f"/api/dashboard/orders/{self.paid.order_number}/refund/")
        self.assertEqual(res.status_code, 200)
        self.paid.refresh_from_db()
        self.assertEqual(self.paid.status, Order.Status.REFUNDED)

    def test_csv_exports(self):
        self._login_admin()
        for url, needle in [
            ("/api/dashboard/export/orders/", b"order_number"),
            ("/api/dashboard/export/customers/", b"cust@x.com"),
            ("/api/dashboard/export/sales/", b"Notes"),
        ]:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 200)
            self.assertIn("text/csv", res["Content-Type"])
            self.assertIn(needle, res.content)
