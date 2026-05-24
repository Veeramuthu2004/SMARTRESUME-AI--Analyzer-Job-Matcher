const mongoose = require("mongoose");

const SiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    maintenanceMode: { type: Boolean, default: false },
    branding: {
      appName: { type: String, default: "Smart Resume Analyzer" },
      tagline: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
      primaryColor: { type: String, default: "#22d3ee" },
    },
    pricing: {
      proMonthly: { type: Number, default: 499 },
      proYearly: { type: Number, default: 4999 },
      premiumMonthly: { type: Number, default: 999 },
      premiumYearly: { type: Number, default: 9999 },
    },
    email: {
      supportEmail: { type: String, default: "support@smartresume.dev" },
      senderName: { type: String, default: "Smart Resume Analyzer" },
    },
    subscription: {
      trialDays: { type: Number, default: 7 },
      gracePeriodDays: { type: Number, default: 3 },
      monthlyAnalysisLimit: { type: Number, default: 5 },
    },
    announcements: [
      {
        title: { type: String, required: true },
        message: { type: String, required: true },
        enabled: { type: Boolean, default: true },
      },
    ],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SiteSettings", SiteSettingsSchema);
