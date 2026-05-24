import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useSocket } from "../../hooks/useSocket";
import ConnectionStatus from "../ConnectionStatus";
import { Menu } from "lucide-react";

export const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  useSocket();

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      {/* persistent connection status badge */}
      <ConnectionStatus />
      <main className="mx-auto flex w-full max-w-7xl items-start gap-6 px-4 py-6 md:px-6 md:py-8">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <section className="w-full flex-1 px-0 py-2 md:px-6">
          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
              aria-label="Open workspace navigation"
            >
              <Menu size={16} />
              Workspace
            </button>
          </div>
          <div className="mx-auto max-w-6xl">{children || <Outlet />}</div>
        </section>
      </main>
    </div>
  );
};
