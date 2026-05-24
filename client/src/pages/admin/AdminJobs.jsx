import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { useToast } from "../../hooks/useToast";
import { Pagination } from "../../components/ui/Pagination";
import { FilterBar } from "../../components/ui/FilterBar";

const PAGE_SIZE = 10;

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.listJobs();
      setJobs(res.jobs || []);
    } catch (error) {
      toast("Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const h = (e) => {
      if (!e?.detail) return;
      if (["job_created", "job_updated", "job_deleted"].includes(e.detail.type))
        load();
    };
    window.addEventListener("admin-update", h);
    return () => window.removeEventListener("admin-update", h);
  }, []);

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const filtered = jobs.filter(
    (j) =>
      !filter ||
      (j.title || "").toLowerCase().includes(filter.toLowerCase()) ||
      (j.company || "").toLowerCase().includes(filter.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    skills: "",
    description: "",
    featured: false,
  });

  const [editingJobId, setEditingJobId] = useState(null);
  const [editJob, setEditJob] = useState({
    title: "",
    company: "",
    location: "",
    skills: "",
    description: "",
    featured: false,
  });

  const create = async () => {
    setSaving(true);
    try {
      const payload = {
        ...newJob,
        skills: (newJob.skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await adminService.createJob(payload);
      setNewJob({
        title: "",
        company: "",
        location: "",
        skills: "",
        description: "",
        featured: false,
      });
      toast("Job created", "success");
      load();
    } catch (error) {
      toast("Failed to create job", "error");
    } finally {
      setSaving(false);
    }
  };

  const { toast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const remove = async (id) => {
    setConfirmConfig({
      title: "Delete job",
      description: "Delete job?",
      tone: "danger",
      onConfirm: async () => {
        try {
          await adminService.deleteJob(id);
          load();
          toast("Job deleted", "success");
        } catch (err) {
          toast("Failed to delete job", "error");
        } finally {
          setConfirmOpen(false);
        }
      },
    });
    setConfirmOpen(true);
  };

  const startEdit = (job) => {
    setEditingJobId(job._id);
    setEditJob({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
      description: job.description || "",
      featured: !!job.featured,
    });
  };

  const saveEdit = async () => {
    if (!editingJobId) return;
    setSaving(true);
    try {
      const payload = {
        ...editJob,
        skills: (editJob.skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await adminService.updateJob(editingJobId, payload);
      toast("Job updated", "success");
      setEditingJobId(null);
      load();
    } catch (error) {
      toast("Failed to update job", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
        Admin — Jobs
      </h1>
      <div className="flex justify-between">
        <FilterBar
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          placeholder="Search jobs or company"
        />
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      <Card>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              placeholder="Title"
              className="p-2"
            />
            <input
              value={newJob.company}
              onChange={(e) =>
                setNewJob({ ...newJob, company: e.target.value })
              }
              placeholder="Company"
              className="p-2"
            />
            <input
              value={newJob.location}
              onChange={(e) =>
                setNewJob({ ...newJob, location: e.target.value })
              }
              placeholder="Location"
              className="p-2"
            />
            <input
              value={newJob.skills}
              onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
              placeholder="Skills (comma)"
              className="p-2"
            />
          </div>
          <textarea
            value={newJob.description}
            onChange={(e) =>
              setNewJob({ ...newJob, description: e.target.value })
            }
            placeholder="Description"
            className="w-full p-2"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Featured</label>
            <input
              type="checkbox"
              checked={newJob.featured}
              onChange={(e) =>
                setNewJob({ ...newJob, featured: e.target.checked })
              }
            />
            <button
              onClick={create}
              disabled={saving}
              className="ml-auto rounded bg-cyan-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create Job"}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Loading jobs...
            </div>
          </Card>
        ) : (
          visible.map((j) => (
            <div key={j._id} className="space-y-3">
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-950 dark:text-white">
                      {j.title}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {j.company} — {j.location}
                    </div>
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {j.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(j.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => startEdit(j)}
                        className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(j._id)}
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {editingJobId === j._id && (
                <Card>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editJob.title}
                        onChange={(e) =>
                          setEditJob({ ...editJob, title: e.target.value })
                        }
                        placeholder="Title"
                        className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        value={editJob.company}
                        onChange={(e) =>
                          setEditJob({ ...editJob, company: e.target.value })
                        }
                        placeholder="Company"
                        className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        value={editJob.location}
                        onChange={(e) =>
                          setEditJob({ ...editJob, location: e.target.value })
                        }
                        placeholder="Location"
                        className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        value={editJob.skills}
                        onChange={(e) =>
                          setEditJob({ ...editJob, skills: e.target.value })
                        }
                        placeholder="Skills (comma)"
                        className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <textarea
                      value={editJob.description}
                      onChange={(e) =>
                        setEditJob({ ...editJob, description: e.target.value })
                      }
                      placeholder="Description"
                      className="min-h-28 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-600 dark:text-slate-300">
                        Featured
                      </label>
                      <input
                        type="checkbox"
                        checked={editJob.featured}
                        onChange={(e) =>
                          setEditJob({ ...editJob, featured: e.target.checked })
                        }
                      />
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="ml-auto rounded bg-cyan-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setEditingJobId(null)}
                        className="rounded border border-slate-200 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))
        )}
      </div>
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
