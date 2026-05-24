import { useCallback, useEffect, useState } from "react";
import { savedJobService } from "../services/savedJobService";
import JobCard from "../components/JobCard";
import { resumeService } from "../services/resumeService";
import { jobService } from "../services/jobService";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";
import { useAppRefresh } from "../hooks/useAppRefresh";
import { normalizeJobDisplay } from "../utils/jobDisplay";

export const SavedJobsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await savedJobService.listSaved();
      setItems(r.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAppRefresh(load);

  const handleRemove = async (id) => {
    setRemovingId(id);
    const previous = items;
    setItems((prev) => prev.filter((p) => p._id !== id));
    try {
      await savedJobService.removeSaved(id);
      toast("Saved job removed", "success");
      emitAppRefresh({ entity: "saved-job", action: "remove" });
    } catch (err) {
      setItems(previous);
      toast(
        err.response?.data?.message || "Failed to remove saved job",
        "error",
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Saved Jobs</h1>
      {loading && <div className="text-slate-300">Loading...</div>}
      {items.length === 0 && !loading && (
        <div className="text-slate-300">No saved jobs yet.</div>
      )}

      <div className="grid gap-3">
        {items.map((s) => (
          <div key={s._id} className="relative">
            <JobCard
              job={normalizeJobDisplay({
                ...s.rawJob,
                title: s.title,
                company: s.company,
                location: s.location,
              })}
              onSave={() => {}}
              onComputeMatch={async () => {
                let resumeId =
                  localStorage.getItem("sra_latest_resume_id") || "";

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

                return jobService.match({
                  resumeId,
                  jobText:
                    s.rawJob.job_description || s.rawJob.description || "",
                });
              }}
            />
            <button
              className="absolute right-2 top-2 text-xs text-red-400"
              onClick={() => handleRemove(s._id)}
              disabled={removingId === s._id}
            >
              {removingId === s._id ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedJobsPage;
