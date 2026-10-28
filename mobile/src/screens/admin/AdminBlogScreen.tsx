// Admin blog — posts and categories (full CRUD).
import React, { useEffect, useState } from "react";
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
import { adminBlog } from "@/services/admin";
import {
  AdminButton,
  AdminHeader,
  Field,
  FormSheet,
  PickerField,
  ToggleRow,
  adminStyles,
  confirmDelete,
} from "@/components/admin";
import { apiError, mediaUrl } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

export default function AdminBlogScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"posts" | "categories">("posts");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ id: 0 });
  const [image, setImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);

  const posts = useQuery({
    queryKey: ["admin-blog-posts", page],
    queryFn: () => adminBlog.posts({ page, page_size: 20 }),
    enabled: tab === "posts",
  });
  const cats = useQuery({
    queryKey: ["admin-blog-cats"],
    queryFn: adminBlog.categories,
    enabled: tab === "categories",
  });

  useEffect(() => {
    const data = posts.data?.results;
    if (!data) return;
    if (page === 1) setRows(data);
    else
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...data.filter((r) => !seen.has(r.id))];
      });
  }, [posts.data, page]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    qc.invalidateQueries({ queryKey: ["admin-blog-cats"] });
    qc.invalidateQueries({ queryKey: ["blog"] });
    qc.invalidateQueries({ queryKey: ["home-blog"] });
  };

  const save = useMutation({
    mutationFn: async (p: any) => {
      if (tab === "categories") {
        return p.id
          ? adminBlog.updateCategory(p.id, p)
          : adminBlog.createCategory(p);
      }
      let payload: any = p;
      if (image) {
        const data = new FormData();
        ["title", "excerpt", "content", "tags"].forEach((k) => {
          if (p[k] !== undefined && p[k] !== null) data.append(k, String(p[k]));
        });
        if (p.category) data.append("category", String(p.category));
        data.append("read_minutes", String(p.read_minutes || 5));
        data.append("is_published", String(p.is_published !== false));
        const name = image.split("/").pop() || "cover.jpg";
        data.append("cover_image", {
          uri: image,
          name,
          type: name.toLowerCase().endsWith(".png")
            ? "image/png"
            : "image/jpeg",
        } as unknown as Blob);
        payload = data;
      }
      return p.id
        ? adminBlog.updatePost(p.id, payload)
        : adminBlog.createPost(payload);
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Saved" });
      setOpen(false);
      setRows([]);
      setPage(1);
      invalidate();
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Save failed", text2: apiError(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      tab === "categories"
        ? adminBlog.deleteCategory(id)
        : adminBlog.deletePost(id),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Deleted" });
      setRows([]);
      setPage(1);
      invalidate();
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Delete failed", text2: apiError(e) }),
  });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setImage(res.assets[0].uri);
  };

  const data = tab === "posts" ? rows : (cats.data ?? []);
  const loading = tab === "posts" ? posts.isLoading : cats.isLoading;

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader title="Blog" onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        {(["posts", "categories"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
              {t === "posts" ? "Posts" : "Categories"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={data as any[]}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={tab === "posts" ? posts.isFetching : cats.isFetching}
          onRefresh={() => (tab === "posts" ? posts.refetch() : cats.refetch())}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons
                name="document-text-outline"
                size={44}
                color={colors.border}
              />
              <Text style={adminStyles.emptyText}>Nothing here yet</Text>
            </View>
          }
          renderItem={({ item }) =>
            tab === "categories" ? (
              <View style={adminStyles.rowCard}>
                <Text style={adminStyles.rowTitle}>{item.name}</Text>
                <Text style={adminStyles.rowMeta}>
                  {item.post_count ?? 0} post
                  {item.post_count === 1 ? "" : "s"} · slug: {item.slug}
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
                      confirmDelete(item.name, () => remove.mutate(item.id))
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <View style={adminStyles.rowCard}>
                {item.cover_image ? (
                  <Image
                    source={{ uri: mediaUrl(item.cover_image) }}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={adminStyles.rowTitle}>{item.title}</Text>
                <Text style={adminStyles.rowMeta}>
                  {item.is_published ? "Published" : "Draft"}
                  {item.published_at
                    ? ` · ${formatDate(item.published_at)}`
                    : ""}{" "}
                  · {item.read_minutes} min · {item.views} views
                </Text>
                <View style={adminStyles.rowActions}>
                  <AdminButton
                    title="Edit"
                    variant="outline"
                    icon="create-outline"
                    onPress={() => {
                      setForm({ ...item, tags: item.tags ?? "" });
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
                      confirmDelete(item.title, () => remove.mutate(item.id))
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (tab === "posts" && posts.data?.next && !posts.isFetching)
              setPage((p) => p + 1);
          }}
        />
      )}

      <Pressable
        style={adminStyles.fab}
        onPress={() => {
          setForm(
            tab === "categories"
              ? { id: 0, name: "", description: "" }
              : {
                  id: 0,
                  title: "",
                  excerpt: "",
                  content: "",
                  category: null,
                  tags: "",
                  read_minutes: "5",
                  is_published: true,
                },
          );
          setImage(null);
          setOpen(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <FormSheet
        visible={open}
        title={
          form.id ? "Edit" : tab === "categories" ? "New category" : "New post"
        }
        onClose={() => setOpen(false)}
        onSubmit={() => {
          if (!form.title?.trim() && !form.name?.trim()) {
            Toast.show({ type: "error", text1: "A title is required" });
            return;
          }
          if (tab === "categories") {
            save.mutate({
              id: form.id || undefined,
              name: form.name.trim(),
              description: form.description ?? "",
            });
          } else {
            save.mutate({
              id: form.id || undefined,
              title: form.title.trim(),
              excerpt: form.excerpt ?? "",
              content: form.content ?? "",
              category: form.category || null,
              tags: form.tags ?? "",
              read_minutes: Number(form.read_minutes) || 5,
              is_published: form.is_published !== false,
            });
          }
        }}
        submitting={save.isPending}
      >
        {tab === "categories" ? (
          <>
            <Field
              label="Name"
              value={form.name ?? ""}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            <Field
              label="Description"
              value={form.description ?? ""}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
            />
          </>
        ) : (
          <>
            <Field
              label="Title"
              value={form.title ?? ""}
              onChangeText={(v) => setForm({ ...form, title: v })}
            />
            <Field
              label="Excerpt"
              value={form.excerpt ?? ""}
              onChangeText={(v) => setForm({ ...form, excerpt: v })}
              multiline
            />
            <Field
              label="Content (HTML or text)"
              value={form.content ?? ""}
              onChangeText={(v) => setForm({ ...form, content: v })}
              multiline
            />
            <PickerField
              label="Category"
              value={form.category}
              options={[
                { label: "None", value: null },
                ...(cats.data ?? []).map((c: any) => ({
                  label: c.name,
                  value: c.id,
                })),
              ]}
              onChange={(v) => setForm({ ...form, category: v })}
            />
            <Field
              label="Tags (comma separated)"
              value={form.tags ?? ""}
              onChangeText={(v) => setForm({ ...form, tags: v })}
            />
            <Field
              label="Read minutes"
              value={String(form.read_minutes ?? "")}
              onChangeText={(v) => setForm({ ...form, read_minutes: v })}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Cover image</Text>
            <Pressable style={styles.upload} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color={colors.brand} />
              <Text style={styles.uploadText}>
                {image ? "Change cover" : "Choose cover"}
              </Text>
            </Pressable>
            {image || form.cover_image ? (
              <Image
                source={{ uri: image ?? mediaUrl(form.cover_image) }}
                style={styles.coverLarge}
                resizeMode="cover"
              />
            ) : null}
            <ToggleRow
              label="Published"
              value={form.is_published !== false}
              onChange={(v) => setForm({ ...form, is_published: v })}
            />
          </>
        )}
      </FormSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(3),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing(2.5),
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { fontSize: font.small, fontWeight: "700", color: colors.textMuted },
  tabTextOn: { color: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cover: {
    width: "100%",
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    marginBottom: spacing(3),
  },
  coverLarge: {
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
});
