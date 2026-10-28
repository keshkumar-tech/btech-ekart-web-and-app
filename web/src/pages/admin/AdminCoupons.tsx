import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiTag, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import Select from "@/components/store/Select";
import { apiError } from "@/lib/api";
import { ordersService } from "@/services/orders";
import { formatINR } from "@/lib/utils";
import type { Coupon } from "@/types";

const EMPTY = {
  code: "",
  description: "",
  discount_type: "percent",
  value: "",
  min_order_amount: "0",
  max_discount: "",
  usage_limit: "",
  per_user_limit: "1",
  is_active: true,
};

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: ordersService.adminCoupons,
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { ...form };
      // Send nulls (not "") for optional nullable fields so DRF accepts them.
      ["max_discount", "usage_limit"].forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      if (editing) return ordersService.adminUpdateCoupon(editing.id, payload);
      return ordersService.adminCreateCoupon(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Coupon updated" : "Coupon created");
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => ordersService.adminDeleteCoupon(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description,
      discount_type: c.discount_type,
      value: c.value,
      min_order_amount: c.min_order_amount,
      max_discount: c.max_discount ?? "",
      usage_limit: c.usage_limit ?? "",
      per_user_limit: c.per_user_limit,
      is_active: c.is_active,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <Seo title="Admin — Coupons" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Commerce
          </p>
          <h1 className="admin-title">Coupons</h1>
          <p className="admin-subtitle">
            Discount codes and usage limits
          </p>
        </div>
        <button className="btn-primary h-9 px-3.5 text-[13px]" onClick={openCreate}>
          <FiPlus /> Add coupon
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data?.length ? (
        <EmptyState
          icon={<FiTag />}
          title="No coupons yet"
          message="Create your first coupon to get started."
        />
      ) : (
        <div className="admin-panel overflow-x-auto">
          <table className="admin-table min-w-[660px]">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min order</th>
                <th>Used</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 font-mono text-[12px] font-semibold text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
                      {c.code}
                    </span>
                  </td>
                  <td className="capitalize text-slate-600 dark:text-slate-300">
                    {c.discount_type}
                  </td>
                  <td className="font-semibold text-slate-900 dark:text-white">
                    {c.discount_type === "percent"
                      ? `${c.value}%`
                      : formatINR(c.value)}
                  </td>
                  <td className="text-slate-500 dark:text-slate-400">
                    {formatINR(c.min_order_amount)}
                  </td>
                  <td>
                    <span className="chip bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                      {c.used_count}
                      {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`chip ${c.is_active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.05] dark:text-slate-400 dark:ring-white/10"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${c.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      {c.is_active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button
                        className="icon-btn"
                        onClick={() => openEdit(c)}
                        aria-label="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="icon-btn-danger"
                        onClick={() => {
                          if (window.confirm(`Delete coupon "${c.code}"?`))
                            remove.mutate(c.id);
                        }}
                        aria-label="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div
            className="modal-card max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 font-display text-lg font-semibold tracking-tight">
              {editing ? "Edit coupon" : "Add coupon"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code">
                <input
                  className="input"
                  value={String(form.code ?? "")}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="Discount type">
                <Select
                  variant="field"
                  className="w-full"
                  value={String(form.discount_type ?? "percent")}
                  onChange={(v) => set("discount_type", v)}
                  options={[
                    { value: "percent", label: "Percentage" },
                    { value: "flat", label: "Flat amount" },
                  ]}
                  label="Discount type"
                />
              </Field>
              <Field
                label={
                  form.discount_type === "percent" ? "Value (%)" : "Value (₹)"
                }
              >
                <input
                  type="number"
                  className="input"
                  value={String(form.value ?? "")}
                  onChange={(e) => set("value", e.target.value)}
                />
              </Field>
              <Field label="Min order amount (₹)">
                <input
                  type="number"
                  className="input"
                  value={String(form.min_order_amount ?? "")}
                  onChange={(e) => set("min_order_amount", e.target.value)}
                />
              </Field>
              <Field label="Max discount (₹, optional)">
                <input
                  type="number"
                  className="input"
                  value={String(form.max_discount ?? "")}
                  onChange={(e) => set("max_discount", e.target.value)}
                />
              </Field>
              <Field label="Total usage limit (optional)">
                <input
                  type="number"
                  className="input"
                  value={String(form.usage_limit ?? "")}
                  onChange={(e) => set("usage_limit", e.target.value)}
                />
              </Field>
              <Field label="Per-user limit">
                <input
                  type="number"
                  className="input"
                  value={String(form.per_user_limit ?? "")}
                  onChange={(e) => set("per_user_limit", e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description (optional)">
                  <input
                    className="input"
                    value={String(form.description ?? "")}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_active)}
                  onChange={(e) => set("is_active", e.target.checked)}
                />{" "}
                Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-outline" onClick={closeForm}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Saving…" : "Save Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
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
