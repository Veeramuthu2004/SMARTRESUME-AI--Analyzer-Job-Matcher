import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { settingsService } from "../services/settingsService";

export function MaintenancePage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    settingsService
      .getPublicSettings()
      .then((res) => setSettings(res.settings || null));
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 text-center shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Maintenance mode
        </p>
        <h1 className="mt-4 text-4xl font-bold text-white">
          {settings?.branding?.appName || "Smart Resume Analyzer"} is
          temporarily unavailable
        </h1>
        <p className="mt-4 text-slate-300">
          We’re making improvements behind the scenes. Admins can still access
          the platform while normal user actions are paused.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Sign in again
          </Link>
          <Link
            to="/contact"
            className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/5"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
