import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../hooks/useToast";
import { settingsService } from "../../services/settingsService";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import {
  adminMutedPanelClass,
  adminPageLeadClass,
  adminPageTitleClass,
  adminPrimaryButtonClass,
} from "../../components/admin/adminUi";

export default function AdminMaintenance() {
  const [settings, setSettings] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const res = await settingsService.getSettings();
    const data = res.settings || null;
    setSettings(data);
    setMaintenanceMode(Boolean(data?.maintenanceMode));
  };

  useEffect(() => {
    load().catch(() => toast("Failed to load maintenance settings", "error"));
  }, []);

  // listen for external settings updates
  useAdminSocket();
  useEffect(() => {
    const h = (e) => {
      if (!e?.detail?.type) return;
      if (e.detail.type === "settings_updated" && e.detail.settings) {
        setSettings(e.detail.settings);
        setMaintenanceMode(Boolean(e.detail.settings.maintenanceMode));
      } else if (String(e.detail.type).toLowerCase().includes("setting")) {
        load();
      }
    };
    window.addEventListener("admin-update", h);
    return () => window.removeEventListener("admin-update", h);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await settingsService.updateMaintenance({ maintenanceMode });
      setSettings(res.settings || null);
      toast("Maintenance mode updated", "success");
    } catch (e) {
      toast(
        e?.response?.data?.message || "Failed to update maintenance mode",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Maintenance Mode</h1>
        <p className={adminPageLeadClass}>
          Block normal users while keeping admin access live.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Platform status
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {maintenanceMode
                ? "Users are blocked."
                : "All users can access the platform."}
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
            />
            <span>{maintenanceMode ? "Enabled" : "Disabled"}</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className={adminPrimaryButtonClass}
          >
            {saving ? "Saving..." : "Save status"}
          </button>
        </div>
      </Card>

      <Card>
        <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Current settings snapshot
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            ["Maintenance", settings?.maintenanceMode ? "On" : "Off"],
            ["Branding", settings?.branding?.appName || "Not set"],
            ["Pricing", settings?.pricing ? "Configured" : "Not set"],
          ].map(([label, value]) => (
            <div key={label} className={adminMutedPanelClass}>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
