// Admin catalog setup — Categories, Branches and Subjects, each with full CRUD.
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
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
import { apiError } from "@/lib/api";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

type Tab = "categories" | "branches" | "subjects";

const TABS: { key: Tab; label: string }[] = [
  { key: "categories", label: "Categories" },
  { key: "branches", label: "Branches" },
  { key: "subjects", label: "Subjects" },
];

export default function AdminTaxonomyScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("categories");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ id: 0 });

  const categories = useQuery({
    queryKey: ["admin-cats"],
    queryFn: adminCatalog.categories,
  });
  const branches = useQuery({
    queryKey: ["admin-branches"],
    queryFn: adminCatalog.branches,
  });
  const subjects = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: adminCatalog.subjects,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
    qc.invalidateQueries({ queryKey: ["admin-cats-all"] });
    qc.invalidateQueries({ queryKey: ["admin-branches"] });
    qc.invalidateQueries({ queryKey: ["admin-branches-all"] });
    qc.invalidateQueries({ queryKey: ["admin-subjects"] });
    qc.invalidateQueries({ queryKey: ["admin-subjects-all"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["branches"] });
  };

  const save = useMutation({
    mutationFn: async (payload: any) => {
      const api = adminCatalog;
      if (tab === "categories")
        return payload.id
          ? api.updateCategory(payload.id, payload)
          : api.createCategory(payload);
      if (tab === "branches")
        return payload.id
          ? api.updateBranch(payload.id, payload)
          : api.createBranch(payload);
      return payload.id
        ? api.updateSubject(payload.id, payload)
        : api.createSubject(payload);
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Saved" });
      setOpen(false);
      invalidate();
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Save failed", text2: apiError(e) }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      if (tab === "categories") return adminCatalog.deleteCategory(id);
      if (tab === "branches") return adminCatalog.deleteBranch(id);
      return adminCatalog.deleteSubject(id);
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Deleted" });
      invalidate();
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Delete failed", text2: apiError(e) }),
  });

  const openNew = () => {
    if (tab === "categories")
      setForm({
        id: 0,
        name: "",
        icon: "",
        description: "",
        is_active: true,
        order: "",
      });
    else if (tab === "branches")
      setForm({ id: 0, name: "", short_name: "", is_active: true });
    else setForm({ id: 0, name: "", code: "", branch: null, semester: "" });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim()) {
      Toast.show({ type: "error", text1: "Name is required" });
      return;
    }
    let payload: any = { name: form.name.trim() };
    if (tab === "categories") {
      payload = {
        ...payload,
        icon: form.icon || "",
        description: form.description || "",
        is_active: form.is_active !== false,
        order: form.order ? Number(form.order) : 0,
      };
    } else if (tab === "branches") {
      if (!form.short_name?.trim()) {
        Toast.show({ type: "error", text1: "Short name is required" });
        return;
      }
      payload = {
        ...payload,
        short_name: form.short_name.trim().toUpperCase(),
        is_active: form.is_active !== false,
      };
    } else {
      if (!form.branch) {
        Toast.show({ type: "error", text1: "Choose a branch" });
        return;
      }
      payload = {
        ...payload,
        code: form.code || "",
        branch: form.branch,
        semester: form.semester ? Number(form.semester) : 1,
      };
    }
    save.mutate({ id: form.id || undefined, ...payload });
  };

  const data =
    tab === "categories"
      ? (categories.data ?? [])
      : tab === "branches"
        ? (branches.data ?? [])
        : (subjects.data ?? []);

  const loading =
    (tab === "categories" && categories.isLoading) ||
    (tab === "branches" && branches.isLoading) ||
    (tab === "subjects" && subjects.isLoading);

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader title="Catalog Setup" onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabOn]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextOn]}>
              {t.label}
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
          keyExtractor={(row) => String(row.id)}
          contentContainerStyle={adminStyles.list}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons name="layers-outline" size={44} color={colors.border} />
              <Text style={adminStyles.emptyText}>Nothing here yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={adminStyles.rowCard}>
              <Text style={adminStyles.rowTitle}>
                {tab === "branches"
                  ? `${item.short_name} — ${item.name}`
                  : tab === "subjects"
                    ? `${item.code || "—"} — ${item.name}`
                    : item.name}
              </Text>
              <Text style={adminStyles.rowMeta}>
                {tab === "categories"
                  ? item.is_active
                    ? "Active"
                    : "Hidden"
                  : tab === "branches"
                    ? `${item.branch_name ?? ""} ${item.is_active === false ? "· Hidden" : "· Active"}`
                    : `${item.branch_name ?? ""} · Semester ${item.semester}`}
              </Text>
              <View style={adminStyles.rowActions}>
                <AdminButton
                  title="Edit"
                  variant="outline"
                  icon="create-outline"
                  onPress={() => {
                    setForm({
                      ...item,
                      is_active:
                        typeof item.is_active === "boolean"
                          ? item.is_active
                          : true,
                      semester: item.semester ? String(item.semester) : "",
                      order: item.order ? String(item.order) : "",
                    });
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
          )}
        />
      )}

      <Pressable style={adminStyles.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <FormSheet
        visible={open}
        title={`${form.id ? "Edit" : "New"} ${tab.slice(0, -1)}`}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={save.isPending}
      >
        <Field
          label="Name *"
          value={form.name ?? ""}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        {tab === "categories" ? (
          <>
            <Field
              label="Icon (Ionicons name)"
              value={form.icon ?? ""}
              onChangeText={(v) => setForm({ ...form, icon: v })}
              placeholder="book-outline"
            />
            <Field
              label="Description"
              value={form.description ?? ""}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
            />
            <Field
              label="Order"
              value={form.order ?? ""}
              onChangeText={(v) => setForm({ ...form, order: v })}
              keyboardType="number-pad"
            />
            <ToggleRow
              label="Active"
              value={form.is_active !== false}
              onChange={(v) => setForm({ ...form, is_active: v })}
            />
          </>
        ) : tab === "branches" ? (
          <>
            <Field
              label="Short name * (e.g. CSE)"
              value={form.short_name ?? ""}
              onChangeText={(v) => setForm({ ...form, short_name: v })}
              autoCapitalize="characters"
            />
            <ToggleRow
              label="Active"
              value={form.is_active !== false}
              onChange={(v) => setForm({ ...form, is_active: v })}
            />
          </>
        ) : (
          <>
            <Field
              label="Subject code"
              value={form.code ?? ""}
              onChangeText={(v) => setForm({ ...form, code: v })}
              placeholder="BCS-301"
              autoCapitalize="characters"
            />
            <PickerField
              label="Branch *"
              value={form.branch}
              options={(branches.data ?? []).map((b: any) => ({
                label: b.short_name,
                value: b.id,
              }))}
              onChange={(v) => setForm({ ...form, branch: v })}
            />
            <Field
              label="Semester"
              value={form.semester ?? ""}
              onChangeText={(v) => setForm({ ...form, semester: v })}
              keyboardType="number-pad"
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
    paddingBottom: spacing(1),
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
});
