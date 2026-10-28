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
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Button, Input } from "@/components/ui";
import { apiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { colors, font, spacing } from "@/theme";

export default function LoginScreen({ navigation }: any) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    try {
      const user = await login(email.trim().toLowerCase(), password);
      Toast.show({
        type: "success",
        text1: `Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}!`,
      });
      // Admins land on their dashboard, exactly like the web does.
      navigation.replace("Tabs");
      if (user.role === "admin") {
        setTimeout(() => navigation.navigate("AdminTabs"), 250);
      }
    } catch (e) {
      const msg = apiError(e);
      setError(msg);
      Toast.show({ type: "error", text1: "Login failed", text2: msg });
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
        <View style={styles.logoBox}>
          <Ionicons name="school" size={40} color={colors.brand} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Log in to access your purchases and downloads.
        </Text>

        <Input
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View>
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry={!showPw}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            onPress={() => setShowPw((v) => !v)}
            style={styles.eye}
            hitSlop={12}
          >
            <Ionicons
              name={showPw ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Log In"
          onPress={submit}
          loading={loading}
          style={{ marginTop: spacing(3) }}
        />

        <Pressable
          onPress={() => navigation.navigate("ForgotPassword")}
          style={{ marginTop: spacing(4) }}
        >
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.replace("Tabs")}
          style={{ marginTop: spacing(6) }}
        >
          <Text style={styles.guest}>Continue as guest</Text>
        </Pressable>
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
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.brand,
    alignSelf: "center",
    marginBottom: spacing(6),
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
  eye: { position: "absolute", right: spacing(4), top: 42 },
  error: { color: colors.danger, fontSize: font.small, textAlign: "center" },
  link: {
    color: colors.brand,
    fontWeight: "700",
    textAlign: "center",
    fontSize: font.body,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing(6),
  },
  footerText: { color: colors.textMuted, fontSize: font.body },
  guest: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: font.small,
    textDecorationLine: "underline",
  },
});
