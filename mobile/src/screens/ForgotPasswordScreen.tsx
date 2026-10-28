// Forgot password — same two-step OTP flow as the web app:
//   1. request a 6-digit code by email  2. enter code + new password.
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import Toast from "react-native-toast-message";
import { Button, Input } from "@/components/ui";
import { authService } from "@/services";
import { apiError } from "@/lib/api";
import { colors, font, spacing } from "@/theme";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Enter your email" });
      return;
    }
    setBusy(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      Toast.show({
        type: "success",
        text1: "Reset code sent",
        text2: "If an account exists, an OTP is on its way to your email.",
      });
      setStep("reset");
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Request failed",
        text2: apiError(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (password !== password2) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    if (password.length < 8) {
      Toast.show({
        type: "error",
        text1: "Password must be at least 8 characters",
      });
      return;
    }
    setBusy(true);
    try {
      await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
        password2,
      });
      Toast.show({
        type: "success",
        text1: "Password reset",
        text2: "You can now log in with your new password.",
      });
      navigation.replace("Login");
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Reset failed",
        text2: apiError(e),
      });
    } finally {
      setBusy(false);
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
        <Text style={styles.title}>
          {step === "request"
            ? "Forgot your password?"
            : "Enter OTP & new password"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "request"
            ? "We will email you a one-time code to reset it."
            : `Enter the 6-digit code sent to ${email}.`}
        </Text>

        {step === "request" ? (
          <>
            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button
              title="Send Reset Code"
              onPress={requestOtp}
              loading={busy}
            />
          </>
        ) : (
          <>
            <Input
              label="OTP code"
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <Input
              label="New password"
              placeholder="Min 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Input
              label="Confirm new password"
              placeholder="Repeat password"
              secureTextEntry
              value={password2}
              onChangeText={setPassword2}
            />
            <Button
              title="Reset Password"
              onPress={resetPassword}
              loading={busy}
              disabled={
                !otp.trim() || password.length < 8 || password !== password2
              }
            />
            <Pressable
              onPress={() => setStep("request")}
              style={styles.backStep}
            >
              <Text style={styles.link}>← Use a different email</Text>
            </Pressable>
          </>
        )}

        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing(6) }}
        >
          <Text style={styles.link}>Back to login</Text>
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
  link: {
    color: colors.brand,
    fontWeight: "700",
    textAlign: "center",
    fontSize: font.body,
  },
  backStep: { marginTop: spacing(4) },
});
