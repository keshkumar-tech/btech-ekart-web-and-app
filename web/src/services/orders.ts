// Orders, payments and library API calls.
import { api, http } from "@/lib/api";
import type {
  Coupon,
  LibraryItem,
  ManualQRData,
  Order,
  PaymentMethod,
  RazorpayCheckoutData,
} from "@/types";

export const ordersService = {
  checkout: (payload: {
    payment_method: PaymentMethod;
    coupon_code?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  }) => http.post<Order>("/api/orders/checkout/", payload),

  list: () => http.get<Order[]>("/api/orders/"),
  detail: (orderNumber: string) =>
    http.get<Order>(`/api/orders/${orderNumber}/`),
  applyCoupon: (code: string) =>
    http.post<{
      code: string;
      discount_amount: string;
      subtotal: string;
      payable: string;
    }>("/api/orders/coupon/apply/", { code }),
  submitManualPayment: (
    orderNumber: string,
    utr: string,
    screenshot?: File,
  ) => {
    const form = new FormData();
    form.append("utr_number", utr);
    if (screenshot) form.append("payment_screenshot", screenshot);
    return api
      .post<Order>(`/api/orders/${orderNumber}/manual-payment/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  invoiceUrl: (orderNumber: string) => {
    const base = import.meta.env.VITE_API_BASE_URL || "";
    return `${base}/api/orders/${orderNumber}/invoice/`;
  },
  downloadInvoice: async (orderNumber: string) => {
    const res = await api.get(`/api/orders/${orderNumber}/invoice/`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  // ---- Admin coupon CRUD (custom admin panel) ----
  adminCoupons: () => http.get<Coupon[]>("/api/orders/admin/coupons/"),
  adminCreateCoupon: (payload: Partial<Coupon>) =>
    http.post<Coupon>("/api/orders/admin/coupons/", payload),
  adminUpdateCoupon: (id: number, payload: Partial<Coupon>) =>
    http.patch<Coupon>(`/api/orders/admin/coupons/${id}/`, payload),
  adminDeleteCoupon: (id: number) =>
    http.delete(`/api/orders/admin/coupons/${id}/`),
};

export const paymentsService = {
  razorpayCreate: (orderNumber: string) =>
    http.post<RazorpayCheckoutData>("/api/payments/razorpay/create/", {
      order_number: orderNumber,
    }),
  razorpayVerify: (payload: {
    order_number: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    http.post<{ detail: string; order: string }>(
      "/api/payments/razorpay/verify/",
      payload,
    ),
  manualDetails: (orderNumber: string) =>
    http.get<ManualQRData>(`/api/payments/manual/${orderNumber}/`),
};

export const libraryService = {
  list: () =>
    http.get<{ count: number; results: LibraryItem[] }>("/api/library/"),
  // Fetch the PDF bytes with auth + signed token, then trigger a download in-browser.
  download: async (item: LibraryItem) => {
    const res = await api.get(item.download_url, { responseType: "blob" });
    return res.data as Blob;
  },
};
