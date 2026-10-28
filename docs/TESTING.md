# ✅ Testing Checklist

Two layers: **automated tests** (run these first — they're fast and already green)
and a **manual QA checklist** covering the flows a test can't fully judge.

---

## 1. Automated tests

### Backend — 56 tests

```bash
cd backend
python manage.py test              # all apps
python manage.py test apps.orders apps.payments   # focus on payments
```

Covered:

| Suite            | What it proves                                                                                                                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`       | register, login, profile, duplicate email rejected, password mismatch rejected, OTP verify, forgot/reset password                                                                                                                                              |
| `catalog`        | auto-discount calculation, slug generation + de-duplication                                                                                                                                                                                                    |
| `cart`           | add, quantity bump, per-user isolation, update/delete, **can't touch another user's item**                                                                                                                                                                     |
| `wishlist`       | add/list/remove, move-to-cart                                                                                                                                                                                                                                  |
| `orders`         | checkout creates a pending order + clears cart, empty-cart rejected, coupon apply + checkout, per-user order list, **detail scoped to owner**, manual-payment submission, `mark_paid` unlock + sold-count, no double unlock                                    |
| `payments`       | signature helpers, verify endpoint unlocks on a valid signature, **rejects a bad signature**, webhook signature, **webhook captured unlocks + is idempotent on replay**, bad webhook signature rejected                                                        |
| `core` (library) | signed-token roundtrip, **wrong-resource token rejected**, library lists only paid items, per-user isolation, unpaid orders excluded, download with a valid token, **no token → 403**, bad token → 403, **non-buyer → 403**, **download limit enforced (429)** |
| `reviews`        | non-buyer blocked, buyer review updates the product rating, one review per user, unapproved hidden from public                                                                                                                                                 |
| `blog`           | list/detail, view counter, unpublished hidden, search + category filter, slug generation                                                                                                                                                                       |
| `dashboard`      | **non-admin → 403, anonymous → 401**, overview stats, revenue chart + top products, customer list/detail totals, order filters, **approve unlocks**, reject, refund, all 3 CSV exports                                                                         |

### OpenAPI schema

```bash
python manage.py spectacular --file schema.yml --validate
```

→ expect **0 errors, 0 warnings**.

### Frontend type-checking

```bash
cd web    && npm run typecheck     # 0 errors
cd mobile && npm run typecheck     # 0 errors
```

### Production builds

```bash
cd web    && npm run build         # tsc + vite build → dist/
cd mobile && npx expo export -p android --output-dir /tmp/out   # Metro bundles cleanly
```

---

## 2. Manual QA checklist

Log in as **`student@btechekart.com` / `Student@123`** (customer) and
**`admin@btechekart.com` / `Admin@123`** (admin).

### 🔐 Auth

- [ ] Sign up with a new email → lands logged in; OTP email appears in the console (dev)
- [ ] Log in / log out (logout blacklists the refresh token)
- [ ] Forgot password → OTP → reset → log in with the new password
- [ ] Wrong password shows a friendly error (no crash)
- [ ] Session survives a page reload; an expired access token silently refreshes

### 🛍️ Storefront

- [ ] Home: banner slider rotates; category tiles, trending, new arrivals, combos, top-rated all load
- [ ] Shop: filters (type / branch / semester / year / price / rating) narrow the list; sort works; pagination works
- [ ] Live search suggestions appear while typing in the navbar and navigate to the product
- [ ] Product detail: preview opens, reviews render, related products show, rating is correct
- [ ] Add to Cart updates the navbar badge **immediately**
- [ ] Wishlist heart toggles and the badge updates; "Move to Cart" works from the wishlist page
- [ ] Dark-mode toggle persists across reload

### 🧺 Guest → account merge (important)

- [ ] **Signed out**, add 2 items to the cart and 1 to the wishlist
- [ ] Sign in → those items now appear in the **account** cart/wishlist
- [ ] Same test in the mobile app (guest cart merges on login)

### 💳 Payments — Razorpay

- [ ] Checkout with Razorpay → the Checkout modal opens with the right amount
- [ ] Pay with test card `4111 1111 1111 1111`, any future expiry, any CVV
- [ ] Order flips to **Paid**, the invoice email arrives, **My Library** shows the items
- [ ] Dismiss the modal → order stays **pending**, no unlock
- [ ] Replaying the webhook payload does **not** create a duplicate unlock (check admin → Payments)

### 📱 Payments — Manual UPI / QR

- [ ] Checkout with "Pay via UPI/QR" → the owner's QR + exact amount + order id show
- [ ] Submit a UTR (with and without a screenshot) → order becomes **Pending verification**
- [ ] As **admin**, `/admin/orders` shows a "needs review" banner → **Approve** → order becomes Paid and the buyer is emailed
- [ ] Repeat and **Reject** → order becomes Failed with a note
- [ ] Try an empty UTR → blocked client-side

### 📚 Secure PDF delivery (the core promise)

- [ ] A **paid** item downloads from **My Library** (watermarked with the buyer email)
- [ ] The **download counter** increases; after the cap it's blocked (429) with a clear message
- [ ] Open the **private** file URL directly in a browser **without** a token → **403**
- [ ] Use another user's signed URL → **403**
- [ ] **Unpaid** orders do not appear in My Library

### 🧾 Orders & invoices

- [ ] My Orders lists only **my** orders with correct statuses
- [ ] Order detail shows items, payment info, and the UTR for manual payments
- [ ] A paid order's **invoice PDF** downloads and shows the correct totals

### ⭐ Reviews

- [ ] A non-buyer cannot submit a review (UI blocks / API 403)
- [ ] A buyer submits a review → the product's average rating updates
- [ ] Un-approving the review in the Django admin hides it from the storefront

### 🛡️ Admin dashboard (`/admin`)

- [ ] A **customer** hitting `/admin` sees a 403 page; the API returns 403 too
- [ ] Overview: revenue cards, revenue graph (daily/weekly/monthly toggle), top products, recent orders, low-stock-style alerts
- [ ] Customers: search/filter; click one → full profile, purchases, cart, wishlist, total spent, payments
- [ ] Orders: filter by status / method / date / needs-review; approve, reject, refund
- [ ] CSV exports (orders / customers / sales) download and open in Excel
- [ ] Products / taxonomy / coupons / banners screens render the live data

### 📰 Blog

- [ ] Blog list renders with categories and covers; category filter and search work
- [ ] Post detail renders rich content and increments the view count

### 📱 Mobile app

- [ ] Splash → onboarding → home renders with banners and product rails
- [ ] Shop filters (bottom-sheet) work; infinite scroll loads more
- [ ] Product detail → Add to Cart / Buy Now; sticky footer respects "already owned"
- [ ] Cart quantity +/-, remove, totals correct
- [ ] Checkout: Razorpay **native SDK** (dev build only) and the QR + UTR flow
- [ ] My Library → PDF opens **in-app**; screenshots are blocked where supported
- [ ] Pull-to-refresh on every list; toasts for success/failure
- [ ] **Offline**: open the app with the API down → friendly error, no crash; retry works
- [ ] Kill and reopen the app → still logged in (SecureStore), cart/wishlist intact
- [ ] Guest cart merges into the account on login

### 🌍 Cross-platform sync (the whole point)

- [ ] Add to cart on **web** → appears in the **mobile** cart after refresh (and vice-versa)
- [ ] Buy on mobile → the item appears in **My Library** on web
- [ ] Wishlist changes sync both ways

### 📐 Responsive & a11y

- [ ] Web at 360px, 768px, 1440px — no horizontal overflow, filters usable
- [ ] Keyboard navigation reaches the main controls; focus rings are visible
- [ ] Images have alt text; colour contrast is readable in both themes

---

## 3. Load / edge cases worth trying

- [ ] Two rapid Add-to-Cart clicks don't double-add beyond the quantity cap
- [ ] Checkout with an **empty cart** → clear error, no orphan order
- [ ] Coupon: below the minimum spend, expired, and over the per-user limit → all rejected with clear messages
- [ ] An invalid/expired JWT → a single redirect to login (no refresh loop)
- [ ] Very long product titles wrap without breaking the layout

---

## 4. Known, intentional behaviour

| Behaviour                                                           | Why                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Razorpay falls back to the QR flow in Expo Go                       | `react-native-razorpay` is a native module and can't run in Expo Go — use a dev/EAS build   |
| The shop filter sidebar is hidden below `lg` on web                 | It opens as a full-screen panel on mobile widths (the "Filters" button)                     |
| Product/Category/Coupon/Banner **writes** point at the Django admin | The storefront catalog API is read-only; full CRUD is in `/admin/` as the documented backup |
| Blog bodies render as plain text on mobile                          | Renders the rich text safely without an HTML engine                                         |
| Notification list is local sample data                              | Push delivery is wired via `expo-notifications`; the in-app feed is illustrative            |
