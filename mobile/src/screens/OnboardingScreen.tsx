import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui";
import { colors, font, spacing } from "@/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "library-outline" as const,
    title: "All AKTU material in one place",
    body: "PDF Notes, PYQs, Quantum booklets and syllabus for every branch and semester.",
  },
  {
    icon: "cloud-download-outline" as const,
    title: "Instant access after payment",
    body: "Buy once and download your material any time from My Library — forever.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Pay the way you like",
    body: "UPI, cards, netbanking via Razorpay or scan the owner QR and upload your UTR.",
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
    } else {
      navigation.replace("Tabs");
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.replace("Tabs")} style={styles.skip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconBox}>
              <Ionicons name={item.icon} size={62} color={colors.brand} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title={index === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={next}
        />
        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={{ marginTop: spacing(4) }}
        >
          <Text style={styles.loginText}>Already have an account? Log in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  skip: {
    position: "absolute",
    top: spacing(14),
    right: spacing(5),
    zIndex: 10,
    padding: spacing(2),
  },
  skipText: { color: colors.textMuted, fontSize: font.body, fontWeight: "600" },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing(10),
  },
  iconBox: {
    width: 150,
    height: 150,
    borderRadius: 40,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(8),
  },
  title: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing(4),
  },
  body: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing(2),
    marginBottom: spacing(8),
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.brand },
  actions: { paddingHorizontal: spacing(8), paddingBottom: spacing(12) },
  loginText: {
    textAlign: "center",
    color: colors.brand,
    fontSize: font.body,
    fontWeight: "600",
  },
});
