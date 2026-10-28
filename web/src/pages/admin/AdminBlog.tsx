import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiFileText,
  FiEdit2,
  FiEye,
  FiPlus,
  FiTrash2,
  FiTag,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { EmptyState, Pagination, Skeleton } from "@/components/ui";
import Select from "@/components/store/Select";
import { apiError } from "@/lib/api";
import { blogService } from "@/services/content";
import { formatDate, mediaUrl } from "@/lib/utils";
import type { BlogCategory, BlogPost } from "@/types";

const PAGE_SIZE = 10;
const EMPTY_POST = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  tags: "",
  read_minutes: 4,
  is_published: true,
};

export default function AdminBlog() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCatForm, setShowCatForm] = useState(false);
  const [postForm, setPostForm] = useState<Record<string, unknown> | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [catForm, setCatForm] = useState<Record<string, unknown>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog-posts", page],
    queryFn: () => blogService.adminPosts({ page }),
  });
  const { data: cats } = useQuery({
    queryKey: ["admin-blog-cats"],
    queryFn: blogService.adminCategories,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    qc.invalidateQueries({ queryKey: ["admin-blog-cats"] });
    qc.invalidateQueries({ queryKey: ["admin-blog"] });
    qc.invalidateQueries({ queryKey: ["blog-categories"] });
  }

  const savePost = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(postForm ?? {}).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, String(v));
      });
      if (cover) fd.append("cover_image", cover);
      if (editingPost) return blogService.adminUpdatePost(editingPost.id, fd);
      return blogService.adminCreatePost(fd);
    },
    onSuccess: () => {
      toast.success(editingPost ? "Post updated" : "Post created");
      closePostForm();
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const removePost = useMutation({
    mutationFn: (id: number) => blogService.adminDeletePost(id),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const saveCat = useMutation({
    mutationFn: () => blogService.adminCreateCategory(catForm),
    onSuccess: () => {
      toast.success("Category added");
      setCatForm({});
      setShowCatForm(false);
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const removeCat = useMutation({
    mutationFn: (id: number) => blogService.adminDeleteCategory(id),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  function openCreatePost() {
    setEditingPost(null);
    setPostForm({ ...EMPTY_POST });
    setCover(null);
  }

  function openEditPost(p: BlogPost) {
    setEditingPost(p);
    setPostForm({
      title: p.title,
      excerpt: p.excerpt,
      content: p.content ?? "",
      category: p.category?.id ?? "",
      tags: (p.tags_list || []).join(", "),
      read_minutes: p.read_minutes,
      is_published: p.is_published,
    });
    setCover(null);
  }

  function closePostForm() {
    setEditingPost(null);
    setPostForm(null);
    setCover(null);
  }

  const setP = (k: string, v: unknown) =>
    setPostForm((f) => ({ ...(f ?? {}), [k]: v }));

  return (
    <div>
      <Seo title="Admin — Blog" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Content
          </p>
          <h1 className="admin-title">Blog</h1>
          <p className="admin-subtitle">{data?.count ?? 0} posts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-sm-neutral h-9"
            onClick={() => setShowCatForm((v) => !v)}
          >
            <FiTag /> Categories
          </button>
          <button
            className="btn-primary h-9 px-3.5 text-[13px]"
            onClick={openCreatePost}
          >
            <FiPlus /> New post
          </button>
        </div>
      </div>

      {showCatForm && (
        <div className="admin-panel mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-900 dark:text-white">
              <FiTag className="text-indigo-500" /> Blog categories
            </h2>
            <button
              className="icon-btn h-7 w-7"
              onClick={() => setShowCatForm(false)}
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {cats?.map((c: BlogCategory) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11.5px] font-medium text-slate-700 dark:bg-white/[0.06] dark:text-slate-200"
              >
                {c.name}
                <button
                  className="text-slate-400 transition-colors hover:text-rose-500"
                  onClick={() => {
                    if (window.confirm(`Delete category "${c.name}"?`))
                      removeCat.mutate(c.id);
                  }}
                  aria-label="Delete category"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            ))}
            {!cats?.length && (
              <span className="text-[12.5px] text-slate-400">
                No categories yet.
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="input h-9 w-52 text-[13px]"
              placeholder="New category name"
              value={String(catForm.name ?? "")}
              onChange={(e) =>
                setCatForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <button
              className="btn-primary h-9 px-3.5 text-[13px]"
              disabled={saveCat.isPending || !catForm.name}
              onClick={() => saveCat.mutate()}
            >
              <FiPlus /> Add
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          icon={<FiFileText />}
          title="No blog posts"
          message="Create your first post to get started."
        />
      ) : (
        <>
          <div className="admin-panel divide-y divide-slate-100 dark:divide-white/[0.05]">
            {data.results.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
              >
                <div className="h-12 w-[68px] shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-white/10">
                  {p.cover_image && (
                    <img
                      src={mediaUrl(p.cover_image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                    {p.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-slate-400">
                    <span>{p.category?.name || "Uncategorised"}</span>
                    <span>·</span>
                    <span>{formatDate(p.published_at || p.created_at)}</span>
                    <span>·</span>
                    <span>{p.views} views</span>
                    <span
                      className={`chip ml-0.5 ${p.is_published ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}
                    >
                      {p.is_published ? "Published" : "Draft"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link to={`/blog/${p.slug}`} className="icon-btn" title="View">
                    <FiEye />
                  </Link>
                  <button
                    className="icon-btn"
                    onClick={() => openEditPost(p)}
                    title="Edit"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="icon-btn-danger"
                    onClick={() => {
                      if (window.confirm(`Delete "${p.title}"?`))
                        removePost.mutate(p.id);
                    }}
                    aria-label="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            count={data.count}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}

      {postForm && (
        <div className="modal-backdrop" onClick={closePostForm}>
          <div
            className="modal-card max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">
              {editingPost ? "Edit Post" : "New Post"}
            </h2>
            <div className="grid gap-4">
              <Field label="Title">
                <input
                  className="input"
                  value={String(postForm.title ?? "")}
                  onChange={(e) => setP("title", e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <Select
                    variant="field"
                    className="w-full"
                    value={String(postForm.category ?? "")}
                    onChange={(v) => setP("category", v)}
                    options={[
                      { value: "", label: "Uncategorised" },
                      ...(cats ?? []).map((c) => ({
                        value: String(c.id),
                        label: c.name,
                      })),
                    ]}
                    label="Blog category"
                  />
                </Field>
                <Field label="Read minutes">
                  <input
                    type="number"
                    className="input"
                    value={String(postForm.read_minutes ?? "")}
                    onChange={(e) => setP("read_minutes", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Excerpt (optional)">
                <input
                  className="input"
                  value={String(postForm.excerpt ?? "")}
                  onChange={(e) => setP("excerpt", e.target.value)}
                />
              </Field>
              <Field label="Content (HTML / rich text)">
                <textarea
                  className="input min-h-40 font-mono text-xs"
                  value={String(postForm.content ?? "")}
                  onChange={(e) => setP("content", e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tags (comma-separated)">
                  <input
                    className="input"
                    value={String(postForm.tags ?? "")}
                    onChange={(e) => setP("tags", e.target.value)}
                  />
                </Field>
                <Field
                  label={`Cover image ${editingPost ? "(leave empty to keep)" : ""}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => setCover(e.target.files?.[0] || null)}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(postForm.is_published)}
                  onChange={(e) => setP("is_published", e.target.checked)}
                />{" "}
                Published
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-outline" onClick={closePostForm}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={savePost.isPending}
                onClick={() => savePost.mutate()}
              >
                {savePost.isPending ? "Saving…" : "Save Post"}
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
