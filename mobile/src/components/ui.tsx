// Reusable mobile UI primitives.
import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, font, radius, shadow, spacing } from "@/theme";
import { mediaUrl } from "@/lib/api";
import { formatINR } from "@/lib/utils";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}) {
  const bg = {
    primary: colors.brand,
    accent: colors.accent,
    outline: "transparent",
    ghost: "transparent",
    danger: colors.danger,
  }[variant];
  const fg =
    variant === "accent"
      ? colors.text
      : variant === "outline" || variant === "ghost"
        ? colors.brand
        : colors.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled || loading ? 0.55 : pressed ? 0.85 : 1,
        },
        variant === "outline" && {
          borderWidth: 1.5,
          borderColor: colors.brand,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.btnText,
              { color: fg },
              icon ? { marginLeft: 8 } : null,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Input({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={{ marginBottom: spacing(3) }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textLight}
        style={[styles.input, error ? { borderColor: colors.danger } : null]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Badge({
  text,
  bg,
  fg,
}: {
  text: string;
  bg: string;
  fg: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function Price({
  price,
  mrp,
  discount,
  big,
  size,
}: {
  price: string | number;
  mrp: string | number;
  discount?: number;
  big?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const p = typeof price === "number" ? price : parseFloat(price || "0");
  const m = typeof mrp === "number" ? mrp : parseFloat(mrp || "0");
  const priceStyle =
    size === "lg"
      ? { fontSize: font.h1 }
      : size === "sm"
        ? { fontSize: font.body }
        : null;
  return (
    <View style={styles.row}>
      <Text style={[styles.price, priceStyle, big && { fontSize: font.h2 }]}>
        {formatINR(p)}
      </Text>
      {m > p ? <Text style={styles.mrp}>{formatINR(m)}</Text> : null}
      {m > p && discount ? (
        <Text style={styles.discount}>{discount}% off</Text>
      ) : null}
    </View>
  );
}

export function Stars({
  rating,
  count,
}: {
  rating: number | string;
  count?: number;
}) {
  const r = typeof rating === "string" ? parseFloat(rating) : rating || 0;
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.accent, fontSize: font.small }}>
        {"★".repeat(Math.round(r))}
      </Text>
      <Text style={styles.ratingText}>
        {r.toFixed(1)}
        {count !== undefined ? ` (${count})` : ""}
      </Text>
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Loading({ text }: { text?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand} />
      {text ? <Text style={styles.muted}>{text}</Text> : null}
    </View>
  );
}

export function Empty({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.muted}>{message}</Text> : null}
      {action ? <View style={{ marginTop: spacing(4) }}>{action}</View> : null}
    </View>
  );
}

export function Thumb({
  uri,
  w,
  aspect = 3 / 4,
  style,
}: {
  uri?: string | null;
  /** Optional fixed width; height is derived from `aspect` (default 3:4). */
  w?: number;
  aspect?: number;
  style?: any;
}) {
  // Covers are portrait 3:4. Using the same aspect ratio as the artwork means
  // nothing is cropped off-centre (which is what made cart thumbs look
  // "shifted left") and grid cards line up pixel-perfect.
  return (
    <View
      style={[
        styles.thumb,
        {
          width: w ?? "100%",
          // An explicit `aspectRatio` alone can compute to 0 height inside a
          // stretched flex parent — always derive the height from the width.
          aspectRatio: aspect,
          alignSelf: "center",
          flexGrow: 0,
          flexShrink: 0,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri: mediaUrl(uri) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
  },
  btnText: { fontSize: font.body, fontWeight: "700" },
  label: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing(1.5),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    fontSize: font.body,
    backgroundColor: colors.white,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: font.small, marginTop: spacing(1) },
  badge: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: font.tiny, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  price: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  mrp: {
    fontSize: font.small,
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  discount: { fontSize: font.small, fontWeight: "700", color: colors.success },
  ratingText: { fontSize: font.small, color: colors.textMuted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing(16),
  },
  muted: {
    color: colors.textMuted,
    fontSize: font.body,
    marginTop: spacing(2),
    textAlign: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing(20),
    paddingHorizontal: spacing(8),
  },
  emptyTitle: {
    fontSize: font.h3,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing(3),
    textAlign: "center",
  },
  thumb: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.brandLight,
  },
});

/** Selectable pill used for filters (type / branch / semester / rating). */
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[chipStyles.chip, active ? chipStyles.chipActive : null]}
    >
      <Text
        style={[chipStyles.chipText, active ? chipStyles.chipTextActive : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipTextActive: { color: colors.white },
});
