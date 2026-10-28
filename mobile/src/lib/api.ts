// Axios client with JWT tokens stored in expo-secure-store and refresh-on-401.
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// API origin resolution
// ---------------------
// 1. EXPO_PUBLIC_API_BASE_URL wins (production / a specific LAN IP).
// 2. On a physical device we probe a few candidate hosts once and keep the
//    first that answers /api/health/: the Metro host, the USB `adb reverse`
//    loopback and the emulator alias. This means a release APK works on a real
//    phone over USB (`adb reverse tcp:8000 tcp:8000`) with no rebuild, and over
//    Wi-Fi when Metro/LAN is reachable.
const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
const CONFIGURED_URL = configured ? configured.replace(/\/$/, "") : null;

function metroHost(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules } = require("react-native");
    const scriptURL: string | undefined =
      NativeModules?.SourceCode?.scriptURL ??
      NativeModules?.SourceCode?.getConstants?.()?.scriptURL;
    if (!scriptURL) return null;
    const host = new URL(scriptURL).hostname;
    return host && host !== "localhost" && host !== "127.0.0.1" ? host : null;
  } catch {
    return null;
  }
}

function candidates(): string[] {
  const list: string[] = [];
  if (CONFIGURED_URL) list.push(CONFIGURED_URL);
  const host = metroHost();
  if (host) list.push(`http://${host}:8000`);
  // A release build has no Metro URL, so the USB reverse loopback is the most
  // reliable default; localhost also covers `adb reverse`.
  list.push("http://localhost:8000");
  if (Platform.OS === "android") list.push("http://10.0.2.2:8000");
  return Array.from(new Set(list));
}

export const BASE_URL = candidates()[0];

let activeBaseUrl: string | null = CONFIGURED_URL ?? null;
let resolved: Promise<string> | null = null;

// Resolution is cached. `null` means "not attempted yet".
const cachedBase: string | null = null;

async function probe(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    // Short timeout: several candidates are tried in series.
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${url}/api/health/`, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/** First reachable backend origin (cached for the app's lifetime). */
export function resolveApiBase(): Promise<string> {
  if (CONFIGURED_URL) return Promise.resolve(CONFIGURED_URL);
  if (activeBaseUrl) return Promise.resolve(activeBaseUrl);
  if (!resolved) {
    resolved = (async () => {
      for (const url of candidates()) {
        if (await probe(url)) {
          activeBaseUrl = url;
          api.defaults.baseURL = url;
          return url;
        }
      }
      // Nothing answered — keep the first candidate so the error is explicit.
      return candidates()[0];
    })();
  }
  return resolved;
}

const ACCESS_KEY = "ekart_access";
const REFRESH_KEY = "ekart_refresh";

// Tokens live in the device secure enclave/keystore, never in plain AsyncStorage.
export const tokenStore = {
  async getAccess() {
    return (await SecureStore.getItemAsync(ACCESS_KEY)) || null;
  },
  async getRefresh() {
    return (await SecureStore.getItemAsync(REFRESH_KEY)) || null;
  },
  async set(access: string, refresh?: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

// Kept in memory too, so request interceptors don't hit the keystore on every call.
let memoryAccess: string | null = null;
export const setMemoryAccess = (t: string | null) => {
  memoryAccess = t;
};

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Wait for the one-time host probe before the very first request goes out.
  const base = await resolveApiBase();
  config.baseURL = base;
  const token = memoryAccess || (await tokenStore.getAccess());
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  // Let the runtime set the multipart boundary for FormData (file uploads).
  // Leaving the default "application/json" header breaks DRF file fields.
  if (
    typeof FormData !== "undefined" &&
    config.data instanceof FormData &&
    config.headers
  ) {
    delete (config.headers as Record<string, unknown>)["Content-Type"];
    delete (config.headers as Record<string, unknown>)["content-type"];
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

// Endpoints where a 401 means "bad credentials / not allowed", NOT "expired token".
// Refreshing makes no sense here and would mask the real error with "No refresh token".
const AUTH_NO_REFRESH = [
  "/api/auth/login/",
  "/api/auth/register/",
  "/api/auth/token/refresh/",
  "/api/auth/logout/",
  "/api/auth/google/",
];

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_NO_REFRESH.some((path) => url.includes(path));
}

async function refreshAccessToken(): Promise<string> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) throw new Error("Session expired. Please log in again.");
  const base = await resolveApiBase();
  const res = await axios.post(`${base}/api/auth/token/refresh/`, {
    refresh,
  });
  const access = res.data.access as string;
  await tokenStore.set(access, res.data.refresh as string | undefined);
  setMemoryAccess(access);
  return access;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !shouldSkipRefresh(original.url)
    ) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const access = await refreshPromise;
        refreshPromise = null;
        if (original.headers)
          original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (e) {
        refreshPromise = null;
        setMemoryAccess(null);
        await tokenStore.clear();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);

// Human-readable message from a DRF error payload.
export function apiError(err: unknown): string {
  const e = err as AxiosError<Record<string, unknown>>;
  const data = e.response?.data;
  if (!data) {
    // Surface the exact origin attempted — makes connection problems obvious.
    if (e.code === "ECONNABORTED") {
      return `Server did not respond at ${activeBaseUrl ?? BASE_URL}.`;
    }
    return `Cannot reach the server at ${activeBaseUrl ?? BASE_URL}. Check that the backend is running and the phone is on the same network.`;
  }
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(" ");
  if (typeof data.detail === "string") return data.detail;
  const key = Object.keys(data)[0];
  if (key) {
    const val = data[key];
    return `${key}: ${Array.isArray(val) ? val[0] : String(val)}`;
  }
  return "Something went wrong. Please try again.";
}

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((r) => r.data),
};

export { api as axiosClient };

// Absolute media URL for images coming back as relative paths.
// Issued images use the resolved origin (images are fetched by the native
// Image component, which bypasses the axios interceptor).
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return baseForMedia() + path;
}

let mediaBase: string | null = null;
function baseForMedia(): string {
  if (mediaBase) return mediaBase;
  const candidate = activeBaseUrl ?? BASE_URL;
  // Kick off resolution; the next render (after data loads) picks it up.
  resolveApiBase()
    .then((u) => {
      mediaBase = u;
    })
    .catch(() => {});
  return candidate;
}
