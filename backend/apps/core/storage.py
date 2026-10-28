"""Private storage backends for PDFs. Files are never publicly served."""
import uuid

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage


class PrivateLocalStorage(FileSystemStorage):
    """Local private storage under media_private/ (dev only)."""

    def __init__(self):
        super().__init__(location=str(settings.PRIVATE_MEDIA_ROOT))

    def url(self, name):
        # Never expose a static URL; buyers get signed API links instead.
        return None


class PrivateS3Storage:
    """S3-backed private storage returning pre-signed GET URLs."""

    def __init__(self):
        import boto3
        self._s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        self._bucket = settings.AWS_STORAGE_BUCKET_NAME

    def save(self, name, content):
        key = f"private/pdfs/{uuid.uuid4().hex}_{name}"
        self._s3.upload_fileobj(content, self._bucket, key)
        return key

    def exists(self, name):
        try:
            self._s3.head_object(Bucket=self._bucket, Key=name)
            return True
        except Exception:
            return False

    def signed_url(self, name, expires=None):
        return self._s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": name},
            ExpiresIn=expires or settings.PRIVATE_PDF_URL_EXPIRY,
        )

    def read_bytes(self, name):
        import io
        buf = io.BytesIO()
        self._s3.download_fileobj(self._bucket, name, buf)
        return buf.getvalue()

    def url(self, name):
        return None


class PrivateCloudinaryStorage:
    """Cloudinary-backed private storage (signed delivery URLs)."""

    def __init__(self):
        import cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY["cloud_name"],
            api_key=settings.CLOUDINARY["api_key"],
            api_secret=settings.CLOUDINARY["api_secret"],
            secure=True,
        )

    def save(self, name, content):
        import cloudinary
        public_id = f"private/pdfs/{uuid.uuid4().hex}_{name.rsplit('.', 1)[0]}"
        result = cloudinary.uploader.upload(
            content, public_id=public_id, resource_type="raw", type="private"
        )
        return result["public_id"]

    def exists(self, name):
        try:
            import cloudinary
            cloudinary.api.resource(name, resource_type="raw", type="private")
            return True
        except Exception:
            return False

    def signed_url(self, name, expires=None):
        import time

        import cloudinary
        return cloudinary.utils.private_download_url(
            name, "pdf", expires_at=int(time.time()) + (expires or settings.PRIVATE_PDF_URL_EXPIRY)
        )

    def read_bytes(self, name):
        import io

        import requests
        url = self.signed_url(name, expires=120)
        return io.BytesIO(requests.get(url, timeout=60).content).getvalue()

    def url(self, name):
        return None


def get_private_storage():
    """Return the configured private storage backend."""
    if getattr(settings, "USE_S3", False):
        return PrivateS3Storage()
    if getattr(settings, "USE_CLOUDINARY", False):
        return PrivateCloudinaryStorage()
    return PrivateLocalStorage()


def private_storage():
    """Django `storage=` callable for FileFields that must stay private.

    Django accepts a callable for FileField(storage=...) and calls it (without
    arguments) to obtain the storage instance.
    """
    return get_private_storage()


def read_private_file(field_file) -> bytes:
    """Read the raw bytes of a private FileField value regardless of backend.

    Works for local private storage (dev), S3 (signed GET), and Cloudinary.
    Returns b"" if the file is missing so callers can return a clean 404.
    """
    if not field_file:
        return b""
    name = field_file.name
    storage = get_private_storage()
    if isinstance(storage, PrivateLocalStorage):
        try:
            with storage.open(name, "rb") as fh:
                return fh.read()
        except FileNotFoundError:
            return b""
    if hasattr(storage, "read_bytes"):
        return storage.read_bytes(name)
    # Fallback: default storage open()
    try:
        with field_file.open("rb") as fh:
            return fh.read()
    except Exception:
        return b""
