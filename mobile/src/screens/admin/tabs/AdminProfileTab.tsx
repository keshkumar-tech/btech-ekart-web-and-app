// Admin · Profile tab — the admin's own account, not the storefront profile.
// Mirrors the web admin profile menu: identity, edit profile, security,
// notifications, quick store access and sign out.
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { authService } from "@/services";
import { dashboardService } from "@/services/admin";
import { apiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { Button } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { font, radius, shadow, spacing } from "@/theme";
import {
  AdminTabBody,
  AdminTabHeader,
  MenuCard,
  type AdminMenuItem,
} from "./AdminTabParts";

export default function AdminProfileTab({ navigation }: any) {
  const { user, logout } = useAuth();
  const { colors: c, isDark, toggle } = useTheme();
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [changing, setChanging] = useState(false);

  const stats = useQuery({
    queryKey: ["admin-overview"],
    queryFn: dashboardService.overview,
  });

  const signOut = async () => {
    await logout();
    Toast.show({ type: "success", text1: "Logged out" });
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const changePassword = async () => {
    if (!pw.current_password) {
      Toast.show({ type: "error", text1: "Enter your current password" });
      return;
    }
    if (pw.new_password.length < 8) {
      Toast.show({
        type: "error",
        text1: "New password must be at least 8 characters",
      });
      return;
    }
    if (pw.new_password !== pw.confirm) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    setChanging(true);
    try {
      await authService.changePassword({
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      Toast.show({ type: "success", text1: "Password changed" });
      setPw({ current_password: "", new_password: "", confirm: "" });
      setShowPw(false);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Could not change password",
        text2: apiError(e),
      });
    } finally {
      setChanging(false);
    }
  };

  const items: AdminMenuItem[] = [
    {
      key: "edit",
      label: "Edit profile",
      description: "Name, phone, college and branch",
      icon: "create-outline",
      screen: "EditProfile",
      tone: "#6366f1",
    },
    {
      key: "orders",
      label: "Admin orders",
      description: "Jump straight to order management",
      icon: "receipt-outline",
      screen: "AdminOrders",
      tone: "#0ea5e9",
      badge: Number(stats.data?.pending_verification ?? 0),
    },
    {
      key: "customers",
      label: "Customers",
      description: "Accounts and their purchases",
      icon: "people-outline",
      screen: "AdminCustomers",
      tone: "#a855f7",
    },
    {
      key: "notifications",
      label: "Notifications",
      description: "New orders, reviews and alerts",
      icon: "notifications-outline",
      screen: "Notifications",
      tone: "#f59e0b",
    },
    {
      key: "store",
      label: "My orders as customer",
      description: "Orders placed with this account",
      icon: "bag-outline",
      screen: "MyOrders",
      tone: "#14b8a6",
    },
    {
      key: "library",
      label: "My library",
      description: "Downloads purchased with this account",
      icon: "library-outline",
      screen: "MyLibrary",
      tone: "#10b981",
    },
    {
      key: "store2",
      label: "Open storefront",
      description: "Browse the shop as a customer",
      icon: "storefront-outline",
      screen: "Tabs",
      tone: "#ec4899",
    },
  ];

  return (
    <AdminTabBody>
      <AdminTabHeader title="Profile" subtitle="Admin account" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing(10) }}
      >
        {/* Identity card */}
        <View style={[styles.idCard, { backgroundColor: c.card }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
              {user?.name || "Administrator"}
            </Text>
            <Text
              style={[styles.email, { color: c.textMuted }]}
              numberOfLines={1}
            >
              {user?.email}
            </Text>
            <View style={styles.chips}>
              <View style={styles.roleChip}>
                <Ionicons name="shield-checkmark" size={11} color="#fff" />
                <Text style={styles.roleText}>Admin</Text>
              </View>
              {user?.phone ? (
                <Text style={[styles.phone, { color: c.textLight }]}>
                  {user.phone}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.since, { color: c.textLight }]}>
              Member since {formatDate(user?.date_joined)}
            </Text>
          </View>
        </View>

        <MenuCard
          items={items}
          onOpen={(i) => navigation.navigate(i.screen, i.params)}
        />

        {/* Security + appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Security & appearance
          </Text>
          <View style={[styles.card, { backgroundColor: c.card }]}>
            <Pressable style={styles.row} onPress={() => setShowPw(true)}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={c.textMuted}
              />
              <Text style={[styles.rowLabel, { color: c.text }]}>
                Change password
              </Text>
              <Ionicons name="chevron-forward" size={17} color={c.textLight} />
            </Pressable>
            <Pressable
              style={[
                styles.row,
                { borderTopWidth: 1, borderTopColor: c.border },
              ]}
              onPress={toggle}
            >
              <Ionicons
                name={isDark ? "moon" : "moon-outline"}
                size={19}
                color={c.textMuted}
              />
              <Text style={[styles.rowLabel, { color: c.text }]}>
                Dark mode
              </Text>
              <View
                style={[
                  styles.track,
                  { backgroundColor: isDark ? c.brand : c.border },
                ]}
              >
                <View
                  style={[styles.knob, isDark && { alignSelf: "flex-end" }]}
                />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing(4), marginTop: spacing(5) }}>
          <Button title="Log Out" variant="outline" onPress={signOut} />
          <Text style={[styles.version, { color: c.textLight }]}>
            B.Tech eKart · Admin v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Change password sheet */}
      <Modal
        visible={showPw}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPw(false)}
      >
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[styles.sheet, { backgroundColor: c.card }]}
          >
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>
                Change password
              </Text>
              <Pressable onPress={() => setShowPw(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
            </View>
            {(
              [
                ["current_password", "Current password"],
                ["new_password", "New password (min 8)"],
                ["confirm", "Confirm new password"],
              ] as const
            ).map(([key, label]) => (
              <TextInput
                key={key}
                style={[
                  styles.input,
                  {
                    borderColor: c.border,
                    color: c.text,
                    backgroundColor: c.bg,
                  },
                ]}
                secureTextEntry
                placeholder={label}
                placeholderTextColor={c.textLight}
                value={(pw as any)[key]}
                onChangeText={(v) => setPw({ ...pw, [key]: v })}
              />
            ))}
            <Button
              title="Update password"
              loading={changing}
              onPress={changePassword}
              disabled={
                !pw.current_password ||
                pw.new_password.length < 8 ||
                pw.new_password !== pw.confirm
              }
              style={{ marginTop: spacing(3) }}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </AdminTabBody>
  );
}

const styles = StyleSheet.create({
  idCard: {
    flexDirection: "row",
    gap: spacing(4),
    margin: spacing(4),
    padding: spacing(4),
    borderRadius: radius.lg,
    ...shadow.card,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2874f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  name: { fontSize: font.h3, fontWeight: "800" },
  email: { fontSize: font.small, marginTop: 1 },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    marginTop: spacing(2),
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2874f0",
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: 2,
  },
  roleText: { color: "#fff", fontSize: 9.5, fontWeight: "800" },
  phone: { fontSize: font.tiny },
  since: { fontSize: font.tiny, marginTop: spacing(2) },
  section: { paddingHorizontal: spacing(4), paddingTop: spacing(4) },
  sectionTitle: {
    fontSize: font.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing(2),
  },
  card: { borderRadius: radius.lg, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
  },
  rowLabel: { flex: 1, fontSize: font.body, fontWeight: "600" },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: "center",
  },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  version: { textAlign: "center", fontSize: font.tiny, marginTop: spacing(4) },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing(5),
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(3),
  },
  sheetTitle: { fontSize: font.h3, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    fontSize: font.body,
    marginBottom: spacing(2.5),
  },
});
