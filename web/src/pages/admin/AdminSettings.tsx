import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiSettings, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui";
import { apiError } from "@/lib/api";
import { catalogService } from "@/services/catalog";
import { mediaUrl } from "@/lib/utils";
import type { SiteSetting } from "@/types";

const KNOWN_KEYS = [
  { key: "upi_qr_image", label: "UPI QR Code Image", image: true },
  { key: "whatsapp_link", label: "WhatsApp Link", image: false },
  { key: "telegram_link", label: "Telegram Link", image: false },
  { key: "support_email", label: "Support Email", image: false },
  { key: "support_phone", label: "Support Phone", image: false },
  { key: "about_text", label: "About Text", image: false },
];

export default function AdminSettings() {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: catalogService.adminSettings,
  });

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    data.forEach((s) => {
      next[s.key] = s.value || "";
    });
    setDrafts(next);
  }, [data]);

  const save = useMutation({
    mutationFn: async ({ setting, value, file }: {
      setting: SiteSetting;
      value: string;
      file?: File | null;
    }) => {
      const fd = new FormData();
      fd.append("key", setting.key);
      fd.append("value", value ?? "");
      if (file) fd.append("image", file);
      return catalogService.adminUpdateSetting(setting.id, fd);
    },
    onSuccess: (_d, vars) => {
      toast.success(`${vars.setting.key} saved`);
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const create = useMutation({
    mutationFn: (key: string) => {
      const fd = new FormData();
      fd.append("key", key);
      fd.append("value", "");
      return catalogService.adminCreateSetting(fd);
    },
    onSuccess: () => {
      toast.success("Setting added");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => catalogService.adminDeleteSetting(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const existingKeys = new Set((data ?? []).map((s) => s.key));
  const missingKeys = KNOWN_KEYS.filter((k) => !existingKeys.has(k.key));

  return (
    <div>
      <Seo title="Admin — Site Settings" noindex />
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            System
          </p>
          <h1 className="admin-title">Site settings</h1>
          <p className="admin-subtitle">
            UPI QR, contact info and storefront links.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((s) => {
            const meta = KNOWN_KEYS.find((k) => k.key === s.key);
            return (
              <div key={s.id} className="admin-panel p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                      {meta?.label ?? s.key}
                    </p>
                    <code className="mt-1 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                      {s.key}
                    </code>
                  </div>
                  <button
                    className="icon-btn-danger"
                    onClick={() => {
                      if (window.confirm(`Delete setting "${s.key}"?`))
                        remove.mutate(s.id);
                    }}
                    aria-label="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                {meta?.image && (
                  <div className="mb-3">
                    {s.image ? (
                      <img
                        src={mediaUrl(s.image)}
                        alt={s.key}
                        className="h-28 w-28 rounded-lg border border-slate-200 object-contain dark:border-white/10"
                      />
                    ) : (
                      <p className="text-[11.5px] text-slate-400">
                        No image uploaded.
                      </p>
                    )}
                  </div>
                )}

                <input
                  className="input"
                  placeholder={meta?.image ? "Optional caption / value" : ""}
                  value={drafts[s.key] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [s.key]: e.target.value }))
                  }
                />

                {meta?.image && (
                  <input
                    type="file"
                    accept="image/*"
                    className="input mt-2"
                    onChange={(e) =>
                      setFiles((f) => ({
                        ...f,
                        [s.key]: e.target.files?.[0] || null,
                      }))
                    }
                  />
                )}

                <button
                  className="btn-primary mt-3 w-full text-[13px]"
                  disabled={save.isPending}
                  onClick={() =>
                    save.mutate({
                      setting: s,
                      value: drafts[s.key] ?? "",
                      file: files[s.key] ?? null,
                    })
                  }
                >
                  <FiSave /> Save changes
                </button>
              </div>
            );
          })}
        </div>
      )}

      {missingKeys.length > 0 && (
        <div className="admin-panel mt-5 p-5">
          <h2 className="mb-1 flex items-center gap-2 text-[14px] font-semibold text-slate-900 dark:text-white">
            <FiSettings className="text-indigo-500" /> Add a missing setting
          </h2>
          <p className="mb-3 text-[12px] text-slate-500 dark:text-slate-400">
            These keys exist in the app but are not created in the database yet.
          </p>
          <div className="flex flex-wrap gap-2">
            {missingKeys.map((k) => (
              <button
                key={k.key}
                className="btn-sm-neutral h-8"
                disabled={create.isPending}
                onClick={() => create.mutate(k.key)}
              >
                <FiPlus /> {k.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
