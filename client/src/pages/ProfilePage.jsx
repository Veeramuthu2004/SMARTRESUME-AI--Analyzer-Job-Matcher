import { useMemo, useState, useEffect, useRef } from "react";
import {
  LogOut,
  Settings2,
  PencilLine,
  ShieldAlert,
  X,
  UploadCloud,
  ImageUp,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analysisService } from "../services/analysisService";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/userService";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";

export const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState("");
  const avatarInputRef = useRef(null);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
  });
  const [form, setForm] = useState({
    name: "",
    headline: "",
    avatarUrl: "",
    skills: "",
  });
  const { toast } = useToast();

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashData = await analysisService.dashboard();
        setStats(dashData?.metrics || {});
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!user) return;
    const preview = user.avatarUrl || "";
    setForm({
      name: user.name || "",
      headline: user.headline || "",
      avatarUrl: preview,
      skills: Array.isArray(user.skills) ? user.skills.join(", ") : "",
    });
    setAvatarPreview(preview);
    setPreferences({
      emailNotifications: user.emailNotifications !== false,
      marketingEmails: user.marketingEmails === true,
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const openEditor = () => setEditing(true);

  const handleAvatarSelect = (file) => {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setAvatarStatus("Please choose a PNG, JPG, JPEG, or WebP image.");
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarStatus("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      setAvatarStatus("Choose an image first.");
      return;
    }

    setAvatarUploading(true);
    setAvatarStatus("");
    try {
      const data = await userService.uploadAvatar(avatarFile);
      await refreshUser();
      setForm((prev) => ({ ...prev, avatarUrl: data.avatarUrl || "" }));
      setAvatarFile(null);
      setAvatarStatus("Avatar updated successfully.");
      toast("Avatar updated successfully", "success");
      emitAppRefresh({ entity: "profile", action: "avatar" });
    } catch (err) {
      setAvatarStatus(err.response?.data?.message || "Failed to upload avatar");
      toast(err.response?.data?.message || "Failed to upload avatar", "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  const savePreferences = async (nextPrefs) => {
    setPrefSaving(true);
    const previous = preferences;
    setPreferences(nextPrefs);
    try {
      await userService.updatePreferences(nextPrefs);
      await refreshUser();
      toast("Preferences updated", "success");
      emitAppRefresh({ entity: "profile", action: "preferences" });
    } catch (err) {
      setPreferences(previous);
      toast(
        err.response?.data?.message || "Failed to update preferences",
        "error",
      );
    } finally {
      setPrefSaving(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateProfile({
        name: form.name,
        headline: form.headline,
        avatarUrl: form.avatarUrl,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await refreshUser();
      setEditing(false);
      toast("Profile updated successfully", "success");
      emitAppRefresh({ entity: "profile", action: "update" });
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const payload =
        user?.provider === "local"
          ? { password: deletePassword }
          : { confirmation: deletePassword };
      await userService.deleteAccount(payload);
      toast("Account deleted successfully", "success");
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account");
      toast(err.response?.data?.message || "Failed to delete account", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const avatarSrc = avatarPreview || form.avatarUrl || user?.avatarUrl || "";
  const avatarPreviewNode = avatarSrc ? (
    <img
      src={avatarSrc}
      alt="Profile avatar preview"
      className="h-28 w-28 rounded-2xl object-cover ring-4 ring-cyan-400/20"
    />
  ) : (
    <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-3xl font-bold text-white ring-4 ring-cyan-400/20">
      {initials}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">
            Profile
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Manage your account settings, preferences, and security.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleLogout}
          variant="outline"
          className="border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/30"
        >
          <LogOut size={16} /> Logout
        </Button>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
        </Card>
      )}

      {/* User Info Card */}
      <Card>
        <div className="flex items-center gap-6">
          {avatarPreviewNode}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
              {user?.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-300">{user?.email}</p>
            <div className="mt-3 flex gap-3">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                {user?.role || "user"}
              </span>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                Member
              </span>
            </div>
          </div>
        </div>
      </Card>

      <ConfirmationModal
        open={logoutOpen}
        title="Logout?"
        description="You can sign back in anytime. We'll keep your data safe while you're away."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        tone="info"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
          navigate("/");
        }}
      />

      {/* Statistics */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resumes
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
              {stats?.resumeCount || 0}
            </p>
            <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
              Uploaded
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Analyses
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
              {stats?.recentAnalyses || 0}
            </p>
            <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
              Completed
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average ATS
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
              {stats?.averageAts || 0}
            </p>
            <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
              Score
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Member Since
            </p>
            <p className="mt-2 text-lg font-bold text-slate-950 dark:text-white">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })
                : "2026"}
            </p>
            <p className="mt-1 text-xs text-cyan-300">Active</p>
          </Card>
        </div>
      )}

      {/* Account Settings */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
          <Settings2 size={18} /> Account Settings
        </h2>
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
            <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
              Email Address
            </p>
            <p className="font-semibold text-slate-950 dark:text-white">
              {user?.email}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
            <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
              Full Name
            </p>
            <p className="font-semibold text-slate-950 dark:text-white">
              {user?.name}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
            <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
              Account Role
            </p>
            <p className="font-semibold text-slate-950 capitalize dark:text-white">
              {user?.role || "user"}
            </p>
          </div>
          <Button
            type="button"
            onClick={openEditor}
            variant="outline"
            className="w-full border-indigo-200 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30"
          >
            <PencilLine size={16} /> Edit Profile
          </Button>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          Security
        </h2>
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/settings")}
            className="w-full cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700/30 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            Change Password
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/settings")}
            className="w-full cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700/30 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            Two-Factor Authentication
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/settings")}
            className="w-full cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700/30 dark:text-slate-200 dark:hover:bg-slate-700/50"
          >
            Active Sessions
          </Button>
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  Edit Profile
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Update your public profile details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={saveProfile}>
              <div className="rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    {avatarPreviewNode}
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Profile photo
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Upload a PNG, JPG, JPEG, or WebP image.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      className="border-cyan-200 bg-white/80 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-500/30 dark:bg-slate-900/70 dark:text-cyan-200 dark:hover:bg-slate-800"
                    >
                      <ImageUp size={16} /> Choose image
                    </Button>
                    <Button
                      type="button"
                      onClick={uploadAvatar}
                      disabled={!avatarFile || avatarUploading}
                    >
                      <UploadCloud size={16} />
                      {avatarUploading ? "Uploading..." : "Upload avatar"}
                    </Button>
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleAvatarSelect(e.target.files?.[0] || null)
                  }
                />
                {avatarStatus && (
                  <p className="mt-3 text-sm text-cyan-700 dark:text-cyan-300">
                    {avatarStatus}
                  </p>
                )}
              </div>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Name
                </span>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Headline
                </span>
                <Input
                  value={form.headline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, headline: e.target.value }))
                  }
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Avatar URL (optional)
                </span>
                <Input
                  value={form.avatarUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))
                  }
                  placeholder="Paste an image URL or upload a photo above"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Skills
                </span>
                <Input
                  value={form.skills}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, skills: e.target.value }))
                  }
                  placeholder="React, Node.js, MongoDB"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setEditing(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Preferences */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Email Notifications
            </span>
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              disabled={prefSaving}
              onChange={(e) =>
                savePreferences({
                  ...preferences,
                  emailNotifications: e.target.checked,
                })
              }
              className="h-4 w-4 cursor-pointer accent-cyan-500 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Marketing Emails
            </span>
            <input
              type="checkbox"
              checked={preferences.marketingEmails}
              disabled={prefSaving}
              onChange={(e) =>
                savePreferences({
                  ...preferences,
                  marketingEmails: e.target.checked,
                })
              }
              className="h-4 w-4 cursor-pointer accent-cyan-500 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Dark Mode
            </span>
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
              className="h-4 w-4 cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-rose-500/20">
        <h2 className="mb-4 text-lg font-semibold text-rose-600 dark:text-rose-400">
          Danger Zone
        </h2>
        <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
          This action permanently deletes your account, resumes, and analyses.
        </p>
        <Button
          type="button"
          onClick={() => {
            setDeletePassword("");
            setDeleteError("");
            setDeleteOpen(true);
          }}
          variant="outline"
          className="w-full border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30"
        >
          <ShieldAlert size={16} /> Delete Account
        </Button>
      </Card>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  Delete account
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {user?.provider === "local"
                    ? "Enter your current password to confirm deletion."
                    : "Type DELETE to confirm deletion for this Google account."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={confirmDelete} className="space-y-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {user?.provider === "local"
                    ? "Current password"
                    : "Type DELETE"}
                </span>
                <input
                  type={user?.provider === "local" ? "password" : "text"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={
                    user?.provider === "local"
                      ? "Enter your password"
                      : "DELETE"
                  }
                  className="h-11 rounded-xl border border-slate-300/80 bg-white/90 px-4 text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/40 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100"
                />
              </label>

              {deleteError && (
                <p className="text-sm text-rose-600 dark:text-rose-300">
                  {deleteError}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={deleteLoading}>
                  {deleteLoading ? "Deleting..." : "Delete permanently"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Help & Support */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
          Help & Support
        </h2>
        <div className="space-y-2">
          <a
            href="#"
            className="block text-sm text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            → View Documentation
          </a>
          <a
            href="#"
            className="block text-sm text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            → Contact Support
          </a>
          <a
            href="#"
            className="block text-sm text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            → Report a Bug
          </a>
          <a
            href="#"
            className="block text-sm text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            → Request a Feature
          </a>
        </div>
      </Card>
    </div>
  );
};
