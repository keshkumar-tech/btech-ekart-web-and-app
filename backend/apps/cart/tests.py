from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Product


class CartTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="c@b.com", password="StrongPass1", name="C")
        self.other = User.objects.create_user(email="d@b.com", password="StrongPass1", name="D")
        self.product = Product.objects.create(title="Maths Notes", type="notes", price=50, mrp=100)
        self.client.force_authenticate(self.user)

    def test_add_and_view_cart(self):
        res = self.client.post("/api/cart/add/", {"product_id": self.product.id, "quantity": 2})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["item_count"], 2)
        self.assertEqual(float(res.data["subtotal"]), 100.0)
        self.assertEqual(float(res.data["you_save"]), 100.0)

    def test_add_same_product_bumps_quantity(self):
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        res = self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.assertEqual(res.data["item_count"], 2)

    def test_cart_is_per_user(self):
        self.client.post("/api/cart/add/", {"product_id": self.product.id})
        self.client.force_authenticate(self.other)
        res = self.client.get("/api/cart/")
        self.assertEqual(res.data["item_count"], 0)

    def test_update_and_delete_item(self):
        add = self.client.post("/api/cart/add/", {"product_id": self.product.id})
        item_id = add.data["items"][0]["id"]
        res = self.client.patch(f"/api/cart/items/{item_id}/", {"quantity": 3})
        self.assertEqual(res.data["item_count"], 3)
        res = self.client.delete(f"/api/cart/items/{item_id}/")
        self.assertEqual(res.data["item_count"], 0)

    def test_cannot_touch_other_users_item(self):
        add = self.client.post("/api/cart/add/", {"product_id": self.product.id})
        item_id = add.data["items"][0]["id"]
        self.client.force_authenticate(self.other)
        res = self.client.delete(f"/api/cart/items/{item_id}/")
        self.assertEqual(res.status_code, 404)
