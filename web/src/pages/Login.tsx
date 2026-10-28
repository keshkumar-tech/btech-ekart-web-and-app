import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { useAuth } from "@/store/auth";
import { apiError } from "@/lib/api";
import AuthShell from "@/pages/AuthShell";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(user.role === "admin" && from === "/" ? "/admin" : from, {
        replace: true,
      });
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to access your cart, orders and library."
    >
      <Seo title="Login" noindex />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <FaEnvelope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              autoComplete="email"
              className="input h-11 pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <FaLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              className="input h-11 pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label="Toggle password"
            >
              {show ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 text-[13.5px]"
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Logging in…
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /> OR{" "}
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>

      <button
        className="w-full rounded-xl border border-slate-200 bg-white py-3 text-[13px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.06]"
        onClick={() =>
          toast("Google login: wire up your client id in .env", { icon: "ℹ️" })
        }
      >
        <FaGoogle /> Continue with Google
      </button>

      <p className="mt-5 text-center text-[12.5px] text-slate-500 dark:text-slate-400">
        New to B.Tech eKart?{" "}
        <Link
          to="/signup"
          className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Demo accounts
        </p>
        <p>Student: student@btechekart.com / Student@123</p>
        <p>Admin: admin@btechekart.com / Admin@123</p>
      </div>
    </AuthShell>
  );
}

