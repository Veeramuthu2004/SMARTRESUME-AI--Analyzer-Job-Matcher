const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true },
    range: { type: String, default: "30d" },
    title: { type: String, required: true },
    metrics: { type: Object, default: {} },
    filters: { type: Object, default: {} },
    fileUrl: { type: String, default: "" },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", ReportSchema);
