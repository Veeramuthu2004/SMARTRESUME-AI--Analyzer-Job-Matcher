import { useEffect, useMemo, useState } from "react";
import { normalizeJobDisplay } from "../utils/jobDisplay";

const JobCard = ({ job, onSave, onComputeMatch }) => {
  const displayJob = useMemo(() => normalizeJobDisplay(job), [job]);
  const [match, setMatch] = useState(displayJob._match || null);
  const [matching, setMatching] = useState(false);

  const companyLabel = displayJob.company || "Company not listed";
  const salaryLabel =
    typeof displayJob.salary === "string" && displayJob.salary.trim()
      ? displayJob.salary
      : typeof displayJob.salary === "number"
        ? `$${displayJob.salary.toLocaleString()}`
        : "Salary not listed";
  const applyUrl = displayJob.applyUrl || "";
  const employmentType = displayJob.employmentType || "";

  const computeMatch = async () => {
    setMatching(true);
    try {
      const resp = await onComputeMatch();
      setMatch(resp);
    } catch (err) {
      setMatch({ error: err?.message || String(err) });
    } finally {
      setMatching(false);
    }
  };

  useEffect(() => {
    if (displayJob._match) setMatch(displayJob._match);
  }, [displayJob._match]);

  return (
    <div
      data-test="job-card"
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/70 p-5 shadow-xl dark:shadow-slate-950/25 backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-500/30"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div className="max-w-3xl flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
              Live
            </span>
            {employmentType && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                {employmentType}
              </span>
            )}
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
              {salaryLabel}
            </span>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-cyan-500/20">
              {companyLabel
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {displayJob.title}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {companyLabel}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {displayJob.location}
              </p>
            </div>
          </div>

          <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {displayJob.description}
          </p>
        </div>

        <div className="flex min-w-[220px] flex-col gap-3 text-left lg:text-right">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {(displayJob.requiredSkills || []).slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-slate-200 dark:border-white/10 bg-white/5 dark:bg-white/5 px-3 py-1 text-[11px] text-slate-700 dark:text-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex flex-col items-stretch gap-2 lg:items-end">
            <button
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/5 dark:bg-slate-800/20 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onSave}
              disabled={job._saved}
            >
              {job._saved ? "Saved" : "Save job"}
            </button>

            {applyUrl ? (
              <a
                href={applyUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02]"
              >
                Apply now
              </a>
            ) : (
              <button
                className="rounded-xl bg-slate-100 dark:bg-slate-700/70 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-300"
                disabled
              >
                No apply link
              </button>
            )}

            <button
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={computeMatch}
              disabled={matching}
            >
              {matching ? "Calculating..." : "ATS match"}
            </button>
          </div>
        </div>
      </div>

      {match && (
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/40 p-4 text-sm text-slate-900 dark:text-slate-200">
          {match.error && (
            <div className="text-sm text-rose-400">{match.error}</div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                ATS match
              </span>
              <div className="mt-1 text-2xl font-black text-white">
                <span data-test="match-percentage">
                  {match.matchPercentage ?? 0}%
                </span>
                {typeof match.atsScore !== "undefined" && (
                  <span className="ml-2 text-sm font-medium text-slate-400">
                    ATS {match.atsScore}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-400">
              {displayJob.location || "Remote friendly"}
            </div>
          </div>
          {match.suggestions?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-300">
              {match.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default JobCard;
