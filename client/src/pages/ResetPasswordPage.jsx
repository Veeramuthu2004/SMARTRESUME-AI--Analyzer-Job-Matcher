import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { authService } from "../services/authService";

const useQuery = () => new URLSearchParams(useLocation().search);

export const ResetPasswordPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const email = query.get("email") || "";
  const token = query.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () =>
      token &&
      email &&
      newPassword.length >= 8 &&
      newPassword === confirmPassword,
    [confirmPassword, email, newPassword, token],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token || !email) {
      setError("Reset link is missing token or email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword({
        email,
        token,
        newPassword,
      });
      setStatus(result?.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-12">
      <Card>
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-slate-950 dark:text-white">
          <KeyRound size={20} /> Reset Password
        </h1>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          Enter a new password for {email || "your account"}.
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-4 text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-4 text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100"
          />

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
          )}
          {status && (
            <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 size={16} /> {status}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
