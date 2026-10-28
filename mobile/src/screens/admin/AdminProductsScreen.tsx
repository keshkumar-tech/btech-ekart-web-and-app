// Admin products — list, search, create, edit, delete.
// Mirrors /admin/products: title, type, category, branch, subject, pricing,
// flags and visibility.
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { adminCatalog } from "@/services/admin";
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
import { Thumb } from "@/components/ui";
import { apiError } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

const TYPES = [
  { label: "Notes", value: "notes" },
  { label: "PYQ", value: "pyq" },
  { label: "Quantum", value: "quantum" },
  { label: "Syllabus", value: "syllabus" },
  { label: "Combo", value: "combo" },
];

const blank = {
  id: 0,
  title: "",
  description: "",
  type: "notes",
  category: null as number | null,
  branch: null as number | null,
  subject: null as number | null,
  year: "",
  semester: "",
  subject_code: "",
  price: "",
  mrp: "",
  page_count: "",
  tags: "",
  is_active: true,
  is_trending: false,
  is_new_arrival: false,
};

export default function AdminProductsScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(blank);
  const [open, setOpen] = useState(false);

  const list = useQuery({
    queryKey: ["admin-products", q, page],
    queryFn: () => adminCatalog.products({ q, page, page_size: 20 }),
  });
  const categories = useQuery({
    queryKey: ["admin-cats-all"],
    queryFn: adminCatalog.categories,
  });
  const branches = useQuery({
    queryKey: ["admin-branches-all"],
    queryFn: adminCatalog.branches,
  });
  const subjects = useQuery({
    queryKey: ["admin-subjects-all"],
    queryFn: adminCatalog.subjects,
  });

  useEffect(() => {
    const data = list.data?.results;
    if (!data) return;
    if (page === 1) setRows(data);
    else
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...data.filter((r) => !seen.has(r.id))];
      });
  }, [list.data, page]);

  useEffect(() => {
    setRows([]);
    setPage(1);
  }, [q]);

  const save = useMutation({
    mutationFn: (payload: any) =>
      payload.id
        ? adminCatalog.updateProduct(payload.id, payload)
        : adminCatalog.createProduct(payload),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: form.id ? "Product updated" : "Product created",
      });
      setOpen(false);
      setRows([]);
      setPage(1);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Save failed", text2: apiError(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminCatalog.deleteProduct(id),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Product deleted" });
      setRows([]);
      setPage(1);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Delete failed", text2: apiError(e) }),
  });

  const openNew = () => {
    setForm({ ...blank });
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setForm({
      ...p,
      category: p.category?.id ?? null,
      branch: p.branch?.id ?? null,
      subject: p.subject?.id ?? null,
      year: p.year ? String(p.year) : "",
      semester: p.semester ? String(p.semester) : "",
      tags: (p.tags_list ?? []).join(", "),
      price: String(p.price ?? ""),
      mrp: String(p.mrp ?? ""),
      page_count: p.page_count ? String(p.page_count) : "",
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.title.trim() || !form.price) {
      Toast.show({ type: "error", text1: "Title and price are required" });
      return;
    }
    save.mutate({
      id: form.id || undefined,
      title: form.title.trim(),
      description: form.description ?? "",
      type: form.type,
      category: form.category || null,
      branch: form.branch || null,
      subject: form.subject || null,
      year: form.year ? Number(form.year) : null,
      semester: form.semester ? Number(form.semester) : null,
      subject_code: form.subject_code ?? "",
      price: form.price,
      mrp: form.mrp || form.price,
      page_count: form.page_count ? Number(form.page_count) : 0,
      tags: form.tags ?? "",
      is_active: !!form.is_active,
      is_trending: !!form.is_trending,
      is_new_arrival: !!form.is_new_arrival,
    });
  };

  const subjectOptions = (subjects.data ?? [])
    .filter((s: any) => !form.branch || s.branch === form.branch)
    .map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.id }));

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title="Products"
        subtitle={list.data ? `${list.data.count} total` : undefined}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filters}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search products…"
            placeholderTextColor={colors.textLight}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />
        </View>
      </View>

      {list.isLoading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={list.isFetching && page === 1}
          onRefresh={() => {
            setPage(1);
            list.refetch();
          }}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons name="cube-outline" size={44} color={colors.border} />
              <Text style={adminStyles.emptyText}>No products</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={adminStyles.rowCard}>
              <View style={styles.productRow}>
                <Thumb uri={item.cover_image} w={48} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={adminStyles.rowTitle}>
                    {item.title}
                  </Text>
                  <Text style={adminStyles.rowMeta}>
                    {item.type_display} · {item.branch?.short_name || "—"} ·{" "}
                    {item.semester ? `Sem ${item.semester}` : "—"}
                  </Text>
                  <Text style={adminStyles.rowMeta}>
                    {formatINR(item.price)} ·{" "}
                    {item.is_active ? "Active" : "Hidden"}
                    {item.is_trending ? " · 🔥" : ""}
                    {item.is_new_arrival ? " · 🆕" : ""}
                  </Text>
                </View>
              </View>
              <View style={adminStyles.rowActions}>
                <AdminButton
                  title="Edit"
                  variant="outline"
                  icon="create-outline"
                  onPress={() => openEdit(item)}
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
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (list.data?.next && !list.isFetching) setPage((p) => p + 1);
          }}
          ListFooterComponent={
            list.isFetching && page > 1 ? (
              <ActivityIndicator
                color={colors.brand}
                style={{ marginVertical: spacing(4) }}
              />
            ) : null
          }
        />
      )}

      <Pressable style={adminStyles.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <FormSheet
        visible={open}
        title={form.id ? "Edit product" : "New product"}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={save.isPending}
        submitLabel={form.id ? "Save changes" : "Create product"}
      >
        <Field
          label="Title *"
          value={form.title}
          onChangeText={(v) => setForm({ ...form, title: v })}
          placeholder="e.g. Data Structures — Complete Notes"
        />
        <Field
          label="Description"
          value={form.description ?? ""}
          onChangeText={(v) => setForm({ ...form, description: v })}
          multiline
        />
        <PickerField
          label="Type"
          value={form.type}
          options={TYPES}
          onChange={(v) => setForm({ ...form, type: v })}
        />
        <PickerField
          label="Category"
          value={form.category}
          options={[
            { label: "None", value: null },
            ...(categories.data ?? []).map((c: any) => ({
              label: c.name,
              value: c.id,
            })),
          ]}
          onChange={(v) => setForm({ ...form, category: v })}
        />
        <PickerField
          label="Branch"
          value={form.branch}
          options={[
            { label: "None", value: null },
            ...(branches.data ?? []).map((b: any) => ({
              label: b.short_name,
              value: b.id,
            })),
          ]}
          onChange={(v) => setForm({ ...form, branch: v })}
        />
        <PickerField
          label="Subject"
          value={form.subject}
          options={[{ label: "None", value: null }, ...subjectOptions]}
          onChange={(v) => setForm({ ...form, subject: v })}
        />
        <Field
          label="Subject code"
          value={form.subject_code ?? ""}
          onChangeText={(v) => setForm({ ...form, subject_code: v })}
          placeholder="e.g. BCS-301"
        />
        <Field
          label="Price (₹) *"
          value={form.price}
          onChangeText={(v) => setForm({ ...form, price: v })}
          keyboardType="decimal-pad"
        />
        <Field
          label="MRP (₹)"
          value={form.mrp}
          onChangeText={(v) => setForm({ ...form, mrp: v })}
          keyboardType="decimal-pad"
        />
        <Field
          label="Year"
          value={form.year}
          onChangeText={(v) => setForm({ ...form, year: v })}
          keyboardType="number-pad"
        />
        <Field
          label="Semester"
          value={form.semester}
          onChangeText={(v) => setForm({ ...form, semester: v })}
          keyboardType="number-pad"
        />
        <Field
          label="Pages"
          value={form.page_count}
          onChangeText={(v) => setForm({ ...form, page_count: v })}
          keyboardType="number-pad"
        />
        <Field
          label="Tags (comma separated)"
          value={form.tags}
          onChangeText={(v) => setForm({ ...form, tags: v })}
        />
        <ToggleRow
          label="Active"
          hint="Visible in the store"
          value={!!form.is_active}
          onChange={(v) => setForm({ ...form, is_active: v })}
        />
        <ToggleRow
          label="Trending"
          value={!!form.is_trending}
          onChange={(v) => setForm({ ...form, is_trending: v })}
        />
        <ToggleRow
          label="New arrival"
          value={!!form.is_new_arrival}
          onChange={(v) => setForm({ ...form, is_new_arrival: v })}
        />
      </FormSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filters: { padding: spacing(4), paddingBottom: spacing(2) },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(4),
  },
  input: {
    flex: 1,
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  productRow: { flexDirection: "row", gap: spacing(3), alignItems: "center" },
});
