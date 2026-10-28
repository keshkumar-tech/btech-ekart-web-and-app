// Design tokens shared across the app (mirrors the web Flipkart-like theme).
import { Dimensions } from "react-native";

export const colors = {
  brand: "#2874f0",
  brandDark: "#1f5fd0",
  brandLight: "#e8f1ff",
  accent: "#ffb800",
  accentDark: "#e6a200",

  bg: "#f4f6fb",
  card: "#ffffff",
  border: "#e5e7eb",

  text: "#111827",
  textMuted: "#6b7280",
  textLight: "#9ca3af",

  success: "#10893e",
  danger: "#dc3545",
  warning: "#f59e0b",
  purple: "#6f42c1",

  white: "#ffffff",
  black: "#000000",
};

export const spacing = (n: number) => n * 4;
export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 };

export const font = {
  h1: 26,
  h2: 21,
  h3: 17,
  body: 14,
  small: 12,
  tiny: 10.5,
};

export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
};

// Type/status colour helpers (used by badges).
export const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  notes: { bg: "#dbeafe", fg: "#1d4ed8" },
  pyq: { bg: "#ede9fe", fg: "#6d28d9" },
  quantum: { bg: "#fef3c7", fg: "#b45309" },
  syllabus: { bg: "#d1fae5", fg: "#047857" },
  combo: { bg: "#fee2e2", fg: "#b91c1c" },
};

export const TYPE_LABELS: Record<string, string> = {
  notes: "Notes",
  pyq: "PYQ",
  quantum: "Quantum",
  syllabus: "Syllabus",
  combo: "Combo",
};

export const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#e5e7eb", fg: "#374151" },
  pending_verification: { bg: "#fef3c7", fg: "#92400e" },
  paid: { bg: "#d1fae5", fg: "#065f46" },
  failed: { bg: "#fee2e2", fg: "#991b1b" },
  cancelled: { bg: "#e5e7eb", fg: "#4b5563" },
  refunded: { bg: "#e0e7ff", fg: "#3730a3" },
};
