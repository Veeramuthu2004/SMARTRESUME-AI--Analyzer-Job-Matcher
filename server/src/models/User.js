const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    avatarUrl: { type: String, default: "" },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },
    skills: [{ type: String }],
    headline: { type: String, default: "" },
    emailNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date },
    // Premium subscription fields
    isPremium: { type: Boolean, default: false },
    subscriptionPlan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["free", "active", "expired", "canceled", "past_due"],
      default: "free",
    },
    subscriptionStartDate: { type: Date, default: null },
    subscriptionExpiry: { type: Date, default: null },
    subscriptionExpiryDate: { type: Date, default: null },
    monthlyUsageCount: { type: Number, default: 0 },
    lastUsageReset: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function hashPassword() {
  // Use async middleware without the `next` callback. Return early if password
  // wasn't modified so mongoose proceeds normally.
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
