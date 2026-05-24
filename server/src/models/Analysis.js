const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobDescription: { type: String, required: true },
    roleTitle: { type: String, default: "" },
    matchPercentage: { type: Number, default: 0 },
    matchingSkills: [String],
    missingSkills: [String],
    semanticSimilarity: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    formattingScore: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    suggestions: [String],
    recommendations: [String],
    coverLetter: { type: String, default: "" },
    interviewPrep: {
      technicalQuestions: [String],
      behavioralQuestions: [String],
      technical: [String],
      behavioral: [String],
      tips: [String],
    },
    reportUrl: { type: String, default: "" },
    // Cache control
    cacheHash: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// TTL index for automatic expiry of cached analyses (default: use expiresAt field)
// Documents with an `expiresAt` Date will be removed by MongoDB when that time passes.
AnalysisSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Add an index on cacheHash to speed up lookup for identical resume+JD
AnalysisSchema.index({ cacheHash: 1 });

module.exports = mongoose.model("Analysis", AnalysisSchema);
