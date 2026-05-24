import { useEffect, useRef, useState, useMemo, forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Settings2,
  Moon,
  SunMedium,
  LayoutDashboard,
  History,
  User,
  LifeBuoy,
  Bell,
  Users,
  LineChart,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const MenuItem = forwardRef(
  ({ children, as: Comp = "button", ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        {...props}
        className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100/80 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:text-slate-100 dark:hover:bg-slate-800/70 dark:hover:text-white"
      >
        {children}
      </Comp>
    );
  },
);

MenuItem.displayName = "MenuItem";

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const firstActionRef = useRef(null);
  const navigate = useNavigate();

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const isAdmin = user?.role === "admin";
  const roleLabel = isAdmin ? "Administrator" : "Member";

  const adminQuickLinks = [
    { to: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
    { to: "/admin/reports", label: "Reports", icon: LineChart },
    { to: "/admin/settings", label: "System Settings", icon: Settings2 },
    { to: "/admin/maintenance", label: "Maintenance Mode", icon: Shield },
  ];

  const userQuickLinks = [
    { to: "/profile", label: "My Profile", icon: User },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/history", label: "Resume History", icon: History },
    { to: "/settings", label: "Settings", icon: Settings2 },
  ];

  useEffect(() => {
    if (open) {
      firstActionRef.current?.focus();
    }

    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };

    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const handleMenuKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const items = Array.from(
        menuRef.current?.querySelectorAll("button, a") || [],
      );
      if (!items.length) return;
      const currentIndex = items.indexOf(document.activeElement);
      const nextIndex =
        e.key === "ArrowDown"
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
      e.preventDefault();
    }
  };

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            ref={menuRef}
            onKeyDown={handleMenuKeyDown}
            className="absolute right-0 mt-3 w-72 origin-top-right rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/90 dark:shadow-black/40"
            role="menu"
            aria-label="Profile menu"
          >
            <div className="px-3 py-2">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-950 dark:text-white">
                    {user.name}
                  </div>
                  <div className="truncate text-xs text-slate-600 dark:text-slate-300">
                    {user.email}
                  </div>
                  <div className="mt-1 inline-flex items-center rounded-full border border-cyan-500/15 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
                    {roleLabel}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                  {isAdmin ? "Admin workspace" : "Account"}
                </div>

                {(isAdmin ? adminQuickLinks : userQuickLinks).map(
                  ({ to, label, icon: Icon }, index) => (
                    <Link key={to} to={to} onClick={() => setOpen(false)}>
                      <MenuItem
                        as={"div"}
                        ref={index === 0 ? firstActionRef : null}
                      >
                        <Icon size={14} /> {label}
                      </MenuItem>
                    </Link>
                  ),
                )}

                {isAdmin && (
                  <div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    Account
                  </div>
                )}

                {isAdmin && (
                  <Link to="/profile" onClick={() => setOpen(false)}>
                    <MenuItem as={"div"}>
                      <User size={14} /> My Profile
                    </MenuItem>
                  </Link>
                )}

                <div className="mt-1 rounded-lg border-t border-slate-200/70 pt-2 dark:border-slate-700/40">
                  <MenuItem
                    as={"button"}
                    onClick={() => {
                      toggleTheme();
                      setOpen(false);
                    }}
                  >
                    {theme === "dark" ? (
                      <>
                        <SunMedium size={14} /> Switch to Light Mode
                      </>
                    ) : (
                      <>
                        <Moon size={14} /> Switch to Dark Mode
                      </>
                    )}
                  </MenuItem>
                </div>

                <div className="mt-2">
                  <MenuItem as={"button"} onClick={handleLogout}>
                    <LogOut size={14} /> Logout
                  </MenuItem>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
