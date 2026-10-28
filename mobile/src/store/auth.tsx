// Auth context: JWT session in SecureStore, profile in memory.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { http, setMemoryAccess, tokenStore } from "@/lib/api";
import { guestStore } from "@/store/guest";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (p: {
    email: string;
    name: string;
    phone?: string;
    password: string;
    password2: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const refreshProfile = useCallback(async () => {
    const token = await tokenStore.getAccess();
    if (!token) {
      setInitialized(true);
      return;
    }
    setMemoryAccess(token);
    try {
      const me = await http.get<User>("/api/auth/profile/");
      setUser(me);
    } catch {
      await tokenStore.clear();
      setMemoryAccess(null);
      setUser(null);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await http.post<{
        access: string;
        refresh: string;
        user: User;
      }>("/api/auth/login/", {
        email,
        password,
        // Merge any guest cart/wishlist on the device into the account.
        guest_cart: guestStore.getCart(),
        guest_wishlist: guestStore.getWishlist(),
      });
      await tokenStore.set(res.access, res.refresh);
      setMemoryAccess(res.access);
      guestStore.clear();
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      name: string;
      phone?: string;
      password: string;
      password2: string;
    }) => {
      setLoading(true);
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
        await tokenStore.set(res.access, res.refresh);
        setMemoryAccess(res.access);
        guestStore.clear();
        setUser(res.user);
        return res.user;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      const refresh = await tokenStore.getRefresh();
      if (refresh) await http.post("/api/auth/logout/", { refresh });
    } catch {
      // Offline / already blacklisted — clearing local tokens is what matters.
    }
    await tokenStore.clear();
    setMemoryAccess(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      loading,
      initialized,
      login,
      register,
      logout,
      refreshProfile,
      setUser,
    }),
    [user, loading, initialized, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
