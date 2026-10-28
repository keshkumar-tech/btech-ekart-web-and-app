// Admin banners — CRUD for the home-page slider (image upload supported).
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
import { adminBanners } from "@/services/admin";
import {
  AdminButton,
  AdminHeader,
  Field,
  FormSheet,
  ToggleRow,
  adminStyles,
  confirmDelete,
} from "@/components/admin";
import { apiError, mediaUrl } from "@/lib/api";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

export default function AdminBannersScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ id: 0 });
  const [image, setImage] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-banners"],
    queryFn: adminBanners.list,
  });

  const save = useMutation({
    mutationFn: async (p: any) => {
      if (image) {
        const data = new FormData();
        data.append("title", p.title ?? "");
        data.append("subtitle", p.subtitle ?? "");
        data.append("link", p.link ?? "");
        data.append("badge_text", p.badge_text ?? "");
        data.append("is_active", String(p.is_active !== false));
        const name = image.split("/").pop() || "banner.jpg";
        data.append("image", {
          uri: image,
          name,
          type: name.toLowerCase().endsWith(".png")
            ? "image/png"
            : "image/jpeg",
        } as unknown as Blob);
        return p.id
          ? adminBanners.update(p.id, data)
          : adminBanners.create(data);
      }
      return p.id ? adminBanners.update(p.id, p) : adminBanners.create(p);
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Banner saved" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Save failed", text2: apiError(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminBanners.remove(id),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Banner deleted" });
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
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
        title="Banners"
        subtitle={list.data ? `${list.data.length} total` : undefined}
        onBack={() => navigation.goBack()}
      />

      {list.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={list.data ?? []}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={list.isFetching}
          onRefresh={() => list.refetch()}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons name="images-outline" size={44} color={colors.border} />
              <Text style={adminStyles.emptyText}>No banners</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={adminStyles.rowCard}>
              {item.image ? (
                <Image
                  source={{ uri: mediaUrl(item.image) }}
                  style={styles.preview}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={adminStyles.rowTitle}>
                {item.title || "Untitled"}
              </Text>
              <Text style={adminStyles.rowMeta}>
                {item.subtitle || "—"}
                {item.badge_text ? ` · ${item.badge_text}` : ""}
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
                    confirmDelete(item.title || "banner", () =>
                      remove.mutate(item.id),
                    )
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
          setForm({
            id: 0,
            title: "",
            subtitle: "",
            link: "/shop",
            badge_text: "",
            is_active: true,
          });
          setImage(null);
          setOpen(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <FormSheet
        visible={open}
        title={form.id ? "Edit banner" : "New banner"}
        onClose={() => setOpen(false)}
        onSubmit={() => {
          if (!form.title?.trim() && !image) {
            Toast.show({ type: "error", text1: "Add a title or an image" });
            return;
          }
          save.mutate({
            id: form.id || undefined,
            title: form.title ?? "",
            subtitle: form.subtitle ?? "",
            link: form.link ?? "",
            badge_text: form.badge_text ?? "",
            is_active: form.is_active !== false,
          });
        }}
        submitting={save.isPending}
      >
        <Field
          label="Title"
          value={form.title ?? ""}
          onChangeText={(v) => setForm({ ...form, title: v })}
        />
        <Field
          label="Subtitle"
          value={form.subtitle ?? ""}
          onChangeText={(v) => setForm({ ...form, subtitle: v })}
        />
        <Field
          label="Badge text"
          value={form.badge_text ?? ""}
          onChangeText={(v) => setForm({ ...form, badge_text: v })}
          placeholder="e.g. FLAT 50% OFF"
        />
        <Field
          label="Link"
          value={form.link ?? ""}
          onChangeText={(v) => setForm({ ...form, link: v })}
          placeholder="/shop?type=combo"
        />

        <Text style={styles.label}>Image</Text>
        <Pressable style={styles.upload} onPress={pickImage}>
          <Ionicons name="image-outline" size={20} color={colors.brand} />
          <Text style={styles.uploadText}>
            {image ? "Change image" : "Choose image"}
          </Text>
        </Pressable>
        {image || form.image ? (
          <Image
            source={{ uri: image ?? mediaUrl(form.image) }}
            style={styles.previewLarge}
            resizeMode="cover"
          />
        ) : null}

        <ToggleRow
          label="Active"
          value={form.is_active !== false}
          onChange={(v) => setForm({ ...form, is_active: v })}
        />
      </FormSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  preview: {
    width: "100%",
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    marginBottom: spacing(3),
  },
  previewLarge: {
    width: "100%",
    height: 160,
    borderRadius: radius.md,
    marginTop: spacing(2),
    backgroundColor: colors.bg,
  },
  label: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing(1.5),
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
});
