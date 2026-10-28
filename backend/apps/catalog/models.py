"""Catalog models: taxonomy + products + banners + site settings.

Digital goods only — no stock. `main_pdf` is stored on private storage and
never exposed publicly; buyers get signed URLs.
"""
from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.core.storage import private_storage


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon key for the frontend tiles")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Branch(models.Model):
    name = models.CharField(max_length=120, unique=True)   # e.g. Computer Science & Engineering
    short_name = models.CharField(max_length=10, unique=True)  # e.g. CSE
    slug = models.SlugField(max_length=130, unique=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["short_name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.short_name


class Subject(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="subjects")
    semester = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, blank=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)

    class Meta:
        ordering = ["branch__short_name", "semester", "name"]
        unique_together = [("branch", "semester", "name")]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.branch.short_name}-{self.semester}-{self.name}"
            slug = slugify(base)[:215]
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.branch.short_name} S{self.semester} — {self.name}"


class Product(models.Model):
    class Type(models.TextChoices):
        NOTES = "notes", "Notes"
        PYQ = "pyq", "PYQ"
        QUANTUM = "quantum", "Quantum"
        SYLLABUS = "syllabus", "Syllabus"
        COMBO = "combo", "Combo"

    title = models.CharField(max_length=250)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=Type.choices, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    year = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-4")
    semester = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-8")
    subject_code = models.CharField(max_length=20, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    mrp = models.DecimalField(max_digits=8, decimal_places=2)
    discount = models.PositiveSmallIntegerField(default=0, help_text="Auto-computed % off")
    cover_image = models.ImageField(upload_to="products/covers/", null=True, blank=True)
    preview_pdf = models.FileField(upload_to="products/previews/", null=True, blank=True)
    main_pdf = models.FileField(
        upload_to="products/main/",
        null=True,
        blank=True,
        storage=private_storage,
        help_text="PRIVATE — never served publicly; buyers get signed URLs",
    )
    page_count = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)
    tags = models.CharField(max_length=300, blank=True, help_text="Comma-separated tags")
    is_active = models.BooleanField(default=True)
    is_trending = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["type", "is_active"]),
            models.Index(fields=["branch", "semester"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = self.title[:250]
            slug = slugify(base)
            candidate, i = slug, 1
            while Product.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{slug}-{i}"
                i += 1
            self.slug = candidate
        if self.mrp and self.mrp > self.price:
            self.discount = int(round((self.mrp - self.price) / self.mrp * 100))
        super().save(*args, **kwargs)
        # Cover image is OPTIONAL: if none was uploaded, auto-generate it from the
        # first page of the product PDF so the product always has a thumbnail.
        if not self.cover_image and self.main_pdf:
            self._generate_cover_from_pdf()

    def _generate_cover_from_pdf(self):
        """Render the first page of `main_pdf` and store it as `cover_image`."""
        from django.core.files.base import ContentFile

        from apps.core.storage import read_private_file
        from apps.core.utils import pdf_first_page_image

        raw = read_private_file(self.main_pdf)
        png = pdf_first_page_image(raw)
        if not png:
            return
        filename = f"{(self.slug or 'product')}-cover.png"
        self.cover_image.save(filename, ContentFile(png), save=False)
        Product.objects.filter(pk=self.pk).update(cover_image=self.cover_image)

    def get_cover_image_url(self):
        """Public URL for the cover, generating it from the PDF on demand."""
        if self.cover_image:
            try:
                return self.cover_image.url
            except Exception:
                pass
        if self.main_pdf:
            self._generate_cover_from_pdf()
            if self.cover_image:
                try:
                    return self.cover_image.url
                except Exception:
                    return None
        return None

    @property
    def tag_list(self):
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    def __str__(self):
        return self.title


class Banner(models.Model):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=250, blank=True)
    image = models.ImageField(upload_to="banners/")
    link = models.CharField(max_length=300, blank=True, help_text="Internal path or full URL")
    badge_text = models.CharField(max_length=50, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class SiteSetting(models.Model):
    """Singleton key/value settings editable from admin (QR image, contacts...)."""

    KEY_CHOICES = [
        ("upi_qr_image", "UPI QR Code Image"),
        ("whatsapp_link", "WhatsApp Link"),
        ("telegram_link", "Telegram Link"),
        ("support_email", "Support Email"),
        ("support_phone", "Support Phone"),
        ("about_text", "About Text"),
    ]
    key = models.CharField(max_length=50, choices=KEY_CHOICES, unique=True)
    value = models.TextField(blank=True)
    image = models.ImageField(upload_to="settings/", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key

    @classmethod
    def get(cls, key, default=""):
        obj = cls.objects.filter(key=key).first()
        if key.endswith("image") and obj and obj.image:
            return obj.image.url
        return obj.value if obj else default
