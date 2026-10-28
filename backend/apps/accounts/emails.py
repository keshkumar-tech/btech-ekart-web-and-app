"""Email helpers for accounts (OTP, welcome)."""
from django.conf import settings
from django.core.mail import send_mail


def send_otp_email(user, otp_obj):
    subject = {
        "email_verify": "Verify your B.Tech eKart email",
        "password_reset": "Reset your B.Tech eKart password",
    }[otp_obj.purpose]
    message = (
        f"Hi {user.name or 'there'},\n\n"
        f"Your OTP is: {otp_obj.code}\n"
        f"It is valid for 10 minutes. Do not share it with anyone.\n\n"
        f"— B.Tech eKart Team"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def send_welcome_email(user):
    send_mail(
        "Welcome to B.Tech eKart 🎓",
        f"Hi {user.name},\n\nWelcome aboard! Browse notes, PYQs, Quantums and Combos for your branch now.\n\n— B.Tech eKart Team",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
    )
