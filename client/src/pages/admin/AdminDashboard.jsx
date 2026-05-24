import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  adminChipClass,
  adminMutedPanelClass,
  adminPageLeadClass,
  adminPageTitleClass,
} from "../../components/admin/adminUi";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [schedulerStats, setSchedulerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [overviewRes, activityRes] = await Promise.all([
        adminService.getOverview(),
        adminService.listActivity(10),
        // scheduler stats is optional; fetch separately to avoid blocking
      ]);
      setOverview(overviewRes.metrics ? overviewRes : { metrics: overviewRes });
      setActivity(activityRes.activity || []);
      try {
        const stats = await adminService.getSchedulerStats();
        setSchedulerStats(stats.stats || stats);
      } catch (e) {
        // ignore if endpoint missing
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const handle = (e) => {
      if (e?.detail?.metrics) {
        setOverview((prev) => ({ ...(prev || {}), metrics: e.detail.metrics }));
      }
      load();
    };

    window.addEventListener("admin-update", handle);
    return () => window.removeEventListener("admin-update", handle);
  }, []);

  useAdminSocket();

  if (loading && !overview) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!overview) return <Card>Loading admin dashboard...</Card>;

  const metrics = overview.metrics || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Admin Dashboard</h1>
          <p className={adminPageLeadClass}>
            A live snapshot of users, revenue, and platform health.
          </p>
        </div>
        <span className={adminChipClass}>Realtime sync enabled</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          [
            "Total Users",
            metrics.totalUsers || 0,
            "from-cyan-500/15 to-cyan-500/5",
          ],
          [
            "Premium Users",
            metrics.premiumUsers || 0,
            "from-violet-500/15 to-violet-500/5",
          ],
          [
            "Total Revenue",
            metrics.totalRevenue || 0,
            "from-emerald-500/15 to-emerald-500/5",
          ],
          [
            "Total Resume Analyses",
            metrics.totalAnalyses || 0,
            "from-amber-500/15 to-amber-500/5",
          ],
          [
            "Active Subscriptions",
            metrics.activeSubscriptions || 0,
            "from-fuchsia-500/15 to-fuchsia-500/5",
          ],
          [
            "Monthly Growth",
            `${metrics.monthlyGrowth || 0}%`,
            "from-sky-500/15 to-sky-500/5",
          ],
        ].map(([label, value, gradient]) => (
          <Card
            key={label}
            className={`bg-gradient-to-br ${gradient} border-slate-200/70 dark:border-slate-800`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-950 dark:text-white">
            Live Activity Feed
          </h2>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {activity.length === 0 ? (
              <div className={adminMutedPanelClass}>
                No recent admin activity.
              </div>
            ) : (
              activity.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {item.action}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.admin?.email || "system"} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-slate-950 dark:text-white">
              Real-time notes
            </h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Metrics refresh automatically when admin events, user actions,
              payments, or analyses hit the backend.
            </p>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="mb-3 text-lg font-semibold text-slate-950 dark:text-white">
                  Scheduler
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Shows scheduled notification processor status and queue.
                </p>
              </div>
              <div>
                <button
                  onClick={async () => {
                    try {
                      const stats = await adminService.getSchedulerStats();
                      setSchedulerStats(stats.stats || stats);
                    } catch (e) {}
                  }}
                  className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {schedulerStats ? (
                <div className="space-y-2">
                  <div>
                    Pending: <strong>{schedulerStats.pending ?? 0}</strong>
                  </div>
                  <div>
                    Processed: <strong>{schedulerStats.processed ?? 0}</strong>
                  </div>
                  <div>
                    Succeeded: <strong>{schedulerStats.succeeded ?? 0}</strong>
                  </div>
                  <div>
                    Failed: <strong>{schedulerStats.failed ?? 0}</strong>
                  </div>
                  <div>
                    Dead-lettered:{" "}
                    <strong>
                      {schedulerStats.deadLetterCount ??
                        schedulerStats.deadLettered ??
                        0}
                    </strong>
                  </div>
                  <div>
                    Last run:{" "}
                    <strong>
                      {schedulerStats.lastRun
                        ? new Date(schedulerStats.lastRun).toLocaleString()
                        : "n/a"}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className={adminMutedPanelClass}>
                  Scheduler stats unavailable.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
