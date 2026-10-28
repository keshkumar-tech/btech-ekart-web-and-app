"""Seed the database with realistic AKTU B.Tech sample data.

Usage:
    python manage.py seed_data              # idempotent: creates what's missing
    python manage.py seed_data --reset      # wipe sample data first, then reseed
    python manage.py seed_data --no-demo    # skip the demo customer + sample order

Creates:
  * Branches: CSE, IT, ECE, ME, CE, EE
  * Semesters 1-8 and representative subjects per branch
  * Categories (Notes, PYQ, Quantum, Syllabus, Combo) + Branch tiles
  * ~60 sample products (Notes/PYQ/Quantum/Syllabus/Combo) with covers
  * Banners, coupons, blog categories + posts, site settings
  * Admin user + demo customer
"""
import io
import random
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.blog.models import BlogCategory, BlogPost
from apps.catalog.models import Banner, Branch, Category, Product, SiteSetting, Subject
from apps.core.management.commands.cover import make_blog_cover, make_book_cover
from apps.orders.models import Coupon, Order, OrderItem

BRANCHES = [
    ("Computer Science & Engineering", "CSE"),
    ("Information Technology", "IT"),
    ("Electronics & Communication Engineering", "ECE"),
    ("Mechanical Engineering", "ME"),
    ("Civil Engineering", "CE"),
    ("Electrical Engineering", "EE"),
]

CATEGORIES = [
    ("Notes", "notes", "book"),
    ("Previous Year Questions", "pyq", "file"),
    ("Quantum", "quantum", "zap"),
    ("Syllabus", "syllabus", "list"),
    ("Combo Packs", "combo", "package"),
]

