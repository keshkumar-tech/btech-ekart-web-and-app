# 🎓 B.Tech eKart

> **A full-stack, production-ready e-commerce platform for AKTU B.Tech study material** — digital notes, PYQs, quantums, syllabus & combo packs — delivered through a **Django REST API**, a **React web app**, and a **React Native (Expo) mobile app**.

<p align="center">
  <img alt="Django" src="https://img.shields.io/badge/Django-4.2-092E20?logo=django&logoColor=white">
  <img alt="DRF" src="https://img.shields.io/badge/DRF-3.15-A30000">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-Expo-000020?logo=expo&logoColor=white">
  <img alt="Razorpay" src="https://img.shields.io/badge/Payments-Razorpay%20%2B%20UPI-0C2451">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

---

## 📖 What is this?

**B.Tech eKart** is a one-stop shop where engineering students buy **digital study material** for **Dr. A.P.J. Abdul Kalam Technical University (AKTU)**:

- 🏫 **6 branches** — CSE, IT, ECE, ME, CE, EE
- 📅 **Semesters 1–8**, 150+ real AKTU-style subjects (`BCS-301`, `BEC-401`, …)
- 📦 **5 product types** — Notes, PYQs, Quantum, Syllabus, Combo packs
- 🔒 Paid PDFs delivered **securely** with signed URLs, download caps and watermarking

One backend powers **three clients**: a customer storefront, an admin dashboard, and a native mobile app.

```
btech-ekart/
├── backend/   Python · Django + DRF + SimpleJWT  → REST API, payments, secure PDF delivery
├── web/       React + Vite + TypeScript          → storefront + admin dashboard (/admin)
├── mobile/    React Native + Expo + TypeScript   → Android & iOS app
├── docs/      Deployment, testing & Postman docs
└── qa/        QA notes & test artifacts
```

---

## ✨ Feature highlights

| Area                | Highlights                                                                                                                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**            | Custom email-login user · JWT (access/refresh + rotation + blacklist) · Google login · signup · forgot/reset password · email-verification OTP · profile update                                                            |
| **Catalog**         | Products, Category, Branch, Subject, Banner, SiteSetting · filtering, search, ordering, pagination · Swagger/OpenAPI docs                                                                                                  |
| **Per-user data**   | Cart · Wishlist (+ move-to-cart) · Orders · Coupons · **My Library** — every user sees only their own data                                                                                                                 |
| **Payments**        | **Razorpay** (server-created order, signature verification, webhooks for `payment.captured` / `payment.failed` / refunds) **+ Manual UPI/QR** (UTR + screenshot upload, admin approve/reject)                              |
| **Secure PDFs**     | Private storage · short-lived **HMAC signed URLs** · per-item download limit · dynamic **buyer-email watermark**                                                                                                           |
| **Admin dashboard** | Overview + revenue graphs (daily/weekly/monthly) · customers with full purchase/cart/wishlist/spend detail · orders with QR moderation · CSV exports · product/blog/coupon/banner management · review moderation           |
| **Web app**         | Flipkart-style blue/yellow theme · dark mode · skeleton loaders · toasts · SEO meta · live search · fully responsive · floating WhatsApp/Telegram support                                                                  |
| **Mobile app**      | Secure token storage (`expo-secure-store`) · tabs + stack navigation · **Razorpay native SDK** · in-app PDF viewer with **screenshot prevention** · push notifications · guest → account cart merge · EAS builds (APK/AAB) |
| **Quality**         | 56 backend tests · TypeScript strict on web & mobile · OpenAPI schema validated with 0 errors/warnings                                                                                                                     |

---

## 🏗️ Architecture

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Web (React)    │   │  Mobile (Expo)   │   │  Django Admin    │
│  Vite · TS · TW  │   │  RN · TS · Expo  │   │  staff-only UI   │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │ HTTPS / JSON + JWT   │                      │
         └──────────┬───────────┴──────────────────────┘
                    ▼
         ┌────────────────────────────────────┐
         │        Django REST Framework       │
         │  accounts · catalog · cart         │
         │  wishlist · orders · payments      │
         │  dashboard · notifications         │
         │  reviews · blog · core             │
         └───────┬─────────────────┬──────────┘
                 │                 │
        ┌────────▼──────┐  ┌───────▼────────────┐
        │  Database     │  │  Media / Private   │
        │  SQLite (dev) │  │  PDFs (signed URL) │
        │  Postgres     │  │  S3 / Cloudinary   │
        └───────────────┘  └────────────────────┘
                 │
        ┌────────▼────────────┐
        │  Razorpay + UPI QR  │
        └─────────────────────┘
```

**Backend apps:** `accounts` · `catalog` · `cart` · `wishlist` · `orders` · `payments` · `dashboard` · `notifications` · `reviews` · `blog` · `core`

---

## 🚀 Quick start (5 minutes)

### Prerequisites

| Tool                     | Version                         |
| ------------------------ | ------------------------------- |
| Python                   | 3.11+                           |
| Node.js                  | 18+                             |
| npm                      | 9+                              |
| Expo Go / Android Studio | for the mobile app _(optional)_ |

### 1️⃣ Backend (Django)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env          # set DJANGO_SECRET_KEY etc. (dev defaults work out of the box)
python manage.py migrate
python manage.py seed_data --products-per-subject 2
python manage.py runserver
```

