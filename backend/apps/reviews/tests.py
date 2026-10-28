from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem

from .models import Review


class ReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="rev@b.com", password="StrongPass1", name="Rev")
        self.product = Product.objects.create(title="DSA Notes", type="notes", price=100, mrp=200)
        self.client.force_authenticate(self.user)

    def _grant_purchase(self):
        order = Order.objects.create(user=self.user, payment_method="razorpay")
        OrderItem.objects.create(order=order, product=self.product, title="DSA Notes", price=100, quantity=1)
        order.recalculate()
        order.mark_paid()

    def test_non_buyer_cannot_review(self):
        res = self.client.post(
            f"/api/reviews/product/{self.product.slug}/",
            {"product": self.product.id, "rating": 5, "comment": "Great"},
        )
        self.assertEqual(res.status_code, 403)

    def test_buyer_can_review_and_rating_updates(self):
        self._grant_purchase()
        res = self.client.post(
            f"/api/reviews/product/{self.product.slug}/",
            {"product": self.product.id, "rating": 4, "title": "Good", "comment": "Helpful notes"},
        )
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["is_verified_purchase"])
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.rating), 4.0)
        self.assertEqual(self.product.rating_count, 1)

    def test_one_review_per_user_updates(self):
        self._grant_purchase()
        first = self.client.post(
            f"/api/reviews/product/{self.product.slug}/",
            {"product": self.product.id, "rating": 5, "comment": "A"},
        )
        self.assertEqual(first.status_code, 201)
        res = self.client.post(
            f"/api/reviews/product/{self.product.slug}/",
            {"product": self.product.id, "rating": 3, "comment": "B"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Review.objects.filter(product=self.product, user=self.user).count(), 1)
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.rating), 3.0)

    def test_public_list_only_shows_approved(self):
        self._grant_purchase()
        first = self.client.post(
            f"/api/reviews/product/{self.product.slug}/",
            {"product": self.product.id, "rating": 5, "comment": "A"},
        )
        self.assertEqual(first.status_code, 201)
        # Buyer reviews are live immediately.
        live = self.client.get(f"/api/reviews/product/{self.product.slug}/")
        self.assertEqual(len(live.data), 1)
        # An admin can still hide one, and it must disappear from the storefront.
        Review.objects.filter(product=self.product).update(is_approved=False)
        res = self.client.get(f"/api/reviews/product/{self.product.slug}/")
        self.assertEqual(len(res.data), 0)
