const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    signature: {
      type: String,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    subscriptionPlan: {
      type: String,
      enum: ["pro", "premium"],
      required: true,
    },
    planDuration: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionExpiryDate: {
      type: Date,
      default: null,
    },
    billingCycle: {
      type: String,
      default: "manual",
    },
    provider: {
      type: String,
      default: "razorpay",
    },
    receipt: {
      type: String,
      sparse: true,
    },
    errorMessage: {
      type: String,
      sparse: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

// Index for faster queries
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
