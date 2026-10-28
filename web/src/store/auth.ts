// Auth store: JWT session + guest-data merge on login.
import { create } from "zustand";
import { http, tokenStore } from "@/lib/api";
import type { User } from "@/types";

const GUEST_CART_KEY = "ekart_guest_cart";
const GUEST_WISHLIST_KEY = "ekart_guest_wishlist";

// Guest cart/wishlist live in localStorage so visitors can shop before signing up.
export const guestStore = {
  getCart(): { product_id: number }[] {
    try {
      return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    } catch {
      return [];
    }
  },
  setCart(items: { product_id: number }[]) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  },
  addToCart(productId: number) {
    const items = guestStore.getCart();
    if (!items.some((i) => i.product_id === productId)) {
      items.push({ product_id: productId });
      guestStore.setCart(items);
    }
  },
  getWishlist(): { product_id: number }[] {
    try {
      return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
    } catch {
      return [];
    }
  },
  setWishlist(items: { product_id: number }[]) {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  },
  addToWishlist(productId: number) {
    const items = guestStore.getWishlist();
    if (!items.some((i) => i.product_id === productId)) {
      items.push({ product_id: productId });
      guestStore.setWishlist(items);
    }
  },
  clear() {
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  googleLogin: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export interface RegisterPayload {
  email: string;
  name: string;
  phone?: string;
  password: string;
  password2: string;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  initialized: false,

  async login(email, password) {
    set({ loading: true });
    try {
      // Send any guest cart/wishlist so the backend merges it into the account.
      const res = await http.post<{
        access: string;
        refresh: string;
        user: User;
      }>("/api/auth/login/", {
        email,
        password,
        guest_cart: guestStore.getCart(),
        guest_wishlist: guestStore.getWishlist(),
      });
      tokenStore.set(res.access, res.refresh);
      guestStore.clear();
      set({
        user: res.user,
        isAuthenticated: true,
        isAdmin: res.user.role === "admin",
      });
      return res.user;
    } finally {
      set({ loading: false });
    }
  },

  async register(payload) {
    set({ loading: true });
    try {
      const res = await http.post<{
        access: string;
        refresh: string;
        user: User;
      }>("/api/auth/register/", {
        ...payload,
        guest_cart: guestStore.getCart(),
        guest_wishlist: guestStore.getWishlist(),
      });
      tokenStore.set(res.access, res.refresh);
      guestStore.clear();
      set({
        user: res.user,
        isAuthenticated: true,
        isAdmin: res.user.role === "admin",
      });
      return res.user;
    } finally {
      set({ loading: false });
    }
  },

  async googleLogin(idToken) {
    set({ loading: true });
    try {
      const res = await http.post<{
        access: string;
        refresh: string;
        user: User;
      }>("/api/auth/google/", {
        id_token: idToken,
        guest_cart: guestStore.getCart(),
        guest_wishlist: guestStore.getWishlist(),
      });
      tokenStore.set(res.access, res.refresh);
      guestStore.clear();
      set({
        user: res.user,
        isAuthenticated: true,
        isAdmin: res.user.role === "admin",
      });
      return res.user;
    } finally {
      set({ loading: false });
    }
  },

  async logout() {
    const refresh = tokenStore.refresh;
    try {
      if (refresh) await http.post("/api/auth/logout/", { refresh });
    } catch {
      // Ignore network/blacklist errors — clearing local tokens is what matters.
    }
    tokenStore.clear();
    set({ user: null, isAuthenticated: false, isAdmin: false });
  },

  async fetchMe() {
    if (!tokenStore.access) {
      set({ initialized: true });
      return;
    }
    try {
      const user = await http.get<User>("/api/auth/profile/");
      set({
        user,
        isAuthenticated: true,
        isAdmin: user.role === "admin",
        initialized: true,
      });
    } catch {
      tokenStore.clear();
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        initialized: true,
      });
    }
  },

  setUser(user) {
    set({ user, isAuthenticated: true, isAdmin: user.role === "admin" });
  },
}));
