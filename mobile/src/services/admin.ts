// Admin dashboard API — every endpoint the web /admin dashboard uses.
// The backend enforces `IsAdminRole`, so this is safe to ship in the app.
import { api, http } from "@/lib/api";
import type { Paginated } from "@/types";

const clean = (obj: Record<string, unknown>) => {
  const out: Record<string, string> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = String(v);
  });
  return out;
};

const unwrap = <T>(d: Paginated<T> | T[]): T[] =>
  Array.isArray(d) ? d : d.results;

// ------------------------------------------------------------------ analytics

export interface OverviewStats {
  total_revenue: string;
  revenue_today: string;
  revenue_week: string;
  revenue_month: string;
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  pending_verification: number;
  refunded_orders: number;
  total_customers: number;
  total_products: number;
  products_sold: number;
}

export interface RevenueChartData {
  period: string;
  series: { period: string | null; revenue: string; orders: number }[];
  top_products: {
    product_id: number;
    title: string;
    units_sold: number;
    revenue: string;
  }[];
  top_branches: {
    branch_short: string | null;
    units_sold: number;
    revenue: string;
  }[];
  category_breakdown: {
    product_type: string;
    units_sold: number;
    revenue: string;
  }[];
  coupons: {
    code: string;
    discount_type: string;
    value: string;
    used_count: number;
    times_used: number;
  }[];
}

export const dashboardService = {
  overview: () => http.get<OverviewStats>("/api/dashboard/overview/"),
  revenue: (period: "daily" | "weekly" | "monthly" = "daily", days = 30) =>
    http.get<RevenueChartData>("/api/dashboard/revenue/", {
      params: { period, days: String(days) },
    }),
  recentOrders: (limit = 10) =>
    http.get<any[]>("/api/dashboard/recent-orders/", {
      params: { limit: String(limit) },
    }),

  customers: (params: Record<string, unknown> = {}) =>
    http.get<Paginated<any>>("/api/dashboard/customers/", {
      params: clean(params),
    }),
  customer: (userId: number) =>
    http.get<any>(`/api/dashboard/customers/${userId}/`),

  orders: (params: Record<string, unknown> = {}) =>
    http.get<Paginated<any>>("/api/dashboard/orders/", {
      params: clean(params),
    }),
  order: (orderNumber: string) =>
    http.get<any>(`/api/dashboard/orders/${orderNumber}/`),
  approveOrder: (orderNumber: string, note?: string) =>
    http.post(`/api/dashboard/orders/${orderNumber}/approve/`, { note }),
  rejectOrder: (orderNumber: string, reason?: string) =>
    http.post(`/api/dashboard/orders/${orderNumber}/reject/`, { reason }),
  refundOrder: (orderNumber: string, reason?: string) =>
    http.post(`/api/dashboard/orders/${orderNumber}/refund/`, { reason }),

  // CSV exports download the raw text; the caller saves + shares it.
  exportCsv: async (kind: "orders" | "customers" | "sales") => {
    const res = await api.get(`/api/dashboard/export/${kind}/`, {
      responseType: "text",
    });
    return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  },
};

// ------------------------------------------------------------------- catalog

export const adminCatalog = {
  products: (params: Record<string, unknown> = {}) =>
    http.get<Paginated<any>>("/api/catalog/admin/products/", {
      params: clean(params),
    }),
  product: (id: number) => http.get<any>(`/api/catalog/admin/products/${id}/`),
  createProduct: (payload: any) =>
    http.post<any>("/api/catalog/admin/products/", payload),
  updateProduct: (id: number, payload: any) =>
    http.patch<any>(`/api/catalog/admin/products/${id}/`, payload),
  deleteProduct: (id: number) =>
    http.delete(`/api/catalog/admin/products/${id}/`),

  branches: () => http.get<any[]>("/api/catalog/admin/branches/").then(unwrap),
  createBranch: (p: any) => http.post("/api/catalog/admin/branches/", p),
  updateBranch: (id: number, p: any) =>
    http.patch(`/api/catalog/admin/branches/${id}/`, p),
  deleteBranch: (id: number) =>
    http.delete(`/api/catalog/admin/branches/${id}/`),

  categories: () =>
    http.get<any[]>("/api/catalog/admin/categories/").then(unwrap),
  createCategory: (p: any) => http.post("/api/catalog/admin/categories/", p),
  updateCategory: (id: number, p: any) =>
    http.patch(`/api/catalog/admin/categories/${id}/`, p),
  deleteCategory: (id: number) =>
    http.delete(`/api/catalog/admin/categories/${id}/`),

  subjects: () => http.get<any[]>("/api/catalog/admin/subjects/").then(unwrap),
  createSubject: (p: any) => http.post("/api/catalog/admin/subjects/", p),
  updateSubject: (id: number, p: any) =>
    http.patch(`/api/catalog/admin/subjects/${id}/`, p),
  deleteSubject: (id: number) =>
    http.delete(`/api/catalog/admin/subjects/${id}/`),
};

export const adminBanners = {
  list: () => http.get<any[]>("/api/catalog/admin/banners/").then(unwrap),
  create: (p: any) => http.post("/api/catalog/admin/banners/", p),
  update: (id: number, p: any) =>
    http.patch(`/api/catalog/admin/banners/${id}/`, p),
  remove: (id: number) => http.delete(`/api/catalog/admin/banners/${id}/`),
};

export const adminSettings = {
  list: () => http.get<any[]>("/api/catalog/admin/settings/").then(unwrap),
  create: (p: any) => http.post("/api/catalog/admin/settings/", p),
  update: (id: number, p: any) =>
    http.patch(`/api/catalog/admin/settings/${id}/`, p),
  remove: (id: number) => http.delete(`/api/catalog/admin/settings/${id}/`),
};

export const adminCoupons = {
  list: () => http.get<any[]>("/api/orders/admin/coupons/").then(unwrap),
  create: (p: any) => http.post("/api/orders/admin/coupons/", p),
  update: (id: number, p: any) =>
    http.patch(`/api/orders/admin/coupons/${id}/`, p),
  remove: (id: number) => http.delete(`/api/orders/admin/coupons/${id}/`),
};

export const adminReviews = {
  list: (params: Record<string, unknown> = {}) =>
    http.get<Paginated<any>>("/api/reviews/admin/reviews/", {
      params: clean(params),
    }),
  update: (id: number, p: { is_approved: boolean }) =>
    http.patch(`/api/reviews/admin/reviews/${id}/`, p),
  remove: (id: number) => http.delete(`/api/reviews/admin/reviews/${id}/`),
};

export const adminBlog = {
  categories: () => http.get<any[]>("/api/blog/admin/categories/").then(unwrap),
  createCategory: (p: any) => http.post("/api/blog/admin/categories/", p),
  updateCategory: (id: number, p: any) =>
    http.patch(`/api/blog/admin/categories/${id}/`, p),
  deleteCategory: (id: number) =>
    http.delete(`/api/blog/admin/categories/${id}/`),

  posts: (params: Record<string, unknown> = {}) =>
    http.get<Paginated<any>>("/api/blog/admin/posts/", {
      params: clean(params),
    }),
  post: (id: number) => http.get<any>(`/api/blog/admin/posts/${id}/`),
  createPost: (p: any) => http.post("/api/blog/admin/posts/", p),
  updatePost: (id: number, p: any) =>
    http.patch(`/api/blog/admin/posts/${id}/`, p),
  deletePost: (id: number) => http.delete(`/api/blog/admin/posts/${id}/`),
};
