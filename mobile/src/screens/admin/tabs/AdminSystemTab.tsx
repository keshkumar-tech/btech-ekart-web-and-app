// Admin · System tab — site settings, storefront links and theme.
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { font, spacing } from "@/theme";
import { useTheme, type ThemeMode } from "@/store/theme";
import {
  AdminTabBody,
  AdminTabHeader,
  MenuCard,
  type AdminMenuItem,
} from "./AdminTabParts";

const THEMES: {
  key: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
  { key: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function AdminSystemTab({ navigation }: any) {
  const { colors: c, mode, setMode } = useTheme();

  const items: AdminMenuItem[] = [
    {
      key: "settings",
      label: "Site settings",
      description: "Store name, support contact, UPI QR, socials",
      icon: "settings-outline",
      screen: "AdminSettings",
      tone: "#6366f1",
    },
    {
      key: "store",
      label: "Open storefront",
      description: "See the app exactly as a customer does",
      icon: "storefront-outline",
      screen: "Tabs",
      tone: "#10b981",
    },
    {
      key: "about",
      label: "About us",
      description: "Public about page",
      icon: "information-circle-outline",
      screen: "About",
      tone: "#0ea5e9",
    },
    {
      key: "contact",
      label: "Contact & support",
      description: "WhatsApp, Telegram and email",
      icon: "headset-outline",
      screen: "Contact",
      tone: "#a855f7",
    },
    {
      key: "legal",
      label: "Policies",
      description: "Terms, privacy, refund and disclaimer",
      icon: "document-text-outline",
      screen: "Legal",
      params: { page: "terms" },
      tone: "#94a3b8",
    },
  ];

  return (
    <AdminTabBody>
      <AdminTabHeader title="System" subtitle="Settings & appearance" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing(10) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme switcher */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Appearance
          </Text>
          <View style={[styles.themeCard, { backgroundColor: c.card }]}>
            <Text style={[styles.themeLabel, { color: c.textMuted }]}>
              Theme
            </Text>
            <View style={styles.themeRow}>
              {THEMES.map((t) => {
                const active = mode === t.key;
                return (
                  <Text
                    key={t.key}
                    onPress={() => setMode(t.key)}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: active ? c.brand : `${c.brand}14`,
                        color: active ? "#fff" : c.brand,
                        borderColor: active ? c.brand : "transparent",
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                );
              })}
            </View>
            <View style={styles.themeNote}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={c.textLight}
              />
              <Text
                style={{ fontSize: font.tiny, color: c.textLight, flex: 1 }}
              >
                Applies to the admin dashboard instantly and stays after
                restart.
              </Text>
            </View>
          </View>
        </View>

        <MenuCard
          title="Administration"
          items={items}
          onOpen={(i) => navigation.navigate(i.screen, i.params)}
        />
      </ScrollView>
    </AdminTabBody>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing(4), paddingTop: spacing(4) },
  sectionTitle: {
    fontSize: font.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing(2),
  },
  themeCard: { borderRadius: 14, padding: spacing(4), gap: spacing(3) },
  themeLabel: { fontSize: font.small, fontWeight: "700" },
  themeRow: { flexDirection: "row", gap: spacing(2) },
  themeChip: {
    flex: 1,
    textAlign: "center",
    paddingVertical: spacing(2.5),
    borderRadius: 999,
    borderWidth: 1,
    fontSize: font.small,
    fontWeight: "700",
    overflow: "hidden",
  },
  themeNote: { flexDirection: "row", alignItems: "center", gap: 6 },
});
