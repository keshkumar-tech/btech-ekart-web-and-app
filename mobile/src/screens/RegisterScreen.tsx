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
import Toast from "react-native-toast-message";
import { Button, Input } from "@/components/ui";
import { apiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { colors, font, spacing } from "@/theme";

export default function RegisterScreen({ navigation }: any) {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Name, email and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
      Toast.show({
        type: "success",
        text1: "Account created",
        text2: "Check your inbox to verify your email.",
      });
      navigation.replace("Tabs");
    } catch (e) {
      const msg = apiError(e);
      setError(msg);
      Toast.show({ type: "error", text1: "Sign up failed", text2: msg });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Buy AKTU material and download instantly.
        </Text>

        <Input
          label="Full name"
          placeholder="Aarav Sharma"
          value={form.name}
          onChangeText={set("name")}
        />
        <Input
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={set("email")}
        />
        <Input
          label="Phone (optional)"
          placeholder="9876543210"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={set("phone")}
        />
        <Input
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          value={form.password}
          onChangeText={set("password")}
        />
        <Input
          label="Confirm password"
          placeholder="Repeat password"
          secureTextEntry
          value={form.password2}
          onChangeText={set("password2")}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Create Account"
          onPress={submit}
          loading={loading}
          style={{ marginTop: spacing(2) }}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered? </Text>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing(8),
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: font.h1,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing(2),
    marginBottom: spacing(8),
  },
  error: { color: colors.danger, fontSize: font.small, textAlign: "center" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing(6),
  },
  footerText: { color: colors.textMuted, fontSize: font.body },
  link: { color: colors.brand, fontWeight: "700", fontSize: font.body },
});
