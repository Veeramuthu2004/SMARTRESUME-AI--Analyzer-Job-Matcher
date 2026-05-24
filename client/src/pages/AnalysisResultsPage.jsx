import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { Card } from "../components/ui/Card";
import { ProgressBar } from "../components/ui/ProgressBar";
import { analysisService } from "../services/analysisService";
import { useAuth } from "../context/AuthContext";
import { useAppRefresh } from "../hooks/useAppRefresh";
import { useToast } from "../hooks/useToast";

export const AnalysisResultsPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const analysisId = params.get("id");
  const { user } = useAuth();
  const { toast } = useToast();
  const handleExport = async () => {
    if (!analysis?._id) return;
    // check client-side subscription state and show friendly message if not allowed
    const allowed =
      user?.plan === "pro" ||
      user?.subscriptionPlan === "pro" ||
      user?.role === "admin";
    if (!allowed) {
      toast("Upgrade to Pro to export analysis reports", "error");
      return;
    }
    setExporting(true);
    try {
      const blob = await analysisService.exportPdf(analysis._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-${analysis._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchAnalysis = async (id) => {
      try {
        if (!id) {
          setLoading(false);
          return;
        }
        const response = await analysisService.getById(id);
        setAnalysis(response.analysis);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis(analysisId);
  }, [analysisId]);

  // reload analysis if a related real-time event is received
  useAppRefresh((e) => {
    const d = e?.detail || {};
    if (d.entity === "analysis") {
      // if it's this analysis, re-fetch
      const payload = d.payload || {};
      if (
        !payload.analysisId ||
        String(payload.analysisId) === String(analysisId)
      ) {
        (async () => {
          setLoading(true);
          try {
            const response = await analysisService.getById(analysisId);
            setAnalysis(response.analysis);
          } catch (err) {
            // ignore
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  });

  if (loading) {
    return <div className="text-slate-300">Loading analysis...</div>;
  }

  if (!analysis) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/analyses")}
          className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft size={20} /> Back to Analyses
        </button>
        <Card>
          <p className="text-slate-300">
            No analysis selected. Go to{" "}
            <button
              onClick={() => navigate("/upload")}
              className="text-cyan-300 hover:text-cyan-200"
            >
              upload
            </button>{" "}
            to create one.
          </p>
        </Card>
      </div>
    );
  }

  const skillBadgeClass =
    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors";
  const matchingSkillClass =
    "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-200";
  const missingSkillClass =
    "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-200";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/analyses")}
          className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft size={20} /> Back to Analyses
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-60"
        >
          <Download size={16} /> {exporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      <h1 className="text-3xl font-bold text-white">
        {analysis.roleTitle || "Analysis Results"}
      </h1>

      {/* ATS Score Card */}
      <Card>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          ATS Compatibility Score
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-5xl font-bold text-slate-900 dark:text-white">
              {analysis.atsScore}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              /100
            </p>
          </div>
          <div className="flex-1 ml-6">
            <ProgressBar value={analysis.atsScore} />
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {analysis.atsScore >= 80
                ? "Excellent match"
                : analysis.atsScore >= 60
                  ? "Good match"
                  : "Needs improvement"}
            </p>
          </div>
        </div>
      </Card>

      {/* Skills */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            Matching Skills ({analysis.matchingSkills?.length || 0})
          </h2>
          {analysis.matchingSkills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.matchingSkills.map((skill) => (
                <span
                  key={skill}
                  className={`${skillBadgeClass} ${matchingSkillClass}`}
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No matching skills found
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            Missing Skills ({analysis.missingSkills?.length || 0})
          </h2>
          {analysis.missingSkills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills.map((skill) => (
                <span
                  key={skill}
                  className={`${skillBadgeClass} ${missingSkillClass}`}
                >
                  ✗ {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              All skills match!
            </p>
          )}
        </Card>
      </div>

      {/* Suggestions */}
      {analysis.suggestions?.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            AI Suggestions
          </h2>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-cyan-600 dark:text-cyan-300">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            Recommendations
          </h2>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            {analysis.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-indigo-600 dark:text-indigo-300">→</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Cover Letter */}
      {analysis.coverLetter && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            Generated Cover Letter
          </h2>
          <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-900/50">
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
              {analysis.coverLetter}
            </p>
          </div>
        </Card>
      )}

      {/* Interview Prep */}
      {analysis.interviewPrep && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            Interview Preparation
          </h2>
          <div className="space-y-4">
            {(
              analysis.interviewPrep.technicalQuestions ||
              analysis.interviewPrep.technical
            )?.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-cyan-700 dark:text-cyan-300">
                  Technical Questions
                </h3>
                <ul className="space-y-2">
                  {(
                    analysis.interviewPrep.technicalQuestions ||
                    analysis.interviewPrep.technical
                  ).map((q, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-700 dark:text-slate-200"
                    >
                      <span className="text-cyan-700 dark:text-cyan-300">
                        Q{i + 1}:
                      </span>{" "}
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(
              analysis.interviewPrep.behavioralQuestions ||
              analysis.interviewPrep.behavioral
            )?.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-indigo-700 dark:text-indigo-300">
                  Behavioral Questions
                </h3>
                <ul className="space-y-2">
                  {(
                    analysis.interviewPrep.behavioralQuestions ||
                    analysis.interviewPrep.behavioral
                  ).map((q, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-700 dark:text-slate-200"
                    >
                      <span className="text-indigo-700 dark:text-indigo-300">
                        Q{i + 1}:
                      </span>{" "}
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.interviewPrep.tips && (
              <div>
                <h3 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-300">
                  Tips
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {analysis.interviewPrep.tips}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
