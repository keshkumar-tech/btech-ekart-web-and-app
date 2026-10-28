// Renders the four legal pages (the same copy as the web StaticPage).
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, contentStyles } from "@/components/content";
import { LEGAL_PAGES, type LegalPageKey } from "@/lib/content";
import { colors, font, spacing } from "@/theme";

export default function LegalScreen({ navigation, route }: any) {
  const key: LegalPageKey = route?.params?.page ?? "terms";
  const page = LEGAL_PAGES[key] ?? LEGAL_PAGES.terms;

  return (
    <SafeAreaView style={contentStyles.screen} edges={["top"]}>
      <ScreenHeader title={page.title} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={contentStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={contentStyles.h1}>{page.title}</Text>
        <Text style={styles.updated}>
          Last updated for the current catalogue
        </Text>

        {page.body.map((block, i) => (
          <View key={i} style={styles.block}>
            {block.h ? <Text style={contentStyles.h2}>{block.h}</Text> : null}
            {block.p?.map((para, j) => (
              <Text key={j} style={contentStyles.p}>
                {para}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions about this policy? Reach us from Contact in the menu.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  updated: {
    fontSize: font.tiny,
    color: colors.textLight,
    marginTop: spacing(2),
  },
  block: { marginTop: spacing(2) },
  footer: {
    marginTop: spacing(8),
    padding: spacing(4),
    backgroundColor: colors.brandLight,
    borderRadius: 14,
  },
  footerText: {
    fontSize: font.small,
    color: colors.brand,
    lineHeight: 20,
    fontWeight: "600",
  },
});
