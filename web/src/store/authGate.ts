// Global "login required" gate.
//
// Any add-to-cart / wishlist action on the storefront calls
// `requireLogin("cart" | "wishlist")`. When the visitor is signed out, the
// dialog opens with a clear "log in first" message instead of a misleading
// "Added to cart" toast; the action never runs until they sign in.
import { create } from "zustand";

export type GateIntent = "cart" | "wishlist" | "buy" | null;

interface GateState {
  intent: GateIntent;
  open: (intent: Exclude<GateIntent, null>) => void;
  close: () => void;
}

export const useAuthGate = create<GateState>((set) => ({
  intent: null,
  open: (intent) => set({ intent }),
  close: () => set({ intent: null }),
}));

export const GATE_COPY = {
  cart: {
    title: "Please log in first",
    body: "Log in to add products to your cart and keep them saved across devices.",
    icon: "cart",
  },
  wishlist: {
    title: "Please log in first",
    body: "Log in to save this product to your wishlist so you can find it later.",
    icon: "heart",
  },
  buy: {
    title: "Please log in first",
    body: "Log in to complete your purchase securely and access your downloads.",
    icon: "buy",
  },
} as const;
