// About page — hero, stats, mission, what we offer, how it works, values, FAQ
// and CTA. Mirrors the web /about page.
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  FaqRow,
  ScreenHeader,
  SectionTitle,
  openLink,
} from "@/components/content";
import { Button } from "@/components/ui";
import {
  ABOUT_FAQS,
  ABOUT_HIGHLIGHTS,
  ABOUT_MISSION,
  ABOUT_OFFERINGS,
  ABOUT_STATS,
  ABOUT_STEPS,
  ABOUT_VALUES,
  WHATSAPP_LINK,
} from "@/lib/content";
import { colors, font, radius, shadow, spacing } from "@/theme";

export default function AboutScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="About us" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing(12) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroGrid} />
          <View style={styles.blob1} />
          <View style={styles.blob2} />
          <View style={styles.pill}>
            <Ionicons name="school-outline" size={13} color="#c7d2fe" />
            <Text style={styles.pillText}>FOR AKTU B.TECH STUDENTS</Text>
          </View>
          <Text style={styles.heroTitle}>
            Study material that helps you{" "}
            <Text style={styles.heroAccent}>score better</Text>, for less.
          </Text>
          <Text style={styles.heroBody}>
            B.Tech eKart is a digital store built for AKTU students. We curate
            high-quality notes, previous year papers, quantums, syllabus and
            combo packs — all available for instant download at student-friendly
            prices.
          </Text>
          <View style={styles.heroActions}>
            <Button
              title="Browse study material"
              onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
              style={{ flex: 1 }}
            />
            <Pressable
              style={styles.heroGhost}
              onPress={() => navigation.navigate("Contact")}
            >
              <Text style={styles.heroGhostText}>Talk to us</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          {ABOUT_STATS.map((s) => (
            <View key={s.label} style={styles.stat}>
              <View style={styles.statIcon}>
                <Ionicons name={s.icon} size={18} color={colors.brand} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <SectionTitle
            title="Our mission"
            subtitle="Quality study resources, instantly accessible to every student"
          />
          {ABOUT_MISSION.map((p, i) => (
            <Text key={i} style={[styles.p, { paddingHorizontal: spacing(4) }]}>
              {p}
            </Text>
          ))}
          <View style={styles.highlights}>
            {ABOUT_HIGHLIGHTS.map((h) => (
              <View key={h} style={styles.highlight}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
          <View style={styles.quote}>
            <Ionicons name="school" size={28} color="rgba(255,255,255,0.8)" />
            <Text style={styles.quoteText}>
              “No waiting, no shipping, no middlemen — just the material you
              need, the moment you need it.”
            </Text>
            <Text style={styles.quoteBy}>— The B.Tech eKart team</Text>
          </View>
        </View>

        {/* What we offer */}
        <View style={styles.section}>
          <SectionTitle
            title="What we offer"
            subtitle="Everything you need to prepare, in one place"
          />
          <View style={styles.grid}>
            {ABOUT_OFFERINGS.map((o) => (
              <View key={o.title} style={styles.offerCard}>
                <View
                  style={[styles.offerIcon, { backgroundColor: `${o.tone}18` }]}
                >
                  <Ionicons name={o.icon} size={20} color={o.tone} />
                </View>
                <Text style={styles.offerTitle}>{o.title}</Text>
                <Text style={styles.offerDesc}>{o.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <SectionTitle
            title="How it works"
            subtitle="From browsing to studying in three simple steps"
          />
          {ABOUT_STEPS.map((s) => (
            <View key={s.n} style={styles.step}>
              <Text style={styles.stepNo}>{s.n}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Values */}
        <View style={styles.section}>
          {ABOUT_VALUES.map((v) => (
            <View key={v.title} style={styles.valueRow}>
              <View style={styles.valueIcon}>
                <Ionicons name={v.icon} size={20} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <SectionTitle title="Frequently asked questions" />
          <View style={{ paddingHorizontal: spacing(4) }}>
            {ABOUT_FAQS.map((f, i) => (
              <FaqRow key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>Ready to study smarter?</Text>
          <Text style={styles.ctaBody}>
            Explore notes, PYQs and combo packs for your branch and semester —
            download instantly.
          </Text>
          <View style={styles.ctaActions}>
            <Button
              title="Start shopping"
              variant="accent"
              onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
              style={{ flex: 1 }}
            />
            <Pressable
              style={styles.ctaGhost}
              onPress={() => openLink(WHATSAPP_LINK)}
            >
              <Ionicons name="logo-whatsapp" size={18} color={colors.white} />
              <Text style={styles.ctaGhostText}>Support</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: "#0b1120",
    padding: spacing(6),
    paddingTop: spacing(8),
    paddingBottom: spacing(14),
    overflow: "hidden",
  },
  heroGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  blob1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(99,102,241,0.28)",
    top: -80,
    right: -60,
  },
  blob2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139,92,246,0.22)",
    bottom: -90,
    left: -40,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    borderRadius: radius.pill,
  },
  pillText: {
    color: "#c7d2fe",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.white,
    fontSize: font.h1,
    fontWeight: "800",
    lineHeight: 34,
    marginTop: spacing(4),
  },
  heroAccent: { color: "#a5b4fc" },
  heroBody: {
    color: "#94a3b8",
    fontSize: font.body,
    lineHeight: 22,
    marginTop: spacing(3),
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing(3),
    marginTop: spacing(5),
  },
  heroGhost: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: radius.md,
  },
  heroGhostText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: font.body,
  },
  statsCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.white,
    marginHorizontal: spacing(4),
    marginTop: -spacing(9),
    borderRadius: radius.xl,
    padding: spacing(4),
    ...shadow.card,
  },
  stat: {
    width: "50%",
    alignItems: "center",
    paddingVertical: spacing(2),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(1.5),
  },
  statLabel: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  section: { marginTop: spacing(6) },
  p: {
    fontSize: font.body,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing(3),
  },
  highlights: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing(4),
    gap: spacing(2),
  },
  highlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    width: "47%",
  },
  highlightText: {
    fontSize: font.small,
    color: colors.text,
    fontWeight: "500",
  },
  quote: {
    margin: spacing(4),
    marginTop: spacing(5),
    padding: spacing(5),
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
  },
  quoteText: {
    color: colors.white,
    fontSize: font.h3,
    fontWeight: "700",
    lineHeight: 24,
    marginTop: spacing(3),
  },
  quoteBy: {
    color: "rgba(255,255,255,0.75)",
    fontSize: font.small,
    marginTop: spacing(3),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing(4),
    gap: spacing(3),
  },
  offerCard: {
    width: "47.5%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  offerTitle: {
    fontSize: font.body,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing(3),
  },
  offerDesc: {
    fontSize: font.tiny,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: spacing(1.5),
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(4),
    backgroundColor: colors.white,
    marginHorizontal: spacing(4),
    marginBottom: spacing(3),
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  stepNo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.brandLight,
  },
  stepTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  stepDesc: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing(1),
    lineHeight: 19,
  },
  valueRow: {
    flexDirection: "row",
    gap: spacing(3),
    backgroundColor: colors.white,
    marginHorizontal: spacing(4),
    marginBottom: spacing(3),
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
  },
  valueTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  valueDesc: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing(1),
    lineHeight: 19,
  },
  cta: {
    margin: spacing(4),
    marginTop: spacing(7),
    padding: spacing(5),
    borderRadius: radius.xl,
    backgroundColor: colors.brand,
  },
  ctaTitle: { color: colors.white, fontSize: font.h2, fontWeight: "800" },
  ctaBody: {
    color: "rgba(255,255,255,0.82)",
    fontSize: font.small,
    lineHeight: 20,
    marginTop: spacing(2),
  },
  ctaActions: { flexDirection: "row", gap: spacing(3), marginTop: spacing(4) },
  ctaGhost: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  ctaGhostText: { color: colors.white, fontWeight: "700" },
});