# A compact but realistic AKTU subject map (semester -> [(name, code), ...]).
# CSE/IT share many first-year subjects; higher sems differ per branch.
COMMON_SEM1 = [
    ("Engineering Mathematics-I", "BAS-101"),
    ("Engineering Physics", "BAS-102"),
    ("Programming for Problem Solving (C)", "BCS-101"),
    ("Basic Electrical Engineering", "BEE-101"),
    ("Engineering Graphics", "BME-101"),
]
COMMON_SEM2 = [
    ("Engineering Mathematics-II", "BAS-201"),
    ("Engineering Chemistry", "BAS-202"),
    ("Data Structures", "BCS-201"),
    ("Environmental Science", "BAS-203"),
    ("Workshop Practice", "BME-201"),
]
BRANCH_SUBJECTS = {
    "CSE": {
        3: [("Discrete Structures & Theory of Logic", "BCS-301"), ("Data Structures", "BCS-302"),
            ("Computer Organization & Architecture", "BCS-303"), ("Object Oriented Programming (C++)", "BCS-304")],
        4: [("Operating Systems", "BCS-401"), ("Database Management Systems", "BCS-402"),
            ("Design & Analysis of Algorithms", "BCS-403"), ("Theory of Computation", "BCS-404")],
        5: [("Compiler Design", "BCS-501"), ("Computer Networks", "BCS-502"),
            ("Software Engineering", "BCS-503"), ("Web Technologies", "BCS-504")],
        6: [("Artificial Intelligence", "BCS-601"), ("Machine Learning", "BCS-602"),
            ("Cloud Computing", "BCS-603"), ("Computer Graphics", "BCS-604")],
        7: [("Compiler Design Lab", "BCS-701"), ("Big Data", "BCS-702"), ("Cryptography & Network Security", "BCS-703")],
        8: [("Deep Learning", "BCS-801"), ("Blockchain Technology", "BCS-802"), ("Project Work", "BCS-851")],
    },
    "IT": {
        3: [("Digital Electronics", "BIT-301"), ("Data Structures", "BIT-302"), ("OOP with Java", "BIT-303")],
        4: [("Operating Systems", "BIT-401"), ("DBMS", "BIT-402"), ("Computer Networks", "BIT-403")],
        5: [("Web Development", "BIT-501"), ("Software Engineering", "BIT-502"), ("Python Programming", "BIT-503")],
        6: [("Artificial Intelligence", "BIT-601"), ("Mobile Application Development", "BIT-602")],
        7: [("Cyber Security", "BIT-701"), ("Data Warehousing", "BIT-702")],
        8: [("DevOps", "BIT-801"), ("Major Project", "BIT-851")],
    },
    "ECE": {
        3: [("Electronic Devices", "BEC-301"), ("Network Theory", "BEC-302"), ("Signals & Systems", "BEC-303")],
        4: [("Analog Circuits", "BEC-401"), ("Digital Electronics", "BEC-402"), ("Communication Systems", "BEC-403")],
        5: [("Microprocessors", "BEC-501"), ("Electromagnetic Field Theory", "BEC-502"), ("VLSI Design", "BEC-503")],
        6: [("Digital Signal Processing", "BEC-601"), ("Antenna & Wave Propagation", "BEC-602")],
        7: [("Optical Communication", "BEC-701"), ("Wireless Communication", "BEC-702")],
        8: [("Satellite Communication", "BEC-801"), ("Major Project", "BEC-851")],
    },
    "ME": {
        3: [("Thermodynamics", "BME-301"), ("Strength of Materials", "BME-302"), ("Material Science", "BME-303")],
        4: [("Fluid Mechanics", "BME-401"), ("Kinematics of Machinery", "BME-402"), ("Manufacturing Science", "BME-403")],
        5: [("Heat & Mass Transfer", "BME-501"), ("Dynamics of Machinery", "BME-502"), ("Machine Design-I", "BME-503")],
        6: [("IC Engines", "BME-601"), ("Refrigeration & Air Conditioning", "BME-602"), ("Machine Design-II", "BME-603")],
        7: [("CAD/CAM", "BME-701"), ("Automobile Engineering", "BME-702")],
        8: [("Industrial Engineering", "BME-801"), ("Major Project", "BME-851")],
    },
    "CE": {
        3: [("Surveying", "BCE-301"), ("Building Materials", "BCE-302"), ("Mechanics of Solids", "BCE-303")],
        4: [("Structural Analysis-I", "BCE-401"), ("Concrete Technology", "BCE-402"), ("Fluid Mechanics", "BCE-403")],
        5: [("Structural Analysis-II", "BCE-501"), ("Geotechnical Engineering", "BCE-502"), ("Transportation Engineering", "BCE-503")],
        6: [("Design of Steel Structures", "BCE-601"), ("Water Resource Engineering", "BCE-602")],
        7: [("Estimation & Costing", "BCE-701"), ("Environmental Engineering", "BCE-702")],
        8: [("Construction Management", "BCE-801"), ("Major Project", "BCE-851")],
    },
    "EE": {
        3: [("Electrical Circuit Analysis", "BEE-301"), ("Electrical Machines-I", "BEE-302"), ("Measurements", "BEE-303")],
        4: [("Electrical Machines-II", "BEE-401"), ("Power Systems-I", "BEE-402"), ("Control Systems", "BEE-403")],
        5: [("Power Electronics", "BEE-501"), ("Power Systems-II", "BEE-502"), ("Microprocessors", "BEE-503")],
        6: [("Electrical Drives", "BEE-601"), ("Switchgear & Protection", "BEE-602")],
        7: [("High Voltage Engineering", "BEE-701"), ("Utilization of Electrical Energy", "BEE-702")],
        8: [("Renewable Energy Sources", "BEE-801"), ("Major Project", "BEE-851")],
    },
}

PRODUCT_TYPES = [
    ("notes", "Complete Handwritten Notes"),
    ("pyq", "Previous Year Questions (2018-2024)"),
    ("quantum", "Quantum (Important Questions)"),
    ("syllabus", "Latest AKTU Syllabus"),
    ("combo", "Notes + PYQ + Quantum Combo"),
]

PRICE_BY_TYPE = {
    "notes": (49, 149),
    "pyq": (29, 79),
    "quantum": (39, 99),
    "syllabus": (9, 29),
    "combo": (129, 299),
}

