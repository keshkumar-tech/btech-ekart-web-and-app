import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiImage,
  FiExternalLink,
  FiPlus,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Skeleton } from "@/components/ui";
import { apiError } from "@/lib/api";
import { catalogService } from "@/services/catalog";
import { mediaUrl } from "@/lib/utils";
import type { Banner } from "@/types";

const EMPTY = {
  title: "",
  subtitle: "",
  link: "",
  badge_text: "",
  is_active: true,
};

export default function AdminBanners() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
  const [image, setImage] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: catalogService.adminBannersAll,
  });

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, String(v));
      });
      if (image) fd.append("image", image);
      if (editing) return catalogService.adminUpdateBanner(editing.id, fd);
      return catalogService.adminCreateBanner(fd);
    },
    onSuccess: () => {
      toast.success(editing ? "Banner updated" : "Banner created");
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => catalogService.adminDeleteBanner(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setImage(null);
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      link: b.link,
      badge_text: b.badge_text,
      is_active: b.is_active,
    });
    setImage(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
    setImage(null);
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <Seo title="Admin — Banners" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Content
          </p>
          <h1 className="admin-title">Banners</h1>
          <p className="admin-subtitle">Home-page promotional banners</p>
        </div>
        <button className="btn-primary h-9 px-3.5 text-[13px]" onClick={openCreate}>
          <FiPlus /> Add banner
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<FiImage />}
          title="No banners"
          message="Add your first banner to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => (
            <div
              key={b.id}
              className="admin-panel group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.22)]"
            >
              <div className="relative aspect-[2/1] overflow-hidden bg-slate-100 dark:bg-slate-800">
                {b.image && (
                  <img
                    src={mediaUrl(b.image)}
                    alt={b.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                <span
                  className={`absolute left-3 top-3 chip ring-1 backdrop-blur ${b.is_active ? "bg-emerald-50/90 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-white/90 text-slate-500 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-white/10"}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${b.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                  />
                  {b.is_active ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="truncate text-[13.5px] font-semibold text-slate-900 dark:text-white">
                  {b.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-slate-500 dark:text-slate-400">
                  {b.subtitle}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {b.link ? (
                    <a
                      href={b.link}
                      className="inline-flex min-w-0 items-center gap-1 text-[11.5px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <FiExternalLink className="shrink-0" />
                      <span className="truncate">{b.link}</span>
                    </a>
                  ) : (
                    <span className="text-[11.5px] text-slate-400">No link</span>
                  )}
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      className="icon-btn"
                      onClick={() => openEdit(b)}
                      aria-label="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="icon-btn-danger"
                      onClick={() => {
                        if (window.confirm(`Delete "${b.title}"?`))
                          remove.mutate(b.id);
                      }}
                      aria-label="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div
            className="modal-card max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 font-display text-lg font-semibold tracking-tight">
              {editing ? "Edit banner" : "Add banner"}
            </h2>
            <div className="grid gap-4">
              <Field label="Title">
                <input
                  className="input"
                  value={String(form.title ?? "")}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <Field label="Subtitle (optional)">
                <input
                  className="input"
                  value={String(form.subtitle ?? "")}
                  onChange={(e) => set("subtitle", e.target.value)}
                />
              </Field>
              <Field label="Badge text (optional)">
                <input
                  className="input"
                  value={String(form.badge_text ?? "")}
                  onChange={(e) => set("badge_text", e.target.value)}
                />
              </Field>
              <Field label="Link (optional)">
                <input
                  className="input"
                  value={String(form.link ?? "")}
                  onChange={(e) => set("link", e.target.value)}
                  placeholder="/products or https://…"
                />
              </Field>
              <Field label={`Image ${editing ? "(leave empty to keep)" : ""}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
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
                {save.isPending ? "Saving…" : "Save Banner"}
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
