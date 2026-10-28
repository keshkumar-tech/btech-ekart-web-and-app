from django.test import TestCase
from rest_framework.test import APIClient

from .models import User


class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_login_profile(self):
        res = self.client.post(
            "/api/auth/register/",
            {"email": "stu@aktu.ac.in", "name": "Student", "password": "StrongPass1", "password2": "StrongPass1"},
        )
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)

        res = self.client.post("/api/auth/login/", {"email": "stu@aktu.ac.in", "password": "StrongPass1"})
        self.assertEqual(res.status_code, 200)
        token = res.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/profile/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["email"], "stu@aktu.ac.in")

    def test_password_mismatch_rejected(self):
        res = self.client.post(
            "/api/auth/register/",
            {"email": "x@y.com", "name": "X", "password": "StrongPass1", "password2": "Other1"},
        )
        self.assertEqual(res.status_code, 400)

    def test_duplicate_email_rejected(self):
        User.objects.create_user(email="a@b.com", password="StrongPass1", name="A")
        res = self.client.post(
            "/api/auth/register/",
            {"email": "a@b.com", "name": "B", "password": "StrongPass1", "password2": "StrongPass1"},
        )
        self.assertEqual(res.status_code, 400)

    def test_otp_verify_flow(self):
        from .models import OTP
        user = User.objects.create_user(email="otp@b.com", password="StrongPass1", name="O")
        otp = OTP.generate(user, "email_verify")
        res = self.client.post("/api/auth/otp/verify/", {"email": user.email, "otp": otp.code})
        self.assertEqual(res.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)

    def test_forgot_reset_password(self):
        from .models import OTP
        user = User.objects.create_user(email="r@b.com", password="StrongPass1", name="R")
        otp = OTP.generate(user, "password_reset")
        res = self.client.post(
            "/api/auth/password/reset/",
            {"email": user.email, "otp": otp.code, "password": "NewStrong1", "password2": "NewStrong1"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(User.objects.get(email=user.email).check_password("NewStrong1"))
