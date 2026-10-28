// Contact page — support channels, message form, hours, location and quick
// links. Mirrors the web /contact page (the form confirms locally, exactly like
// the web, since there is no contact API on the backend yet).
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { ScreenHeader, SectionTitle, openLink } from "@/components/content";
import { Button } from "@/components/ui";
import {
  CONTACT_TOPICS,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE,
  TELEGRAM_LINK,
  WHATSAPP_LINK,
} from "@/lib/content";
import { colors, font, radius, shadow, spacing } from "@/theme";

type Channel = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  href: string;
  note: string;
  tone: string;
};

const CHANNELS: Channel[] = [
  {
    icon: "logo-whatsapp",
    label: "WhatsApp",
    value: "Chat with support",
    href: WHATSAPP_LINK,
    note: "Fastest — usually a few minutes",
    tone: "#059669",
  },
  {
    icon: "paper-plane-outline",
    label: "Telegram",
    value: "Join our channel",
    href: TELEGRAM_LINK,
    note: "Updates & new material alerts",
    tone: "#0284c7",
  },
  {
    icon: "mail-outline",
    label: "Email",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    note: "Best for order & payment issues",
    tone: colors.brand,
  },
  {
    icon: "call-outline",
    label: "Phone",
    value: SUPPORT_PHONE,
    href: "tel:+919999999999",
    note: "Mon–Sat, 10am – 7pm IST",
    tone: "#d97706",
  },
];

const QUICK_HELP = [
  {
    icon: "book-outline" as const,
    title: "Order or download issue?",
    desc: "Have your order ID handy and we will sort it out quickly.",
    cta: "My Orders",
    screen: "MyOrders",
  },
  {
    icon: "refresh-outline" as const,
    title: "Need a refund?",
    desc: "Read our refund policy to see when you are eligible.",
    cta: "Refund Policy",
    screen: "LegalRefund",
  },
  {
    icon: "help-circle-outline" as const,
    title: "New here?",
    desc: "Learn how instant download and lifetime access work.",
    cta: "About us",
    screen: "About",
  },
];

