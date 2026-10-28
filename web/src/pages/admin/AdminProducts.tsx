import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFileText, FiImage } from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Pagination, Skeleton } from "@/components/ui";
import Select from "@/components/store/Select";
import { apiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { catalogService } from "@/services/catalog";
import { PRODUCT_TYPE_LABELS, formatINR, mediaUrl } from "@/lib/utils";
import type { Product } from "@/types";

const PAGE_SIZE = 12;
const EMPTY = {
  title: "",
  description: "",
  type: "notes",
  price: "",
  mrp: "",
  branch: "",
  semester: "",
  subject_code: "",
  page_count: "",
  tags: "",
  is_active: true,
  is_trending: false,
  is_new_arrival: false,
};

export default function AdminProducts() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
  const [cover, setCover] = useState<File | null>(null);
  const [previewPdf, setPreviewPdf] = useState<File | null>(null);
  const [mainPdf, setMainPdf] = useState<File | null>(null);

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: catalogService.branches,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, q],
    queryFn: () =>
      catalogService.adminProducts({
        page,
        q: q || undefined,
        page_size: PAGE_SIZE,
      }),
  });

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, String(v));
      });
      // Cover image is OPTIONAL. When omitted, the backend renders the first
      // page of the main PDF and uses it as the cover automatically.
      if (cover) fd.append("cover_image", cover);
      if (previewPdf) fd.append("preview_pdf", previewPdf);
      if (mainPdf) fd.append("main_pdf", mainPdf);

      if (editing) return catalogService.adminUpdateProduct(editing.id, fd);
      return catalogService.adminCreateProduct(fd);
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => catalogService.adminDeleteProduct(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setCover(null);
    setPreviewPdf(null);
    setMainPdf(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description,
      type: p.type,
      price: p.price,
      mrp: p.mrp,
      branch: p.branch?.id || "",
      semester: p.semester || "",
      subject_code: p.subject_code,
      page_count: p.page_count || "",
      tags: p.tags,
      is_active: p.is_active,
      is_trending: p.is_trending,
      is_new_arrival: p.is_new_arrival,
    });
    setCover(null);
    setPreviewPdf(null);
    setMainPdf(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
    setCover(null);
    setPreviewPdf(null);
    setMainPdf(null);
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <Seo title="Admin — Products" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Catalog
          </p>
          <h1 className="admin-title">Products</h1>
          <p className="admin-subtitle">
            {data?.count ?? 0} digital products in the store
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search products…"
              className="input h-9 w-56 pl-9 text-[13px]"
            />
          </div>
          <button className="btn-primary h-9 px-3.5 text-[13px]" onClick={openCreate}>
            <FiPlus /> Add product
          </button>
        </div>
      </div>

      {isAdmin && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-relaxed text-indigo-700 dark:border-indigo-400/15 dark:bg-indigo-400/[0.06] dark:text-indigo-300">
          <FiImage className="mt-0.5 shrink-0" />
          <span>
            Uploads (cover image, preview PDF, private main PDF) are handled
            here. The cover image is{" "}
            <span className="font-semibold">optional</span> — leave it empty and
            the first page of the main PDF becomes the cover automatically.
          </span>
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          title="No products"
          message="Add your first product to get started."
        />
      ) : (
        <>
          <div className="admin-panel overflow-x-auto">
            <table className="admin-table min-w-[840px]">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Branch / Sem</th>
                  <th>Price</th>
                  <th>Files</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-white/10">
                          {p.cover_image && (
                            <img
                              src={mediaUrl(p.cover_image)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium text-slate-800 dark:text-slate-100">
                            {p.title}
                          </p>
                          <p className="text-[11.5px] text-slate-400">
                            {p.subject_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="chip bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                        {PRODUCT_TYPE_LABELS[p.type]}
                      </span>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {p.branch?.short_name || "—"}
                      <span className="text-slate-400"> · S{p.semester || "—"}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatINR(p.price)}
                      </span>{" "}
                      <span className="text-[11.5px] text-slate-400 line-through">
                        {formatINR(p.mrp)}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <span
                          title="cover image"
                          className={`grid h-6 w-6 place-items-center rounded-md text-[11px] ${p.cover_image ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-100 text-slate-300 dark:bg-white/[0.05] dark:text-slate-600"}`}
                        >
                          <FiImage />
                        </span>
                        <span
                          title="main pdf"
                          className={`grid h-6 w-6 place-items-center rounded-md text-[11px] ${p.is_active ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400" : "bg-slate-100 text-slate-300 dark:bg-white/[0.05] dark:text-slate-600"}`}
                        >
                          <FiFileText />
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`chip ${p.is_active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-white/[0.05] dark:text-slate-400 dark:ring-white/10"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(p)}
                          aria-label="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="icon-btn-danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${p.title}"? This cannot be undone.`,
                              )
                            )
                              remove.mutate(p.id);
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
          <Pagination
            page={page}
            count={data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div
            className="modal-card max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 font-display text-lg font-semibold tracking-tight">
              {editing ? "Edit product" : "Add product"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input
                  className="input"
                  value={String(form.title)}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">
                  Description <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  className="input min-h-20"
                  value={String(form.description)}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Type</label>
                <Select
                  variant="field"
                  className="w-full"
                  value={String(form.type)}
                  onChange={(v) => set("type", v)}
                  options={Object.entries(PRODUCT_TYPE_LABELS).map(
                    ([value, label]) => ({ value, label }),
                  )}
                  label="Product type"
                />
              </div>
              <div>
                <label className="label">Branch</label>
                <Select
                  variant="field"
                  className="w-full"
                  value={String(form.branch)}
                  onChange={(v) => set("branch", v)}
                  options={[
                    { value: "", label: "None" },
                    ...(branches ?? []).map((b) => ({
                      value: String(b.id),
                      label: b.short_name,
                    })),
                  ]}
                  label="Branch"
                />
              </div>
              <div>
                <label className="label">Price (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={String(form.price)}
                  onChange={(e) => set("price", e.target.value)}
                />
              </div>
              <div>
                <label className="label">MRP (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={String(form.mrp)}
                  onChange={(e) => set("mrp", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Semester</label>
                <input
                  type="number"
                  className="input"
                  value={String(form.semester)}
                  onChange={(e) => set("semester", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Subject code</label>
                <input
                  className="input"
                  value={String(form.subject_code)}
                  onChange={(e) => set("subject_code", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Page count</label>
                <input
                  type="number"
                  className="input"
                  value={String(form.page_count)}
                  onChange={(e) => set("page_count", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Tags (comma-sep)</label>
                <input
                  className="input"
                  value={String(form.tags)}
                  onChange={(e) => set("tags", e.target.value)}
                />
              </div>
              <div>
                <label className="label">
                  Cover image <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                />
                <p className="mt-1 text-[11.5px] text-slate-400">
                  Leave empty to auto-use the first page of the main PDF as the
                  cover.
                </p>
              </div>
              <div>
                <label className="label">Preview PDF (public)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="input"
                  onChange={(e) => setPreviewPdf(e.target.files?.[0] || null)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">
                  Main PDF (PRIVATE — buyers only)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="input"
                  onChange={(e) => setMainPdf(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex flex-wrap gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_active)}
                    onChange={(e) => set("is_active", e.target.checked)}
                  />{" "}
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_trending)}
                    onChange={(e) => set("is_trending", e.target.checked)}
                  />{" "}
                  Trending
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_new_arrival)}
                    onChange={(e) => set("is_new_arrival", e.target.checked)}
                  />{" "}
                  New arrival
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
              <button className="btn-outline text-[13px]" onClick={closeForm}>
                Cancel
              </button>
              <button
                className="btn-primary text-[13px]"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Saving…" : "Save product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
