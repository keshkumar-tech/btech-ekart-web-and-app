"""Auth views: register, login, logout, Google, OTP verify, password reset, profile."""
from django.conf import settings
from drf_spectacular.utils import extend_schema, inline_serializer
from django.db.models import Q
from django_ratelimit.decorators import ratelimit
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.cart.models import Cart
from apps.core.serializers import DetailSerializer
from apps.wishlist.models import Wishlist

from .emails import send_otp_email, send_welcome_email
from .models import OTP, User
from .serializers import (
    ForgotPasswordSerializer,
    GoogleLoginSerializer,
    LoginTokenSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    SendOTPSerializer,
    ChangePasswordSerializer,
    UserPublicSerializer,
    UserProfileUpdateSerializer,
    VerifyOTPSerializer,
)


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def _merge_guest_data(user, request):
    """Merge guest localStorage cart/wishlist into the user's account on login/signup."""
    guest_items = request.data.get("guest_cart") or []
    if guest_items:
        cart, _ = Cart.objects.get_or_create(user=user)
        from apps.catalog.models import Product
        ids = [p.get("product_id") for p in guest_items if p.get("product_id")]
        for product in Product.objects.filter(id__in=ids, is_active=True):
            item, created = cart.items.get_or_create(product=product)
            if not created:
                item.quantity += 1
                item.save(update_fields=["quantity"])
    guest_wishlist = request.data.get("guest_wishlist") or []
    if guest_wishlist:
        wl, _ = Wishlist.objects.get_or_create(user=user)
        from apps.catalog.models import Product
        ids = [p.get("product_id") for p in guest_wishlist if p.get("product_id")]
        wl.products.add(*Product.objects.filter(id__in=ids, is_active=True).exclude(id__in=wl.products.values("id")))


@extend_schema(request=RegisterSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="10/m", method="POST", block=True)
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    otp = OTP.generate(user, "email_verify")
    try:
        send_otp_email(user, otp)
    except Exception:
        pass  # dev: console backend may be unavailable in some hosts
    send_welcome_email(user)
    _merge_guest_data(user, request)
    tokens = _tokens_for(user)
    return Response(
        {**tokens, "user": UserPublicSerializer(user).data,
         "detail": "Account created. OTP sent to your email for verification."},
        status=status.HTTP_201_CREATED,
    )


@extend_schema(request=LoginTokenSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="10/m", method="POST", block=True)
def login(request):
    serializer = LoginTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.user
    _merge_guest_data(user, request)
    data = dict(serializer.validated_data)
    return Response(data)


@extend_schema(
    request=inline_serializer("LogoutRequest", {"refresh": serializers.CharField()}),
    responses=DetailSerializer,
    tags=["auth"],
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        RefreshToken(request.data.get("refresh")).blacklist()
    except Exception:
        return Response({"detail": "Invalid or already-expired token."}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"detail": "Logged out successfully."})


@extend_schema(request=GoogleLoginSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="10/m", method="POST", block=True)
def google_login(request):
    """Verify a Google ID token and log the user in (creating the account on first login)."""
    serializer = GoogleLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    token = serializer.validated_data["id_token"]

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        if not settings.GOOGLE_CLIENT_ID:
            return Response({"detail": "Google login is not configured."}, status=501)
        info = google_id_token.verify_oauth2_token(token, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except Exception:
        return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

    email = info.get("email", "").lower()
    if not email:
        return Response({"detail": "Google account has no email."}, status=status.HTTP_400_BAD_REQUEST)
    user, created = User.objects.get_or_create(
        email=email,
        defaults={"name": info.get("name", ""), "avatar": info.get("picture", ""), "email_verified": True},
    )
    if created:
        send_welcome_email(user)
    _merge_guest_data(user, request)
    return Response({**_tokens_for(user), "user": UserPublicSerializer(user).data})


@extend_schema(request=SendOTPSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="5/m", method="POST", block=True)
def send_otp(request):
    """Resend the email-verification OTP."""
    serializer = SendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = request.user if request.user.is_authenticated else None
    if user is None:
        email = request.data.get("email", "").lower()
        user = User.objects.filter(email=email).first()
    if not user:
        return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
    otp = OTP.generate(user, serializer.validated_data["purpose"])
    send_otp_email(user, otp)
    return Response({"detail": "OTP sent to your email."})


@extend_schema(request=VerifyOTPSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="10/m", method="POST", block=True)
def verify_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].lower()
    code = serializer.validated_data["otp"]
    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
    otp = OTP.objects.filter(user=user, used=False, purpose="email_verify").order_by("-created_at").first()
    if not otp or not otp.is_valid(code):
        return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
    otp.used = True
    otp.save(update_fields=["used"])
    user.email_verified = True
    user.save(update_fields=["email_verified"])
    return Response({"detail": "Email verified successfully."})


@extend_schema(request=ForgotPasswordSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="5/m", method="POST", block=True)
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].lower()
    user = User.objects.filter(email=email).first()
    # Always return success to avoid email enumeration
    if user:
        otp = OTP.generate(user, "password_reset")
        send_otp_email(user, otp)
    return Response({"detail": "If an account exists with this email, an OTP has been sent."})


@extend_schema(request=ResetPasswordSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
@ratelimit(key="ip", rate="5/m", method="POST", block=True)
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].lower()
    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"detail": "Invalid OTP or email."}, status=status.HTTP_400_BAD_REQUEST)
    otp = OTP.objects.filter(user=user, used=False, purpose="password_reset").order_by("-created_at").first()
    if not otp or not otp.is_valid(serializer.validated_data["otp"]):
        return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
    otp.used = True
    otp.save(update_fields=["used"])
    user.set_password(serializer.validated_data["password"])
    user.save(update_fields=["password"])
    return Response({"detail": "Password reset successfully. You can now log in."})


@extend_schema(request=ChangePasswordSerializer, responses=DetailSerializer, tags=["auth"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = request.user
    if not user.check_password(serializer.validated_data["current_password"]):
        return Response({"current_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(serializer.validated_data["new_password"])
    user.save(update_fields=["password"])
    return Response({"detail": "Password changed successfully."})


@extend_schema(request=UserProfileUpdateSerializer, responses=UserPublicSerializer, tags=["auth"])
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == "GET":
        return Response(UserPublicSerializer(request.user).data)
    serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(UserPublicSerializer(request.user).data)
