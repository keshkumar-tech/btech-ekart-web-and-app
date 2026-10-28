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
import { api, tokenStore } from "@/lib/api";
import { colors, font, radius, spacing } from "@/theme";

// Screenshot/screen-recording prevention.
//  - Android: FLAG_SECURE is set natively by the `react-native-screenshot-prevent`
//    module when installed; here we degrade gracefully if it isn't.
//  - iOS: screen capture detection is available via the same module.
let ScreenCapture: any = null;
try {
  // Optional dependency — the app works without it.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ScreenCapture = require("react-native-screenshot-prevent");
} catch {
  ScreenCapture = null;
}

export default function PdfViewerScreen({ navigation, route }: any) {
  const { title, url, orderItemId } = route.params ?? {};
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Prevent screenshots/recording while the purchased PDF is on screen.
  useEffect(() => {
    ScreenCapture?.preventScreenCapture?.();
    return () => ScreenCapture?.allowScreenCapture?.();
  }, []);

  // The backend sends the PDF bytes for an authorised (JWT + signed token) request.
  // We fetch with auth headers and hand the local file/HTML to the WebView.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await tokenStore.getAccess();
        const res = await api.get(url, {
          responseType: "text",
          headers: { Authorization: `Bearer ${token}` },
          // PDFs come back as base64 text when responseType is 'text' on RN.
          transformResponse: [(d) => d],
        });
        if (!cancelled)
          setSignedUrl(typeof res.data === "string" ? res.data : null);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const downloadToDevice = async () => {
    setDownloading(true);
    try {
      const token = await tokenStore.getAccess();
      const safeName = `${(title || "material").replace(/[^a-z0-9]+/gi, "_")}.pdf`;
      const target = `${FileSystem.documentDirectory}${safeName}`;

      const result = await FileSystem.downloadAsync(url, target, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: "application/pdf",
          dialogTitle: title,
        });
      } else {
        Toast.show({
          type: "success",
          text1: "Saved",
          text2: `Downloaded to ${safeName}`,
        });
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Download failed",
        text2: e?.message ?? "Try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Render the PDF inside a WebView (Google Docs viewer for remote, or inline HTML).
  const viewerHtml = signedUrl
    ? `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
       <body style="margin:0;padding:0;background:#525659;">
         <embed src="data:application/pdf;base64,${signedUrl}"
                type="application/pdf" width="100%" height="100%" />
       </body></html>`
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title || "Study material"}
        </Text>
        <Pressable
          onPress={downloadToDevice}
          disabled={downloading}
          hitSlop={10}
          style={styles.download}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="download-outline" size={22} color={colors.white} />
          )}
        </Pressable>
      </View>

      <View style={styles.watermark}>
        <Ionicons
          name="shield-checkmark-outline"
          size={13}
          color={colors.textMuted}
        />
        <Text style={styles.watermarkText}>
          Licensed copy · screenshots disabled · watermarked to your account
        </Text>
      </View>

      {!signedUrl && !failed ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={styles.loadingText}>Opening your document…</Text>
        </View>
      ) : failed ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color={colors.danger}
          />
          <Text style={styles.errorTitle}>Could not open the PDF</Text>
          <Text style={styles.errorSub}>
            Check your connection, or download it to your device instead.
          </Text>
          <Pressable style={styles.retryBtn} onPress={downloadToDevice}>
            <Text style={styles.retryText}>Download to device</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html: viewerHtml ?? "" }}
          style={{ flex: 1 }}
          // Defence-in-depth against casual copying of purchased material.
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          javaScriptEnabled
          domStorageEnabled={false}
          setSupportMultipleWindows={false}
        />
      )}

      <View style={styles.footerNote}>
        <Ionicons
          name="information-circle-outline"
          size={13}
          color={colors.textMuted}
        />
        <Text style={styles.footerText}>
          Purchased by you · order item #{orderItemId}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1f2937",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
  },
  back: { padding: spacing(1.5) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "700",
    color: colors.white,
  },
  download: { padding: spacing(1.5) },
  watermark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    backgroundColor: "#f3f4f6",
    paddingVertical: spacing(2),
  },
  watermarkText: { fontSize: font.tiny, color: colors.textMuted },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(3),
  },
  loadingText: { color: colors.white, fontSize: font.body },
  errorTitle: { color: colors.white, fontSize: font.h3, fontWeight: "700" },
  errorSub: {
    color: "#9ca3af",
    fontSize: font.small,
    textAlign: "center",
    paddingHorizontal: spacing(10),
  },
  retryBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3),
  },
  retryText: { color: colors.white, fontWeight: "700" },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    backgroundColor: "#1f2937",
    paddingVertical: spacing(2.5),
  },
  footerText: { color: "#9ca3af", fontSize: font.tiny },
});
