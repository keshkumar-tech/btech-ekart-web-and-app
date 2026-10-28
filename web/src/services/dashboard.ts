// Admin dashboard API calls (admin-only on the server).
import { api, http } from "@/lib/api";
import type {
  AdminCustomer,
  AdminCustomerDetail,
  Order,
  OverviewStats,
  Paginated,
  RevenueChartData,
} from "@/types";

export interface AdminOrderQuery {
  page?: number;
  status?: string;
  payment_method?: string;
  needs_review?: boolean | string;
  date_from?: string;
  date_to?: string;
  q?: string;
  [key: string]: unknown;
}

export const dashboardService = {
  overview: () => http.get<OverviewStats>("/api/dashboard/overview/"),
  revenue: (period: "daily" | "weekly" | "monthly" = "daily", days = 30) =>
    http.get<RevenueChartData>("/api/dashboard/revenue/", {
      params: { period, days },
    }),
  recentOrders: (limit = 10) =>
    http.get<Order[]>("/api/dashboard/recent-orders/", { params: { limit } }),

  customers: (
    params: {
      page?: number;
      q?: string;
      verified?: string;
      active?: string;
    } = {},
  ) =>
    http.get<Paginated<AdminCustomer>>("/api/dashboard/customers/", { params }),
  customer: (userId: number) =>
    http.get<AdminCustomerDetail>(`/api/dashboard/customers/${userId}/`),

  orders: (params: AdminOrderQuery = {}) =>
    http.get<Paginated<Order>>("/api/dashboard/orders/", {
      params: clean(params),
    }),
  order: (orderNumber: string) =>
    http.get<Order & { payments: unknown[]; user: AdminCustomer }>(
      `/api/dashboard/orders/${orderNumber}/`,
    ),

  approveOrder: (orderNumber: string, note?: string) =>
    http.post<Order>(`/api/dashboard/orders/${orderNumber}/approve/`, { note }),
  rejectOrder: (orderNumber: string, reason?: string) =>
    http.post<Order>(`/api/dashboard/orders/${orderNumber}/reject/`, {
      reason,
    }),
  refundOrder: (orderNumber: string, reason?: string) =>
    http.post<Order>(`/api/dashboard/orders/${orderNumber}/refund/`, {
      reason,
    }),

  // Trigger a CSV file download in the browser.
  exportOrders: () =>
    downloadCSV("/api/dashboard/export/orders/", "orders.csv"),
  exportCustomers: () =>
    downloadCSV("/api/dashboard/export/customers/", "customers.csv"),
  exportSales: () => downloadCSV("/api/dashboard/export/sales/", "sales.csv"),
};

function clean(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = String(v);
  });
  return out;
}

async function downloadCSV(url: string, filename: string) {
  const res = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
