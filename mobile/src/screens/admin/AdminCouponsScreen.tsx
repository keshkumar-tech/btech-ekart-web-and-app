// Admin coupons — full CRUD (percent/flat, limits, validity).
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
import { adminCoupons } from "@/services/admin";
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
import { formatINR } from "@/lib/utils";
import { colors, font, radius, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

export default function AdminCouponsScreen({ navigation }: any) {
  const { colors: c } = useTheme();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ id: 0 });

  const list = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: adminCoupons.list,
  });

  const save = useMutation({
    mutationFn: (p: any) =>
      p.id ? adminCoupons.update(p.id, p) : adminCoupons.create(p),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Coupon saved" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Save failed", text2: apiError(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminCoupons.remove(id),
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Coupon deleted" });
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) =>
      Toast.show({ type: "error", text1: "Delete failed", text2: apiError(e) }),
  });

  const openNew = () => {
    setForm({
      id: 0,
      code: "",
      description: "",
      discount_type: "percent",
      value: "",
      min_order_amount: "",
      max_discount: "",
      valid_to: "",
      usage_limit: "",
      per_user_limit: "1",
      is_active: true,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.code?.trim() || !form.value) {
      Toast.show({ type: "error", text1: "Code and value are required" });
      return;
    }
    const payload: any = {
      id: form.id || undefined,
      code: form.code.trim().toUpperCase(),
      description: form.description || "",
      discount_type: form.discount_type,
      value: form.value,
      min_order_amount: form.min_order_amount || "0",
      max_discount: form.max_discount ? form.max_discount : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : 1,
      is_active: form.is_active !== false,
    };
    // Only send a date when it looks like an ISO date (YYYY-MM-DD).
    if (/^\d{4}-\d{2}-\d{2}$/.test(form.valid_to || "")) {
      payload.valid_to = `${form.valid_to}T23:59:59Z`;
    }
    save.mutate(payload);
  };

  return (
    <SafeAreaView style={[adminStyles.screen, { backgroundColor: c.bg }]} edges={["top"]}>
      <AdminHeader
        title="Coupons"
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
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={adminStyles.list}
          refreshing={list.isFetching}
          onRefresh={() => list.refetch()}
          ListEmptyComponent={
            <View style={adminStyles.empty}>
              <Ionicons
                name="pricetag-outline"
                size={44}
                color={colors.border}
              />
              <Text style={adminStyles.emptyText}>No coupons</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={adminStyles.rowCard}>
              <View style={styles.rowTop}>
                <View style={styles.codePill}>
                  <Text style={styles.code}>{item.code}</Text>
                </View>
                <Text style={styles.meta}>
                  {item.discount_type === "percent"
                    ? `${Number(item.value)}% off`
                    : `${formatINR(item.value)} off`}
                </Text>
              </View>
              <Text style={adminStyles.rowMeta}>
                Min {formatINR(item.min_order_amount)} · used {item.used_count}
                {item.usage_limit ? `/${item.usage_limit}` : ""} ·{" "}
                {item.is_active ? "Active" : "Inactive"}
                {item.valid_to
                  ? ` · valid to ${item.valid_to.slice(0, 10)}`
                  : ""}
              </Text>
              {item.description ? (
                <Text style={adminStyles.rowMeta}>{item.description}</Text>
              ) : null}
              <View style={adminStyles.rowActions}>
                <AdminButton
                  title="Edit"
                  variant="outline"
                  icon="create-outline"
                  onPress={() => {
                    setForm({
                      ...item,
                      valid_to: item.valid_to ? item.valid_to.slice(0, 10) : "",
                      usage_limit: item.usage_limit ?? "",
                      max_discount: item.max_discount ?? "",
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
                    confirmDelete(item.code, () => remove.mutate(item.id))
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
        title={form.id ? "Edit coupon" : "New coupon"}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={save.isPending}
      >
        <Field
          label="Code *"
          value={form.code ?? ""}
          onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })}
          autoCapitalize="characters"
          placeholder="WELCOME10"
        />
        <Field
          label="Description"
          value={form.description ?? ""}
          onChangeText={(v) => setForm({ ...form, description: v })}
        />
        <PickerField
          label="Discount type"
          value={form.discount_type}
          options={[
            { label: "Percent (%)", value: "percent" },
            { label: "Flat (₹)", value: "flat" },
          ]}
          onChange={(v) => setForm({ ...form, discount_type: v })}
        />
        <Field
          label="Value *"
          value={String(form.value ?? "")}
          onChangeText={(v) => setForm({ ...form, value: v })}
          keyboardType="decimal-pad"
        />
        <Field
          label="Min order amount (₹)"
          value={String(form.min_order_amount ?? "")}
          onChangeText={(v) => setForm({ ...form, min_order_amount: v })}
          keyboardType="decimal-pad"
        />
        <Field
          label="Max discount (₹, optional)"
          value={String(form.max_discount ?? "")}
          onChangeText={(v) => setForm({ ...form, max_discount: v })}
          keyboardType="decimal-pad"
        />
        <Field
          label="Valid to (YYYY-MM-DD)"
          value={String(form.valid_to ?? "")}
          onChangeText={(v) => setForm({ ...form, valid_to: v })}
          placeholder="2026-12-31"
        />
        <Field
          label="Usage limit (optional)"
          value={String(form.usage_limit ?? "")}
          onChangeText={(v) => setForm({ ...form, usage_limit: v })}
          keyboardType="number-pad"
        />
        <Field
          label="Per-user limit"
          value={String(form.per_user_limit ?? "")}
          onChangeText={(v) => setForm({ ...form, per_user_limit: v })}
          keyboardType="number-pad"
        />
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
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  codePill: {
    backgroundColor: colors.brandLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  code: { fontSize: font.small, fontWeight: "800", color: colors.brand },
  meta: { fontSize: font.small, color: colors.textMuted },
});
