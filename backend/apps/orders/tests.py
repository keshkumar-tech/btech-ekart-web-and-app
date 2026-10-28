from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Product

from .models import Coupon, Order


class OrderFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="o@b.com", password="StrongPass1", name="O")
        self.other = User.objects.create_user(email="p@b.com", password="StrongPass1", name="P")
        self.product = Product.objects.create(title="CS Notes", type="notes", price=100, mrp=200)
        self.client.force_authenticate(self.user)
        self.client.post("/api/cart/add/", {"product_id": self.product.id, "quantity": 2})

    def test_checkout_creates_pending_order_and_clears_cart(self):
        res = self.client.post("/api/orders/checkout/", {"payment_method": "razorpay"})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["status"], "pending")
        self.assertEqual(float(res.data["total_amount"]), 200.0)
        self.assertEqual(res.data["total_items"], 2)

        cart = self.client.get("/api/cart/")
        self.assertEqual(cart.data["item_count"], 0)

    def test_checkout_empty_cart_rejected(self):
        self.client.post("/api/orders/checkout/", {"payment_method": "razorpay"})
        res = self.client.post("/api/orders/checkout/", {"payment_method": "razorpay"})
        self.assertEqual(res.status_code, 400)

    def test_coupon_apply_and_checkout(self):
        coupon = Coupon.objects.create(code="SAVE10", discount_type="percent", value=10)
        res = self.client.post("/api/orders/coupon/apply/", {"code": "SAVE10"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(float(res.data["discount_amount"]), 20.0)
        self.assertEqual(float(res.data["payable"]), 180.0)

        res = self.client.post(
            "/api/orders/checkout/", {"payment_method": "razorpay", "coupon_code": "SAVE10"}
        )
        self.assertEqual(float(res.data["discount_amount"]), 20.0)
        self.assertEqual(float(res.data["total_amount"]), 180.0)

    def test_order_list_is_per_user(self):
        self.client.post("/api/orders/checkout/", {"payment_method": "razorpay"})
        self.client.force_authenticate(self.other)
        res = self.client.get("/api/orders/")
        self.assertEqual(len(res.data), 0)

    def test_order_detail_scoped_to_owner(self):
        order_number = self.client.post(
            "/api/orders/checkout/", {"payment_method": "razorpay"}
        ).data["order_number"]

        self.client.force_authenticate(self.other)
        res = self.client.get(f"/api/orders/{order_number}/")
        self.assertEqual(res.status_code, 404)

    def test_manual_payment_submission(self):
        order_number = self.client.post(
            "/api/orders/checkout/", {"payment_method": "manual_qr"}
        ).data["order_number"]
        res = self.client.post(
            f"/api/orders/{order_number}/manual-payment/", {"utr_number": "UTR123456789"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "pending_verification")
        self.assertEqual(res.data["utr_number"], "UTR123456789")

    def test_mark_paid_unlocks_and_counts_sold(self):
        order = Order.objects.create(user=self.user, payment_method="razorpay")
        from .models import OrderItem
        OrderItem.objects.create(order=order, product=self.product, title=self.product.title, price=100, quantity=1)
        order.recalculate()
        self.assertTrue(order.mark_paid())
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PAID)
        self.assertTrue(order.invoice_number)
        self.product.refresh_from_db()
        self.assertEqual(self.product.sold_count, 1)
        # Second call is a no-op (prevents double counting / duplicate payment unlock).
        self.assertFalse(order.mark_paid())
        self.product.refresh_from_db()
        self.assertEqual(self.product.sold_count, 1)

    def test_coupon_discount_never_exceeds_amount(self):
        coupon = Coupon.objects.create(code="BIG", discount_type="flat", value=Decimal("500"))
        self.assertEqual(coupon.compute_discount(Decimal("200")), Decimal("200.00"))
