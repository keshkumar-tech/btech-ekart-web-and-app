# 🚀 Deployment Guide

Deploy the three apps: **Django API** (Render/Railway), **React web** (Vercel),
**Mobile** (EAS Build → APK/AAB).

---

## 0. Prerequisites

- A managed **PostgreSQL** database (Render/Railway/Neon/Supabase all work)
- A **Redis** instance (for rate limiting; optional in single-instance setups)
- A **Razorpay** account with live keys + a webhook secret
- Object storage for private PDFs — **AWS S3** (recommended) or **Cloudinary**
- An SMTP provider for OTP + order emails (Gmail app-password, SendGrid, Resend, …)

---

## 1. Backend → Render

### 1.1 Create the service

1. Push the repo to GitHub.
2. Render → **New → Web Service** → connect the repo.
3. **Root Directory**: `backend`
4. **Environment**: Python 3
5. **Build Command**
   ```bash
   pip install -r requirements.txt && python manage.py collectstatic --noinput
   ```
6. **Start Command**
   ```bash
   python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```

### 1.2 Environment variables

Set every key from `backend/.env.example`. The ones that matter most:

```env
DJANGO_SECRET_KEY=<long-random-string>
DEBUG=False
ALLOWED_HOSTS=btech-ekart-api.onrender.com
DATABASE_URL=postgresql://user:pass@host:5432/db       # Render injects this automatically
DB_SSL_REQUIRE=True
REDIS_URL=redis://default:pass@host:6379/0

CORS_ALLOWED_ORIGINS=https://btechekart.vercel.app,https://btechekart.com

RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
RAZORPAY_KEY_SECRET=<your-live-secret>
RAZORPAY_WEBHOOK_SECRET=<a-secret-you-choose>

AWS_ACCESS_KEY_ID=<...>
AWS_SECRET_ACCESS_KEY=<...>
AWS_STORAGE_BUCKET_NAME=btechekart-private
AWS_S3_REGION_NAME=ap-south-1

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<you@gmail.com>
EMAIL_HOST_PASSWORD=<app-password>
DEFAULT_FROM_EMAIL=B.Tech eKart <noreply@btechekart.com>

GOOGLE_CLIENT_ID=<...>
FRONTEND_URL=https://btechekart.vercel.app
PDF_URL_EXPIRY_SECONDS=600
MAX_DOWNLOADS_PER_ORDER_ITEM=5
WATERMARK_PDFS=True
```

> `DEBUG=False` automatically enables `SECURE_SSL_REDIRECT`, HSTS, secure cookies
> and `X_FRAME_OPTIONS=DENY`.

### 1.3 First deploy

After the first successful build, open the Render **Shell** and run:

```bash
python manage.py createsuperuser       # or use the seed admin
python manage.py seed_data --products-per-subject 2   # optional sample data
```

### 1.4 Railway (alternative)

1. **New Project → Deploy from GitHub**, set root directory `backend`.
2. Add the **PostgreSQL** and **Redis** plugins.
3. Same build/start commands; Railway provides `DATABASE_URL` and `REDIS_URL`.

### 1.5 Razorpay webhook

Razorpay Dashboard → **Settings → Webhooks → Add**:

- **URL**: `https://<your-api-domain>/api/payments/razorpay/webhook/`
- **Secret**: the same value as `RAZORPAY_WEBHOOK_SECRET`
- **Events**: `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`

The handler verifies the HMAC signature and is **idempotent** (a `WebhookEvent`
row per event id), so duplicate deliveries are safe.

### 1.6 Private PDF storage (AWS S3)

1. Create a bucket; **leave Block Public Access ON** (files stay private).
2. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:HeadObject` on that bucket.
3. Set the `AWS_*` env vars. `USE_S3` turns on automatically when all three are present,
   and buyers receive **pre-signed GET URLs**.

---

## 2. Web → Vercel

1. Vercel → **New Project** → import the repo.
2. **Root Directory**: `web` · **Framework**: Vite · Build `npm run build` · Output `dist`
3. **Environment variables**
   ```env
   VITE_API_BASE_URL=https://btech-ekart-api.onrender.com
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
   VITE_GOOGLE_CLIENT_ID=<...>
   VITE_SITE_NAME=B.Tech eKart
   VITE_SUPPORT_EMAIL=support@btechekart.com
   VITE_WHATSAPP_LINK=https://wa.me/91XXXXXXXXXX
   VITE_TELEGRAM_LINK=https://t.me/yourchannel
   ```
4. **SPA routing** — add `web/vercel.json`:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
5. Deploy, then add the Vercel domain to the backend's `CORS_ALLOWED_ORIGINS`.

**Netlify alternative:** build `npm run build`, publish `dist`, and add a
`_redirects` file containing `/*  /index.html  200`.

---

## 3. Mobile → EAS Build (APK / AAB)

```bash
npm install -g eas-cli
cd mobile
eas login
eas build:configure            # then paste the generated projectId into app.json → expo.extra.eas.projectId
```

### Set build-time env vars on EAS

`eas.json` → add an `env` block per profile, or use **EAS Secrets**:

```bash
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value https://btech-ekart-api.onrender.com
eas secret:create --name EXPO_PUBLIC_RAZORPAY_KEY_ID --value rzp_live_xxxxxxxx
```

### Build

```bash
# Internal testing APK (shareable link) — best first step
eas build -p android --profile preview

# Play Store bundle
eas build -p android --profile production
eas submit -p android --latest

# iOS (needs an Apple Developer account)
eas build -p ios --profile production
eas submit -p ios --latest
```

Profiles live in `mobile/eas.json`:
`development` (dev client, APK) · `preview` (internal APK) · `production` (AAB, autoIncrement).

> **Razorpay does not work in Expo Go.** Use a development build
> (`npx expo run:android`) or an EAS preview/production build. The app detects the
> missing native module and falls back to the manual UPI QR flow so QA can proceed.

### Post-build checklist

- Add the app's `package`/`bundleIdentifier` (`com.btechekart.app`) to your
  Google/Apple console as needed.
- For **physical-device testing against a local API**, add your LAN IP to the
  backend's `ALLOWED_HOSTS` + `CORS_ALLOWED_ORIGINS` and set
  `EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000`.

---

## 4. Post-deployment smoke test

```bash
# Health
curl https://<api>/api/health/                       # {"status":"ok"}

# Public catalog
curl https://<api>/api/catalog/products/?page=1

# Docs
open https://<api>/api/docs/

# Auth
curl -X POST https://<api>/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"student@btechekart.com","password":"Student@123"}'
```

Then, in the web UI: log in → add to cart → check out (Razorpay test card
`4111 1111 1111 1111`, any future expiry, any CVV) → confirm the order turns **Paid**
→ download the PDF from **My Library**. Repeat with the **manual QR** flow and
approve it from **/admin/orders**.

---

## 5. Production hardening checklist

- [ ] `DEBUG=False` and a strong, unique `DJANGO_SECRET_KEY`
- [ ] `DATABASE_URL` points at managed Postgres with `DB_SSL_REQUIRE=True`
- [ ] `REDIS_URL` set (so rate limiting is shared across workers)
- [ ] `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` list only your real domains
- [ ] Private bucket (Block Public Access ON) for `main_pdf`; `WATERMARK_PDFS=True`
- [ ] Razorpay **live** keys + webhook secret configured and the webhook verified
- [ ] SMTP configured and a test OTP/order email received
- [ ] Backups enabled on the database
- [ ] Error monitoring (Sentry) and uptime checks on `/api/health/`
