// Sharing helper used by every product surface (cards, detail, cart).
// Shares a ready-to-paste message + the product's public web link so the
// receiver can open the same material.
import { Share } from "react-native";
import Toast from "react-native-toast-message";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/types";

/** Public storefront origin. Override with EXPO_PUBLIC_WEB_URL in production. */
export const WEB_URL = (
  process.env.EXPO_PUBLIC_WEB_URL || "https://btechekart.com"
).replace(/\/$/, "");

export function productLink(slug: string): string {
  return `${WEB_URL}/product/${slug}`;
}

export async function shareProduct(product: Product): Promise<void> {
  if (!product?.slug) return;
  const price =
    product.price !== undefined && product.price !== null
      ? formatINR(product.price)
      : "";
  const bits = [
    product.subject_code ? `(${product.subject_code})` : null,
    product.branch?.short_name ?? null,
    product.semester ? `Sem ${product.semester}` : null,
  ].filter(Boolean);

  const message =
    `${product.title}` +
    (bits.length ? `\n${bits.join(" · ")}` : "") +
    (price ? `\nPrice: ${price}` : "") +
    `\n\n${productLink(product.slug)}\n\n` +
    "AKTU notes, PYQs, Quantums & Combos — instant download on B.Tech eKart.";

  try {
    await Share.share(
      { message, title: product.title, url: productLink(product.slug) },
      { dialogTitle: "Share product" },
    );
  } catch {
    Toast.show({ type: "error", text1: "Could not open the share sheet" });
  }
}

export async function shareText(message: string, title?: string) {
  try {
    await Share.share({ message, title });
  } catch {
    // user dismissed
  }
}
