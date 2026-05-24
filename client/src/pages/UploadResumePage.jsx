import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ProgressBar } from "../components/ui/ProgressBar";
import { resumeService } from "../services/resumeService";
import { analysisService } from "../services/analysisService";
import { extractCompanyFromText } from "../utils/jobUtils";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";

export const UploadResumePage = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const canSubmit = useMemo(
    () => file && jobDescription.trim().length >= 50,
    [file, jobDescription],
  );

  const getErrorMessage = (e) => {
    const message = e?.response?.data?.message || e?.message || "";
    const validationErrors = e?.response?.data?.errors || [];
    if (/unsupported file type/i.test(message)) {
      return "Unsupported file type. Upload a PDF, DOCX, or TXT file.";
    }
    if (/parse resume/i.test(message)) {
      return "Could not read the resume file. Try a plain TXT, PDF, or DOCX file.";
    }
    if (/validation failed/i.test(message) && validationErrors.length > 0) {
      const first = validationErrors[0];
      if (first.path === "jobDescription") {
        return "Job description must be at least 50 characters long.";
      }
      if (first.path === "resumeId") {
        return "Please upload a resume and try again.";
      }
      return first.message || "Please check the required fields and try again.";
    }
    return message || "Analysis failed. Please try again.";
  };

  const runAnalysis = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await resumeService.uploadResume(file, (event) => {
        if (event.total) {
          setProgress(Math.round((event.loaded * 100) / event.total));
        }
      });

      const { analysis } = await analysisService.analyze({
        resumeId: uploaded.resume._id,
        roleTitle,
        jobDescription,
        company: extractCompanyFromText(jobDescription) || undefined,
      });

      toast("Resume analyzed successfully", "success");
      emitAppRefresh({ entity: "analysis", action: "create" });
      navigate(`/analysis?id=${analysis._id}`);
    } catch (e) {
      const message = getErrorMessage(e);
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Upload Resume
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Add a resume and a matching job description to generate your ATS
          analysis.
        </p>
      </div>
      <Card>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/70 bg-white/70 p-10 text-center transition hover:border-cyan-400/60 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/45 dark:hover:bg-slate-900/65">
          <UploadCloud className="mb-3 text-cyan-500 dark:text-cyan-300" />
          <p className="font-medium text-slate-900 dark:text-white">
            Drag-and-drop or click to upload PDF, DOCX, or TXT
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Max file size: 5MB
          </p>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {file && (
          <p className="mt-3 text-sm font-medium text-cyan-700 dark:text-cyan-200">
            Selected: {file.name}
          </p>
        )}
      </Card>

      <Card>
        <Input
          className="mb-3"
          placeholder="Target role (e.g. Senior Frontend Engineer)"
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
        />
        <textarea
          rows={9}
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full rounded-xl border border-slate-300/80 bg-white/90 p-4 text-sm text-slate-900 placeholder:text-slate-500 outline-none ring-cyan-400/40 focus:border-cyan-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Job description length: {jobDescription.trim().length}/50 minimum
          </span>
          <span>{file ? "File ready" : "Pick a file"}</span>
        </div>
        {error && (
          <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </p>
        )}
        {busy && (
          <div className="mt-3">
            <ProgressBar value={progress} />
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Uploading... {progress}%
            </p>
          </div>
        )}
        <Button
          className="mt-4"
          onClick={runAnalysis}
          disabled={!canSubmit || busy}
          loading={busy}
        >
          Analyze Resume
        </Button>
      </Card>
    </div>
  );
};
