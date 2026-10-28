# B.Tech eKart — Backend (Django + DRF)

REST API powering the B.Tech eKart web store, admin dashboard and mobile app.
Sells **digital study material** (Notes, PYQs, Quantums, Syllabus, Combo packs)
for AKTU B.Tech students.

## Tech stack

- Django 4.2 + Django REST Framework
- SimpleJWT (access/refresh, rotation + blacklist), Google login, OTP email verification
- `django-filter` (filtering), `SearchFilter` (search), `OrderingFilter` (sort), pagination
- `drf-spectacular` → Swagger / Redoc / OpenAPI schema
- Razorpay (server-side order creation, signature verification, webhooks) + Manual UPI/QR
- Private PDF storage (local / S3 / Cloudinary) with HMAC signed URLs, download limits, dynamic watermark
- ReportLab (PDF invoices), pypdf (watermarking), Pillow (images)
- PostgreSQL in production (via `DATABASE_URL`), SQLite in dev
- Redis for caching / `django-ratelimit` in production

## Quick start

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

copy .env.example .env        # Windows  (cp on macOS/Linux)
# edit .env with your keys

python manage.py migrate
python manage.py seed_data --products-per-subject 2   # sample AKTU data
python manage.py runserver
```

Then open:

- API docs (Swagger): http://127.0.0.1:8000/api/docs/
- ReDoc: http://127.0.0.1:8000/api/redoc/
- Django admin (backup): http://127.0.0.1:8000/admin/

### Seeded logins

| Role     | Email                  | Password    |
| -------- | ---------------------- | ----------- |
| Admin    | admin@btechekart.com   | Admin@123   |
| Customer | student@btechekart.com | Student@123 |

## Project layout

```
backend/
├── config/                 # settings, urls, wsgi, asgi
├── apps/
│   ├── core/               # private storage, signed URLs, invoices, watermark,
│   │                       # My Library + secure download views, seed command
│   ├── accounts/           # custom User, JWT auth, OTP, Google, profile
│   ├── catalog/            # Product, Category, Branch, Subject, Banner, SiteSetting
│   ├── cart/               # Cart + CartItem (per-user)
│   ├── wishlist/           # Wishlist + move-to-cart (per-user)
│   ├── orders/             # Order, OrderItem, Coupon, checkout, invoices
│   ├── payments/           # Razorpay + manual QR, Payment, WebhookEvent
│   ├── reviews/            # verified-buyer reviews + rating aggregation
│   ├── blog/               # BlogCategory + BlogPost
│   └── dashboard/          # admin analytics, CSV exports, customer detail
└── manage.py
```

## Authentication

JWT bearer tokens. Send `Authorization: Bearer <access>`.

| Method    | Endpoint                     | Purpose                       |
| --------- | ---------------------------- | ----------------------------- |
| POST      | `/api/auth/register/`        | Sign up (+ merges guest cart) |
| POST      | `/api/auth/login/`           | Email + password → tokens     |
| POST      | `/api/auth/logout/`          | Blacklist refresh token       |
| POST      | `/api/auth/google/`          | Google ID-token login         |
| POST      | `/api/auth/otp/send/`        | Send email-verification OTP   |
| POST      | `/api/auth/otp/verify/`      | Verify email                  |
| POST      | `/api/auth/password/forgot/` | Request password-reset OTP    |
| POST      | `/api/auth/password/reset/`  | Reset password with OTP       |
| POST      | `/api/auth/password/change/` | Change password (logged in)   |
| GET/PATCH | `/api/auth/profile/`         | View / update profile         |

## Catalog

| Method | Endpoint                                | Notes                             |
| ------ | --------------------------------------- | --------------------------------- |
| GET    | `/api/catalog/categories/`              | Category tiles                    |
| GET    | `/api/catalog/branches/`                | CSE, IT, ECE, ME, CE, EE          |
| GET    | `/api/catalog/subjects/`                | Filter by `?branch=&semester=&q=` |
| GET    | `/api/catalog/products/`                | See filters below                 |
| GET    | `/api/catalog/products/<slug>/`         | Detail + related products         |
| GET    | `/api/catalog/banners/`                 | Home page banner slider           |
| GET    | `/api/catalog/products/<slug>/preview/` | Public sample PDF                 |

Product list query params: `?type=notes|pyq|quantum|syllabus|combo`,
`?branch__short_name=CSE`, `?semester=3`, `?year=2`, `?category__slug=notes`,
`?price__gte=&price__lte=`, `?rating__gte=`, `?is_trending=`, `?is_new_arrival=`,
`?q=search`, `?ordering=-price|rating|sold_count|created_at`, `?page=`.

## Cart & Wishlist (per-user)

| Method | Endpoint                             |
| ------ | ------------------------------------ |
| GET    | `/api/cart/`                         |
| POST   | `/api/cart/add/`                     |
| PATCH  | `/api/cart/items/<id>/`              |
| DELETE | `/api/cart/items/<id>/`              |
| DELETE | `/api/cart/clear/`                   |
| GET    | `/api/wishlist/`                     |
| POST   | `/api/wishlist/add/`                 |
| DELETE | `/api/wishlist/remove/<product_id>/` |
| POST   | `/api/wishlist/move-to-cart/`        |

Every user only ever sees their **own** cart and wishlist.

## Orders, payments & library

| Method | Endpoint                                        | Purpose                            |
| ------ | ----------------------------------------------- | ---------------------------------- |
| POST   | `/api/orders/checkout/`                         | Create pending order from cart     |
| POST   | `/api/orders/coupon/apply/`                     | Validate coupon + preview discount |
| GET    | `/api/orders/`                                  | My orders                          |
| GET    | `/api/orders/<order_number>/`                   | Order detail (owner/admin only)    |
| GET    | `/api/orders/<order_number>/invoice/`           | Download PDF invoice               |
| POST   | `/api/orders/<order_number>/manual-payment/`    | Submit UTR + screenshot (QR flow)  |
| POST   | `/api/payments/razorpay/create/`                | Create Razorpay order              |
| POST   | `/api/payments/razorpay/verify/`                | Verify signature → unlock          |
| POST   | `/api/payments/razorpay/webhook/`               | Webhook (captured/failed/refund)   |
| GET    | `/api/payments/manual/<order_number>/`          | QR image + exact amount            |
| GET    | `/api/library/`                                 | My Library (purchased items)       |
| GET    | `/api/library/download/<order_item_id>/?token=` | Secure PDF download                |

**Products unlock only after verified payment.** A Razorpay order is unlocked on a
valid HMAC signature (client callback) _or_ a verified `payment.captured` webhook.
Manual QR orders unlock when an admin approves them.

### Payment flow (Razorpay)

1. Client `POST /api/orders/checkout/` → order created (`pending`).
2. Client `POST /api/payments/razorpay/create/` → gets `razorpay_order_id` + public `key_id`.
3. Client opens Razorpay Checkout / native SDK and pays.
4. Client `POST /api/payments/razorpay/verify/` with `razorpay_order_id`,
   `razorpay_payment_id`, `razorpay_signature`.
5. Server verifies HMAC → marks order paid → emails invoice → unlocks Library.
6. The webhook is a reliability backstop and is idempotent (`WebhookEvent` log).

### Payment flow (Manual QR)

1. Client checks out with `payment_method=manual_qr`.
2. Client `GET /api/payments/manual/<order_number>/` → QR image + exact amount.
3. Customer pays via UPI, then `POST /api/orders/<order_number>/manual-payment/`
   with `utr_number` + `payment_screenshot` → order becomes `pending_verification`.
4. Admin approves in the dashboard → order `paid`, Library unlocks, email sent.

## Secure PDF delivery

- `Product.main_pdf` is stored on a **private** backend (`media_private/` in dev,
  S3/Cloudinary in prod) and its `.url` is always `None`.
- Buyers get a short-lived HMAC-signed URL (`PDF_URL_EXPIRY_SECONDS`).
- The token is bound to the specific order item — it can't be reused for another file.
- Per-item download cap (`MAX_DOWNLOADS_PER_ORDER_ITEM`).
- Optional dynamic watermark stamping the buyer's email on every page (`WATERMARK_PDFS`).
- Only the buyer (or an admin) can download.

## Admin dashboard API (`/api/dashboard/`)

Admin-only. Overview stats, revenue graphs (daily/weekly/monthly), top products,
customer list + full detail (purchases, cart, wishlist, total spent), order
management, manual-payment approve/reject, refund marking, and CSV exports.

## Settings (env vars)

See `.env.example`. Key ones: `DJANGO_SECRET_KEY`, `DEBUG`, `DATABASE_URL`,
`CORS_ALLOWED_ORIGINS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`RAZORPAY_WEBHOOK_SECRET`, `REDIS_URL`, `CLOUDINARY_*`, `AWS_*`,
`EMAIL_*`, `GOOGLE_CLIENT_ID`, `FRONTEND_URL`, `PDF_URL_EXPIRY_SECONDS`,
`MAX_DOWNLOADS_PER_ORDER_ITEM`, `WATERMARK_PDFS`.

> **Razorpay webhook:** point your Razorpay dashboard webhook to
> `https://<your-api>/api/payments/razorpay/webhook/` and set the secret in
> `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.captured`, `payment.failed`,
> `refund.created`, `refund.processed`.

## Tests

```bash
python manage.py test            # full suite
python manage.py test apps.orders apps.payments
```

Covers auth flows, catalog filtering, per-user cart/wishlist isolation, checkout +
coupons, Razorpay signature verification, webhook idempotency, library access
control, download limits, reviews and blog.

## Deployment (Render / Railway)

1. Set all env vars from `.env.example` (use `DEBUG=False`, a strong
   `DJANGO_SECRET_KEY`, a Postgres `DATABASE_URL`, and `REDIS_URL`).
2. Build: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
3. Release/start: `python manage.py migrate && gunicorn config.wsgi:application`
4. Add your web/mobile origins to `CORS_ALLOWED_ORIGINS`.
5. Set `ALLOWED_HOSTS` to your API domain.
