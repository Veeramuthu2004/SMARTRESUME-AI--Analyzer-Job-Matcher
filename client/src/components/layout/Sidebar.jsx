import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  History,
  BarChart3,
  Search,
  User,
  Settings,
  Shield,
  TrendingUp,
  LifeBuoy,
  X,
} from "lucide-react";

const userItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Resume", icon: Upload },
  { to: "/analysis", label: "Analysis Results", icon: FileSearch },
  { to: "/analyses", label: "My Analyses", icon: BarChart3 },
  { to: "/job-search", label: "Job Search", icon: Search },
  { to: "/history", label: "Resume History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/subscription", label: "Subscription", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminItems = [
  { to: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: User },
  { to: "/admin/payments", label: "Payments", icon: Upload },
  { to: "/admin/analytics", label: "Revenue Analytics", icon: TrendingUp },
  { to: "/admin/resumes", label: "Resume Monitoring", icon: FileSearch },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
  { to: "/admin/maintenance", label: "Maintenance Mode", icon: Shield },
  { to: "/admin/reports", label: "Reports", icon: TrendingUp },
  { to: "/admin/support", label: "Contact Support", icon: LifeBuoy },
];

export const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const items = isAdmin ? adminItems : userItems;

  useEffect(() => {
    if (mobileOpen) onClose();
  }, [location.pathname, mobileOpen, onClose]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [mobileOpen, onClose]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // Hide sidebar for unauthenticated users or while auth is initializing
  if (loading || !user) return null;

  const renderNavItems = () =>
    items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ${
            isActive
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg"
              : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white"
          }`
        }
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
          <Icon size={16} />
        </span>
        <span className="flex-1">{label}</span>
      </NavLink>
    ));

  return (
    <>
      <aside className="sticky top-20 hidden w-72 shrink-0 flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/70 px-4 py-6 backdrop-blur-xl lg:flex dark:border-slate-800/70 dark:bg-slate-900/60">
        <div className="mb-3 px-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
          Workspace
        </div>
        <div className="space-y-2">{renderNavItems()}</div>
        <div className="mt-auto px-1 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Need help?{" "}
            <a className="text-cyan-400 underline" href="/contact">
              Contact Support
            </a>
          </p>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="Close workspace navigation"
            className="absolute inset-0 bg-slate-900/55"
            onClick={onClose}
          />
          <aside className="relative h-full w-80 max-w-[86vw] overflow-y-auto border-r border-slate-200/70 bg-white px-4 py-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Workspace
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                aria-label="Close workspace navigation"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">{renderNavItems()}</div>
            <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <p>
                Need help?{" "}
                <a
                  className="text-cyan-400 underline"
                  href="/contact"
                  onClick={onClose}
                >
                  Contact Support
                </a>
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
