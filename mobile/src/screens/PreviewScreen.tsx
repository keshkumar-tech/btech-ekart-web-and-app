// Product preview — opens the free sample PDF IN THE APP.
//
// The web page renders it in an <iframe>, so here it is rendered in a WebView.
// Downloading is an explicit action (the button in the top bar); simply
// tapping "View preview" never starts a download.
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { catalogService } from "@/services";
import { resolveApiBase } from "@/lib/api";
import { colors, font, spacing } from "@/theme";

export default function PreviewScreen({ navigation, route }: any) {
  const { slug, title } = route.params ?? {};
  const [url, setUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveApiBase().then((base) => {
      if (alive) setUrl(`${base}/api/catalog/products/${slug}/preview/`);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  const download = async () => {
    if (!url) return;
    setDownloading(true);
    try {
      const safe = `${(title || slug || "preview").replace(/[^a-z0-9]+/gi, "_")}.pdf`;
      const target = `${FileSystem.documentDirectory}${safe}`;
      const res = await FileSystem.downloadAsync(url, target);
      if (res.status !== 200) throw new Error("unavailable");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Preview — ${title ?? ""}`,
        });
      } else {
        Toast.show({ type: "success", text1: "Preview saved" });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Preview download failed",
        text2: "Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          Preview — {title ?? ""}
        </Text>
        <Pressable onPress={download} disabled={downloading} hitSlop={10}>
          {downloading ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Ionicons name="download-outline" size={22} color={colors.brand} />
          )}
        </Pressable>
      </View>

      {url ? (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={styles.loadingText}>Loading preview…</Text>
            </View>
          )}
          onError={() =>
            Toast.show({
              type: "error",
              text1: "Could not open the preview",
              text2: "Check your connection and try again.",
            })
          }
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      )}

      <View style={styles.note}>
        <Ionicons
          name="information-circle-outline"
          size={13}
          color={colors.textMuted}
        />
        <Text style={styles.noteText}>
          Free sample · download with the button above
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    flex: 1,
    fontSize: font.small,
    fontWeight: "700",
    color: colors.text,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(3),
  },
  loadingText: { fontSize: font.small, color: colors.textMuted },
  note: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    paddingVertical: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noteText: { fontSize: font.tiny, color: colors.textMuted },
});
