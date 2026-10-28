// Small formatting + helper utilities used across the app.

export function formatINR(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value || "0") : value || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];
  let count = seconds;
  let unit = "second";
  for (const [size, name] of units) {
    if (Math.abs(count) < size) {
      unit = name;
      break;
    }
    count = count / size;
    unit = name;
  }
  const rounded = Math.floor(Math.abs(count));
  return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
}

export function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Absolute media URL (uses the API origin when the API is on another host).
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  const base = import.meta.env.VITE_API_BASE_URL || "";
  // DRF serializes Image/FileFields as absolute URLs built from the request
  // host (e.g. http://127.0.0.1:8000/media/...). In dev the web app runs on
  // :5173 and reaches the API through the Vite proxy, so a cross-origin
  // 127.0.0.1:8000 URL would fail to load. Strip the origin and keep the path
  // whenever no explicit API base is configured.
  if (path.startsWith("http")) {
    if (base) return path;
    try {
      const u = new URL(path);
      return `${u.pathname}${u.search}`;
    } catch {
      return path;
    }
  }
  return `${base}${path}`;
}

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  notes: "Notes",
  pyq: "PYQ",
  quantum: "Quantum",
  syllabus: "Syllabus",
  combo: "Combo",
};

export const PRODUCT_TYPE_COLORS: Record<string, string> = {
  notes: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  pyq: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  quantum:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  syllabus:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  combo: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  pending_verification:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  refunded:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};
