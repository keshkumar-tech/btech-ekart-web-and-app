// Welcome offer popup — shown EVERY time the app opens (as requested), after a
// short delay so the first screen paints first. Mirrors the web
// `WelcomeOffer`: subscribe by email, or jump to WhatsApp / Telegram.
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { colors, font, radius, spacing } from "@/theme";
import { SUPPORT_EMAIL, TELEGRAM_LINK, WHATSAPP_LINK } from "@/lib/content";

const DELAY_MS = 1200;

export default function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"subscribe" | "contact">("subscribe");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  // Every app launch shows the offer once the UI has settled.
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function subscribe() {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      Toast.show({
        type: "error",
        text1: "Invalid email",
        text2: "Please enter a valid email address.",
      });
      return;
    }
    setDone(true);
    Toast.show({ type: "success", text1: "You're on the list! 🎉" });
  }

  const openLink = async (url: string) => {
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="school" size={22} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {done ? "Welcome aboard!" : "Get 10% off your first order"}
              </Text>
              <Text style={styles.headerSub}>
                {done
                  ? "We'll send study tips & exclusive offers."
                  : "Join 10,000+ AKTU students on B.Tech eKart."}
              </Text>
            </View>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color="#cbd5e1" />
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(
              [
                ["subscribe", "Subscribe"],
                ["contact", "Get in touch"],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={styles.tab}
              >
                <Text style={[styles.tabText, tab === key && styles.tabTextOn]}>
                  {label}
                </Text>
                {tab === key ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            style={styles.bodyScroll}
            keyboardShouldPersistTaps="handled"
          >
            {done ? (
              <View style={styles.doneWrap}>
                <View style={styles.doneIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={34}
                    color={colors.success}
                  />
                </View>
                <Text style={styles.doneText}>Subscribed as</Text>
                <Text style={styles.doneEmail}>{email}</Text>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => setOpen(false)}
                >
                  <Text style={styles.primaryBtnText}>Start shopping</Text>
                </Pressable>
              </View>
            ) : tab === "subscribe" ? (
              <>
                <Text style={styles.lead}>
                  New notes, PYQs and combo drops — plus an exclusive discount
                  code for your first purchase.
                </Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="mail-outline"
                    size={17}
                    color={colors.textLight}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <TextInput
                  style={styles.plainInput}
                  placeholder="Your name (optional)"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                />
                <Pressable style={styles.primaryBtn} onPress={subscribe}>
                  <Ionicons name="send" size={15} color={colors.white} />
                  <Text style={styles.primaryBtnText}>
                    Subscribe &amp; get the code
                  </Text>
                </Pressable>
                <Pressable onPress={() => setOpen(false)}>
                  <Text style={styles.skip}>
                    No thanks, I&apos;ll pay full price
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.lead}>
                  Questions about an order, a subject, or a custom bundle?
                  Message us directly — we usually reply within a few hours.
                </Text>
                <Pressable
                  style={[styles.channel, { borderColor: "#a7f3d0" }]}
                  onPress={() => openLink(WHATSAPP_LINK)}
                >
                  <View
                    style={[styles.channelIcon, { backgroundColor: "#10b981" }]}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.channelTitle}>Chat on WhatsApp</Text>
                    <Text style={styles.channelSub}>
                      Fastest reply · order help
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textLight}
                  />
                </Pressable>
                <Pressable
                  style={[styles.channel, { borderColor: "#bae6fd" }]}
                  onPress={() => openLink(TELEGRAM_LINK)}
                >
                  <View
                    style={[styles.channelIcon, { backgroundColor: "#0ea5e9" }]}
                  >
                    <Ionicons name="paper-plane" size={17} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.channelTitle}>Telegram channel</Text>
                    <Text style={styles.channelSub}>
                      New uploads &amp; exam alerts
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textLight}
                  />
                </Pressable>
                <Pressable
                  style={[styles.channel, { borderColor: "#e2e8f0" }]}
                  onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
                >
                  <View
                    style={[
                      styles.channelIcon,
                      { backgroundColor: colors.brand },
                    ]}
                  >
                    <Ionicons name="mail" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.channelTitle}>Email support</Text>
                    <Text style={styles.channelSub}>{SUPPORT_EMAIL}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textLight}
                  />
                </Pressable>
                <Pressable
                  style={styles.outlineBtn}
                  onPress={() => setTab("subscribe")}
                >
                  <Text style={styles.outlineBtnText}>
                    Or subscribe by email
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.62)",
    justifyContent: "center",
    padding: spacing(5),
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: "hidden",
    // Let the card grow with its content but never beyond the screen.
    maxHeight: "86%",
  },
  bodyScroll: { flexGrow: 0, flexShrink: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: "#0b1120",
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(5),
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: font.h3,
    fontWeight: "800",
  },
  headerSub: {
    color: "#94a3b8",
    fontSize: font.tiny,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing(2.5),
  },
  tabText: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.textLight,
  },
  tabTextOn: { color: colors.brand },
  tabUnderline: {
    height: 2,
    alignSelf: "stretch",
    marginTop: spacing(2),
    borderRadius: 1,
    backgroundColor: colors.brand,
  },
  body: { padding: spacing(5), gap: spacing(3) },
  lead: {
    fontSize: font.small,
    color: colors.textMuted,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
  },
  input: {
    flex: 1,
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  plainInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing(3.5),
    marginTop: spacing(1),
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: font.body,
  },
  skip: {
    textAlign: "center",
    fontSize: font.tiny,
    color: colors.textLight,
    paddingVertical: spacing(1),
  },
  channel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing(3),
  },
  channelIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  channelTitle: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
  },
  channelSub: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    alignItems: "center",
  },
  outlineBtnText: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.textMuted,
  },
  doneWrap: {
    alignItems: "center",
    paddingVertical: spacing(3),
    gap: spacing(2),
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: "#e6f9ee",
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing(2),
  },
  doneEmail: { fontSize: font.small, color: colors.textMuted },
});
