# B.Tech eKart — Mobile App (React Native + Expo + TypeScript)

The Android/iOS app for B.Tech eKart. **Same backend API as the web app**, so the
cart, wishlist, orders and library stay in sync across devices.

## Tech stack

- Expo SDK 51 + React Native 0.74 + TypeScript (strict)
- React Navigation (bottom tabs + native stack)
- TanStack Query (caching, pull-to-refresh, offline-friendly retries)
- Axios with **JWT in `expo-secure-store`** and refresh-on-401
- `react-native-razorpay` (native SDK) + manual UPI QR/UTR flow
- `expo-notifications` for push, `react-native-webview` + `expo-file-system`
  for the in-app PDF viewer with screenshot prevention

## Screens

Splash · Onboarding · Login · Signup · Forgot Password · **Home** (banner slider,
category tiles, trending, new arrivals) · **Shop** (search, filters: type / branch /
year / semester / price / rating, sort, infinite scroll) · **Product Detail**
(gallery, what's included, related, sticky Add-to-Cart / Buy-Now) · **Cart** ·
**Wishlist** (move to cart) · **Checkout** (Razorpay + manual QR with UTR) ·
Order Success · My Orders · Order Detail · **My Library** (download used counter) ·
**PDF Viewer** (in-app, screenshots blocked, watermarked) · Blog list & detail ·
**Profile** · Edit Profile · Notifications

## ⚠️ Expo Go vs a development build

**`react-native-razorpay` is a native module — it does NOT work in Expo Go.**
You need a **development build** (or an EAS build) to test real Razorpay payments.

The app is written defensively: if the Razorpay native module is missing, it falls
back to the **manual UPI QR flow** and tells the user to use a dev build. So you can
still browse, cart and pay-by-QR in Expo Go while developing.

## Quick start

```bash
cd mobile
npm install
copy .env.example .env     # Windows (cp on macOS/Linux) — set EXPO_PUBLIC_API_BASE_URL

# Option A — Expo Go (fast, no Razorpay):
npx expo start

# Option B — development build (REQUIRED for Razorpay):
npx expo run:android       # or:  npx expo run:ios
```

### Pointing the app at your backend

| Where you run the app     | `EXPO_PUBLIC_API_BASE_URL`                                   |
| ------------------------- | ------------------------------------------------------------ |
| Android emulator          | `http://10.0.2.2:8000` (host machine)                        |
| iOS simulator             | `http://localhost:8000`                                      |
| Physical device (Expo Go) | `http://<your-LAN-IP>:8000` (e.g. `http://192.168.1.5:8000`) |
| Production                | `https://api.btechekart.com`                                 |

Also add your LAN IP / domain to the backend's `CORS_ALLOWED_ORIGINS` and
`ALLOWED_HOSTS` when testing on a physical device.

## Building an APK / AAB with EAS

Razorpay requires a native build, so shipping goes through EAS Build.

```bash
npm install -g eas-cli
eas login
eas build:configure          # writes/updates eas.json; paste the projectId into app.json

# Android APK (internal testing / direct install)
eas build -p android --profile preview

# Android AAB (Google Play upload)
eas build -p android --profile production

# iOS (needs an Apple Developer account)
eas build -p ios --profile production
```

Profiles are defined in `eas.json`:

- `development` — dev client, APK, for iterating with native modules
- `preview` — internal distribution APK (share the link with testers)
- `production` — AAB with `autoIncrement`, for the Play Store

Then submit:

```bash
eas submit -p android --latest
eas submit -p ios --latest
```

## Push notifications

`expo-notifications` registers a device token on launch (`src/lib/notifications.ts`).
Physical devices only — simulators/emulators don't receive push tokens. The token is
POSTed to `/api/notifications/register-device/` once the user is signed in (best-effort;
a failure is non-fatal).

## Session & data security

- JWT access/refresh tokens are stored with **`expo-secure-store`** (iOS Keychain /
  Android Keystore) — never plain `AsyncStorage`.
- The Axios interceptor attaches the access token and silently refreshes on a 401
  (single-flight, so concurrent requests don't storm the refresh endpoint).
- PDFs are fetched with the token **and** the backend's short-lived signed URL;
  the app never stores a permanent public link.
- Screenshots/recording of the PDF viewer are blocked via
  `react-native-screenshot-prevent` (no-op if the optional module isn't installed).

## Guest → account sync

Signed-out users can browse and add to cart/wishlist. Those items are cached with
`AsyncStorage` (`src/store/guest.ts`) and **merged into the account server-side** on
login/signup, so a cart started on mobile appears on web and vice-versa.

## Scripts

```bash
npm run typecheck   # tsc --noEmit (strict, zero errors)
npm run start       # expo start --dev-client
npm run android     # expo run:android
npm run ios         # expo run:ios
npm run build:apk   # eas build -p android --profile preview
npm run build:aab   # eas build -p android --profile production
```

## Environment (`.env.example`)

| var                                                                                                            | purpose                                             |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL`                                                                                     | API origin (see table above)                        |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID`                                                                                  | Public Razorpay key id (secret stays on the server) |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID`                                                                                 | Google OAuth client id                              |
| `EXPO_PUBLIC_SITE_NAME`, `EXPO_PUBLIC_SUPPORT_EMAIL`, `EXPO_PUBLIC_WHATSAPP_LINK`, `EXPO_PUBLIC_TELEGRAM_LINK` | Site metadata / support links                       |

Only `EXPO_PUBLIC_*` vars are exposed to the app bundle — never put a secret there.
