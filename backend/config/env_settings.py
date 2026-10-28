import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-secret-key-change-me")
DEBUG = os.environ.get("DEBUG", "1") == "1"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Placeholder — the real settings live in settings.py. This file re-exports
# it so `django.core.management` and ASGI/WSGI discovery work when only the
# DJANGO_SETTINGS_MODULE-style env var differs.
from .settings import *  # noqa: F401,F403
