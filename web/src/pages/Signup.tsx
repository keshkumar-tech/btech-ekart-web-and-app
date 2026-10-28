import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaGoogle,
  FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { useAuth } from "@/store/auth";
import { apiError } from "@/lib/api";
import AuthShell from "@/pages/AuthShell";

export default function Signup() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.password !== form.password2)
      e.password2 = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await register(form);
      toast.success(
        "Account created! Check your email for the verification OTP.",
      );
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get instant access to AKTU study material."
    >
      <Seo title="Sign Up" noindex />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <FaUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-rose-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <FaEnvelope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              className="input pl-9"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="label">Phone (optional)</label>
          <div className="relative">
            <FaPhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="10-digit mobile"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="input pl-9"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 chars"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
            )}
          </div>
          <div>
            <label className="label">Confirm password</label>
            <div className="relative">
              <FaLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="input pl-9"
                value={form.password2}
                onChange={(e) => set("password2", e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            {errors.password2 && (
              <p className="mt-1 text-xs text-rose-500">{errors.password2}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="text-xs text-gray-400">
          By signing up you agree to our{" "}
          <Link to="/terms" className="link">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="link">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" /> OR{" "}
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <button
        className="btn-outline w-full py-3"
        onClick={() =>
          toast("Google signup: wire up your client id in .env", { icon: "ℹ️" })
        }
      >
        <FaGoogle /> Sign up with Google
      </button>

      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
