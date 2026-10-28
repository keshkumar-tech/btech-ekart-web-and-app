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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Button } from "@/components/ui";
import { authService } from "@/services";
import { apiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { useCart, useWishlist } from "@/hooks/useShop";
import { colors, font, radius, shadow, spacing } from "@/theme";

export default function ProfileScreen({ navigation }: any) {
  const { user, isAuthenticated, isAdmin, logout, refreshProfile } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { itemCount } = useCart();
  const { itemCount: wishCount } = useWishlist();
  const [showPw, setShowPw] = useState(false);

  // Pick up edits made on the Edit Profile screen when returning here.
  React.useEffect(() => {
    const unsub = navigation.addListener?.("focus", () => {
      refreshProfile().catch(() => {});
    });
    return unsub;
  }, [navigation, refreshProfile]);
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [changing, setChanging] = useState(false);

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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.guestWrap}>
          <View style={styles.avatarBig}>
            <Ionicons name="person-outline" size={40} color={colors.brand} />
          </View>
          <Text style={styles.guestTitle}>You're browsing as a guest</Text>
          <Text style={styles.guestSub}>
            Log in to sync your cart, wishlist and downloads across web and
            mobile.
          </Text>
          <Button
            title="Log In"
            onPress={() => navigation.navigate("Login")}
            style={{ marginTop: spacing(6), paddingHorizontal: spacing(10) }}
          />
          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={{ marginTop: spacing(4) }}
          >
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.phone ? (
              <Text style={styles.phone}>{user.phone}</Text>
            ) : null}
            <View style={styles.chipRow}>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>
                  {isAdmin ? "Admin" : "Customer"}
                </Text>
              </View>
              <View
                style={[
                  styles.verifyChip,
                  user?.email_verified ? styles.verified : styles.unverified,
                ]}
              >
                <Text
                  style={[
                    styles.verifyChipText,
                    {
                      color: user?.email_verified ? "#047857" : "#b45309",
                    },
                  ]}
                >
                  {user?.email_verified ? "✓ Verified" : "Unverified"}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate("EditProfile")}
            hitSlop={10}
          >
            <Ionicons name="create-outline" size={22} color={colors.white} />
          </Pressable>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <Stat
            label="Cart"
            value={itemCount}
            onPress={() => navigation.navigate("Cart")}
            icon="cart-outline"
          />
          <Stat
            label="Wishlist"
            value={wishCount}
            onPress={() => navigation.navigate("Wishlist")}
            icon="heart-outline"
          />
          <Stat
            label="Library"
            value="→"
            onPress={() => navigation.navigate("MyLibrary")}
            icon="library-outline"
          />
        </View>

        {user?.college || user?.branch || user?.year ? (
          <View style={styles.detailCard}>
            {user?.college ? (
              <InfoRow icon="business-outline" label="College" value={user.college} />
            ) : null}
            {user?.branch ? (
              <InfoRow icon="git-branch-outline" label="Branch" value={user.branch} />
            ) : null}
            {user?.year ? (
              <InfoRow
                icon="calendar-outline"
                label="Year"
                value={`Year ${user.year}`}
              />
            ) : null}
          </View>
        ) : null}

        <Text style={styles.memberSince}>
          Member since {formatDate(user?.date_joined)}
        </Text>
        <View style={styles.menu}>
          <MenuItem
            icon="receipt-outline"
            label="My Orders"
            onPress={() => navigation.navigate("MyOrders")}
          />
          <MenuItem
            icon="library-outline"
            label="My Library"
            onPress={() => navigation.navigate("MyLibrary")}
          />
          <MenuItem
            icon="heart-outline"
            label="My Wishlist"
            onPress={() => navigation.navigate("Wishlist")}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate("Notifications")}
          />
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => setShowPw(true)}
          />
          <MenuItem
            icon={isDark ? "moon" : "moon-outline"}
            label="Dark mode"
            badge={isDark ? "ON" : "OFF"}
            onPress={toggleTheme}
          />
          {isAdmin ? (
            <MenuItem
              icon="shield-checkmark-outline"
              label="Admin dashboard"
              onPress={() => navigation.navigate("AdminTabs")}
            />
          ) : null}
          <MenuItem
            icon="information-circle-outline"
            label="About us"
            onPress={() => navigation.navigate("About")}
          />
          <MenuItem
            icon="headset-outline"
            label="Contact & support"
            onPress={() => navigation.navigate("Contact")}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => navigation.navigate("Legal", { page: "terms" })}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => navigation.navigate("Legal", { page: "privacy" })}
          />
          <MenuItem
            icon="refresh-outline"
            label="Refund Policy"
            onPress={() => navigation.navigate("Legal", { page: "refund" })}
          />
          <MenuItem
            icon="information-circle-outline"
            label="Disclaimer"
            onPress={() => navigation.navigate("Legal", { page: "disclaimer" })}
          />
        </View>

        <Button
          title="Log Out"
          variant="outline"
          onPress={signOut}
          style={{ marginTop: spacing(6) }}
        />

        <Text style={styles.version}>B.Tech eKart v1.0.0</Text>
      </ScrollView>

      {/* Change password sheet */}
      <Modal
        visible={showPw}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPw(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalSheet}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={() => setShowPw(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <Text style={styles.pwLabel}>Current password</Text>
            <TextInput
              style={styles.pwInput}
              secureTextEntry
              value={pw.current_password}
              onChangeText={(v) => setPw({ ...pw, current_password: v })}
              placeholder="Your current password"
              placeholderTextColor={colors.textLight}
            />
            <Text style={styles.pwLabel}>New password</Text>
            <TextInput
              style={styles.pwInput}
              secureTextEntry
              value={pw.new_password}
              onChangeText={(v) => setPw({ ...pw, new_password: v })}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textLight}
            />
            <Text style={styles.pwLabel}>Confirm new password</Text>
            <TextInput
              style={styles.pwInput}
              secureTextEntry
              value={pw.confirm}
              onChangeText={(v) => setPw({ ...pw, confirm: v })}
              placeholder="Repeat new password"
              placeholderTextColor={colors.textLight}
            />
            {pw.new_password && pw.new_password !== pw.confirm ? (
              <Text style={styles.pwError}>Passwords do not match.</Text>
            ) : null}
            <Button
              title="Update Password"
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
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={17} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function Stat({
  label,
  value,
  onPress,
  icon,
}: {
  label: string;
  value: number | string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.brand} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge ? <Text style={styles.menuBadge}>{badge}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing(4), paddingBottom: spacing(12) },
  guestWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(8),
  },
  avatarBig: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brandLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(5),
  },
  guestTitle: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  guestSub: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(3),
    lineHeight: 22,
  },
  link: { color: colors.brand, fontWeight: "700", fontSize: font.body },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(4),
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing(5),
    ...shadow.card,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: font.h1, fontWeight: "800", color: colors.white },
  name: { fontSize: font.h3, fontWeight: "800", color: colors.white },
  email: {
    fontSize: font.small,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  phone: { fontSize: font.tiny, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: spacing(3), marginTop: spacing(4) },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing(4),
  },
  statValue: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: font.tiny, color: colors.textMuted },
  menu: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginTop: spacing(4),
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(4),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(4),
  },
  menuLabel: {
    flex: 1,
    fontSize: font.body,
    fontWeight: "600",
    color: colors.text,
  },
  menuBadge: {
    fontSize: font.tiny,
    color: colors.textLight,
    textTransform: "uppercase",
  },
  version: {
    textAlign: "center",
    color: colors.textLight,
    fontSize: font.tiny,
    marginTop: spacing(6),
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing(2),
    marginTop: spacing(2),
  },
  roleChip: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: 2,
  },
  roleChipText: { color: colors.white, fontSize: font.tiny, fontWeight: "700" },
  verifyChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing(2.5),
    paddingVertical: 2,
  },
  verified: { backgroundColor: "#d1fae5" },
  unverified: { backgroundColor: "#fef3c7" },
  verifyChipText: { fontSize: font.tiny, fontWeight: "700" },
  detailCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(4),
    marginTop: spacing(4),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    paddingVertical: spacing(3),
  },
  infoLabel: { fontSize: font.small, color: colors.textMuted, width: 70 },
  infoValue: {
    flex: 1,
    fontSize: font.small,
    fontWeight: "600",
    color: colors.text,
    textAlign: "right",
  },
  memberSince: {
    fontSize: font.tiny,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing(3),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing(5),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(3),
  },
  modalTitle: { fontSize: font.h2, fontWeight: "800", color: colors.text },
  pwLabel: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: spacing(2.5),
    marginBottom: spacing(1.5),
  },
  pwInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    fontSize: font.body,
    color: colors.text,
  },
  pwError: {
    fontSize: font.small,
    color: colors.danger,
    marginTop: spacing(2),
  },
});
