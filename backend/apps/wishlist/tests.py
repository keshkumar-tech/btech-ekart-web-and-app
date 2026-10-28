from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Product


class WishlistTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="w@b.com", password="StrongPass1", name="W")
        self.product = Product.objects.create(title="Physics Notes", type="notes", price=40, mrp=80)
        self.client.force_authenticate(self.user)

    def test_add_list_remove(self):
        res = self.client.post("/api/wishlist/add/", {"product_id": self.product.id})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["item_count"], 1)

        res = self.client.get("/api/wishlist/")
        self.assertEqual(res.data["item_count"], 1)

        res = self.client.delete(f"/api/wishlist/remove/{self.product.id}/")
        self.assertEqual(res.data["item_count"], 0)

    def test_move_to_cart(self):
        self.client.post("/api/wishlist/add/", {"product_id": self.product.id})
        res = self.client.post("/api/wishlist/move-to-cart/", {"product_id": self.product.id})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["item_count"], 0)  # gone from wishlist

        cart = self.client.get("/api/cart/")
        self.assertEqual(cart.data["item_count"], 1)  # now in cart
