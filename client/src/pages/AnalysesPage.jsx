import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, FileText, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { analysisService } from "../services/analysisService";
import { formatDate } from "../lib/utils";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";
import { useAppRefresh } from "../hooks/useAppRefresh";

export const AnalysesPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await analysisService.list();
      setItems(response.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  useAppRefresh(fetchAnalyses);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(target._id);

    const previous = items;
    setItems((prev) => prev.filter((a) => a._id !== target._id));

    try {
      await analysisService.delete(target._id);
      toast("Analysis deleted successfully", "success");
      emitAppRefresh({ entity: "analysis", action: "delete" });
    } catch (error) {
      setItems(previous);
      toast(
        error.response?.data?.message || "Failed to delete analysis",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-300";
    if (score >= 60) return "text-cyan-300";
    if (score >= 40) return "text-yellow-300";
    return "text-rose-300";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-emerald-500/20";
    if (score >= 60) return "bg-cyan-500/20";
    if (score >= 40) return "bg-yellow-500/20";
    return "bg-rose-500/20";
  };

  if (loading) {
    return <div className="text-slate-300">Loading analyses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Analyses</h1>
        {items.length > 0 && (
          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-300">
            {items.length} completed
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-slate-300">
            No analyses yet.{" "}
            <Link to="/upload" className="text-cyan-300 hover:text-cyan-200">
              Run your first analysis
            </Link>
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Link
              key={a._id}
              to={`/analysis?id=${a._id}`}
              className="no-underline"
            >
              <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${getScoreBg(a.atsScore)}`}
                    >
                      <TrendingUp
                        size={20}
                        className={getScoreColor(a.atsScore)}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-lg">
                        {a.roleTitle || "Untitled Role"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDate(a.createdAt)}</span>
                        {a.resume?.fileName && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FileText size={12} />
                              {a.resume.fileName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`text-3xl font-bold ${getScoreColor(a.atsScore)}`}
                      >
                        {a.atsScore}
                      </p>
                      <p className="text-xs text-slate-400">ATS Score</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteTarget(a);
                      }}
                      disabled={deletingId === a._id}
                      className="rounded-lg bg-rose-500/20 p-2 text-rose-300 transition-all duration-300 hover:scale-105 hover:bg-rose-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {(a.matchingSkills?.length > 0 ||
                  a.missingSkills?.length > 0) && (
                  <div className="mt-3 flex gap-4 text-xs text-slate-300">
                    {a.matchingSkills?.length > 0 && (
                      <span className="text-emerald-300">
                        ✓ {a.matchingSkills.length} skills matched
                      </span>
                    )}
                    {a.missingSkills?.length > 0 && (
                      <span className="text-rose-300">
                        ✗ {a.missingSkills.length} skills missing
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Statistics */}
      {items.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Overview</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Average ATS
              </p>
              <p className="text-2xl font-bold text-white">
                {Math.round(
                  items.reduce((sum, a) => sum + a.atsScore, 0) / items.length,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Highest Score
              </p>
              <p className="text-2xl font-bold text-emerald-300">
                {Math.max(...items.map((a) => a.atsScore))}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Lowest Score
              </p>
              <p className="text-2xl font-bold text-rose-300">
                {Math.min(...items.map((a) => a.atsScore))}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Total Analyses
              </p>
              <p className="text-2xl font-bold text-cyan-300">{items.length}</p>
            </div>
          </div>
        </Card>
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete Analysis?"
        description="This action cannot be undone. The analysis report, related ATS data, and interview prep records will be removed from your account."
        confirmLabel="Delete Analysis"
        cancelLabel="Cancel"
        loading={Boolean(deletingId)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