BLOG_POSTS = [
    ("Top 10 Internships for B.Tech Students in 2025", "Internships & Jobs",
     "Land a great internship with these strategies and platforms."),
    ("AKTU Odd Semester Exam Datesheet Released", "AKTU News & Updates",
     "Check the latest datesheet and prepare accordingly."),
    ("How to Score 9+ CGPA in AKTU: A Practical Guide", "Exam Tips",
     "Smart study techniques, PYQ practice and time management."),
    ("Best Free Resources for Learning DSA", "Exam Tips",
     "Curated playlists and practice platforms for DSA mastery."),
    ("Campus Placement Preparation Roadmap", "Internships & Jobs",
     "From aptitude to interviews — a semester-by-semester plan."),
    ("AKTU New Credit System Explained", "AKTU News & Updates",
     "Everything you need to know about the revised credit structure."),
]


def make_cover_png(title: str) -> bytes:
    """Generate a simple branded cover image using Pillow (no external assets)."""
    from PIL import Image, ImageDraw
    from apps.core.management.commands.cover import _load_font
    W, H = 1200, 600
    colors = [(37, 99, 235), (124, 58, 237), (5, 150, 105), (225, 29, 72), (217, 119, 6)]
    top = random.choice(colors)
    bottom = tuple(max(0, c - 60) for c in top)
    img = Image.new("RGB", (W, H), top)
    draw = ImageDraw.Draw(img)
    # Smooth vertical gradient.
    for y in range(H):
        t = y / H
        draw.line(
            [(0, y), (W, y)],
            fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)),
        )
    # Brand mark + wrapped title.
    draw.rectangle([60, 60, 116, 116], fill=(255, 255, 255))
    draw.text((78, 70), "e", font=_load_font(36, bold=True), fill=top)
    font = _load_font(46, bold=True)
    words = title.split()[:9]
    y = 240
    for i in range(0, len(words), 3):
        draw.text((60, y), " ".join(words[i:i + 3]), font=font, fill=(255, 255, 255))
        y += 60
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_pdf(title: str, pages: int = 3) -> bytes:
    """Generate a small placeholder PDF so downloads/preview work end-to-end."""
    from reportlab.pdfgen import canvas as rl_canvas

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf)
    for page in range(pages):
        c.setFont("Helvetica-Bold", 18)
        c.drawString(80, 760, f"{title}")
        c.setFont("Helvetica", 11)
        c.drawString(80, 730, f"Sample page {page + 1} of {pages} — B.Tech eKart")
        c.drawString(80, 700, "This is generated placeholder content for local development.")
        c.showPage()
    c.save()
    return buf.getvalue()


