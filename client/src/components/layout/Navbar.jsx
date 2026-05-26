import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  CircleUserRound,
  MoonStar,
  Shield,
  SunMedium,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";

const ProfileDropdown = React.lazy(() => import("./ProfileDropdown"));

const links = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const isAdmin = user?.role === "admin";
  const isAdminRoute = location.pathname.startsWith("/admin");
  const showAdminChrome = isAdmin && isAdminRoute;
  const mobileLinks = !user
    ? links
    : isAdmin
      ? [
          { to: "/admin/dashboard", label: "Admin Dashboard" },
          { to: "/admin/users", label: "User Management" },
          { to: "/admin/payments", label: "Payments" },
          { to: "/admin/analytics", label: "Revenue Analytics" },
          { to: "/admin/settings", label: "System Settings" },
          { to: "/admin/support", label: "Support Tickets" },
          { to: "/admin/maintenance", label: "Maintenance Mode" },
        ]
      : [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/profile", label: "Profile" },
          { to: "/settings", label: "Settings" },
          { to: "/history", label: "Resume History" },
        ];

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    const loadUnreadNotifications = async () => {
      try {
        const res = await adminService.listAdminNotifications();
        if (!active) return;
        const notifications = res.notifications || [];
        setUnreadNotifications(notifications.filter((n) => !n.read).length);
      } catch {
        if (active) setUnreadNotifications(0);
      }
    };

    loadUnreadNotifications();

    const onRefresh = (event) => {
      const type = event?.detail?.type || "";
      if (String(type).startsWith("notification")) {
        loadUnreadNotifications();
      }
    };

    window.addEventListener("admin-notification", onRefresh);
    window.addEventListener("admin-update", onRefresh);

    return () => {
      active = false;
      window.removeEventListener("admin-notification", onRefresh);
      window.removeEventListener("admin-update", onRefresh);
    };
  }, [isAdmin]);

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl ${showAdminChrome ? "border-cyan-500/15 bg-white/90 shadow-[0_8px_30px_rgba(8,15,40,0.06)] dark:border-cyan-400/10 dark:bg-slate-950/85" : "border-slate-200/70 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80"}`}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="text-lg font-black tracking-tight text-slate-900 dark:text-white"
          >
            SmartResume<span className="text-cyan-400">AI</span>
          </Link>
          {showAdminChrome && (
            <span className="hidden items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700 md:inline-flex dark:text-cyan-300">
              <Shield size={12} /> Admin workspace
            </span>
          )}
        </div>

        {!showAdminChrome && (
          <div className="hidden items-center gap-6 md:flex">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition ${
                    isActive
                      ? "text-cyan-600 dark:text-cyan-300"
                      : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {!showAdminChrome && (
            <div className="hidden items-center gap-2 xl:flex">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/15 dark:text-cyan-300"
              >
                <Bell size={14} /> Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm dark:bg-cyan-400 dark:text-slate-950">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            aria-label="toggle-theme"
            className="border-slate-200 bg-white/90 px-3 text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <span className="inline-flex items-center gap-2">
              {theme === "dark" ? (
                <>
                  <SunMedium size={16} className="text-amber-500" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <MoonStar size={16} className="text-indigo-500" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="toggle-mobile-menu"
            className="md:hidden"
          >
            ☰
          </Button>
          {user ? (
            <>
              {!isAdmin && (
                <Link
                  to="/dashboard"
                  className="hidden text-sm font-medium text-slate-700 md:block dark:text-slate-200"
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <div className="hidden min-w-0 flex-col items-end leading-tight lg:flex">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    Admin
                  </span>
                  <span className="max-w-[180px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user.name || "Administrator"}
                  </span>
                </div>
              )}
              {/* Profile dropdown handles logout/profile navigation */}
              <div className="relative">
                {isAdmin && unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 z-10 inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-950">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
                {/* lazy load ProfileDropdown to avoid circular deps */}
                <React.Suspense fallback={<div className="w-8 h-8" />}>
                  <ProfileDropdown />
                </React.Suspense>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm font-medium text-slate-700 md:block dark:text-slate-200"
              >
                Login
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
              <Link to="/login" className="ml-2">
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-transform hover:scale-105 dark:bg-slate-800/60 dark:text-slate-200">
                  <CircleUserRound className="h-4 w-4" />
                </div>
              </Link>
            </>
          )}
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200/70 px-4 pb-4 pt-2 md:hidden dark:border-slate-800/70">
          <div className="space-y-1">
            {mobileLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${isActive ? "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300" : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/60"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {!user && (
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                Login
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Logout
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
