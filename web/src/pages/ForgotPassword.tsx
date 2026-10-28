import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaKey, FaLock, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { http, apiError } from "@/lib/api";
import AuthShell from "@/pages/AuthShell";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await http.post("/api/auth/password/forgot/", { email });
      toast.success(
        "If an account exists, an OTP has been sent to your email.",
      );
      setStep("reset");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== password2) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await http.post("/api/auth/password/reset/", {
        email,
        otp,
        password,
        password2,
      });
      toast.success("Password reset! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={
        step === "request"
          ? "Forgot your password?"
          : "Enter OTP & new password"
      }
      subtitle={
        step === "request"
          ? "We will email you a one-time code to reset it."
          : `Enter the 6-digit code sent to ${email}.`
      }
    >
      <Seo title="Reset Password" noindex />
      {step === "request" ? (
        <form onSubmit={requestOtp} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <FaEnvelope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                className="input pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={busy}
          >
            {busy ? (
              <>
                <FaSpinner className="animate-spin" /> Sending…
              </>
            ) : (
              "Send Reset Code"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div>
            <label className="label">OTP code</label>
            <div className="relative">
              <FaKey className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                required
                maxLength={6}
                className="input pl-9 tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
            </div>
          </div>
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                className="input pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                className="input pl-9"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={busy || password.length < 8 || password !== password2}
          >
            {busy ? (
              <>
                <FaSpinner className="animate-spin" /> Resetting…
              </>
            ) : (
              "Reset Password"
            )}
          </button>
          <button
            type="button"
            className="btn-ghost w-full text-sm"
            onClick={() => setStep("request")}
          >
            ← Use a different email
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:underline"
        >
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