export default function ContactScreen({ navigation }: any) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing details",
        text2: "Please fill your name, email and message.",
      });
      return;
    }
    Toast.show({
      type: "success",
      text1: "Message received",
      text2: "We'll reply within 24 hours.",
    });
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Contact us" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="headset-outline" size={20} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>Get in touch</Text>
          <Text style={styles.heroBody}>
            Questions about an order, a payment, or our study material? Reach
            out through any channel below — we usually reply within 24 hours.
          </Text>
        </View>

        {/* Channels */}
        <View style={styles.channels}>
          {CHANNELS.map((c) => (
            <Pressable
              key={c.label}
              style={styles.channel}
              onPress={() => openLink(c.href)}
            >
              <View
                style={[styles.channelIcon, { backgroundColor: `${c.tone}18` }]}
              >
                <Ionicons name={c.icon} size={20} color={c.tone} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.channelLabel}>{c.label}</Text>
                <Text numberOfLines={1} style={styles.channelValue}>
                  {c.value}
                </Text>
                <Text style={styles.channelNote}>{c.note}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textLight}
              />
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View style={{ marginTop: spacing(6) }}>
          <SectionTitle
            title="Send us a message"
            subtitle="Fill in the form and we'll get back to you by email"
          />
          <View style={styles.form}>
            {sent ? (
              <View style={styles.sentBox}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.sentText}>
                  Message received. We'll reply within 24 hours.
                </Text>
              </View>
            ) : null}

            <Field label="Your name">
              <TextInput
                style={styles.input}
                placeholder="e.g. Aarav Sharma"
                placeholderTextColor={colors.textLight}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
              />
            </Field>
            <Field label="Email address">
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
              />
            </Field>

            <Field label="Subject">
              <View style={styles.topicWrap}>
                {CONTACT_TOPICS.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() =>
                      setForm({ ...form, subject: form.subject === t ? "" : t })
                    }
                    style={[
                      styles.topic,
                      form.subject === t && styles.topicActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.topicText,
                        form.subject === t && styles.topicTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <Field label="Message">
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Tell us how we can help — include your order ID if you have one."
                placeholderTextColor={colors.textLight}
                multiline
                textAlignVertical="top"
                value={form.message}
                onChangeText={(v) => setForm({ ...form, message: v })}
              />
            </Field>

            <Button title="Send Message" onPress={submit} />
          </View>
        </View>

        {/* Hours */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            <Ionicons name="time-outline" size={15} color={colors.brand} />{" "}
            Support hours
          </Text>
          {SUPPORT_HOURS.map((h, i) => (
            <View
              key={h.day}
              style={[
                styles.hoursRow,
                i === SUPPORT_HOURS.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.hoursDay}>{h.day}</Text>
              <Text style={styles.hoursTime}>{h.time}</Text>
            </View>
          ))}
        </View>

        {/* Location */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            <Ionicons name="location-outline" size={15} color={colors.brand} />{" "}
            Where we are
          </Text>
          <Text style={styles.infoBody}>
            B.Tech eKart is an online-only store. We're based in Lucknow, Uttar
            Pradesh, and serve students across all AKTU-affiliated colleges in
            India.
          </Text>
          <Text style={styles.infoMuted}>
            Since everything is digital, there's no pickup or delivery — you get
            your material instantly online.
          </Text>
        </View>

        {/* Tips */}
        <View style={[styles.infoCard, styles.tipsCard]}>
          <Text style={styles.infoTitle}>Quick response tips</Text>
          {[
            "Include your order ID for order-related queries.",
            "Mention your branch and semester for material questions.",
            "Attach a screenshot for payment issues.",
          ].map((t) => (
            <View key={t} style={styles.tip}>
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={colors.success}
              />
              <Text style={styles.tipText}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Quick help */}
        <View style={{ marginTop: spacing(6) }}>
          <SectionTitle
            title="Looking for something specific?"
            subtitle="These pages answer the most common questions"
          />
          {QUICK_HELP.map((q) => (
            <Pressable
              key={q.title}
              style={styles.quick}
              onPress={() => navigation.navigate(q.screen)}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={q.icon} size={20} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{q.title}</Text>
                <Text style={styles.quickDesc}>{q.desc}</Text>
                <Text style={styles.quickCta}>{q.cta} →</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing(3.5) }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing(4), paddingBottom: spacing(12) },
  hero: {
    backgroundColor: colors.brand,
    borderRadius: radius.xl,
    padding: spacing(6),
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: colors.white,
    fontSize: font.h1,
    fontWeight: "800",
    marginTop: spacing(3),
  },
  heroBody: {
    color: "rgba(255,255,255,0.86)",
    fontSize: font.body,
    lineHeight: 21,
    marginTop: spacing(2),
  },
  channels: { marginTop: spacing(4), gap: spacing(3) },
  channel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  channelIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  channelLabel: { fontSize: font.body, fontWeight: "700", color: colors.text },
  channelValue: {
    fontSize: font.small,
    color: colors.brand,
    fontWeight: "600",
    marginTop: 1,
  },
  channelNote: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  form: {
    marginHorizontal: spacing(4),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  sentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: "#e6f9ee",
    borderRadius: radius.md,
    padding: spacing(3),
    marginBottom: spacing(3),
  },
  sentText: { flex: 1, color: colors.success, fontSize: font.small },
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
    color: colors.text,
    backgroundColor: colors.white,
  },
  textarea: { minHeight: 110 },
  topicWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  topic: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  topicActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  topicText: {
    fontSize: font.tiny,
    color: colors.textMuted,
    fontWeight: "600",
  },
  topicTextActive: { color: colors.white },
  infoCard: {
    marginTop: spacing(4),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  infoTitle: {
    fontSize: font.body,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing(2),
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  hoursDay: { fontSize: font.small, color: colors.textMuted },
  hoursTime: { fontSize: font.small, color: colors.text, fontWeight: "600" },
  infoBody: {
    fontSize: font.small,
    color: colors.textMuted,
    lineHeight: 20,
  },
  infoMuted: {
    fontSize: font.small,
    color: colors.textLight,
    lineHeight: 20,
    marginTop: spacing(2),
  },
  tipsCard: { backgroundColor: "#eef5ff" },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(2),
    marginTop: spacing(2),
  },
  tipText: {
    flex: 1,
    fontSize: font.small,
    color: colors.text,
    lineHeight: 19,
  },
  quick: {
    flexDirection: "row",
    gap: spacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginHorizontal: spacing(4),
    marginBottom: spacing(3),
    ...shadow.card,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  quickDesc: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 19,
  },
  quickCta: {
    fontSize: font.small,
    color: colors.brand,
    fontWeight: "700",
    marginTop: spacing(2),
  },
});
