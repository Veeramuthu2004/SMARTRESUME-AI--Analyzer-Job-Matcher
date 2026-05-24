const User = require("../models/User");
const Notification = require("../models/Notification");
const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const ATSReport = require("../models/ATSReport");
const InterviewPrep = require("../models/InterviewPrep");
const JobDescription = require("../models/JobDescription");
const SavedJob = require("../models/SavedJob");
const Payment = require("../models/Payment");
const AdminLog = require("../models/AdminLog");
const asyncHandler = require("../utils/asyncHandler");
const { sendNotificationEmail } = require("../services/emailService");

const updateProfile = asyncHandler(async (req, res) => {
  const { name, headline, skills, avatarUrl } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.name = name ?? user.name;
  user.headline = headline ?? user.headline;
  user.avatarUrl = avatarUrl ?? user.avatarUrl;
  user.skills = Array.isArray(skills) ? skills : user.skills;

  await user.save();

  await Notification.create({
    user: req.user._id,
    title: "Profile updated",
    message: "Your profile settings were updated successfully.",
    type: "info",
  });

  sendNotificationEmail({
    to: user.email,
    title: "Profile updated",
    message: "Your Smart Resume profile settings were updated successfully.",
    enabled: user.emailNotifications !== false,
  }).catch((err) => {
    console.warn(
      "Failed to send profile notification email:",
      err?.message || err,
    );
  });

  return res.json({ user });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file was uploaded." });
  }

  if (!req.file.mimetype?.startsWith("image/")) {
    return res
      .status(400)
      .json({ message: "Please upload a valid image file." });
  }

  const avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  user.avatarUrl = avatarUrl;
  await user.save();

  return res.json({
    message: "Avatar updated successfully.",
    avatarUrl,
    user,
  });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const { emailNotifications, marketingEmails } = req.body;

  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (typeof emailNotifications === "boolean") {
    user.emailNotifications = emailNotifications;
  }

  if (typeof marketingEmails === "boolean") {
    user.marketingEmails = marketingEmails;
  }

  await user.save();

  return res.json({
    user,
    message: "Preferences updated successfully.",
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { password, confirmation } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!user) return res.status(404).json({ message: "User not found" });

  const isLocalAccount = user.provider === "local" || !!user.password;
  if (isLocalAccount) {
    if (!password) {
      return res.status(400).json({
        message: "Current password is required to delete this account.",
      });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(400).json({
        message: "Incorrect password. Account deletion cancelled.",
      });
    }
  } else if (
    String(confirmation || "")
      .trim()
      .toUpperCase() !== "DELETE"
  ) {
    return res.status(400).json({
      message: "Type DELETE to confirm deletion for this account.",
    });
  }

  await Promise.all([
    Notification.deleteMany({ user: req.user._id }),
    Resume.deleteMany({ user: req.user._id }),
    Analysis.deleteMany({ user: req.user._id }),
    ATSReport.deleteMany({ user: req.user._id }),
    InterviewPrep.deleteMany({ user: req.user._id }),
    JobDescription.deleteMany({ user: req.user._id }),
    SavedJob.deleteMany({ user: req.user._id }),
    Payment.deleteMany({ userId: req.user._id }),
    AdminLog.deleteMany({ admin: req.user._id }),
    User.deleteOne({ _id: req.user._id }),
  ]);

  try {
    const { getIo } = require("../services/socketService");
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "user_account_deleted",
      userId: req.user._id,
      admin: null,
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "User account deleted",
      message: `User ${req.user.email || req.user._id} deleted their account`,
      userId: req.user._id,
    });
  } catch (e) {}

  return res.json({ message: "Account deleted successfully." });
});

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  return res.json({ notifications });
});

module.exports = {
  updateProfile,
  uploadAvatar,
  updatePreferences,
  deleteAccount,
  getNotifications,
};
