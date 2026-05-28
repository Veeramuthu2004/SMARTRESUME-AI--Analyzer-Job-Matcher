import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { jobsService } from "../services/jobsService";
import { savedJobService } from "../services/savedJobService";
import { resumeService } from "../services/resumeService";
import { analysisService } from "../services/analysisService";
import JobCard from "../components/JobCard";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";
import { useDebounce } from "../hooks/useDebounce";
import { io } from "socket.io-client";
import { normalizeJobDisplay } from "../utils/jobDisplay";
import { apiOrigin } from "../services/api";

export const JobSearchPage = () => {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [latestResumeId, setLatestResumeId] = useState("");
  const [cachedMatches, setCachedMatches] = useState([]);
  const { toast } = useToast();
  const debouncedQ = useDebounce(q, 350);
  const debouncedRole = useDebounce(role, 350);
  const debouncedLocation = useDebounce(location, 350);
  const debouncedSkills = useDebounce(skills, 350);

  const normalizeJobText = (value = "") =>
    String(value).replace(/\s+/g, " ").trim().toLowerCase();

  const hydrateMatches = (items, matches) => {
    if (!Array.isArray(items) || !Array.isArray(matches) || !matches.length) {
      return items;
    }

    return items.map((item) => {
      const normalizedItem = normalizeJobDisplay(item);
      if (normalizedItem._match) return normalizedItem;

      const itemText = normalizeJobText(
        normalizedItem.description ||
          normalizedItem.title ||
          normalizedItem.company ||
          "",
      );

      const matched = matches.find((analysis) => {
        const analysisText = normalizeJobText(analysis.jobDescription || "");
        return (
          analysisText &&
          (analysisText === itemText ||
            analysisText.includes(itemText) ||
            itemText.includes(analysisText))
        );
      });

      return matched ? { ...normalizedItem, _match: matched } : normalizedItem;
    });
  };

  useEffect(() => {
    const loadLatestResume = async () => {
      try {
        const cachedResumeId = localStorage.getItem("sra_latest_resume_id");
        if (cachedResumeId) {
          setLatestResumeId(cachedResumeId);
        }

        const data = await resumeService.listResumes();
        const items = data?.resumes || data?.items || [];
        if (items.length > 0) {
          setLatestResumeId(items[0]._id);
          localStorage.setItem("sra_latest_resume_id", items[0]._id);
        }
      } catch (err) {
        console.warn(
          "Could not load resume list for ATS matching",
          err?.message || err,
        );
      }
    };

    loadLatestResume();
  }, []);

  useEffect(() => {
    const loadCachedMatches = async () => {
      try {
        const data = await analysisService.listCached(1, 5);
        setCachedMatches(data?.items || []);
      } catch (err) {
        console.warn("Could not load cached analyses", err?.message || err);
      }
    };

    loadCachedMatches();
  }, []);

  const executeSearch = async ({
    query,
    searchRole,
    searchLocation,
    searchSkills,
    searchPage = page,
    searchLimit = limit,
  } = {}) => {
    const nextQuery = query ?? q;
    const nextRole = searchRole ?? role;
    const nextLocation = searchLocation ?? location;
    const nextSkills = searchSkills ?? skills;

    if (
      !String(nextQuery).trim() &&
      !nextRole &&
      !nextLocation &&
      !nextSkills
    ) {
      return;
    }

    setBusy(true);
    try {
      const filters = {};
      if (nextRole) filters.role = nextRole;
      if (nextLocation) filters.location = nextLocation;
      if (nextSkills) filters.skills = nextSkills;

      const params = {
        q: nextQuery,
        page: searchPage,
        limit: searchLimit,
        ...filters,
      };
      const r = await jobsService.searchJobs(params);
      setResults(hydrateMatches(r.items || [], cachedMatches));
      setPage(r.pagination?.page || searchPage);
      setLimit(r.pagination?.limit || searchLimit);
      setTotal(r.pagination?.total || 0);
    } finally {
      setBusy(false);
    }
  };

  // realtime job feed: listen for new jobs and update results/toast
  useEffect(() => {
    let socket;
    try {
      const apiBase = apiOrigin;
      socket = io(apiBase, { transports: ["websocket"] });
      socket.on("job:new", (job) => {
        const normalizedJob = normalizeJobDisplay(job);
        const text =
          `${normalizedJob.title || ""} ${normalizedJob.company || ""} ${normalizedJob.description || ""}`.toLowerCase();
        const qLow = (q || "").toLowerCase();
        const matchesQuery = !qLow || text.includes(qLow);
        if (matchesQuery) {
          setResults((prev) => [normalizedJob, ...prev].slice(0, limit));
          setTotal((t) => (Number(t) || 0) + 1);
          toast(`New job posted: ${normalizedJob.title}`);
        } else {
          toast(`New job posted: ${normalizedJob.title}`, "info");
        }
      });
    } catch (err) {
      console.warn("Realtime socket init failed", err?.message || err);
    }

    return () => {
      try {
        if (socket) socket.disconnect();
      } catch (e) {}
    };
    // include q and limit to react to current filter state
  }, [q, limit]);

  useEffect(() => {
    if (!results.length || !cachedMatches.length) return;
    setResults((prev) => hydrateMatches(prev, cachedMatches));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedMatches]);

  const runSearch = () =>
    executeSearch({
      query: q,
      searchRole: role,
      searchLocation: location,
      searchSkills: skills,
      searchPage: page,
      searchLimit: limit,
    });

  // Re-run search automatically when filters change or page/limit changes.
  useEffect(() => {
    const shouldRun =
      debouncedQ.trim() ||
      debouncedRole ||
      debouncedLocation ||
      debouncedSkills;
    if (shouldRun) {
      executeSearch({
        query: debouncedQ,
        searchRole: debouncedRole,
        searchLocation: debouncedLocation,
        searchSkills: debouncedSkills,
        searchPage: page,
        searchLimit: limit,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedQ,
    debouncedRole,
    debouncedLocation,
    debouncedSkills,
    page,
    limit,
  ]);

  const handleSave = async (job) => {
    setResults((prev) =>
      prev.map((j) => (j.jobId === job.jobId ? { ...j, _saved: true } : j)),
    );
    try {
      await savedJobService.saveJob(job);
      toast("Job saved", "success");
      emitAppRefresh({ entity: "saved-job", action: "create" });
    } catch (err) {
      setResults((prev) =>
        prev.map((j) => (j.jobId === job.jobId ? { ...j, _saved: false } : j)),
      );
      toast(
        err.response?.data?.message || err?.message || "Save failed",
        "error",
      );
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Job Search
      </h1>
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
        >
          <div className="grid gap-3 md:grid-cols-4">
            <input
              placeholder="Keywords / Job description"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="col-span-2 rounded-xl border border-slate-200 dark:border-white/20 bg-white/90 dark:bg-slate-900/40 p-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
            />
            <input
              placeholder="Role / Title"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-white/20 bg-white/90 dark:bg-slate-900/40 p-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
            />
            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-white/20 bg-white/90 dark:bg-slate-900/40 p-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <input
            placeholder="Skills (comma separated)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-white/90 dark:bg-slate-900/40 p-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
          />

          <Button className="mt-3" type="submit" disabled={busy}>
            {busy ? "Searching..." : "Search"}
          </Button>
        </form>
      </Card>
      {/* accessibility / small-screen polish: show page controls centered */}

      <div className="space-y-3">
        {busy && (
          <div className="grid gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}

        {!busy && results.length === 0 && (
          <Card>No results yet — try broader keywords or remove filters.</Card>
        )}

        {results.map((j) => (
          <JobCard
            key={j.jobId || j._id}
            job={normalizeJobDisplay(j)}
            onSave={() => handleSave(j)}
            onComputeMatch={async () => {
              let resumeId = latestResumeId;
              if (!resumeId) {
                const data = await resumeService.listResumes();
                const items = data?.resumes || data?.items || [];
                resumeId = items[0]?._id || "";
                if (resumeId) {
                  localStorage.setItem("sra_latest_resume_id", resumeId);
                }
              }

              if (!resumeId) {
                throw new Error(
                  "Upload a resume first to calculate ATS match.",
                );
              }
              try {
                const data = await jobsService.matchJob({
                  resumeId,
                  jobText: j.description || j.title || j.company || "",
                });
                // persist match on the client so it's visible across re-renders
                setResults((prev) =>
                  prev.map((p) =>
                    (p.jobId || p._id) === (j.jobId || j._id)
                      ? { ...p, _match: data }
                      : p,
                  ),
                );
                return data;
              } catch (err) {
                console.error("Match failed", err);
                throw err;
              }
            }}
          />
        ))}

        {cachedMatches.length > 0 && (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Cached matches
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {cachedMatches.length} recent results
              </span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {cachedMatches.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.roleTitle ||
                          item.resume?.fileName ||
                          "Cached analysis"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.matchPercentage}% match • ATS {item.atsScore}%
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-500/15 px-2 py-1 text-[11px] text-indigo-200">
                      cached
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-700 dark:text-slate-300">
                    {item.jobDescription}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {total > limit && (
          <div className="flex items-center gap-3">
            <button
              className="rounded-md bg-slate-700 px-3 py-1 text-xs text-white"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <div className="text-sm text-slate-300">
              Page {page} — {Math.ceil(total / limit)} ({total} results)
            </div>
            <button
              className="rounded-md bg-slate-700 px-3 py-1 text-xs text-white"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
