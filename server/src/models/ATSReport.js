const mongoose = require("mongoose");

const ATSReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
    },
    score: { type: Number, default: 0 },
    details: {
      formatting: Number,
      keywords: Number,
      technical: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ATSReport", ATSReportSchema);
