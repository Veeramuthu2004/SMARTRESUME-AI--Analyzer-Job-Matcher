const mongoose = require("mongoose");

const AdminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, required: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminLog", AdminLogSchema);
