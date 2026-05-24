const mongoose = require("mongoose");

const JobDescriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    description: { type: String, required: true },
    requiredSkills: [String],
    embeddings: [Number],
  },
  { timestamps: true },
);

module.exports = mongoose.model("JobDescription", JobDescriptionSchema);
