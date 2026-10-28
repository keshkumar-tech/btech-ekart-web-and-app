import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiTag,
  FiBookOpen,
  FiPlus,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui";
import Select from "@/components/store/Select";
import { apiError } from "@/lib/api";
import { catalogService } from "@/services/catalog";
import type { Branch, Category, Subject } from "@/types";

type Tab = "categories" | "branches" | "subjects";

export default function AdminTaxonomy() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("categories");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [editing, setEditing] = useState<{ kind: Tab; id: number } | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);

  const { data: categories, isLoading: l1 } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: catalogService.adminCategories,
  });
  const { data: branches, isLoading: l2 } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: catalogService.adminBranchesAll,
  });
  const { data: subjects, isLoading: l3 } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: catalogService.adminSubjects,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["admin-branches"] });
    qc.invalidateQueries({ queryKey: ["admin-subjects"] });
    // Public lists used across the storefront.
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["branches"] });
    qc.invalidateQueries({ queryKey: ["subjects"] });
    qc.invalidateQueries({ queryKey: ["subjects-all"] });
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (editing) {
        const { id, kind } = editing;
        if (kind === "categories")
          return catalogService.adminUpdateCategory(
            id,
            payload as Partial<Category>,
          );
        if (kind === "branches")
          return catalogService.adminUpdateBranch(
            id,
            payload as Partial<Branch>,
          );
        return catalogService.adminUpdateSubject(id, payload);
      }
      if (tab === "categories")
        return catalogService.adminCreateCategory(payload as Partial<Category>);
      if (tab === "branches")
        return catalogService.adminCreateBranch(payload as Partial<Branch>);
      return catalogService.adminCreateSubject(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Updated" : "Created");
      closeForm();
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: async ({ kind, id }: { kind: Tab; id: number }) => {
      if (kind === "categories") return catalogService.adminDeleteCategory(id);
      if (kind === "branches") return catalogService.adminDeleteBranch(id);
      return catalogService.adminDeleteSubject(id);
    },
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  function openCreate(kind: Tab) {
    setTab(kind);
    setEditing(null);
    setForm(
      kind === "categories"
        ? { name: "", icon: "", description: "", is_active: true }
        : kind === "branches"
          ? { name: "", short_name: "", is_active: true }
          : { name: "", code: "", branch: "", semester: 1 },
    );
    setShowForm(true);
  }

  function openEditCategory(c: Category) {
    setTab("categories");
    setEditing({ kind: "categories", id: c.id });
    setForm({
      name: c.name,
      icon: c.icon,
      description: c.description,
      is_active: c.is_active,
    });
    setShowForm(true);
  }

  function openEditBranch(b: Branch) {
    setTab("branches");
    setEditing({ kind: "branches", id: b.id });
    setForm({ name: b.name, short_name: b.short_name, is_active: b.is_active });
    setShowForm(true);
  }

  function openEditSubject(s: Subject) {
    setTab("subjects");
    setEditing({ kind: "subjects", id: s.id });
    setForm({
      name: s.name,
      code: s.code,
      branch: s.branch?.id || "",
      semester: s.semester,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm({});
  }

  function confirmDelete(kind: Tab, id: number, label: string) {
    if (window.confirm(`Delete "${label}"? This cannot be undone.`))
      remove.mutate({ kind, id });
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <Seo title="Admin — Categories & Branches" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Catalog
          </p>
          <h1 className="admin-title">Catalog setup</h1>
          <p className="admin-subtitle">
            Categories, branches and subjects — changes appear on the storefront
            instantly.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Categories */}
        <div className="admin-panel self-start overflow-hidden">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">Categories</h2>
              <p className="admin-panel-sub">{categories?.length || 0} groups</p>
            </div>
            <button
              className="icon-btn"
              onClick={() => openCreate("categories")}
              aria-label="Add category"
            >
              <FiPlus />
            </button>
          </div>
          {l1 ? (
            <Skeleton className="m-4 h-40" />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {categories?.map((c) => (
                <li
                  key={c.id}
                  className="group flex items-center gap-2 py-2.5 pl-5 pr-3 text-[13px] transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[12px] text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <FiTag />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                      {c.name}
                    </span>
                    <code className="text-[11px] text-slate-400">{c.slug}</code>
                  </span>
                  <span className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      className="icon-btn h-7 w-7"
                      onClick={() => openEditCategory(c)}
                      aria-label="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="icon-btn-danger h-7 w-7"
                      onClick={() => confirmDelete("categories", c.id, c.name)}
                      aria-label="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </span>
                </li>
              ))}
              {!categories?.length && (
                <li className="px-5 py-6 text-center text-[13px] text-slate-400">
                  No categories yet.
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Branches */}
        <div className="admin-panel self-start overflow-hidden">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">Branches</h2>
              <p className="admin-panel-sub">{branches?.length || 0} streams</p>
            </div>
            <button
              className="icon-btn"
              onClick={() => openCreate("branches")}
              aria-label="Add branch"
            >
              <FiPlus />
            </button>
          </div>
          {l2 ? (
            <Skeleton className="m-4 h-40" />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {branches?.map((b) => (
                <li
                  key={b.id}
                  className="group flex items-center gap-2 py-2.5 pl-5 pr-3 text-[13px] transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-50 text-[11px] font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    {b.short_name?.slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                      {b.short_name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">
                      {b.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      className="icon-btn h-7 w-7"
                      onClick={() => openEditBranch(b)}
                      aria-label="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="icon-btn-danger h-7 w-7"
                      onClick={() =>
                        confirmDelete("branches", b.id, b.short_name)
                      }
                      aria-label="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </span>
                </li>
              ))}
              {!branches?.length && (
                <li className="px-5 py-6 text-center text-[13px] text-slate-400">
                  No branches yet.
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Subjects */}
        <div className="admin-panel self-start overflow-hidden">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">Subjects</h2>
              <p className="admin-panel-sub">{subjects?.length || 0} subjects</p>
            </div>
            <button
              className="icon-btn"
              onClick={() => openCreate("subjects")}
              aria-label="Add subject"
            >
              <FiPlus />
            </button>
          </div>
          {l3 ? (
            <Skeleton className="m-4 h-40" />
          ) : (
            <ul className="max-h-[330px] divide-y divide-slate-100 overflow-auto dark:divide-white/[0.05]">
              {subjects?.map((s) => (
                <li
                  key={s.id}
                  className="group flex items-center gap-2 py-2.5 pl-5 pr-3 text-[12.5px] transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-50 text-[12px] text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                    <FiBookOpen />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                      {s.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {s.branch?.short_name} · S{s.semester}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      className="icon-btn h-7 w-7"
                      onClick={() => openEditSubject(s)}
                      aria-label="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="icon-btn-danger h-7 w-7"
                      onClick={() => confirmDelete("subjects", s.id, s.name)}
                      aria-label="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </span>
                </li>
              ))}
              {!subjects?.length && (
                <li className="px-5 py-6 text-center text-[13px] text-slate-400">
                  No subjects yet.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div
            className="modal-card max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold capitalize">
              {editing ? "Edit" : "Add"} {tab.slice(0, -1)}
            </h2>
            <div className="grid gap-4">
              {tab === "categories" && (
                <>
                  <Field label="Name">
                    <input
                      className="input"
                      value={String(form.name ?? "")}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                  <Field label="Icon key (optional)">
                    <input
                      className="input"
                      value={String(form.icon ?? "")}
                      onChange={(e) => set("icon", e.target.value)}
                    />
                  </Field>
                  <Field label="Description (optional)">
                    <textarea
                      className="input min-h-16"
                      value={String(form.description ?? "")}
                      onChange={(e) => set("description", e.target.value)}
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
                </>
              )}

              {tab === "branches" && (
                <>
                  <Field label="Full name">
                    <input
                      className="input"
                      value={String(form.name ?? "")}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                    />
                  </Field>
                  <Field label="Short name">
                    <input
                      className="input"
                      value={String(form.short_name ?? "")}
                      onChange={(e) => set("short_name", e.target.value)}
                      placeholder="e.g. CSE"
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
                </>
              )}

              {tab === "subjects" && (
                <>
                  <Field label="Subject name">
                    <input
                      className="input"
                      value={String(form.name ?? "")}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                  <Field label="Code (optional)">
                    <input
                      className="input"
                      value={String(form.code ?? "")}
                      onChange={(e) => set("code", e.target.value)}
                    />
                  </Field>
                  <Field label="Branch">
                    <Select
                      variant="field"
                      className="w-full"
                      value={String(form.branch ?? "")}
                      onChange={(v) => set("branch", v)}
                      options={[
                        { value: "", label: "Select branch" },
                        ...(branches ?? []).map((b) => ({
                          value: String(b.id),
                          label: `${b.short_name} — ${b.name}`,
                        })),
                      ]}
                      label="Branch"
                    />
                  </Field>
                  <Field label="Semester">
                    <input
                      type="number"
                      min={1}
                      max={8}
                      className="input"
                      value={String(form.semester ?? "")}
                      onChange={(e) => set("semester", e.target.value)}
                    />
                  </Field>
                </>
              )}
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
                {save.isPending ? "Saving…" : "Save"}
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
