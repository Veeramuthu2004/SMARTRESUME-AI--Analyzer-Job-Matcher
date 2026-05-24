const Analysis = require("../models/Analysis");
const Resume = require("../models/Resume");
const ATSReport = require("../models/ATSReport");
const InterviewPrep = require("../models/InterviewPrep");
const JobDescription = require("../models/JobDescription");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { getIo } = require("../services/socketService");
const { computeScores } = require("../services/scoringService");
const { detectSkills } = require("../services/parserService");
const aiService = require("../services/aiService");
const { sendNotificationEmail } = require("../services/emailService");
const {
  MONTHLY_ANALYSIS_LIMIT,
  canAccessPlan,
  getSubscriptionSnapshot,
  syncSubscriptionState,
} = require("../utils/subscription");
const PDFDocument = require("pdfkit");

const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeId, roleTitle, company, jobDescription } = req.body;

  const syncResult = syncSubscriptionState(req.user);
  if (syncResult.changed) {
    await req.user.save();
  }

  const hasPaidAccess = canAccessPlan(req.user, "pro");
  const monthlyUsageCount = Number(req.user.monthlyUsageCount || 0);

  if (!hasPaidAccess && monthlyUsageCount >= MONTHLY_ANALYSIS_LIMIT) {
    const snapshot = getSubscriptionSnapshot(req.user);
    return res.status(403).json({
      message:
        "Your free plan limit has been reached for this month. Upgrade to continue analyzing resumes.",
      requiresUpgrade: true,
      monthlyLimitReached: true,
      monthlyUsageCount: snapshot.monthlyUsageCount,
      monthlyUsageLimit: snapshot.monthlyUsageLimit,
      remainingAnalyses: snapshot.remainingAnalyses,
      currentPlan: snapshot.plan,
    });
  }

  const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
  if (!resume) return res.status(404).json({ message: "Resume not found" });

  const score = computeScores({
    resumeText: resume.rawText,
    parsedSkills: resume.parsed.skills,
    jobDescription,
  });

  const baseSuggestions = [];
  if ((score.missingSkills || []).length > 0) {
    baseSuggestions.push(
      `Add missing skills: ${score.missingSkills.slice(0, 6).join(", ")}`,
    );
  }
  if ((score.keywordScore || 0) < 60) {
    baseSuggestions.push(
      "Include more JD keywords and action verbs in your summary and experience sections.",
    );
  }
  if ((resume.rawText || "").split(/\s+/).filter(Boolean).length < 200) {
    baseSuggestions.push(
      "Consider expanding key experience bullets to show measurable impact.",
    );
  }

  const ai = hasPaidAccess
    ? await aiService.generateMatchEnhancements({
        resumeText: resume.rawText,
        jobText: jobDescription,
        matchingSkills: score.matchingSkills,
        missingSkills: score.missingSkills,
      })
    : null;

  // Normalize ai response shape
  const aiSuggestions = ai?.suggestions?.length
    ? ai.suggestions
    : baseSuggestions;
  const aiRecommendations = ai?.recommendations || [];
  const aiCoverLetter = ai?.coverLetter || "";
  const aiInterview = ai?.interviewPrep || ai?.interview || [];

  const technicalQuestions = Array.isArray(aiInterview)
    ? aiInterview
    : aiInterview.technical || [];
  const behavioralQuestions = Array.isArray(aiInterview)
    ? []
    : aiInterview.behavioral || [];
  const interviewTips = !Array.isArray(aiInterview)
    ? aiInterview.tips || []
    : [];

  const analysis = await Analysis.create({
    user: req.user._id,
    resume: resume._id,
    jobDescription,
    roleTitle,
    matchPercentage: score.matchPercentage,
    matchingSkills: score.matchingSkills,
    missingSkills: score.missingSkills,
    semanticSimilarity: score.semanticSimilarity,
    atsScore: score.atsScore,
    formattingScore: score.formattingScore,
    keywordScore: score.keywordScore,
    technicalScore: score.technicalScore,
    suggestions: aiSuggestions,
    recommendations: aiRecommendations,
    coverLetter: aiCoverLetter,
    interviewPrep: {
      technicalQuestions,
      behavioralQuestions,
      technical: technicalQuestions,
      behavioral: behavioralQuestions,
      tips: interviewTips,
    },
  });

  req.user.monthlyUsageCount = monthlyUsageCount + 1;
  await req.user.save();

  await ATSReport.create({
    user: req.user._id,
    analysis: analysis._id,
    score: score.atsScore,
    details: {
      formatting: score.formattingScore,
      keywords: score.keywordScore,
      technical: score.technicalScore,
    },
  });

  await InterviewPrep.create({
    user: req.user._id,
    analysis: analysis._id,
    technicalQuestions,
    hrQuestions: behavioralQuestions,
    tips: interviewTips,
  });

  // ensure company is stored when possible: use provided company, else try to
  // heuristically extract one from the job description text
  const { extractCompanyFromText } = require("../utils/jobUtils");
  const inferredCompany = extractCompanyFromText(jobDescription || "");
  await JobDescription.create({
    user: req.user._id,
    title: roleTitle || "Untitled Role",
    company: company || inferredCompany || "",
    description: jobDescription,
    requiredSkills: detectSkills(jobDescription),
  });

  await Notification.create({
    user: req.user._id,
    title: "Analysis completed",
    message: `Your ${roleTitle || "new"} analysis scored ${score.atsScore}/100 ATS.`,
    type: "success",
  });

  // emit real-time update for admins and notifications
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "analysis_completed",
      analysis: {
        _id: analysis._id,
        user: analysis.user,
        resume: analysis.resume,
        atsScore: analysis.atsScore,
        createdAt: analysis.createdAt,
      },
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "Analysis completed",
      message: `User ${req.user.email || req.user._id} completed an analysis (${analysis._id}).`,
      analysisId: analysis._id,
    });
    // also notify the specific user so their UI (subscription, analysis pages)
    // can update in real-time without polling
    try {
      const snapshot = getSubscriptionSnapshot(req.user);
      io.to(`user:${String(req.user._id)}`).emit("billing:update", snapshot);
    } catch (emitErr) {
      // ignore user emit errors
    }
    try {
      io.to(`user:${String(req.user._id)}`).emit("analysis:created", {
        analysisId: analysis._id,
      });
    } catch (emitErr) {}
  } catch (e) {}

  sendNotificationEmail({
    to: req.user.email,
    title: "Analysis completed",
    message: `Your ${roleTitle || "new"} analysis scored ${score.atsScore}/100 ATS. Open Smart Resume Analyzer to review the report.`,
    enabled: req.user.emailNotifications !== false,
  }).catch((err) => {
    console.warn(
      "Failed to send analysis notification email:",
      err?.message || err,
    );
  });

  return res.status(201).json({ analysis });
});

