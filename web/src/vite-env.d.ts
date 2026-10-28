/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_SITE_NAME: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_WHATSAPP_LINK: string;
  readonly VITE_TELEGRAM_LINK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
