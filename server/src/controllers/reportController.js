const PDFDocument = require("pdfkit");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Analysis = require("../models/Analysis");
const Resume = require("../models/Resume");
const Payment = require("../models/Payment");
const Subscription = require("../models/Subscription");
const Report = require("../models/Report");
const AdminLog = require("../models/AdminLog");

const getDateWindow = (range) => {
  const normalized = String(range || "30d").toLowerCase();
  const days = normalized === "90d" ? 90 : normalized === "7d" ? 7 : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);
  return { days, start, end, previousStart };
};

const buildReportSummary = async (range = "30d") => {
  const { days, start, previousStart } = getDateWindow(range);

  const [
    totalUsers,
    premiumUsers,
    totalAnalyses,
    activeSubscriptions,
    totalRevenueAgg,
    monthlyPayments,
    monthlyUsers,
    monthlyAnalyses,
    monthlySubscriptions,
    recentActivity,
    recentResumes,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isPremium: true }),
    Analysis.countDocuments(),
    Subscription.countDocuments({ status: "active" }),
    Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { status: "success", createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          payments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Analysis.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          analyses: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Subscription.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          subscriptions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AdminLog.find({ createdAt: { $gte: start } })
      .populate("admin", "name email role")
      .sort({ createdAt: -1 })
      .limit(20),
    Resume.find({ createdAt: { $gte: start } })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(20),
  ]);

  const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;
  const totalPayments = totalRevenueAgg[0]?.totalPayments || 0;

  const currentUsers = monthlyUsers.reduce((sum, item) => sum + item.users, 0);
  const previousUsers = await User.countDocuments({
    createdAt: { $gte: previousStart, $lt: start },
  });
  const monthlyGrowth =
    previousUsers > 0
      ? Math.round(((currentUsers - previousUsers) / previousUsers) * 100)
      : currentUsers > 0
        ? 100
        : 0;

  const seriesMap = new Map();
  const pushSeries = (series, field) => {
    series.forEach((item) => {
      const current = seriesMap.get(item._id) || { date: item._id };
      current[field] =
        item[field] || item[field === "revenue" ? "revenue" : field] || 0;
      seriesMap.set(item._id, current);
    });
  };

  pushSeries(monthlyUsers, "users");
  pushSeries(monthlyPayments, "revenue");
  pushSeries(monthlyAnalyses, "analyses");
  pushSeries(monthlySubscriptions, "subscriptions");

  const charts = Array.from(seriesMap.values())
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((item) => ({
      ...item,
      revenue: item.revenue || 0,
      users: item.users || 0,
      analyses: item.analyses || 0,
      subscriptions: item.subscriptions || 0,
    }));

  return {
    range: `${days}d`,
    metrics: {
      totalUsers,
      premiumUsers,
      totalAnalyses,
      activeSubscriptions,
      totalRevenue,
      totalPayments,
      monthlyGrowth,
      recentResumes: recentResumes.length,
      recentActivity: recentActivity.length,
    },
    charts,
    activity: recentActivity,
    resumes: recentResumes,
  };
};

const getReportsSummary = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";
  const summary = await buildReportSummary(range);

  return res.json({ summary });
});

const listReports = asyncHandler(async (_req, res) => {
  const reports = await Report.find({})
    .populate("generatedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(100);
  return res.json({ reports });
});

const downloadReportsPdf = asyncHandler(async (req, res) => {
  const range = req.query.range || "30d";
  const summary = await buildReportSummary(range);
  const report = await Report.create({
    kind: "admin_pdf",
    range: summary.range,
    title: `Admin PDF report (${summary.range})`,
    metrics: summary.metrics,
    filters: { range: summary.range },
    generatedBy: req.user._id,
  });

  // notify admins in real-time that a report was generated
  try {
    const { getIo } = require("../services/socketService");
    const io = getIo();
    if (io) {
      io.to("admin-dashboard").emit("dashboard:update", {
        type: "report_generated",
        report: { _id: report._id, title: report.title, range: report.range },
        admin: req.user._id,
      });
      io.to("admin-dashboard").emit("notification:new", {
        title: "Admin report generated",
        message: `Report ${report.title} was generated by admin ${req.user._id}`,
        reportId: report._id,
      });
    }
  } catch (e) {}

  const doc = new PDFDocument({ margin: 40 });
  const filename = `admin-report-${summary.range}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc
    .fontSize(20)
    .text("Smart Resume Analyzer Admin Report", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Range: ${summary.range}`);
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  Object.entries(summary.metrics).forEach(([key, value]) => {
    doc.fontSize(12).text(`${key}: ${value}`);
  });

  doc.moveDown();
  doc.fontSize(14).text("Monthly Series");
  summary.charts.forEach((item) => {
    doc
      .fontSize(11)
      .text(
        `${item.date} — Users: ${item.users}, Revenue: ${item.revenue}, Analyses: ${item.analyses}, Subscriptions: ${item.subscriptions}`,
      );
  });

  doc.end();

  await AdminLog.create({
    admin: req.user._id,
    action: "download_report_pdf",
    metadata: { reportId: report._id, range: summary.range },
  });
});

module.exports = {
  getReportsSummary,
  listReports,
  downloadReportsPdf,
  buildReportSummary,
};
