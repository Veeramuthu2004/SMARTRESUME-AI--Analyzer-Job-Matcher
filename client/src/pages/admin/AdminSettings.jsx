import { Card } from "../../components/ui/Card";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { settingsService } from "../../services/settingsService";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import {
  adminInputClass,
  adminPageLeadClass,
  adminPageTitleClass,
  adminPrimaryButtonClass,
  adminTextAreaClass,
} from "../../components/admin/adminUi";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [maintenance, setMaintenance] = useState(false);
  const [branding, setBranding] = useState({
    appName: "",
    tagline: "",
    logoUrl: "",
    primaryColor: "#22d3ee",
  });
  const [pricing, setPricing] = useState({
    proMonthly: 499,
    proYearly: 4999,
    premiumMonthly: 999,
    premiumYearly: 9999,
  });
  const [email, setEmail] = useState({ supportEmail: "", senderName: "" });
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    enabled: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsService.getSettings();
        const data = res.settings || null;
        setSettings(data);
        setMaintenance(Boolean(data?.maintenanceMode));
        setBranding({ ...branding, ...(data?.branding || {}) });
        setPricing({ ...pricing, ...(data?.pricing || {}) });
        setEmail({ ...email, ...(data?.email || {}) });
      } catch (e) {
        toast(e?.response?.data?.message || "Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // listen for settings-related updates from other admin actions
  useAdminSocket();
  useEffect(() => {
    const h = (e) => {
      if (!e?.detail?.type) return;
      if (e.detail.type === "settings_updated") {
        if (e.detail.settings) {
          setSettings(e.detail.settings);
          setMaintenance(Boolean(e.detail.settings.maintenanceMode));
          setBranding((prev) => ({
            ...prev,
            ...(e.detail.settings.branding || {}),
          }));
          setPricing((prev) => ({
            ...prev,
            ...(e.detail.settings.pricing || {}),
          }));
          setEmail((prev) => ({ ...prev, ...(e.detail.settings.email || {}) }));
        } else {
          settingsService
            .getSettings()
            .then((res) => setSettings(res.settings || null))
            .catch(() => {});
        }
      } else if (String(e.detail.type).toLowerCase().includes("setting")) {
        settingsService
          .getSettings()
          .then((res) => setSettings(res.settings || null))
          .catch(() => {});
      }
    };
    window.addEventListener("admin-update", h);
    return () => window.removeEventListener("admin-update", h);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        maintenanceMode: maintenance,
        branding,
        pricing,
        email,
        announcements:
          announcement.title && announcement.message
            ? [announcement]
            : settings?.announcements || [],
      };
      const res = await settingsService.updateSettings(payload);
      setSettings(res.settings || null);
      toast("Settings saved", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card>Loading settings...</Card>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>System Settings</h1>
        <p className={adminPageLeadClass}>
          Control branding, pricing, email identity, announcements, and
          maintenance.
        </p>
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Maintenance Mode
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle to disable public access during maintenance
            </p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm">{maintenance ? "ON" : "OFF"}</span>
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Branding
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={branding.appName}
            onChange={(e) =>
              setBranding((p) => ({ ...p, appName: e.target.value }))
            }
            className={adminInputClass}
            placeholder="App name"
          />
          <input
            value={branding.primaryColor}
            onChange={(e) =>
              setBranding((p) => ({ ...p, primaryColor: e.target.value }))
            }
            className={adminInputClass}
            placeholder="Primary color"
          />
          <input
            value={branding.tagline}
            onChange={(e) =>
              setBranding((p) => ({ ...p, tagline: e.target.value }))
            }
            className={`${adminInputClass} md:col-span-2`}
            placeholder="Tagline"
          />
          <input
            value={branding.logoUrl}
            onChange={(e) =>
              setBranding((p) => ({ ...p, logoUrl: e.target.value }))
            }
            className={`${adminInputClass} md:col-span-2`}
            placeholder="Logo URL"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Pricing
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="number"
            value={pricing.proMonthly}
            onChange={(e) =>
              setPricing((p) => ({ ...p, proMonthly: Number(e.target.value) }))
            }
            className={adminInputClass}
            placeholder="Pro monthly"
          />
          <input
            type="number"
            value={pricing.proYearly}
            onChange={(e) =>
              setPricing((p) => ({ ...p, proYearly: Number(e.target.value) }))
            }
            className={adminInputClass}
            placeholder="Pro yearly"
          />
          <input
            type="number"
            value={pricing.premiumMonthly}
            onChange={(e) =>
              setPricing((p) => ({
                ...p,
                premiumMonthly: Number(e.target.value),
              }))
            }
            className={adminInputClass}
            placeholder="Premium monthly"
          />
          <input
            type="number"
            value={pricing.premiumYearly}
            onChange={(e) =>
              setPricing((p) => ({
                ...p,
                premiumYearly: Number(e.target.value),
              }))
            }
            className={adminInputClass}
            placeholder="Premium yearly"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Email
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={email.supportEmail}
            onChange={(e) =>
              setEmail((p) => ({ ...p, supportEmail: e.target.value }))
            }
            className={adminInputClass}
            placeholder="Support email"
          />
          <input
            value={email.senderName}
            onChange={(e) =>
              setEmail((p) => ({ ...p, senderName: e.target.value }))
            }
            className={adminInputClass}
            placeholder="Sender name"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Site announcement
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={announcement.title}
            onChange={(e) =>
              setAnnouncement((p) => ({ ...p, title: e.target.value }))
            }
            className={adminInputClass}
            placeholder="Announcement title"
          />
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
            <input
              type="checkbox"
              checked={announcement.enabled}
              onChange={(e) =>
                setAnnouncement((p) => ({ ...p, enabled: e.target.checked }))
              }
            />{" "}
            Enabled
          </label>
          <textarea
            value={announcement.message}
            onChange={(e) =>
              setAnnouncement((p) => ({ ...p, message: e.target.value }))
            }
            className={`${adminTextAreaClass} min-h-28 md:col-span-2`}
            placeholder="Announcement message"
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className={adminPrimaryButtonClass}
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
