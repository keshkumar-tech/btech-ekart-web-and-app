import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Button, Input } from "@/components/ui";
import { authService } from "@/services";
import { apiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { colors, font, radius, spacing } from "@/theme";

const BRANCHES = ["CSE", "IT", "ECE", "ME", "CE", "EE"];

export default function EditProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [college, setCollege] = useState(user?.college ?? "");
  const [branch, setBranch] = useState(user?.branch ?? "");
  const [year, setYear] = useState(user?.year ? String(user.year) : "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        name,
        phone,
        college,
        branch,
        year: year ? Number(year) : null,
      });
      setUser(updated);
      Toast.show({ type: "success", text1: "Profile updated" });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: "error", text1: "Update failed", text2: apiError(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Full name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Phone"
            placeholder="9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Input
            label="College"
            placeholder="e.g. IET Lucknow"
            value={college}
            onChangeText={setCollege}
          />

          <Text style={styles.label}>Branch</Text>
          <View style={styles.chips}>
            {BRANCHES.map((b) => (
              <Pressable
                key={b}
                onPress={() => setBranch(branch === b ? "" : b)}
                style={[styles.chip, branch === b && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    branch === b && styles.chipTextActive,
                  ]}
                >
                  {b}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: spacing(4) }]}>Year</Text>
          <View style={styles.chips}>
            {["1", "2", "3", "4"].map((y) => (
              <Pressable
                key={y}
                onPress={() => setYear(year === y ? "" : y)}
                style={[styles.chip, year === y && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, year === y && styles.chipTextActive]}
                >
                  Year {y}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title="Save Changes"
            onPress={save}
            loading={saving}
            style={{ marginTop: spacing(8) }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: spacing(1.5) },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: font.h3,
    fontWeight: "800",
    color: colors.text,
  },
  scroll: { padding: spacing(5) },
  label: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: spacing(2),
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  chip: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: {
    fontSize: font.small,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipTextActive: { color: colors.white },
});
