import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { libraryService } from "@/services";
import { Badge } from "@/components/ui";
import { mediaUrl } from "@/lib/api";
import {
  colors,
  font,
  radius,
  spacing,
  TYPE_COLORS,
  TYPE_LABELS,
} from "@/theme";
import type { LibraryItem } from "@/types";

export default function MyLibraryScreen({ navigation }: any) {
  const [query, setQuery] = useState("");
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["library"],
    queryFn: libraryService.list,
  });

  const items = (data?.results ?? []).filter(
    (i) =>
      !query ||
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      (i.subject_code ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const openPdf = (item: LibraryItem) => {
    if (!item.has_pdf) {
      Toast.show({
        type: "info",
        text1: "File not ready",
        text2: "This PDF is not available yet.",
      });
      return;
    }
    if (item.downloads_remaining <= 0) {
      Toast.show({
        type: "error",
        text1: "Download limit reached",
        text2: "Contact support if you need more downloads.",
      });
      return;
    }
    navigation.navigate("PdfViewer", {
      title: item.title,
      url: item.download_url,
      orderItemId: item.order_item_id,
    });
  };

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
        <Text style={styles.headerTitle}>My Library</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your purchases…"
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={60} color={colors.border} />
          <Text style={styles.emptyTitle}>
            {query ? "Nothing found" : "Your library is empty"}
          </Text>
          <Text style={styles.emptySub}>
            {query
              ? "Try a different search."
              : "Everything you buy shows up here for instant download."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.order_item_id)}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const tc = TYPE_COLORS[item.type] ?? {
              bg: "#e5e7eb",
              fg: "#374151",
            };
            const usedOut = item.downloads_remaining <= 0;
            const total = item.download_count + item.downloads_remaining;
            return (
              <Pressable style={styles.card} onPress={() => openPdf(item)}>
                <Image
                  source={{ uri: mediaUrl(item.cover_image) }}
                  style={styles.thumb}
                />
                <View style={styles.info}>
                  <Badge
                    text={TYPE_LABELS[item.type] ?? item.type}
                    bg={tc.bg}
                    fg={tc.fg}
                  />
                  <Text numberOfLines={2} style={styles.title}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta}>
                    {item.subject_code || "—"} · {item.page_count} pages
                  </Text>
                  <Text
                    style={[
                      styles.downloads,
                      usedOut && { color: colors.danger },
                    ]}
                  >
                    {usedOut
                      ? "Download limit reached"
                      : `${item.download_count} / ${total} downloads used`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.downloadBtn,
                    usedOut && styles.downloadBtnDisabled,
                  ]}
                >
                  <Ionicons
                    name={usedOut ? "lock-closed-outline" : "download-outline"}
                    size={20}
                    color={usedOut ? colors.textLight : colors.white}
                  />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: spacing(1.5) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    margin: spacing(4),
    paddingHorizontal: spacing(4),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(8),
  },
  emptyTitle: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(4),
  },
  emptySub: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(2),
  },
  list: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(8),
    gap: spacing(3),
  },
  card: {
    flexDirection: "row",
    gap: spacing(3),
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(3),
  },
  thumb: {
    width: 64,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  info: { flex: 1, gap: spacing(1) },
  title: { fontSize: font.body, fontWeight: "700", color: colors.text },
  meta: { fontSize: font.tiny, color: colors.textMuted },
  downloads: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: spacing(1),
  },
  downloadBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadBtnDisabled: { backgroundColor: colors.border },
});
