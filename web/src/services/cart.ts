// Cart & wishlist API calls (per-user on the server).
import { http } from "@/lib/api";
import type { Cart, Wishlist } from "@/types";

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
