import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Mail, KeyRound, ShieldCheck, BellRing } from "lucide-react";
import { authService } from "../services/authService";

export const SettingsPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const requestReset = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      await authService.forgotPassword(email);
      setStatus("If your account exists, reset instructions were sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage password recovery and account preferences.
        </p>
      </div>
      <Card>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <KeyRound size={18} /> Password Recovery
        </h2>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          We’ll send a reset link to your email if the account exists.
        </p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your account email"
          className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-4 text-slate-900 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        <Button className="mt-3" onClick={requestReset}>
          <Mail size={16} />
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        {error && (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">
            {error}
          </p>
        )}
        {status && (
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
            {status}
          </p>
        )}
        <button
          type="button"
          onClick={() =>
            navigate(`/reset-password?email=${encodeURIComponent(email)}`)
          }
          className="mt-3 text-sm font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          Open reset page
        </button>
      </Card>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <ShieldCheck size={18} /> Account Safety
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Your account uses token-based login. If you see a session error, sign
          in again to refresh access.
        </p>
      </Card>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <BellRing size={18} /> Notifications
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Notification settings will be available here.
        </p>
      </Card>
    </div>
  );
};
