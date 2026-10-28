import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FaUser, FaLock, FaCheck } from "react-icons/fa";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import Select from "@/components/store/Select";
import { http, apiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import type { User } from "@/types";
import { formatDate } from "@/lib/utils";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    college: user?.college || "",
    branch: user?.branch || "",
    year: user?.year || "",
  });
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      http.patch<User>("/api/auth/profile/", {
        ...form,
        year: form.year ? Number(form.year) : null,
      }),
    onSuccess: (data) => {
      setUser(data);
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      http.post("/api/auth/password/change/", {
        current_password: pw.current_password,
        new_password: pw.new_password,
      }),
    onSuccess: () => {
      toast.success("Password changed");
      setPw({ current_password: "", new_password: "", confirm: "" });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="container-app py-6">
      <Seo title="My Profile" noindex />
      <div className="mb-6">
        <p className="store-eyebrow mb-1">Account</p>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white sm:text-[28px]">
          My profile
        </h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        {/* Account summary */}
        <div className="relative h-fit overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-34px_rgba(15,23,42,0.35)] dark:border-white/[0.07] dark:bg-[#0e1526]">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/15 to-violet-400/10 blur-2xl" />
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="relative mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-indigo-50 dark:ring-indigo-500/15"
            />
          ) : (
            <span className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-[0_10px_26px_-10px_rgba(99,102,241,0.8)] ring-4 ring-indigo-50 dark:ring-indigo-500/15">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          )}
          <h2 className="relative mt-3.5 text-[15px] font-bold text-slate-900 dark:text-white">
            {user?.name}
          </h2>
          <p className="relative text-[12px] text-slate-500 dark:text-slate-400">
            {user?.email}
          </p>
          <div className="relative mt-3 flex justify-center gap-2">
            <span
              className={`chip ${user?.role === "admin" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"}`}
            >
              {user?.role === "admin" ? "Admin" : "Customer"}
            </span>
            {user?.email_verified ? (
              <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FaCheck className="mr-0.5 h-2.5 w-2.5" /> Verified
              </span>
            ) : (
              <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                Unverified
              </span>
            )}
          </div>
          <p className="relative mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-white/[0.06]">
            Member since {formatDate(user?.date_joined)}
          </p>
        </div>

        {/* Edit profile */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:col-span-2 dark:border-white/[0.07] dark:bg-[#0e1526]">
          <h2 className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-slate-900 dark:text-white">
            <FaUser className="text-indigo-500" /> Edit profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="College">
              <input
                className="input"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="e.g. IET Lucknow"
              />
            </Field>
            <Field label="Branch">
              <Select
                variant="field"
                className="w-full"
                value={form.branch}
                onChange={(v) => setForm({ ...form, branch: v })}
                options={[
                  { value: "", label: "Select branch" },
                  ...["CSE", "IT", "ECE", "ME", "CE", "EE"].map((b) => ({
                    value: b,
                    label: b,
                  })),
                ]}
                label="Branch"
              />
            </Field>
            <Field label="Year">
              <Select
                variant="field"
                className="w-full"
                value={String(form.year)}
                onChange={(v) => setForm({ ...form, year: v })}
                options={[
                  { value: "", label: "Select year" },
                  ...[1, 2, 3, 4].map((y) => ({
                    value: String(y),
                    label: `Year ${y}`,
                  })),
                ]}
                label="Year"
              />
            </Field>
            <div className="flex items-end">
              <button
                className="btn-primary w-full"
                disabled={saveProfile.isPending}
                onClick={() => saveProfile.mutate()}
              >
                {saveProfile.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Change password */}
          <h2 className="mb-4 mt-8 flex items-center gap-2 font-bold">
            <FaLock className="text-brand-500" /> Change Password
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current password">
              <input
                type="password"
                className="input"
                value={pw.current_password}
                onChange={(e) =>
                  setPw({ ...pw, current_password: e.target.value })
                }
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                className="input"
                value={pw.new_password}
                onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                className="input"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </Field>
          </div>
          <button
            className="btn-outline mt-4"
            disabled={
              changePassword.isPending ||
              !pw.current_password ||
              pw.new_password.length < 8 ||
              pw.new_password !== pw.confirm
            }
            onClick={() => changePassword.mutate()}
          >
            {changePassword.isPending ? "Updating…" : "Update Password"}
          </button>
          {pw.new_password && pw.new_password !== pw.confirm && (
            <p className="mt-2 text-xs text-rose-500">
              Passwords do not match.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
