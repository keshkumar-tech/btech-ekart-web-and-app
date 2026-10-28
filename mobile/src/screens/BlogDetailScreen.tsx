import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { blogService } from "@/services";
import { Badge, Button } from "@/components/ui";
import { mediaUrl } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";

export default function BlogDetailScreen({ navigation, route }: any) {
  const { slug } = route.params;
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => blogService.post(slug),
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Article</Text>
        <View style={{ width: 34 }} />
      </View>

      {isLoading || !post ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri: mediaUrl(post.cover_image) }}
            style={styles.cover}
          />
          {post.category ? (
            <Badge
              text={post.category.name}
              bg={colors.brandLight}
              fg={colors.brand}
            />
          ) : null}
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.metaRow}>
            {post.author_name ? (
              <Text style={styles.meta}>✍ {post.author_name}</Text>
            ) : null}
            <Text style={styles.meta}>⏱ {post.read_minutes} min read</Text>
            <Text style={styles.meta}>👁 {post.views} views</Text>
            <Text style={styles.meta}>
              {formatDate(post.published_at ?? post.created_at)}
            </Text>
          </View>

          {post.excerpt ? (
            <Text style={styles.excerpt}>{post.excerpt}</Text>
          ) : null}

          {/* Rich-text body (rendered as plain text on mobile for safety). */}
          <Text style={styles.body}>{stripHtml(post.content ?? "")}</Text>

          {post.tags_list?.length ? (
            <View style={styles.tags}>
              {post.tags_list.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>Ready to ace your exams?</Text>
            <Text style={styles.ctaBody}>
              Grab notes, PYQs and quantums for your branch and semester.
            </Text>
            <Button
              title="Shop Study Material"
              variant="accent"
              onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
              style={{ marginTop: spacing(4) }}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Very small HTML-to-text helper so blog content reads cleanly on mobile.
function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|div|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: spacing(1.5) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "700",
    color: colors.text,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing(5), gap: spacing(3), paddingBottom: spacing(10) },
  cover: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    backgroundColor: colors.brandLight,
  },
  title: {
    fontSize: font.h1,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 34,
  },
  meta: { fontSize: font.tiny, color: colors.textLight },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing(3),
    rowGap: spacing(1),
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(2),
    marginTop: spacing(2),
  },
  tag: {
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  tagText: { fontSize: font.tiny, color: colors.textMuted, fontWeight: "600" },
  cta: {
    marginTop: spacing(6),
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing(5),
  },
  ctaTitle: {
    color: colors.white,
    fontSize: font.h3,
    fontWeight: "800",
  },
  ctaBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: font.small,
    marginTop: spacing(1.5),
    lineHeight: 19,
  },
  excerpt: {
    fontSize: font.h3,
    color: colors.textMuted,
    fontStyle: "italic",
    lineHeight: 24,
  },
  body: {
    fontSize: font.body,
    color: colors.text,
    lineHeight: 24,
    marginTop: spacing(2),
  },
});
