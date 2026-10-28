// Orders + payments API calls (mobile). Kept separate from services/index.ts.
import * as FileSystem from "expo-file-system";
import { api, BASE_URL, http, tokenStore } from "@/lib/api";
import type { ManualQRData, Order, RazorpayCheckoutData } from "@/types";

export type CheckoutOrder = {
  id: number;
  order_number: string;
  total_amount: string;
  status: string;
};

export const orderService = {
  // Create a pending order from the current cart. It is unlocked only after payment.
  create: (payload: {
    coupon_code?: string;
    payment_method: "razorpay" | "manual_qr";
    customer_name?: string;
  }) => http.post<CheckoutOrder>("/api/orders/checkout/", payload),

  list: () => http.get<Order[]>("/api/orders/"),

  detail: (orderNumber: string) =>
    http.get<Order>(`/api/orders/${orderNumber}/`),

  // Validate a coupon against the current cart and preview the discount.
  validateCoupon: (code: string, subtotal?: number) =>
    http.post<{
      code: string;
      discount_amount: string;
      subtotal: string;
      payable: string;
    }>("/api/orders/coupon/apply/", { code }),

  // Attach UTR (+ optional screenshot) to a manual-QR order for verification.
  submitManualPayment: (payload: {
    orderNumber: string;
    utr: string;
    screenshotUri?: string;
  }) => {
    const form = new FormData();
    form.append("utr_number", payload.utr);
    if (payload.screenshotUri) {
      const name = payload.screenshotUri.split("/").pop() || "screenshot.jpg";
      const ext = name.split(".").pop() || "jpg";
      // React Native FormData file shape (uri/name/type).
      form.append("payment_screenshot", {
        uri: payload.screenshotUri,
        name,
        type: `image/${ext === "png" ? "png" : "jpeg"}`,
      } as unknown as Blob);
    }
    return api
      .post<Order>(`/api/orders/${payload.orderNumber}/manual-payment/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  // Paid orders only — the backend renders the invoice PDF.
  invoiceUrl: (orderNumber: string) =>
    `${BASE_URL}/api/orders/${orderNumber}/invoice/`,

  // Download the invoice into the app's document directory and return the path.
  downloadInvoice: async (orderNumber: string, invoiceNumber?: string) => {
    const token = await tokenStore.getAccess();
    const name = `${(invoiceNumber || orderNumber).replace(/[^a-z0-9-]+/gi, "_")}.pdf`;
    const target = `${FileSystem.documentDirectory}${name}`;
    const res = await FileSystem.downloadAsync(
      `${BASE_URL}/api/orders/${orderNumber}/invoice/`,
      target,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (res.status !== 200) throw new Error("Invoice unavailable");
    return res.uri;
  },
};

export const paymentService = {
  // Public payment settings (owner QR image + instructions) for the manual flow.
  settings: () =>
    http.get<{
      qr_code_image: string;
      payment_instructions: string;
      manual_qr_enabled: boolean;
    }>("/api/payments/settings/"),

  // ---- Razorpay ----
  createRazorpayOrder: (orderNumber: string) =>
    http.post<RazorpayCheckoutData>("/api/payments/razorpay/create/", {
      order_number: orderNumber,
    }),

  verifyRazorpay: (payload: {
    order_number: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    http.post<{ detail: string }>("/api/payments/razorpay/verify/", payload),

  // Exact amount + QR for a manual-QR order.
  manualDetails: (orderNumber: string) =>
    http.get<ManualQRData>(`/api/payments/manual/${orderNumber}/`),
};
