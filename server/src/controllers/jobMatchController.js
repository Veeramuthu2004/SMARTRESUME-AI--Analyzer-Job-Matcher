const asyncHandler = require("../utils/asyncHandler");
const { parseResumeText, detectSkills } = require("../services/parserService");
const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const aiService = require("../services/aiService");
const crypto = require("crypto");
const env = process.env;
const {
  canAccessPlan,
  syncSubscriptionState,
} = require("../utils/subscription");

// Simple text normalization
const normalizeWords = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
};

const unique = (arr) => Array.from(new Set(arr.map((s) => s.toLowerCase())));

const matchJobDescription = asyncHandler(async (req, res) => {
  // Accept either resumeId or resumeText, and jobText or jobId
  const userId = req.user && req.user._id;
  const { resumeId, resumeText, jobText } = req.body;

  const syncResult = syncSubscriptionState(req.user);
  if (syncResult.changed) {
    await req.user.save();
  }

  if (!jobText && !req.body.jobId) {
    return res.status(400).json({ message: "jobText is required" });
  }

  let resumeRaw = resumeText || "";
  let resumeParsed = null;

  if (resumeId) {
    const resume = await Resume.findById(resumeId).lean();
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    resumeRaw =
      resume.rawText || resume.rawText || resume.parsed?.summary || "";
    resumeParsed = resume.parsed || null;
  }

  // If we still don't have resume text, try to parse provided resumeText
  if (!resumeParsed && resumeRaw) {
    resumeParsed =
      parseResumeText(resumeRaw).parsed || parseResumeText(resumeRaw);
  }

  // JD text
  const jdText = jobText || "";

  // Compute a cache hash for resume+jobText to allow TTL-based caching & dedupe
  const hashInput = `${userId || "anon"}::${resumeId || ""}::${jdText}`;
  const cacheHash = crypto.createHash("sha256").update(hashInput).digest("hex");

  // Check for cached analysis (avoid recomputing for same user/resume/jobText)
  try {
    const existing = await Analysis.findOne({ cacheHash }).lean();
    if (existing) {
      // if expiresAt exists and is in the past, let MongoDB remove it; otherwise return cached
      if (!existing.expiresAt || new Date(existing.expiresAt) > new Date()) {
        return res.json({
          matchPercentage: existing.matchPercentage,
          atsScore: existing.atsScore,
          keywordScore: existing.keywordScore,
          skillMatchPct: existing.technicalScore,
          matchingSkills: existing.matchingSkills || [],
          missingSkills: existing.missingSkills || [],
          suggestions: existing.suggestions || [],
          analysisId: existing._id,
        });
      }
    }
  } catch (err) {
    console.warn("Error checking cached analysis", err?.message || err);
  }

  // Extract skills
  const jdSkills = unique(detectSkills(jdText));
  const resumeSkills = resumeParsed?.skills
    ? resumeParsed.skills.map((s) => s.toLowerCase())
    : unique(detectSkills(resumeRaw));

  const matching = jdSkills.filter((s) => resumeSkills.includes(s));
  const missing = jdSkills.filter((s) => !resumeSkills.includes(s));

  // Keyword overlap score (simple)
  const jdWords = unique(normalizeWords(jdText));
  const resumeWords = unique(normalizeWords(resumeRaw));
  const overlap = jdWords.filter((w) => resumeWords.includes(w));
  const keywordScore =
    jdWords.length > 0
      ? Math.round((overlap.length / jdWords.length) * 100)
      : 0;

  // Skill match percentage
  const skillMatchPct =
    jdSkills.length > 0
      ? Math.round((matching.length / jdSkills.length) * 100)
      : 0;

  // ATS score heuristic: weighted (keywords 60%, skills 30%, length/formatting 10%)
  const lengthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Math.min(1, (resumeRaw || "").split(/\s+/).length / 400) * 100,
      ),
    ),
  );
  const atsScore = Math.round(
    0.6 * keywordScore + 0.3 * skillMatchPct + 0.1 * lengthScore,
  );

  const matchPercentage = Math.round(
    skillMatchPct * 0.7 + keywordScore * 0.3 + atsScore * 0.1,
  );

  // Clamp match percentage to 0-100
  const clampedMatchPercentage = Math.max(0, Math.min(100, matchPercentage));

  // Create simple suggestions
  const suggestions = [];
  if (missing.length > 0) {
    suggestions.push(`Add missing skills: ${missing.slice(0, 6).join(", ")}`);
  }
  if (keywordScore < 60) {
    suggestions.push(
      "Include more JD keywords and action verbs in your summary and experience sections.",
    );
  }
  if (resumeRaw.split(/\s+/).length < 200) {
    suggestions.push(
      "Consider expanding key experience bullets to show measurable impact.",
    );
  }

  // Semantic similarity placeholder (could use embeddings)
  const semanticSimilarity = Math.round(
    (overlap.length / Math.max(1, jdWords.length)) * 100,
  );

  // Try to enrich suggestions using AI (Gemini) if configured
  let aiEnhancements = null;
  const hasPaidAccess = canAccessPlan(req.user, "pro");
  if (hasPaidAccess) {
    try {
      aiEnhancements = await aiService.generateMatchEnhancements({
        resumeText: resumeRaw,
        jobText: jdText,
        matchingSkills: matching,
        missingSkills: missing,
      });
    } catch (err) {
      aiEnhancements = null;
      console.warn("AI enhancement failed", err?.message || err);
    }
  }

  // Final suggestions prefer AI enhancements when available
  const finalSuggestions = aiEnhancements?.suggestions?.length
    ? aiEnhancements.suggestions
    : suggestions;

  // Persist analysis record
  // Set TTL for cache (days)
  const ttlDays = parseInt(env.MATCH_CACHE_DAYS || "7", 10);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const analysisDoc = await Analysis.create({
    user: userId,
    resume: resumeId || null,
    jobDescription: jdText,
    roleTitle: req.body.roleTitle || "",
    matchPercentage: clampedMatchPercentage,
    matchingSkills: matching,
    missingSkills: missing,
    semanticSimilarity,
    atsScore,
    keywordScore,
    technicalScore: skillMatchPct,
    suggestions: finalSuggestions,
    recommendations: aiEnhancements?.recommendations || [],
    coverLetter: aiEnhancements?.coverLetter || "",
    interviewPrep: aiEnhancements?.interviewPrep || {},
    cacheHash,
    expiresAt,
  });

  if (req.user) {
    req.user.monthlyUsageCount = Number(req.user.monthlyUsageCount || 0) + 1;
    await req.user.save();
  }

  res.json({
    matchPercentage: clampedMatchPercentage,
    atsScore,
    keywordScore,
    skillMatchPct,
    matchingSkills: matching,
    missingSkills: missing,
    suggestions: finalSuggestions,
    analysisId: analysisDoc._id,
  });
});

module.exports = { matchJobDescription };
