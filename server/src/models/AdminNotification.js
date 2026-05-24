const mongoose = require("mongoose");

const AdminNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    read: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminNotification", AdminNotificationSchema);
