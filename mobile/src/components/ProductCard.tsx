import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Price, Stars, Thumb } from "@/components/ui";
import { shareProduct } from "@/lib/share";
import {
  colors,
  font,
  radius,
  shadow,
  spacing,
  TYPE_COLORS,
  TYPE_LABELS,
} from "@/theme";
import type { Product } from "@/types";

interface Props {
  product: Product;
  onPress: () => void;
  onAdd?: () => void;
  onToggleWishlist?: () => void;
  wishlisted?: boolean;
  /** True when the product is already in the cart — shows “Go to cart”. */
  inCart?: boolean;
  /** Opens the cart. When provided, the ADD button becomes “Go to cart”. */
  onGoToCart?: () => void;
  horizontal?: boolean;
  /** Card width. Horizontal rows use a fixed 160; grids derive it from the
   *  available space so two cards + the gutter always line up. */
  width?: number;
}

const ROW_CARD_W = 148;

export default function ProductCard({
  product,
  onPress,
  onAdd,
  onToggleWishlist,
  wishlisted,
  inCart,
  onGoToCart,
  horizontal,
  width,
}: Props) {
  const tc = TYPE_COLORS[product.type] || { bg: "#e5e7eb", fg: "#374151" };

  if (horizontal) {
    return (
      <Pressable onPress={onPress} style={styles.hCard}>
        <Thumb uri={product.cover_image} w={72} />
        <View style={styles.hBody}>
          <Text numberOfLines={2} style={styles.title}>
            {product.title}
          </Text>
          <Text style={styles.subject}>{product.subject_code}</Text>
          <Stars rating={product.rating} count={product.rating_count} />
          <Price
            price={product.price}
            mrp={product.mrp}
            discount={product.discount}
          />
        </View>
        <View style={styles.hActions}>
          <Pressable
            onPress={() => shareProduct(product)}
            hitSlop={10}
            style={styles.heart}
            accessibilityLabel="Share product"
          >
            <Ionicons
              name="share-social-outline"
              size={19}
              color={colors.textLight}
            />
          </Pressable>
          {onToggleWishlist ? (
            <Pressable
              onPress={onToggleWishlist}
              hitSlop={10}
              style={styles.heart}
              accessibilityLabel="Toggle wishlist"
            >
              <Ionicons
                name={wishlisted ? "heart" : "heart-outline"}
                size={22}
                color={wishlisted ? colors.danger : colors.textLight}
              />
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, width ? { width } : null]}
    >
      {/* Artwork. In a grid the card fills its column and the cover keeps the
          3:4 ratio of the source artwork; in a horizontal row the card has a
          fixed width so the row stays tidy. */}
      <View style={styles.coverWrap}>
        <Thumb uri={product.cover_image} />
        <View style={styles.badges}>
          <Badge
            text={TYPE_LABELS[product.type] || product.type}
            bg={tc.bg}
            fg={tc.fg}
          />
        </View>
        {/* Wishlist + share, stacked on the artwork. Every product everywhere
            exposes sharing, so any card can be forwarded from the app. */}
        <View style={styles.fabColumn}>
          {onToggleWishlist ? (
            <Pressable
              onPress={onToggleWishlist}
              hitSlop={8}
              style={styles.heartFab}
              accessibilityLabel="Toggle wishlist"
            >
              <Ionicons
                name={wishlisted ? "heart" : "heart-outline"}
                size={16}
                color={wishlisted ? colors.danger : colors.textMuted}
              />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => shareProduct(product)}
            hitSlop={8}
            style={styles.heartFab}
            accessibilityLabel="Share product"
          >
            <Ionicons
              name="share-social-outline"
              size={16}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {product.title}
        </Text>
        <Text numberOfLines={1} style={styles.subject}>
          {product.subject_code || "\u00A0"}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ₹{Number(product.price).toLocaleString("en-IN")}
          </Text>
          {Number(product.mrp) > Number(product.price) ? (
            <Text style={styles.mrp}>
              ₹{Number(product.mrp).toLocaleString("en-IN")}
            </Text>
          ) : null}
        </View>
        {onAdd ? (
          inCart ? (
            <Pressable
              style={[styles.addBtn, styles.addedBtn]}
              onPress={onGoToCart}
              accessibilityLabel="Go to cart"
            >
              <Ionicons
                name="bag-check-outline"
                size={13}
                color={colors.success}
              />
              <Text style={[styles.addText, styles.addedText]}>GO TO CART</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onAdd}
              style={styles.addBtn}
              accessibilityLabel={`Add ${product.title} to cart`}
            >
              <Text style={styles.addText}>ADD</Text>
            </Pressable>
          )
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: ROW_CARD_W,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    // Content-sized: artwork (1:1) + details. No flexGrow, otherwise the card
    // stretches to the row height and the details get clipped.
    flexGrow: 0,
    flexShrink: 0,
    ...shadow.card,
  },
  coverWrap: {
    width: "100%",
    // A compact 1:1 tile. The generated cover art already carries the title, so
    // a squarer frame keeps the whole card (art + title + price + ADD) inside
    // one screen row while `contain` guarantees the artwork is never cropped.
    aspectRatio: 1,
    backgroundColor: colors.brandLight,
    overflow: "hidden",
  },
  hCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing(3),
    ...shadow.card,
  },
  hBody: { flex: 1, gap: spacing(1) },
  body: {
    padding: spacing(2),
    gap: spacing(0.5),
    // Let the card size itself from its content. A fixed height made the row
    // clip the title/price/button when fonts scaled even slightly.
    flexGrow: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 16,
    // Two lines reserved only when the title actually needs the second line.
    minHeight: 32,
  },
  subject: { fontSize: 9.5, color: colors.textLight },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing(1),
    marginTop: spacing(0.5),
  },
  price: { fontSize: 13, fontWeight: "800", color: colors.text },
  mrp: {
    fontSize: font.tiny,
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  badges: {
    position: "absolute",
    bottom: spacing(2),
    left: spacing(2),
  },
  heart: { padding: spacing(2) },
  hActions: { flexDirection: "row", alignItems: "center" },
  fabColumn: {
    position: "absolute",
    top: spacing(2),
    right: spacing(2),
    gap: spacing(1.5),
  },
  heartFab: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radius.pill,
    padding: spacing(1.5),
    elevation: 1,
  },
  addBtn: {
    marginTop: spacing(1.5),
    backgroundColor: colors.brand,
    borderRadius: radius.sm,
    paddingVertical: spacing(1.5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1),
  },
  addedBtn: { backgroundColor: "#e6f9ee" },
  addText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: font.tiny,
    letterSpacing: 0.4,
  },
  addedText: { color: colors.success },
});