| URL                             | What           |
| ------------------------------- | -------------- |
| http://127.0.0.1:8000           | API root       |
| http://127.0.0.1:8000/api/docs/ | **Swagger UI** |
| http://127.0.0.1:8000/admin/    | Django admin   |

### 2️⃣ Web app (React + Vite)

```bash
cd web
npm install
copy .env.example .env          # optional in dev — Vite proxies /api → :8000
npm run dev
```

→ http://localhost:5173 · Admin dashboard at http://localhost:5173/admin

### 3️⃣ Mobile app (Expo)

```bash
cd mobile
npm install
copy .env.example .env          # set EXPO_PUBLIC_API_BASE_URL (10.0.2.2 for Android emulator)
npx expo start                  # Expo Go for browsing
npx expo run:android            # dev build — required for the Razorpay native SDK
```

### ⚡ One-command dev (Windows)

```powershell
.\start-dev.ps1                 # boots Django + Vite together
```

### 🔑 Seeded logins

| Role         | Email                    | Password      |
| ------------ | ------------------------ | ------------- |
| **Admin**    | `admin@btechekart.com`   | `Admin@123`   |
| **Customer** | `student@btechekart.com` | `Student@123` |

---

## 🔐 Security model

- **Passwords** hashed with **Argon2** (first hasher), role-based permissions, admin-only dashboard API
- **Secrets only in env files** — only `VITE_*` / `EXPO_PUBLIC_*` variables ever reach client bundles
- **JWT** rotation + blacklist, short access-token lifetime, refresh-token revocation on logout
- **CORS** whitelist · HTTPS-only + HSTS in production · `X_FRAME_OPTIONS = DENY`
- **Rate limiting** — `django-ratelimit` on sensitive views + DRF throttles
- **Paid PDFs never public** — private storage, short-lived HMAC signed URLs bound to a specific order item, per-item download cap, buyer-email watermark
- **Payment unlock** requires a **verified gateway signature** or an **admin approval** — never the client's word
- Mobile tokens stored in **SecureStore**; PDF viewer blocks screenshots on Android

---

## 🧪 Tests & quality gates

```bash
cd backend && python manage.py test        # 56 tests, all passing
cd web     && npm run typecheck            # 0 errors
cd mobile  && npm run typecheck            # 0 errors
```

OpenAPI schema validation:

```bash
python manage.py spectacular --file schema.yml --validate   # 0 errors, 0 warnings
```

---

## 📚 Documentation

| Doc                                                            | What's inside                                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`backend/README.md`](backend/README.md)                       | Every API endpoint, payment flows, secure PDF delivery, tests           |
| [`web/README.md`](web/README.md)                               | Every page/route, auth + guest-merge, theming, deploy to Vercel         |
| [`mobile/README.md`](mobile/README.md)                         | Every screen, Expo Go vs dev build, **APK/AAB via EAS**, push, security |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)                     | Step-by-step: Django on Render/Railway, React on Vercel, mobile via EAS |
| [`docs/TESTING.md`](docs/TESTING.md)                           | Full manual + automated testing checklist                               |
| [`docs/postman_collection.json`](docs/postman_collection.json) | Ready-to-import Postman collection                                      |

---

## 🗺️ Roadmap

- [x] Auth, catalog, cart, wishlist, orders
- [x] Razorpay + manual UPI/QR payments with webhooks
- [x] Secure PDF library with watermarking
- [x] Admin dashboard with revenue analytics
- [x] Web storefront + mobile app
- [x] Blog, reviews, notifications
- [ ] Instructor / affiliate program
- [ ] Multi-language UI (Hindi)
- [ ] Play Store & App Store production release

---

## 📦 Sample AKTU data (seeded)

- **6 branches** — CSE, IT, ECE, ME, CE, EE
- **158 subjects** across semesters 1–8 with real AKTU-style codes (`BCS-301`, `BEC-401`, …)
- **300+ products** with generated covers, public previews and **private** main PDFs
- Banners, coupons (`WELCOME10`, `AKTU50`, `FLAT30`), 6 blog posts, site settings
- A demo paid order, so **My Library** is populated on first login

---

## 🤝 Contributing

1. Fork the repo and create a branch: `git checkout -b feature/my-feature`
2. Follow the existing structure and run the checks above before committing
3. Commit using clear messages (`feat: …`, `fix: …`, `docs: …`)
4. Open a Pull Request describing **what** changed and **why**

> ⚠️ Never commit `.env` files, keys, `db.sqlite3`, logs or build outputs — `.gitignore` already covers them.

---

## 👨‍💻 Author

**Kesh Kumar** — [@keshkumar-tech](https://github.com/keshkumar-tech)

---

## 📄 Licence & disclaimer

Released under the **MIT License**.
Independent study-material platform — **not affiliated with or endorsed by AKTU**.
See the in-app Disclaimer. Review the [Terms](web/src/pages/StaticPage.tsx), Privacy and Refund pages before going live.
