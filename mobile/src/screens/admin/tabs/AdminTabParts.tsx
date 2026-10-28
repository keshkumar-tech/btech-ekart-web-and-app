// Shared pieces for the 5 admin tabs: a dark tab header and a tappable menu
// list. Every tab screen is just header + (optional) live summary + menu.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, shadow, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

export type AdminMenuItem = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen?: string; // stack route to push
  params?: Record<string, unknown>;
  tone?: string;
  badge?: number | string;
};

export function AdminTabHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
      ) : (
        <View style={styles.logo}>
          <Text style={styles.logoText}>e</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.headerSub}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function AdminTabBody({ children }: { children: React.ReactNode }) {
  const { colors: c } = useTheme();
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.bg }]}
      edges={["top"]}
    >
      {children}
    </SafeAreaView>
  );
}

export function MenuCard({
  title,
  items,
  onOpen,
}: {
  title?: string;
  items: AdminMenuItem[];
  onOpen: (item: AdminMenuItem) => void;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={styles.section}>
      {title ? (
        <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: c.card }]}>
        {items.map((item, i) => (
          <Pressable
            key={item.key}
            style={[
              styles.row,
              i > 0 && { borderTopWidth: 1, borderTopColor: c.border },
            ]}
            onPress={() => onOpen(item)}
            android_ripple={{ color: "rgba(99,102,241,0.12)" }}
          >
            <View
              style={[
                styles.iconTile,
                { backgroundColor: `${item.tone ?? "#6366f1"}1A` },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={19}
                color={item.tone ?? "#6366f1"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: c.text }]}>
                {item.label}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.rowDesc, { color: c.textMuted }]}
              >
                {item.description}
              </Text>
            </View>
            {item.badge !== undefined && item.badge !== 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={17} color={c.textLight} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: "#0b1120",
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
  },
  backBtn: { padding: spacing(1) },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  headerTitle: { color: "#fff", fontSize: font.h3, fontWeight: "800" },
  headerSub: { color: "#94a3b8", fontSize: font.tiny, marginTop: 1 },
  section: { paddingHorizontal: spacing(4), paddingTop: spacing(4) },
  sectionTitle: {
    fontSize: font.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing(2),
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: font.body, fontWeight: "700" },
  rowDesc: { fontSize: font.tiny, marginTop: 2 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
