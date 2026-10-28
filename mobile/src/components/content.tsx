// Shared building blocks for the content screens (About / Contact / policies)
// and for the collapsible FAQ sections used on Home and About.
import React, { useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, spacing } from "@/theme";

/** Standard back-arrow bar used by every stacked screen. */
export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ) : (
        <View style={{ width: 34 }} />
      )}
      <Text numberOfLines={1} style={styles.headerTitle}>
        {title}
      </Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/** Section heading with optional "see all" action. */
export function SectionTitle({
  title,
  subtitle,
  onAction,
  actionLabel = "See all",
}: {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Accessible accordion item — used for the home FAQ and About FAQs. */
export function FaqRow({
  q,
  a,
  defaultOpen,
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <View style={[styles.faq, open && styles.faqOpen]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.faqHead}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons
          name={open ? "remove" : "add"}
          size={18}
          color={open ? colors.brand : colors.textLight}
        />
      </Pressable>
      {open ? <Text style={styles.faqA}>{a}</Text> : null}
    </View>
  );
}

/** Opens a URL via the device browser / dialer / WhatsApp. Fails silently. */
export async function openLink(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  } catch {
    // Ignore — the user can copy the address manually.
  }
}

export const contentStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing(5), paddingBottom: spacing(12) },
  h1: {
    fontSize: font.h1,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(6),
    marginBottom: spacing(2),
  },
  p: {
    fontSize: font.body,
    color: colors.textMuted,
    lineHeight: 23,
    marginBottom: spacing(3),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
  } as ViewStyle,
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: spacing(1.5) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  headerRight: {
    minWidth: 34,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing(4),
    marginBottom: spacing(3),
    gap: spacing(3),
  },
  sectionTitle: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSub: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  action: { color: colors.brand, fontWeight: "700", fontSize: font.small },
  faq: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    marginBottom: spacing(2.5),
  },
  faqOpen: { borderColor: colors.brandLight },
  faqHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
  },
  faqQ: {
    flex: 1,
    fontSize: font.body,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 20,
  },
  faqA: {
    fontSize: font.small,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing(2.5),
  },
});
