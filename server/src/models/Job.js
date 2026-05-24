const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String },
    location: { type: String },
    description: { type: String },
    skills: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Job", JobSchema);
