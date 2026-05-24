const mongoose = require("mongoose");

const ScheduledNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    metadata: { type: Object, default: {} },
    dueAt: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sent: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    deadLetter: { type: Boolean, default: false },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String, default: "" },
    maxRetries: { type: Number, default: 3 },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "ScheduledNotification",
  ScheduledNotificationSchema,
);
