"""Regenerate cover images for products and blog posts with the seeded designs.

Usage:
    python manage.py regenerate_covers                 # products + blog posts
    python manage.py regenerate_covers --type combo    # only one product type
    python manage.py regenerate_covers --blog-only     # only blog covers
    python manage.py regenerate_covers --products-only # only product covers

Handy after changing the cover generator so images refresh without a full
reseed (which would also wipe/recreate everything else).
"""
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.blog.models import BlogPost
from apps.catalog.models import Product
from apps.core.management.commands.cover import make_blog_cover, make_book_cover


class Command(BaseCommand):
    help = "Regenerate cover images for existing products and blog posts."

    def add_arguments(self, parser):
        parser.add_argument("--type", default=None,
                            help="Only regenerate covers for this product type.")
        parser.add_argument("--blog-only", action="store_true",
                            help="Only regenerate blog post covers.")
        parser.add_argument("--products-only", action="store_true",
                            help="Only regenerate product covers.")

    def handle(self, *args, **options):
        if not options["blog_only"]:
            self._products(options)
        if not options["products_only"]:
            self._blogs()

    def _products(self, options):
        qs = Product.objects.select_related("branch", "subject").all()
        if options["type"]:
            qs = qs.filter(type=options["type"])
            self.stdout.write(f"Filtering to type={options['type']}")

        total = qs.count()
        updated = 0
        for product in qs.iterator():
            subject_name = product.subject.name if product.subject else product.title
            branch = product.branch.short_name if product.branch else ""
            cover = make_book_cover(
                subject_name,
                type_key=product.type,
                branch=branch,
                semester=product.semester,
            )
            product.cover_image.save(
                f"cover-{product.slug[:40]}.png", ContentFile(cover), save=True
            )
            updated += 1
            if updated % 100 == 0:
                self.stdout.write(f"  …{updated}/{total}")

        self.stdout.write(self.style.SUCCESS(f"Regenerated {updated} product covers."))

    def _blogs(self):
        posts = list(BlogPost.objects.all())
        for idx, post in enumerate(posts):
            cover = make_blog_cover(post.title, idx)
            post.cover_image.save(
                f"blog-{post.slug[:40]}.png", ContentFile(cover), save=True
            )
        self.stdout.write(
            self.style.SUCCESS(f"Regenerated {len(posts)} blog covers.")
        )
