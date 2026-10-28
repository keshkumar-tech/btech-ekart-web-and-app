// Admin site settings — key/value pairs (support email, WhatsApp, UPI QR,
// payment instructions…). Image values can be uploaded.
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { adminSettings } from "@/services/admin";
import {
  AdminButton,
  AdminHeader,
  Field,
  FormSheet,
  adminStyles,
  confirmDelete,
} from "@/components/admin";
import { apiError, mediaUrl } from "@/lib/api";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

export default function AdminSettingsScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ id: 0 });
  const [image, setImage] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-settings"],
    queryFn: adminSettings.list,
  });

  const save = useMutation({
    mutationFn: async (p: any) => {
      if (image) {
        const data = new FormData();
        data.append("key", p.key);
        data.append("value", p.value ?? "");
        const name = image.split("/").pop() || "image.jpg";
        data.append("image", {
          uri: image,
          name,
          type: name.toLowerCase().endsWith(".png")
            ? "image/png"
            : "image/jpeg",
        } as unknown as Blob);
        return p.id
          ? adminSettings.update(p.id, data)
          : adminSettings.create(data);
      }
      const payload = { key: p.key, value: p.value ?? "" };
      return p.id
        ? adminSettings.update(p.id, payload)
        : adminSettings.create(payload);
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Setting saved" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Save failed", text2: apiError(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminSettings.remove(id),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Setting deleted" });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Delete failed", text2: apiError(e) }),
  });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: "info", text1: "Photo permission needed" });
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setImage(res.assets[0].uri);
  };

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title="Site Settings"
        subtitle={list.data ? `${list.data.length} keys` : undefined}
        onBack={() => navigation.goBack()}
      />

      {list.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={list.data ?? []}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={list.isFetching}
          onRefresh={() => list.refetch()}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons
                name="settings-outline"
                size={44}
                color={colors.border}
              />
              <Text style={adminStyles.emptyText}>No settings</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={adminStyles.rowCard}>
              <View style={styles.keyRow}>
                <View style={styles.keyPill}>
                  <Text style={styles.key}>{item.key}</Text>
                </View>
                {item.image ? (
                  <Image
                    source={{ uri: mediaUrl(item.image) }}
                    style={styles.thumb}
                  />
                ) : null}
              </View>
              <Text numberOfLines={3} style={styles.value}>
                {item.value || (item.image ? "(image)" : "—")}
              </Text>
              <View style={adminStyles.rowActions}>
                <AdminButton
                  title="Edit"
                  variant="outline"
                  icon="create-outline"
                  onPress={() => {
                    setForm(item);
                    setImage(null);
                    setOpen(true);
                  }}
                  style={{ flex: 1 }}
                />
                <AdminButton
                  title="Delete"
                  variant="danger"
                  icon="trash-outline"
                  onPress={() =>
                    confirmDelete(item.key, () => remove.mutate(item.id))
                  }
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        />
      )}

      <Pressable
        style={adminStyles.fab}
        onPress={() => {
          setForm({ id: 0, key: "", value: "" });
          setImage(null);
          setOpen(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <FormSheet
        visible={open}
        title={form.id ? "Edit setting" : "New setting"}
        onClose={() => setOpen(false)}
        onSubmit={() => {
          if (!form.key?.trim()) {
            Toast.show({ type: "error", text1: "Key is required" });
            return;
          }
          save.mutate({
            id: form.id || undefined,
            key: form.key.trim(),
            value: form.value ?? "",
          });
        }}
        submitting={save.isPending}
      >
        <Field
          label="Key"
          value={form.key ?? ""}
          onChangeText={(v) => setForm({ ...form, key: v })}
          placeholder="support_email"
          autoCapitalize="none"
        />
        <Field
          label="Value"
          value={form.value ?? ""}
          onChangeText={(v) => setForm({ ...form, value: v })}
          multiline
        />
        <Text style={styles.label}>Image (for keys like upi_qr_image)</Text>
        <Pressable style={styles.upload} onPress={pickImage}>
          <Ionicons name="image-outline" size={20} color={colors.brand} />
          <Text style={styles.uploadText}>
            {image ? "Change image" : "Choose image"}
          </Text>
        </Pressable>
        {image || form.image ? (
          <Image
            source={{ uri: image ?? mediaUrl(form.image) }}
            style={styles.preview}
            resizeMode="contain"
          />
        ) : null}
      </FormSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing(3),
  },
  keyPill: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  key: {
    fontSize: font.tiny,
    fontWeight: "800",
    color: colors.brand,
    fontFamily: undefined,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
  },
  value: { fontSize: font.small, color: colors.text, marginTop: spacing(2) },
  label: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing(1.5),
    marginTop: spacing(2),
  },
  upload: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
  },
  uploadText: { fontSize: font.small, fontWeight: "700", color: colors.brand },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: radius.md,
    marginTop: spacing(2),
    backgroundColor: colors.bg,
  },
});