class Command(BaseCommand):
    help = "Seed the database with AKTU B.Tech sample data."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing sample data first.")
        parser.add_argument("--no-demo", action="store_true", help="Skip the demo customer + sample order.")
        parser.add_argument("--products-per-subject", type=int, default=1,
                            help="How many products to create per subject (default 1).")

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(42)

        if options["reset"]:
            self.stdout.write(self.style.WARNING("Resetting sample data..."))
            Order.objects.all().delete()
            Product.objects.all().delete()
            Subject.objects.all().delete()
            Branch.objects.all().delete()
            Category.objects.all().delete()
            Banner.objects.all().delete()
            BlogPost.objects.all().delete()
            BlogCategory.objects.all().delete()
            Coupon.objects.all().delete()
            User.objects.filter(email__in=["admin@btechekart.com", "student@btechekart.com"]).delete()

        self._seed_users(options)
        branches = self._seed_branches()
        categories = self._seed_categories()
        self._seed_subjects(branches)
        self._seed_products(branches, categories, options["products_per_subject"])
        self._seed_banners()
        self._seed_coupons()
        self._seed_blog()
        self._seed_settings()
        if not options["no_demo"]:
            self._seed_demo_order()

        self.stdout.write(self.style.SUCCESS("\nSeed complete."))
        self.stdout.write("  Admin:    admin@btechekart.com / Admin@123")
        self.stdout.write("  Customer: student@btechekart.com / Student@123")
        self.stdout.write("  Docs:     /api/docs/   Admin: /admin/")

    # ------------------------------------------------------------------
    def _seed_users(self, options):
        admin, created = User.objects.get_or_create(
            email="admin@btechekart.com",
            defaults={"name": "Store Admin", "role": User.Role.ADMIN,
                      "is_staff": True, "is_superuser": True, "email_verified": True},
        )
        if created:
            admin.set_password("Admin@123")
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created admin@btechekart.com"))

        if not options["no_demo"]:
            cust, created = User.objects.get_or_create(
                email="student@btechekart.com",
                defaults={"name": "Demo Student", "role": User.Role.CUSTOMER,
                          "phone": "9999", "college": "IET Lucknow",
                          "branch": "CSE", "year": 3, "email_verified": True},
            )
            if created:
                cust.set_password("Student@123")
                cust.save()
                self.stdout.write(self.style.SUCCESS("Created student@btechekart.com"))

    def _seed_branches(self):
        branches = {}
        for name, short in BRANCHES:
            obj, _ = Branch.objects.get_or_create(short_name=short, defaults={"name": name})
            branches[short] = obj
        self.stdout.write(f"Branches: {len(branches)}")
        return branches

    def _seed_categories(self):
        cats = {}
        for i, (name, slug, icon) in enumerate(CATEGORIES):
            obj, _ = Category.objects.get_or_create(
                name=name, defaults={"slug": slug, "icon": icon, "order": i}
            )
            cats[slug] = obj
        self.stdout.write(f"Categories: {len(cats)}")
        return cats

    def _seed_subjects(self, branches):
        count = 0
        for short, branch in branches.items():
            # Sem 1 & 2 are common to all branches.
            for sem, subjects in ((1, COMMON_SEM1), (2, COMMON_SEM2)):
                for name, code in subjects:
                    _, created = Subject.objects.get_or_create(
                        branch=branch, semester=sem, name=name, defaults={"code": code}
                    )
                    count += int(created)
            for sem, subjects in BRANCH_SUBJECTS.get(short, {}).items():
                for name, code in subjects:
                    _, created = Subject.objects.get_or_create(
                        branch=branch, semester=sem, name=name, defaults={"code": code}
                    )
                    count += int(created)
        self.stdout.write(f"Subjects created: {count}")

    def _seed_products(self, branches, categories, per_subject):
        created = 0
        for branch in branches.values():
            for subject in branch.subjects.all():
                types = list(PRODUCT_TYPES)
                if per_subject <= 0:
                    continue
                chosen = types[:per_subject] if per_subject <= len(types) else types
                for type_key, type_label in chosen:
                    title = f"{subject.name} — {type_label} ({branch.short_name} Sem {subject.semester})"
                    if Product.objects.filter(title=title).exists():
                        continue
                    lo, hi = PRICE_BY_TYPE[type_key]
                    price = Decimal(random.randint(lo, hi))
                    mrp = (price * Decimal(random.choice([1.5, 1.8, 2.0, 2.5]))).quantize(Decimal("1"))
                    product = Product.objects.create(
                        title=title,
                        description=(
                            f"{type_label} for {subject.name} ({subject.code}) — "
                            f"AKTU {branch.name}, Semester {subject.semester}. "
                            "Curated, exam-focused and regularly updated."
                        ),
                        type=type_key,
                        category=categories.get(type_key if type_key != "combo" else "combo"),
                        branch=branch,
                        subject=subject,
                        year=(subject.semester + 1) // 2,
                        semester=subject.semester,
                        subject_code=subject.code,
                        price=price,
                        mrp=mrp,
                        page_count=random.randint(40, 220),
                        tags=f"{branch.short_name},sem{subject.semester},{type_key},aktu",
                        is_trending=random.random() < 0.15,
                        is_new_arrival=random.random() < 0.15,
                        sold_count=random.randint(0, 400),
                    )
                    product.cover_image.save(f"cover-{product.slug[:40]}.png",
                                             ContentFile(make_book_cover(
                                                 subject.name,
                                                 type_key=type_key,
                                                 branch=branch.short_name,
                                                 semester=subject.semester,
                                             )), save=False)
                    product.preview_pdf.save(f"preview-{product.slug[:40]}.pdf",
                                             ContentFile(make_pdf(subject.name, 2)), save=False)
                    product.main_pdf.save(f"main-{product.slug[:40]}.pdf",
                                          ContentFile(make_pdf(subject.name, 6)), save=False)
                    product.save()
                    created += 1
        self.stdout.write(f"Products created: {created}")

    def _seed_banners(self):
        if Banner.objects.exists():
            self.stdout.write("Banners: already present")
            return
        data = [
            ("AKTU Exam Special", "Flat 50% OFF on Notes + PYQ Combos", "Save 50%", "/shop?type=combo"),
            ("New Session, New Notes", "Sem 1 & 2 notes updated for the latest syllabus", "Just Launched", "/shop?semester=1"),
            ("Crack Your Backlogs", "Quantums with the most repeated questions", "Trending", "/shop?type=quantum"),
        ]
        for i, (title, subtitle, badge, link) in enumerate(data):
            banner = Banner(title=title, subtitle=subtitle, badge_text=badge, link=link, order=i)
            banner.image.save(f"banner-{i}.png", ContentFile(make_cover_png(title)), save=False)
            banner.save()
        self.stdout.write(f"Banners: {len(data)}")

    def _seed_coupons(self):
        coupons = [
            ("WELCOME10", "percent", Decimal("10"), Decimal("0"), Decimal("50")),
            ("AKTU50", "percent", Decimal("50"), Decimal("199"), Decimal("150")),
            ("FLAT30", "flat", Decimal("30"), Decimal("99"), None),
        ]
        for code, dtype, value, min_amt, max_disc in coupons:
            Coupon.objects.get_or_create(
                code=code,
                defaults={"discount_type": dtype, "value": value,
                          "min_order_amount": min_amt, "max_discount": max_disc},
            )
        self.stdout.write(f"Coupons: {len(coupons)}")

    def _seed_blog(self):
        cats = {}
        for name in ["Internships & Jobs", "AKTU News & Updates", "Exam Tips"]:
            obj, _ = BlogCategory.objects.get_or_create(name=name)
            cats[name] = obj
        for idx, (title, cat_name, excerpt) in enumerate(BLOG_POSTS):
            post, created = BlogPost.objects.get_or_create(
                title=title,
                defaults={
                    "category": cats[cat_name],
                    "excerpt": excerpt,
                    "content": f"<h2>{title}</h2><p>{excerpt}</p>"
                               "<p>This is sample blog content seeded for local development. "
                               "Edit it from the admin dashboard or Django admin.</p>",
                    "tags": "aktu,btech,students",
                    "is_published": True,
                    "published_at": timezone.now(),
                },
            )
            if created:
                post.cover_image.save(f"blog-{post.slug[:40]}.png",
                                      ContentFile(make_blog_cover(title, idx)), save=True)
        self.stdout.write(f"Blog posts: {len(BLOG_POSTS)}")

    def _seed_settings(self):
        defaults = {
            "whatsapp_link": "https://wa.me/919999",
            "telegram_link": "https://t.me/btechekart",
            "support_email": "support@btechekart.com",
            "support_phone": "+91 99999 99999",
            "about_text": "B.Tech eKart sells digital study material for AKTU B.Tech students.",
        }
        for key, value in defaults.items():
            SiteSetting.objects.get_or_create(key=key, defaults={"value": value})
        # A placeholder UPI QR image (so the manual-payment flow renders in dev).
        qr, created = SiteSetting.objects.get_or_create(key="upi_qr_image")
        if created and not qr.image:
            qr.image.save("upi-qr.png", ContentFile(make_cover_png("Scan to pay")), save=True)
        self.stdout.write("Site settings: ok")

    def _seed_demo_order(self):
        customer = User.objects.filter(email="student@btechekart.com").first()
        if not customer or Order.objects.filter(user=customer).exists():
            return
        products = list(Product.objects.filter(is_active=True)[:2])
        if not products:
            return
        order = Order.objects.create(user=customer, payment_method="razorpay",
                                     customer_name=customer.name, customer_email=customer.email)
        for p in products:
            OrderItem.objects.create(order=order, product=p, title=p.title, price=p.price,
                                     mrp=p.mrp, quantity=1)
        order.recalculate()
        order.mark_paid(method="razorpay")
        self.stdout.write(self.style.SUCCESS(f"Demo paid order {order.order_number} created."))
