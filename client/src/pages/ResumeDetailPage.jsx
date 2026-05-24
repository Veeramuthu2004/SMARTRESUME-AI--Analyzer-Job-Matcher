import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Edit } from "lucide-react";
import { Card } from "../components/ui/Card";
import { resumeService } from "../services/resumeService";
import { formatDate } from "../lib/utils";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";

export const ResumeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await resumeService.getById(id);
        setResume(response.resume);
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [id]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await resumeService.delete(id);
      toast("Resume deleted successfully", "success");
      emitAppRefresh({ entity: "resume", action: "delete" });
      navigate("/history");
    } catch (error) {
      toast(error.response?.data?.message || "Error deleting resume", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-300">Loading resume...</div>;
  }

  if (!resume) {
    return <div className="text-slate-300">Resume not found</div>;
  }

  const parsed = resume.parsed || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/history")}
          className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft size={20} /> Back to History
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/upload?resume=${id}`)}
            className="flex items-center gap-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-indigo-300 hover:bg-indigo-500/30"
          >
            <Edit size={16} /> Reanalyze
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-rose-300 transition-all duration-300 hover:scale-105 hover:bg-rose-500/30 active:scale-95"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{resume.fileName}</h1>
            <p className="text-sm text-slate-400">
              Uploaded {formatDate(resume.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">File Size</p>
            <p className="text-lg font-semibold text-white">
              {Math.round(resume.size / 1024)} KB
            </p>
          </div>
        </div>
      </Card>

      {parsed?.name && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">
            Personal Information
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {parsed.name && (
              <div>
                <p className="text-xs text-slate-400">Name</p>
                <p className="text-sm text-white">{parsed.name}</p>
              </div>
            )}
            {parsed.email && (
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm text-white">{parsed.email}</p>
              </div>
            )}
            {parsed.phone && (
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm text-white">{parsed.phone}</p>
              </div>
            )}
            {parsed.location && (
              <div>
                <p className="text-xs text-slate-400">Location</p>
                <p className="text-sm text-white">{parsed.location}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {parsed?.skills && parsed.skills.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {parsed.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}

      {parsed?.education && parsed.education.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">Education</h2>
          <div className="space-y-3">
            {parsed.education.map((edu, i) => (
              <div key={i} className="border-l-2 border-cyan-500/30 pl-3">
                <p className="font-semibold text-white">{edu.degree}</p>
                <p className="text-sm text-slate-300">{edu.school}</p>
                {edu.year && (
                  <p className="text-xs text-slate-400">{edu.year}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {parsed?.experience && parsed.experience.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">Experience</h2>
          <div className="space-y-3">
            {parsed.experience.map((exp, i) => (
              <div key={i} className="border-l-2 border-indigo-500/30 pl-3">
                <p className="font-semibold text-white">{exp.title}</p>
                <p className="text-sm text-slate-300">{exp.company}</p>
                {exp.duration && (
                  <p className="text-xs text-slate-400">{exp.duration}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {parsed?.projects && parsed.projects.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">Projects</h2>
          <div className="space-y-3">
            {parsed.projects.map((project, i) => (
              <div key={i} className="border-l-2 border-emerald-500/30 pl-3">
                <p className="font-semibold text-white">{project.name}</p>
                {project.description && (
                  <p className="text-sm text-slate-300">
                    {project.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-white">Raw Text</h2>
        <div className="max-h-64 overflow-y-auto rounded bg-slate-900/50 p-3">
          <p className="whitespace-pre-wrap text-xs text-slate-300">
            {resume.rawText}
          </p>
        </div>
      </Card>

      <ConfirmationModal
        open={deleteOpen}
        title="Delete Resume?"
        description="This action cannot be undone. The resume and related analysis data will be permanently removed."
        confirmLabel="Delete Resume"
        cancelLabel="Cancel"
        loading={deleteLoading}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
