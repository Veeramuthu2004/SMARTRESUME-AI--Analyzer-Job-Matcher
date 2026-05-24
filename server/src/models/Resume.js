const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    rawText: { type: String, default: "" },
    parsed: {
      name: String,
      email: String,
      phone: String,
      skills: [String],
      education: [String],
      experience: [String],
      certifications: [String],
      projects: [String],
      summary: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resume", ResumeSchema);
