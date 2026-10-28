// All API calls, grouped by domain. Same backend as the web app.
import { api, http } from "@/lib/api";
import type {
  Banner,
  BlogPost,
  Branch,
  Cart,
  Category,
  LibraryItem,
  Paginated,
  Product,
  Review,
  Wishlist,
} from "@/types";

const clean = (obj: Record<string, unknown>) => {
  const out: Record<string, string> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = String(v);
  });
  return out;
};

export const catalogService = {
  branches: () =>
    http
      .get<Paginated<Branch> | Branch[]>("/api/catalog/branches/")
      .then(unwrap)
      // The API returns `short_name`; expose it as `code` for the filter chips.
      .then((rows) => rows.map((b) => ({ ...b, code: b.short_name }))),
  categories: () =>
    http
      .get<Paginated<Category> | Category[]>("/api/catalog/categories/")
      .then(unwrap),
  banners: () =>
    http
      .get<Paginated<Banner> | Banner[]>("/api/catalog/banners/")
      .then(unwrap),
  products: (query: Record<string, unknown> = {}) =>
    http.get<Paginated<Product>>("/api/catalog/products/", {
      params: clean(query),
    }),
  product: (slug: string) =>
    http.get<Product>(`/api/catalog/products/${slug}/`),
  previewUrl: (slug: string) =>
    `${api.defaults.baseURL}/api/catalog/products/${slug}/preview/`,
};

export const cartService = {
  get: () => http.get<Cart>("/api/cart/"),
  add: (productId: number, quantity = 1) =>
    http.post<Cart>("/api/cart/add/", { product_id: productId, quantity }),
  updateQty: (itemId: number, quantity: number) =>
    http.patch<Cart>(`/api/cart/items/${itemId}/`, { quantity }),
  remove: (itemId: number) => http.delete<Cart>(`/api/cart/items/${itemId}/`),
  clear: () => http.delete<Cart>("/api/cart/clear/"),
};

export const wishlistService = {
  get: () => http.get<Wishlist>("/api/wishlist/"),
  add: (productId: number) =>
    http.post<Wishlist>("/api/wishlist/add/", { product_id: productId }),
  remove: (productId: number) =>
    http.delete<Wishlist>(`/api/wishlist/remove/${productId}/`),
  moveToCart: (productId: number) =>
    http.post<Wishlist>("/api/wishlist/move-to-cart/", {
      product_id: productId,
    }),
};

// Orders + payments are defined in ./orders and re-exported at the bottom.

export const libraryService = {
  list: () =>
    http.get<{ count: number; results: LibraryItem[] }>("/api/library/"),
};

export const reviewsService = {
  forProduct: (slug: string) =>
    http
      .get<Review[] | Paginated<Review>>(`/api/reviews/product/${slug}/`)
      .then((d) => (Array.isArray(d) ? d : d.results)),
  create: (
    slug: string,
    payload: {
      product: number;
      rating: number;
      title?: string;
      comment: string;
    },
  ) => http.post<Review>(`/api/reviews/product/${slug}/`, payload),
  // Approved reviews across every product — powers the home testimonial row.
  publicList: (limit = 20) =>
    http.get<Review[] | Paginated<Review>>("/api/reviews/public/", {
      params: { limit: String(limit) },
    }).then((d) => (Array.isArray(d) ? d : d.results)),
};

export const settingsService = {
  // There is no public settings endpoint; the manual-QR details endpoint returns
  // the support values we need (email, phone, WhatsApp). We read those off the
  // signed-in user's most recent order, and fall back to sane defaults.
  support: async (orderNumber?: string) => {
    const defaults = {
      support_email: "support@btechekart.com",
      support_phone: "+91 99999 99999",
      whatsapp_link: "https://wa.me/919999999999",
      telegram_link: "https://t.me/btechekart",
    };
    if (!orderNumber) return defaults;
    try {
      const d = await http.get<{
        support_email?: string;
        support_phone?: string;
        whatsapp_link?: string;
      }>(`/api/payments/manual/${orderNumber}/`);
      return {
        support_email: d.support_email || defaults.support_email,
        support_phone: d.support_phone || defaults.support_phone,
        whatsapp_link: d.whatsapp_link || defaults.whatsapp_link,
        telegram_link: defaults.telegram_link,
      };
    } catch {
      return defaults;
    }
  },
};

export const blogService = {
  categories: () =>
    http
      .get<Paginated<Category> | Category[]>("/api/blog/categories/")
      .then(unwrap),
  posts: (params: Record<string, unknown> = {}) =>
    http.get<Paginated<BlogPost>>("/api/blog/posts/", {
      params: clean(params),
    }),
  post: (slug: string) => http.get<BlogPost>(`/api/blog/posts/${slug}/`),
};

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export const authService = {
  forgotPassword: (email: string) =>
    http.post<{ detail: string }>("/api/auth/password/forgot/", { email }),
  resetPassword: (payload: {
    email: string;
    otp: string;
    password: string;
    password2: string;
  }) => http.post<{ detail: string }>("/api/auth/password/reset/", payload),
  changePassword: (payload: {
    current_password: string;
    new_password: string;
  }) => http.post<{ detail: string }>("/api/auth/password/change/", payload),
  updateProfile: (payload: Record<string, unknown>) =>
    http.patch<import("@/types").User>("/api/auth/profile/", payload),
};

// Orders + payments live in ./orders (kept separate to keep this file stable).
export { orderService, paymentService } from "./orders";
