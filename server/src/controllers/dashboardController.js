const Analysis = require("../models/Analysis");
const Resume = require("../models/Resume");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

const getDashboard = asyncHandler(async (req, res) => {
  const [recentAnalyses, resumeCount, notifications] = await Promise.all([
    Analysis.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(8),
    Resume.countDocuments({ user: req.user._id }),
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(6),
  ]);

  const avgAts = recentAnalyses.length
    ? Math.round(
        recentAnalyses.reduce((acc, a) => acc + a.atsScore, 0) /
          recentAnalyses.length,
      )
    : 0;

  const skillCounts = {};
  recentAnalyses.forEach((a) => {
    a.matchingSkills.forEach((s) => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });

  const topSkills = Object.entries(skillCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return res.json({
    metrics: {
      resumeCount,
      recentAnalyses: recentAnalyses.length,
      averageAts: avgAts,
    },
    charts: {
      atsTrend: recentAnalyses
        .map((a) => ({ date: a.createdAt, score: a.atsScore }))
        .reverse(),
      topSkills,
    },
    recentAnalyses,
    notifications,
  });
});

module.exports = { getDashboard };
