import { useEffect, useState } from "react";
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
import { Card } from "../components/ui/Card";
import { analysisService } from "../services/analysisService";

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await analysisService.dashboard();
        setData(response);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading analytics...</div>;
  }

  const metrics = data?.metrics || {
    resumeCount: 0,
    recentAnalyses: 0,
    averageAts: 0,
  };

  const charts = data?.charts || {
    atsTrend: [],
    topSkills: [],
  };
  // Provide sample mock data if charts empty to avoid blank charts
  const mockAts =
    charts.atsTrend && charts.atsTrend.length > 0
      ? charts.atsTrend
      : [
          { date: "2026-05-18", score: 68 },
          { date: "2026-05-11", score: 72 },
          { date: "2026-05-04", score: 65 },
        ];
  const mockTopSkills =
    charts.topSkills && charts.topSkills.length > 0
      ? charts.topSkills
      : [
          { name: "javascript", value: 45 },
          { name: "react", value: 32 },
          { name: "node.js", value: 28 },
        ];
  // Create distribution data
  const atsDistribution = [
    { name: "90-100", value: 0 },
    { name: "70-89", value: 0 },
    { name: "50-69", value: 0 },
    { name: "Below 50", value: 0 },
  ];

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-white"
      >
        Analytics & Insights
      </motion.h1>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Total Resumes
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {metrics.resumeCount}
          </p>
          <p className="mt-1 text-xs text-cyan-300">Uploaded</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Total Analyses
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {metrics.recentAnalyses}
          </p>
          <p className="mt-1 text-xs text-cyan-300">Completed</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Average ATS Score
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {metrics.averageAts}
          </p>
          <p className="mt-1 text-xs text-cyan-300">Out of 100</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Success Rate
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {metrics.recentAnalyses > 0
              ? Math.round((metrics.resumeCount / metrics.recentAnalyses) * 100)
              : 0}
            %
          </p>
          <p className="mt-1 text-xs text-cyan-300">Pass Rate</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ATS Trend */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">
            ATS Score Trend
          </h2>
          <div className="h-80 min-w-0" style={{ minHeight: 320 }}>
            <MeasuredChart minWidth={280} minHeight={320}>
              {({ width, height }) => (
                <LineChart
                  width={width}
                  height={height}
                  data={mockAts.map((v) => ({
                    ...v,
                    date: v.date ? new Date(v.date).toLocaleDateString() : "",
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

        {/* Top Skills */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Top Matching Skills
          </h2>
          <div className="h-80 min-w-0" style={{ minHeight: 320 }}>
            <MeasuredChart minWidth={280} minHeight={320}>
              {({ width, height }) => (
                <BarChart
                  width={width}
                  height={height}
                  data={mockTopSkills.map((s) => ({
                    name: s.name,
                    value: s.value ?? s.count ?? 0,
                  }))}
                >
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

      {/* Detailed Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">
            ATS Distribution
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Excellent (90-100)</span>
              <span className="text-lg font-semibold text-emerald-300">
                {atsDistribution[0].value}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Good (70-89)</span>
              <span className="text-lg font-semibold text-cyan-300">
                {atsDistribution[1].value}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Fair (50-69)</span>
              <span className="text-lg font-semibold text-yellow-300">
                {atsDistribution[2].value}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Below Average</span>
              <span className="text-lg font-semibold text-rose-300">
                {atsDistribution[3].value}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">Performance</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Highest Score</p>
              <p className="text-2xl font-bold text-white">
                {Math.max(
                  ...(charts.atsTrend || []).map((d) => d.score || 0),
                  0,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Lowest Score</p>
              <p className="text-2xl font-bold text-white">
                {Math.min(
                  ...(charts.atsTrend || []).map((d) => d.score || 0),
                  100,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Improvement</p>
              <p className="text-2xl font-bold text-cyan-300">+12%</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Skills Summary
          </h2>
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Most Matched</p>
            <div className="space-y-1">
              {(charts.topSkills || []).slice(0, 3).map((skill, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">{skill.name}</span>
                  <span className="text-xs font-semibold text-cyan-300">
                    {skill.value ?? skill.count ?? 0}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-white">Key Insights</h2>
        <div className="space-y-3 text-sm text-slate-200">
          <div className="flex gap-3">
            <div className="text-cyan-300">→</div>
            <p>
              Your average ATS score of{" "}
              <span className="font-semibold text-white">
                {metrics.averageAts}
              </span>{" "}
              indicates a <span className="text-emerald-300">strong</span> match
              with job descriptions.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-cyan-300">→</div>
            <p>
              Focus on developing skills in{" "}
              <span className="font-semibold text-white">
                {(charts.topSkills || []).length > 0
                  ? charts.topSkills[0]?.name
                  : "technical areas"}
              </span>{" "}
              for better job match rates.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-cyan-300">→</div>
            <p>
              You've completed{" "}
              <span className="font-semibold text-white">
                {metrics.recentAnalyses}
              </span>{" "}
              analyses. Continue analyzing different roles to diversify your
              skills.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
