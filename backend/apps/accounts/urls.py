from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from . import views

urlpatterns = [
    # JWT rotation — the web/mobile clients refresh an expired access token here.
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("google/", views.google_login, name="google-login"),
    path("otp/send/", views.send_otp, name="send-otp"),
    path("otp/verify/", views.verify_otp, name="verify-otp"),
    path("password/forgot/", views.forgot_password, name="forgot-password"),
    path("password/reset/", views.reset_password, name="reset-password"),
    path("password/change/", views.change_password, name="change-password"),
    path("profile/", views.profile, name="profile"),
]
