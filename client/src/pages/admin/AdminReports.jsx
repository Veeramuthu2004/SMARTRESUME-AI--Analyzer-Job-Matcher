import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { adminService } from "../../services/adminService";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../hooks/useToast";
import { useAdminSocket } from "../../hooks/useAdminSocket";
import {
  adminButtonClass,
  adminPageLeadClass,
  adminPageTitleClass,
  adminPrimaryButtonClass,
} from "../../components/admin/adminUi";

export default function AdminReports() {
  const [range, setRange] = useState("30d");
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, reportsRes] = await Promise.all([
        adminService.getReportsSummary(range),
        adminService.listReports(),
      ]);
      setSummary(summaryRes.summary || null);
      setReports(reportsRes.reports || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load reports");
      toast("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [range]);

  useAdminSocket();

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener("admin-update", refresh);
    return () => window.removeEventListener("admin-update", refresh);
  }, [range]);

  const chartData = useMemo(() => summary?.charts || [], [summary]);

  const handleDownload = async () => {
    try {
      const blob = await adminService.downloadReportsPdf(range);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin-report-${range}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast("Report downloaded", "success");
    } catch (e) {
      toast("PDF download failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={adminPageTitleClass}>Reports</h1>
          <p className={adminPageLeadClass}>
            Live operational and revenue reports.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button onClick={handleDownload} className={adminPrimaryButtonClass}>
            Download PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {error && !loading && (
        <Card>
          <div className="space-y-2">
            <p className="text-white">{error}</p>
            <button onClick={load} className={adminButtonClass}>
              Retry
            </button>
          </div>
        </Card>
      )}

      {summary && !loading && (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              ["Total Users", summary.metrics.totalUsers],
              ["Premium Users", summary.metrics.premiumUsers],
              ["Revenue", summary.metrics.totalRevenue],
              ["Analyses", summary.metrics.totalAnalyses],
              ["Subscriptions", summary.metrics.activeSubscriptions],
              ["Growth", `${summary.metrics.monthlyGrowth}%`],
            ].map(([label, value]) => (
              <Card
                key={label}
                className="bg-gradient-to-br from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-950"
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
            <Card className="min-w-0">
              <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
                Revenue & Growth
              </h2>
              <div className="h-80 min-h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.18)"
                    />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.96)",
                        border: "1px solid rgba(226,232,240,1)",
                        borderRadius: "16px",
                        color: "#0f172a",
                        boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
                      }}
                      labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22d3ee"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="min-w-0">
              <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
                ATS / Subscription Trends
              </h2>
              <div className="h-80 min-h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.18)"
                    />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.96)",
                        border: "1px solid rgba(226,232,240,1)",
                        borderRadius: "16px",
                        color: "#0f172a",
                        boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
                      }}
                      labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="analyses"
                      stroke="#34d399"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="subscriptions"
                      stroke="#f59e0b"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-white">
              Saved Reports
            </h2>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {reports.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">
                  No saved reports yet.
                </p>
              ) : (
                reports.map((report) => (
                  <div
                    key={report._id}
                    className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {report.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Range {report.range} ·{" "}
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                      {report.kind}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