const listAnalyses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const cachedOnly = String(req.query.cached || "").toLowerCase() === "true";

  const filter = { user: req.user._id };
  if (cachedOnly) {
    filter.cacheHash = { $exists: true, $ne: null };
  }

  const [items, total] = await Promise.all([
    Analysis.find(filter)
      .populate("resume", "fileName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Analysis.countDocuments(filter),
  ]);

  return res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getAnalysisById = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate("resume");
  if (!analysis) return res.status(404).json({ message: "Analysis not found" });
  return res.json({ analysis });
});

const deleteAnalysis = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!analysis) return res.status(404).json({ message: "Analysis not found" });

  // Also delete related records
  await Promise.all([
    ATSReport.deleteMany({ analysis: req.params.id }),
    InterviewPrep.deleteMany({ analysis: req.params.id }),
  ]);

  return res.json({ message: "Analysis deleted", analysis });
});

const exportAnalysisPdf = asyncHandler(async (req, res) => {
  const syncResult = syncSubscriptionState(req.user);
  if (syncResult.changed) {
    await req.user.save();
  }

  if (!canAccessPlan(req.user, "pro")) {
    return res.status(403).json({
      message: "Upgrade to Pro to download analysis reports.",
      requiresUpgrade: true,
      requiredPlan: "pro",
    });
  }

  const analysis = await Analysis.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate("resume", "fileName parsed");

  if (!analysis) return res.status(404).json({ message: "Analysis not found" });

  const doc = new PDFDocument({ margin: 40 });
  const filename = `analysis-${analysis._id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  doc.pipe(res);

  doc
    .fontSize(18)
    .text("Smart Resume Analyzer - Analysis Report", { underline: true });
  doc.moveDown(0.6);
  doc.fontSize(12).text(`Role: ${analysis.roleTitle || "Untitled"}`);
  doc.text(`ATS Score: ${analysis.atsScore}`);
  doc.text(`Match Percentage: ${analysis.matchPercentage}`);
  doc.text(`Created: ${new Date(analysis.createdAt).toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(14).text("Matching Skills");
  doc.fontSize(11).text((analysis.matchingSkills || []).join(", ") || "None");
  doc.moveDown(0.5);

  doc.fontSize(14).text("Missing Skills");
  doc.fontSize(11).text((analysis.missingSkills || []).join(", ") || "None");
  doc.moveDown(0.5);

  doc.fontSize(14).text("Suggestions");
  (analysis.suggestions || []).forEach((s, i) =>
    doc.fontSize(11).text(`${i + 1}. ${s}`),
  );
  doc.moveDown(0.5);

  if (analysis.coverLetter) {
    doc.fontSize(14).text("Cover Letter Draft");
    doc.fontSize(11).text(analysis.coverLetter);
    doc.moveDown(0.5);
  }

  doc.end();
});

module.exports = {
  analyzeResume,
  listAnalyses,
  getAnalysisById,
  deleteAnalysis,
  exportAnalysisPdf,
};
