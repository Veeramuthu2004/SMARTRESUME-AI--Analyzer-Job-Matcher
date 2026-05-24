import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { resumeService } from "../services/resumeService";
import { jobService } from "../services/jobService";
import { useToast } from "../hooks/useToast";

export const JobMatchPage = () => {
  const [jobText, setJobText] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [resumes, setResumes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const r = await resumeService.listResumes();
        setResumes(r.resumes || r.items || []);
      } catch {
        setResumes([]);
      } finally {
        setLoadingResumes(false);
      }
    };
    load();
  }, []);

  const runMatch = async () => {
    if (!jobText.trim()) return;
    setBusy(true);
    try {
      const data = await jobService.match({ resumeId, jobText });
      setResult(data);
    } catch (e) {
      toast(e.response?.data?.message || e.message || "Match failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        Job Description Matcher
      </motion.h1>

      {loadingResumes && (
        <div className="grid gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-28" />
        </div>
      )}

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="col-span-1 rounded-lg border border-slate-200/60 bg-white/70 px-3 py-2 text-sm dark:bg-slate-900/60 dark:border-slate-700"
          >
            <option value="">Select resume (or paste resume later)</option>
            {resumes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.fileName}
              </option>
            ))}
          </select>
          <div className="col-span-2">
            <textarea
              rows={6}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste job description here..."
              className="w-full rounded-xl border border-white/20 bg-slate-900/40 p-3 text-sm text-slate-100 outline-none"
            />
          </div>
        </div>

        <div className="mt-3">
          <Button
            onClick={runMatch}
            disabled={busy || !jobText.trim()}
            loading={busy}
          >
            Match with Resume
          </Button>
        </div>
      </Card>

      {result && (
        <Card>
          <h2 className="text-xl font-semibold text-white">Match Results</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-300">Match Percentage</p>
              <p className="text-3xl font-bold text-white">
                {result.matchPercentage}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-300">ATS Score</p>
              <p className="text-3xl font-bold text-white">{result.atsScore}</p>
            </div>
            <div>
              <p className="text-sm text-slate-300">Keyword Score</p>
              <p className="text-3xl font-bold text-white">
                {result.keywordScore}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm text-slate-300">Missing Skills</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {result.missingSkills.length === 0 && (
                  <li>None — Great match!</li>
                )}
                {result.missingSkills.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm text-slate-300">Suggestions</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {result.suggestions.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
                {result.suggestions.length === 0 && (
                  <li>Suggestions will appear after deeper analysis.</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default JobMatchPage;
