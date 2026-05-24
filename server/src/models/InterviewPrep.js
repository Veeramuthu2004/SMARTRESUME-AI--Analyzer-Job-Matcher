const mongoose = require("mongoose");

const InterviewPrepSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
    },
    technicalQuestions: [String],
    hrQuestions: [String],
    tips: [String],
  },
  { timestamps: true },
);

module.exports = mongoose.model("InterviewPrep", InterviewPrepSchema);
