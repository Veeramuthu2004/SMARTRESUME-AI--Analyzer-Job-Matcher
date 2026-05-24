import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import {
  adminChipClass,
  adminPageLeadClass,
  adminPageTitleClass,
} from "../../components/admin/adminUi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AdminAnalytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getReportsSummary("90d");
      setSummary(res.summary || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("admin-update", handler);
    return () => window.removeEventListener("admin-update", handler);
  }, []);

  useAdminSocket();

  const chartData = summary?.charts || [];

  if (loading && !summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Analytics</h1>
          <p className={adminPageLeadClass}>
            Trend lines for users and revenue across the selected window.
          </p>
        </div>
        <span className={adminChipClass}>Updated in real time</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">
            User Growth
          </h3>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.16)"
                />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">
            Revenue Growth
          </h3>
          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.16)"
                />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
