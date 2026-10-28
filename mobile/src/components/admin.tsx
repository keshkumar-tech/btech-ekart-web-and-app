// Shared building blocks for the mobile admin dashboard.
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, shadow, spacing } from "@/theme";
import { useTheme } from "@/store/theme";

export const adminYellow = "#ffc93c";

/** Dark admin header with a back button and an optional action. */
export function AdminHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
      ) : (
        <View style={{ width: 38 }} />
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[styles.headerSub, { color: c.textMuted }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = colors.brand,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${tone}18` }]}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function AdminButton({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}) {
  const bg =
    variant === "primary"
      ? colors.brand
      : variant === "danger"
        ? colors.danger
        : "transparent";
  const fg =
    variant === "primary" || variant === "danger" ? "#fff" : colors.brand;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled || loading ? 0.55 : 1,
          borderWidth: variant === "outline" || variant === "ghost" ? 1 : 0,
          borderColor: variant === "danger" ? colors.danger : colors.brand,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: any;
}) {
  return (
    <View style={{ marginBottom: spacing(3) }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && { minHeight: 90, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

/** A tappable field that opens a bottom sheet of options. */
export function PickerField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
}: {
  label: string;
  value: string | number | null | undefined;
  options: { label: string; value: string | number | null }[];
  onChange: (v: any) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value ?? ""));
  return (
    <View style={{ marginBottom: spacing(3) }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <View style={styles.pickerRow}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: font.body,
              color: selected ? colors.text : colors.textLight,
            }}
          >
            {selected?.label ?? placeholder}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textLight} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {options.map((o) => {
                const active = String(o.value ?? "") === String(value ?? "");
                return (
                  <Pressable
                    key={String(o.value ?? "none")}
                    style={styles.sheetRow}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.sheetText,
                        active && { color: colors.brand, fontWeight: "800" },
                      ]}
                    >
                      {o.label}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.brand}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

/** An editable sheet used by every admin CRUD screen. */
export function FormSheet({
  visible,
  title,
  onClose,
  onSubmit,
  submitting,
  children,
  submitLabel = "Save",
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg }}
        edges={["top", "bottom"]}
      >
        <View style={styles.sheetHeader}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.sheetHeaderTitle}>{title}</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: spacing(4),
            paddingBottom: spacing(10),
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        <View style={styles.sheetFooter}>
          <AdminButton
            title={submitLabel}
            onPress={onSubmit}
            loading={submitting}
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function confirmDelete(name: string, onYes: () => void) {
  Alert.alert(`Delete ${name}?`, "This cannot be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onYes },
  ]);
}

export const adminStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing(4), gap: spacing(3), paddingBottom: spacing(10) },
  rowCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  rowTitle: { fontSize: font.body, fontWeight: "700", color: colors.text },
  rowMeta: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  rowActions: {
    flexDirection: "row",
    gap: spacing(2),
    marginTop: spacing(3),
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing(16),
    gap: spacing(2),
  },
  emptyText: { fontSize: font.body, color: colors.textMuted },
  fab: {
    position: "absolute",
    right: spacing(5),
    bottom: spacing(7),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: "#0b1120",
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(3),
  },
  iconBtn: { padding: spacing(1.5) },
  headerTitle: { color: "#fff", fontSize: font.h3, fontWeight: "800" },
  headerSub: { color: "#94a3b8", fontSize: font.tiny, marginTop: 1 },
  right: { flexDirection: "row", alignItems: "center" },
  statCard: {
    width: "47.5%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing(4),
    ...shadow.card,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: font.h2,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing(2),
  },
  statLabel: { fontSize: font.tiny, color: colors.textMuted, marginTop: 2 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
  },
  btnText: { fontSize: font.body, fontWeight: "700" },
  label: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing(1.5),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.white,
  },
  pickerRow: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing(5),
    paddingBottom: spacing(8),
    maxHeight: "80%",
  },
  sheetTitle: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing(3),
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing(3.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  sheetText: { fontSize: font.body, color: colors.text },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingVertical: spacing(2.5),
  },
  toggleLabel: { fontSize: font.body, fontWeight: "600", color: colors.text },
  toggleHint: { fontSize: font.tiny, color: colors.textMuted, marginTop: 1 },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: "center",
  },
  trackOn: { backgroundColor: colors.brand },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
  },
  knobOn: { alignSelf: "flex-end" },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetHeaderTitle: {
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  sheetFooter: {
    padding: spacing(4),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
