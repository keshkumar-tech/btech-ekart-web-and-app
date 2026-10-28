// Footer block — the mobile equivalent of the web site footer (Shop links,
// Company links, Policies, support contacts and the copyright line).
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { openLink } from "@/components/content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  TELEGRAM_LINK,
  WHATSAPP_LINK,
} from "@/lib/content";
import { colors, font, radius, spacing } from "@/theme";

const SHOP_LINKS = [
  { label: "Notes", params: { type: "notes" } },
  { label: "Previous Year Papers", params: { type: "pyq" } },
  { label: "Quantums", params: { type: "quantum" } },
  { label: "Syllabus", params: { type: "syllabus" } },
  { label: "Combo Packs", params: { type: "combo" } },
];

const POLICY_LINKS = [
  { label: "Terms & Conditions", page: "terms" },
  { label: "Privacy Policy", page: "privacy" },
  { label: "Refund Policy", page: "refund" },
  { label: "Disclaimer", page: "disclaimer" },
];

export default function FooterBlock({ navigation }: any) {
  const year = new Date().getFullYear();

  const goShop = (params: Record<string, unknown>) =>
    navigation.navigate("Shop", { ...params, _ts: Date.now() });

  return (
    <View style={styles.footer}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>e</Text>
        </View>
        <View>
          <Text style={styles.brand}>
            B.Tech <Text style={styles.brandAccent}>eKart</Text>
          </Text>
          <Text style={styles.brandSub}>AKTU STUDY STORE</Text>
        </View>
      </View>
      <Text style={styles.tagline}>
        Instant digital study material for AKTU B.Tech students — Notes, PYQs,
        Quantums, Syllabus and Combos.
      </Text>

      <View style={styles.socialRow}>
        <Social icon="logo-whatsapp" onPress={() => openLink(WHATSAPP_LINK)} />
        <Social icon="paper-plane" onPress={() => openLink(TELEGRAM_LINK)} />
        <Social
          icon="mail-outline"
          onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
        />
      </View>

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.colTitle}>SHOP</Text>
          {SHOP_LINKS.map((l) => (
            <Pressable key={l.label} onPress={() => goShop(l.params)}>
              <Text style={styles.link}>{l.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.column}>
          <Text style={styles.colTitle}>COMPANY</Text>
          <Pressable onPress={() => navigation.navigate("About")}>
            <Text style={styles.link}>About Us</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Contact")}>
            <Text style={styles.link}>Contact</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Tabs", { screen: "Blog" })}
          >
            <Text style={styles.link}>Blog</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("MyOrders")}>
            <Text style={styles.link}>My Orders</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("MyLibrary")}>
            <Text style={styles.link}>My Library</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.policyBlock}>
        <Text style={styles.colTitle}>POLICIES</Text>
        {POLICY_LINKS.map((l) => (
          <Pressable
            key={l.page}
            onPress={() => navigation.navigate("Legal", { page: l.page })}
          >
            <Text style={styles.link}>{l.label}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
          style={styles.contactRow}
        >
          <Ionicons name="mail-outline" size={13} color={colors.textLight} />
          <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
        </Pressable>
        <Pressable
          onPress={() => openLink("tel:+919999999999")}
          style={styles.contactRow}
        >
          <Ionicons name="call-outline" size={13} color={colors.textLight} />
          <Text style={styles.contactText}>{SUPPORT_PHONE}</Text>
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.copy}>
          © {year} B.Tech eKart. All rights reserved.
        </Text>
        <Text style={styles.copy}>Made with ♥ for AKTU students</Text>
      </View>
    </View>
  );
}

function Social({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.social} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#cbd5e1" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#080d1a",
    paddingTop: spacing(8),
    paddingBottom: spacing(6),
    paddingHorizontal: spacing(5),
    marginTop: spacing(8),
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing(2.5) },
  logo: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontWeight: "900", fontSize: 20 },
  brand: { color: colors.white, fontSize: font.h3, fontWeight: "800" },
  brandAccent: { color: "#8ab4ff" },
  brandSub: {
    color: "#64748b",
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginTop: 1,
  },
  tagline: {
    color: "#94a3b8",
    fontSize: font.small,
    lineHeight: 20,
    marginTop: spacing(3),
  },
  socialRow: { flexDirection: "row", gap: spacing(2.5), marginTop: spacing(4) },
  social: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  columns: {
    flexDirection: "row",
    marginTop: spacing(6),
    gap: spacing(5),
  },
  column: { flex: 1 },
  policyBlock: { marginTop: spacing(5) },
  colTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9.5,
    letterSpacing: 1.2,
    fontWeight: "800",
    marginBottom: spacing(3),
  },
  link: {
    color: "#94a3b8",
    fontSize: font.small,
    marginBottom: spacing(2.5),
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    marginTop: spacing(1),
    marginBottom: spacing(2),
  },
  contactText: { color: "#94a3b8", fontSize: font.small },
  bottom: {
    marginTop: spacing(7),
    paddingTop: spacing(4),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    gap: spacing(1.5),
  },
  copy: { color: "#64748b", fontSize: font.tiny },
});
