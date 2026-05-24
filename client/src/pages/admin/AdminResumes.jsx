import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import { useToast } from "../../hooks/useToast";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { FilterBar } from "../../components/ui/FilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  adminButtonClass,
  adminDangerButtonClass,
  adminPageLeadClass,
  adminPageTitleClass,
} from "../../components/admin/adminUi";

export default function AdminResumes() {
  const [resumes, setResumes] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminService.listResumes();
      setResumes(r.resumes || []);
    } catch (e) {
      toast("Failed to load resumes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const h = (e) => {
      if (!e?.detail?.type) return;
      if (String(e.detail.type).toLowerCase().includes("resume")) load();
    };
    window.addEventListener("admin-update", h);
    return () => window.removeEventListener("admin-update", h);
  }, []);

  useAdminSocket();

  const filtered = resumes.filter((resume) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [resume.fileName, resume.user?.email, resume.user?.name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id) => {
    setConfirmConfig({
      title: "Delete resume",
      description: "Delete this resume and related analysis data?",
      tone: "danger",
      onConfirm: async () => {
        try {
          await adminService.deleteResume(id);
          toast("Resume deleted", "success");
          load();
        } catch (e) {
          toast(e?.response?.data?.message || "Delete failed", "error");
        } finally {
          setConfirmOpen(false);
        }
      },
    });
    setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Resume Monitoring</h1>
        <p className={adminPageLeadClass}>
          Track uploads, review file sizes, and remove bad documents fast.
        </p>
      </div>
      <FilterBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search file or user..."
      />
      <Card>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-200">
            {items.length === 0 ? (
              <p className="py-8 text-center text-slate-500 dark:text-slate-400">
                No resumes found.
              </p>
            ) : (
              items.map((r) => (
                <div
                  key={r._id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {r.fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.user?.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Uploaded {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                      {Math.round((r.size || 0) / 1024)} KB
                    </div>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className={adminDangerButtonClass}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Pagination page={page} pages={totalPages} onChange={setPage} />
        </div>
      </Card>
      {confirmConfig && (
        <ConfirmationModal
          open={confirmOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          tone={confirmConfig.tone}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
