# B.Tech eKart — Web (React + Vite + TypeScript)

The customer storefront **and** the admin dashboard, both in one React app.
Talks to the Django backend in `../backend`.

## Tech stack

- React 18 + Vite 5 + TypeScript (strict)
- Tailwind CSS (Flipkart-like blue/yellow theme, **dark mode**)
- React Router 6 (store + `/admin` routes, protected by role)
- TanStack Query (server state, caching, invalidation)
- Zustand (auth + theme stores)
- Axios (JWT interceptor with **auto-refresh on 401**)
- Recharts (admin revenue graphs), react-helmet-async (SEO), react-hot-toast

## Quick start

```bash
cd web
npm install
copy .env.example .env      # Windows  (cp on macOS/Linux) — optional in dev
npm run dev                 # http://localhost:5173
```

In dev the Vite proxy forwards `/api` and `/media` to `http://127.0.0.1:8000`,
so **no CORS setup is needed** — just make sure the backend is running.

```bash
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build locally
npm run typecheck  # types only
```

## Pages

**Storefront**
`/` Home (banner slider, category tiles, trending, new arrivals, combos, top-rated, testimonials) ·
`/shop` (filters: type/branch/semester/year/category/price/rating, sort, live search, pagination) ·
`/product/:slug` (preview viewer, what's included, reviews, related, Add to Cart / Buy Now / Wishlist) ·
`/cart` · `/wishlist` · `/checkout` (Razorpay + manual QR) · `/order-success/:orderNumber` ·
`/orders` · `/orders/:orderNumber` · `/library` (My Library) · `/profile` ·
`/blog` · `/blog/:slug` · `/about` · `/contact` · `/terms` · `/privacy` · `/refund-policy` · `/disclaimer`

**Auth**
`/login` · `/signup` · `/forgot-password`

**Admin** (admin role only)
`/admin` Overview · `/admin/customers` · `/admin/customers/:id` · `/admin/orders` · `/admin/orders/:orderNumber`
· `/admin/products` · `/admin/taxonomy` · `/admin/coupons` · `/admin/banners` · `/admin/reviews`
· `/admin/blog` · `/admin/settings`

## How user data stays per-user

- JWT access + refresh tokens live in `localStorage`; the Axios interceptor
  attaches the access token and transparently refreshes on a 401 (single-flight,
  so concurrent requests don't stampede the refresh endpoint).
- **Guest cart/wishlist** are kept in `localStorage` and **merged server-side**
  on login/signup (the payload includes `guest_cart` / `guest_wishlist`).
- Navbar cart/wishlist badges show **live counts** from the user's own server cart.
- Protected routes (`RequireAuth`) redirect to `/login` preserving the intended
  path; `RequireAdmin` additionally rejects non-admins with a 403 page.

## Theming & UX

- Dark mode toggle (persisted, respects `prefers-color-scheme` on first visit).
- Skeleton loaders on every data-bound view; toast notifications for all actions.
- Fully responsive; floating WhatsApp/Telegram support button.

## Environment (`.env.example`)

| var                                                                                | purpose                                                                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`                                                                | API origin. **Leave blank in dev** to use the Vite proxy. Set to your deployed API in production. |
| `VITE_RAZORPAY_KEY_ID`                                                             | Public Razorpay key id (the secret stays on the server).                                          |
| `VITE_GOOGLE_CLIENT_ID`                                                            | Google OAuth client id.                                                                           |
| `VITE_SITE_NAME`, `VITE_SUPPORT_EMAIL`, `VITE_WHATSAPP_LINK`, `VITE_TELEGRAM_LINK` | Site metadata / footer / support links.                                                           |

## Deployment (Vercel / Netlify)

1. Build command `npm run build`, output directory `dist`.
2. Set `VITE_API_BASE_URL` to your backend URL (e.g. `https://api.btechekart.com`).
3. Add your web origin to the backend's `CORS_ALLOWED_ORIGINS`.
4. For client-side routing, add a SPA rewrite (`/* → /index.html`).

> Products/Categories/Branches/Subjects/Coupons/Banners/Blog are **read** from the
> storefront API and **managed** through the Django admin (`/admin/` on the backend)
> as a backup; the dashboard surfaces links and live performance next to each section.
