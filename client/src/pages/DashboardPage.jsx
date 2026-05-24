import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import MeasuredChart from "../components/ui/MeasuredChart";
import { TrendingUp, Upload, FileText, BarChart3 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { analysisService } from "../services/analysisService";
import { paymentService } from "../services/paymentService";
import { formatDate } from "../lib/utils";
import { useAppRefresh } from "../hooks/useAppRefresh";
import { useAuth } from "../context/AuthContext";
import { normalizeSubscriptionView } from "../lib/subscriptionView";

export const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [response, status] = await Promise.all([
        analysisService.dashboard(),
        paymentService.getStatus().catch(() => null),
      ]);
      setData(response);
      setBilling(status);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAppRefresh(load);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  const metrics = data?.metrics || {
    resumeCount: 0,
    recentAnalyses: 0,
    averageAts: 0,
  };
  const billingView = normalizeSubscriptionView(billing || user);
  const topSkills = (data?.charts?.topSkills || []).map((skill) => ({
    name: skill.name,
    value: skill.value ?? skill.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back! Here's your analysis overview.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white font-semibold hover:scale-105 transition-transform"
        >
          <Upload size={16} /> Upload Resume
        </Link>
      </motion.div>

      {(billing || user) && (
        <Card className="border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-emerald-200/90">Subscription status</p>
              <h2 className="text-2xl font-bold text-white capitalize mt-1">
                {billingView.displayMode}
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                {billingView.status === "active" && billingView.expiry
                  ? `Active until ${formatDate(billingView.expiry)}`
                  : "Free plan active"}
              </p>
            </div>

            <div className="min-w-[220px]">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                <span>Monthly analyses</span>
                <span>
                  {billingView.monthlyUsageCount}/
                  {billingView.monthlyUsageLimit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  style={{
                    width: `${Math.min(
                      100,
                      (billingView.monthlyUsageCount /
                        billingView.monthlyUsageLimit) *
                        100,
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {billingView.remainingAnalyses} free analyses left this month
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Resumes Uploaded</p>
              <p className="text-3xl font-bold text-white mt-1">
                {metrics.resumeCount}
              </p>
              <p className="text-xs text-cyan-300 mt-2">Total</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
              <FileText size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Analyses Completed</p>
              <p className="text-3xl font-bold text-white mt-1">
                {metrics.recentAnalyses}
              </p>
              <p className="text-xs text-cyan-300 mt-2">Active</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
              <BarChart3 size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Average ATS Score</p>
              <p className="text-3xl font-bold text-white mt-1">
                {metrics.averageAts}
              </p>
              <p className="text-xs text-cyan-300 mt-2">Out of 100</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 text-sm text-slate-300 font-semibold">ATS Trend</p>
          <div className="h-80 min-w-0" style={{ minHeight: 320 }}>
            <MeasuredChart minWidth={280} minHeight={320}>
              {({ width, height }) => (
                <LineChart
                  width={width}
                  height={height}
                  data={(data?.charts?.atsTrend || []).map((v) => ({
                    ...v,
                    date: formatDate(v.date),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: "#06b6d4", r: 4 }}
                  />
                </LineChart>
              )}
            </MeasuredChart>
          </div>
        </Card>

        <Card>
          <p className="mb-4 text-sm text-slate-300 font-semibold">
            Top Matching Skills
          </p>
          <div className="h-80 min-w-0" style={{ minHeight: 320 }}>
            <MeasuredChart minWidth={280} minHeight={320}>
              {({ width, height }) => (
                <BarChart width={width} height={height} data={topSkills}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </MeasuredChart>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/upload"
            className="flex items-center gap-2 rounded-lg bg-slate-700/30 p-3 text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <Upload size={16} /> Upload Resume
          </Link>
          <Link
            to="/analyses"
            className="flex items-center gap-2 rounded-lg bg-slate-700/30 p-3 text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <BarChart3 size={16} /> View Analyses
          </Link>
          <Link
            to="/analytics"
            className="flex items-center gap-2 rounded-lg bg-slate-700/30 p-3 text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <TrendingUp size={16} /> Analytics
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-2 rounded-lg bg-slate-700/30 p-3 text-slate-200 hover:bg-slate-700/50 transition-colors"
          >
            <FileText size={16} /> My Resumes
          </Link>
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-indigo-900/20 to-cyan-900/20 border border-indigo-500/20">
        <h2 className="mb-3 text-lg font-semibold text-white">💡 Pro Tips</h2>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="flex gap-2">
            <span className="text-cyan-300">→</span>
            <span>
              Upload multiple versions of your resume to test different formats
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-300">→</span>
            <span>
              Focus on ATS optimization by including relevant keywords from job
              descriptions
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-300">→</span>
            <span>
              Use the generated cover letters as starting templates for your
              applications
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
};
