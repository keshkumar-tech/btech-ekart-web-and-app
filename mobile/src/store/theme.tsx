// Theme store for the mobile app (light / dark / system), persisted in
// AsyncStorage so the choice survives app restarts. Mirrors the web app's
// dark-mode toggle. `useThemeColors()` returns the active token palette so a
// screen can opt in to dark surfaces without touching every existing style.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { colors as lightTokens } from "@/theme";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "ekart_theme";

/** Extra tokens used by dark-mode surfaces (original palette untouched). */
export const darkTokens = {
  bg: "#0b1120",
  card: "#131c33",
  border: "#243049",
  text: "#e8eefc",
  textMuted: "#94a3b8",
  textLight: "#64748b",
  white: "#131c33", // "white" surfaces become card surfaces
  brand: lightTokens.brand,
} as const;

export const themePalette = (dark: boolean) =>
  dark ? { ...lightTokens, ...darkTokens } : lightTokens;

interface ThemeCtx {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  colors: typeof lightTokens;
}

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);

  const isDark = mode === "dark" || (mode === "system" && system === "dark");

  const value = useMemo<ThemeCtx>(
    () => ({
      mode,
      isDark,
      setMode,
      toggle: () => setMode(isDark ? "light" : "dark"),
      colors: themePalette(isDark),
    }),
    [mode, isDark, setMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

/** Shorthand: just the active colours. */
export function useThemeColors() {
  return useTheme().colors;
}
