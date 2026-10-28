"""Tests for payment signature verification and webhook idempotency."""
import hashlib
import hmac
import json

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem

from .models import Payment, WebhookEvent
from .razorpay_client import verify_payment_signature, verify_webhook_signature

KEY_SECRET = "test_secret_key"
WEBHOOK_SECRET = "test_webhook_secret"


@override_settings(RAZORPAY_KEY_ID="rzp_test_123", RAZORPAY_KEY_SECRET=KEY_SECRET,
                   RAZORPAY_WEBHOOK_SECRET=WEBHOOK_SECRET)
class PaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="pay@b.com", password="StrongPass1", name="Pay")
        self.product = Product.objects.create(title="EC Notes", type="notes", price=150, mrp=300)
        self.order = Order.objects.create(user=self.user, payment_method="razorpay")
        OrderItem.objects.create(order=self.order, product=self.product, title=self.product.title, price=150, quantity=1)
        self.order.recalculate()
        self.order_number = self.order.order_number
        self.client.force_authenticate(self.user)

    def _sign(self, order_id, payment_id):
        return hmac.new(KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()

    def test_signature_verification_helpers(self):
        sig = self._sign("order_abc", "pay_xyz")
        self.assertTrue(verify_payment_signature("order_abc", "pay_xyz", sig))
        self.assertFalse(verify_payment_signature("order_abc", "pay_xyz", "wrong"))

    def test_verify_endpoint_unlocks_on_valid_signature(self):
        gateway_order = "order_abc"
        payment_id = "pay_xyz"
        Payment.objects.create(
            order=self.order, gateway="razorpay", status="created",
            amount=self.order.total_amount, razorpay_order_id=gateway_order,
        )
        res = self.client.post(
            "/api/payments/razorpay/verify/",
            {
                "order_number": self.order_number,
                "razorpay_order_id": gateway_order,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": self._sign(gateway_order, payment_id),
            },
        )
        self.assertEqual(res.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.PAID)

    def test_verify_endpoint_rejects_bad_signature(self):
        res = self.client.post(
            "/api/payments/razorpay/verify/",
            {
                "order_number": self.order_number,
                "razorpay_order_id": "order_abc",
                "razorpay_payment_id": "pay_xyz",
                "razorpay_signature": "deadbeef",
            },
        )
        self.assertEqual(res.status_code, 400)
        self.order.refresh_from_db()
        self.assertNotEqual(self.order.status, Order.Status.PAID)
        self.assertTrue(Payment.objects.filter(status="failed").exists())

    def test_webhook_signature(self):
        body = b'{"event":"payment.captured"}'
        sig = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
        self.assertTrue(verify_webhook_signature(body, sig))
        self.assertFalse(verify_webhook_signature(body, "bad"))

    def test_webhook_captured_unlocks_order_and_is_idempotent(self):
        payload = {
            "id": "evt_1",
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_123",
                        "order_id": "order_abc",
                        "method": "upi",
                        "notes": {"order_number": self.order_number},
                    }
                }
            },
        }
        body = json.dumps(payload).encode()
        sig = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()

        res = self.client.post(
            "/api/payments/razorpay/webhook/", data=body,
            content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE=sig,
        )
        self.assertEqual(res.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.PAID)

        # Replaying the same event must be a no-op (idempotent).
        res = self.client.post(
            "/api/payments/razorpay/webhook/", data=body,
            content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE=sig,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(WebhookEvent.objects.filter(event_id="evt_1").count(), 1)

    def test_webhook_rejects_bad_signature(self):
        res = self.client.post(
            "/api/payments/razorpay/webhook/", data=b'{"event":"payment.captured"}',
            content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE="nope",
        )
        self.assertEqual(res.status_code, 400)
