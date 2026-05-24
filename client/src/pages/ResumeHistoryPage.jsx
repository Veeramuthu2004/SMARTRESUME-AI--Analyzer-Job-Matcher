import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { resumeService } from "../services/resumeService";
import { formatDate } from "../lib/utils";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";
import { useAppRefresh } from "../hooks/useAppRefresh";

export const ResumeHistoryPage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await resumeService.listResumes();
      setResumes(response.resumes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useAppRefresh(loadResumes);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target._id);

    const previous = resumes;
    setResumes((prev) => prev.filter((r) => r._id !== target._id));

    try {
      await resumeService.delete(target._id);
      toast("Resume deleted successfully", "success");
      emitAppRefresh({ entity: "resume", action: "delete" });
    } catch (error) {
      setResumes(previous);
      toast(
        error.response?.data?.message || "Failed to delete resume",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-slate-300">Loading resumes...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Resume History</h1>

      {resumes.length === 0 ? (
        <Card>
          <p className="text-slate-300">
            No resumes uploaded yet.{" "}
            <Link to="/upload" className="text-cyan-300 hover:text-cyan-200">
              Upload your first resume
            </Link>
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <Card
              key={resume._id}
              className="flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <Link
                to={`/resume/${resume._id}`}
                className="flex-1 flex items-center gap-4 hover:no-underline"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-semibold text-white hover:text-cyan-300">
                    {resume.fileName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(resume.createdAt)} •{" "}
                    {Math.round(resume.size / 1024)} KB
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  to={`/resume/${resume._id}`}
                  className="rounded-lg bg-slate-700/50 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="View details"
                >
                  <FileText size={16} />
                </Link>
                <button
                  onClick={() => setDeleteTarget(resume)}
                  disabled={deletingId === resume._id}
                  className="rounded-lg bg-rose-500/20 p-2 text-rose-300 transition-all duration-300 hover:scale-105 hover:bg-rose-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {resumes.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Summary</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Total Resumes
              </p>
              <p className="text-2xl font-bold text-white">{resumes.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Total Size
              </p>
              <p className="text-2xl font-bold text-white">
                {Math.round(resumes.reduce((sum, r) => sum + r.size, 0) / 1024)}{" "}
                KB
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Latest Upload
              </p>
              <p className="text-lg font-bold text-white">
                {formatDate(resumes[0]?.createdAt)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.fileName || "this resume"}"?`}
        description="This action cannot be undone. The resume and all related analysis records will be removed from your account."
        confirmLabel="Delete Resume"
        cancelLabel="Cancel"
        loading={Boolean(deletingId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
