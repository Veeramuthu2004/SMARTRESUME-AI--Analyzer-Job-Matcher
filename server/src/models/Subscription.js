const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "past_due", "free"],
      default: "free",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "manual"],
      default: "manual",
    },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    orderId: { type: String, default: "" },
    paymentId: { type: String, default: "" },
    provider: { type: String, default: "razorpay" },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("Subscription", SubscriptionSchema);
