const mongoose = require("mongoose");

const SavedJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, default: "" },
    location: { type: String, default: "" },
    rawJob: { type: Object, default: {} },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SavedJob", SavedJobSchema);
