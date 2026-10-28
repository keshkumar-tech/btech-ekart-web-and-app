import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, spacing } from "@/theme";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Ionicons name="school" size={54} color={colors.brand} />
      </View>
      <Text style={styles.title}>B.Tech eKart</Text>
      <Text style={styles.tagline}>
        AKTU study material, delivered instantly
      </Text>
      <ActivityIndicator
        color={colors.brand}
        style={{ marginTop: spacing(8) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing(8),
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.brand,
    marginBottom: spacing(6),
  },
  title: {
    fontSize: font.h1,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: font.body,
    color: colors.textMuted,
    marginTop: spacing(2),
    textAlign: "center",
  },
});
