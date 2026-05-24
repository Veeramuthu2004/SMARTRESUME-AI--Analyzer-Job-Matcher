const User = require("../models/User");
const Analysis = require("../models/Analysis");
const AdminLog = require("../models/AdminLog");
const Resume = require("../models/Resume");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");
const { getIo } = require("../services/socketService");
const Job = require("../models/Job");
const SupportTicket = require("../models/SupportTicket");
const AdminNotification = require("../models/AdminNotification");
const Subscription = require("../models/Subscription");
const { buildReportSummary } = require("./reportController");

const getAdminOverview = asyncHandler(async (req, res) => {
  const summary = await buildReportSummary("30d");
  const aiUsage = await Analysis.aggregate([
    { $group: { _id: "$roleTitle", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  await AdminLog.create({
    admin: req.user._id,
    action: "view_admin_overview",
    metadata: { at: new Date().toISOString() },
  });

  return res.json({
    metrics: summary.metrics,
    charts: summary.charts,
    activity: summary.activity,
    aiUsage,
  });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({})
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({ users });
});

const listPayments = asyncHandler(async (_req, res) => {
  const Payment = require("../models/Payment");
  const payments = await Payment.find({})
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({ payments });
});

const listResumes = asyncHandler(async (_req, res) => {
  const resumes = await Resume.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({ resumes });
});

const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findByIdAndDelete(req.params.id);
  if (!resume) return res.status(404).json({ message: "Resume not found" });

  await AdminLog.create({
    admin: req.user._id,
    action: "delete_resume",
    metadata: { resumeId: resume._id, fileName: resume.fileName },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "resume_deleted",
      resumeId: resume._id,
      admin: req.user._id,
    });
  } catch (e) {}

  return res.json({ message: "Resume deleted" });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() === id) {
    return res.status(400).json({ message: "You cannot delete yourself" });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await AdminLog.create({
    admin: req.user._id,
    action: "delete_user",
    metadata: { userId: id, email: user.email },
  });

  // emit real-time update to admin dashboard
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "user_deleted",
      userId: id,
      admin: req.user._id,
    });
  } catch (e) {}

  return res.json({ message: "User deleted" });
});

const toggleBanUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() === id) {
    return res.status(400).json({ message: "You cannot ban yourself" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isBanned = !user.isBanned;
  await user.save();

  await AdminLog.create({
    admin: req.user._id,
    action: user.isBanned ? "ban_user" : "unban_user",
    metadata: { userId: id, email: user.email },
  });

  // emit real-time update to admin dashboard
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: user.isBanned ? "user_banned" : "user_unbanned",
      user,
      admin: req.user._id,
    });
  } catch (e) {}

  return res.json({
    message: user.isBanned ? "User banned" : "User unbanned",
    user,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() === id) {
    return res.status(400).json({ message: "You cannot update yourself here" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { role, subscriptionPlan, isPremium, subscriptionStatus } = req.body;

  if (role && ["user", "admin"].includes(role)) {
    user.role = role;
  }

  if (
    subscriptionPlan &&
    ["free", "pro", "premium"].includes(subscriptionPlan)
  ) {
    user.subscriptionPlan = subscriptionPlan;
    user.isPremium = subscriptionPlan !== "free";
    user.subscriptionStatus =
      subscriptionPlan === "free" ? "free" : subscriptionStatus || "active";
  }

  if (typeof isPremium === "boolean") {
    user.isPremium = isPremium;
  }

  if (
    subscriptionStatus &&
    ["free", "active", "expired", "canceled", "past_due"].includes(
      subscriptionStatus,
    )
  ) {
    user.subscriptionStatus = subscriptionStatus;
  }

  await user.save();

  await AdminLog.create({
    admin: req.user._id,
    action: "update_user",
    metadata: {
      userId: id,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
    },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "user_updated",
      user,
      admin: req.user._id,
    });
  } catch (e) {}

  return res.json({ user, message: "User updated" });
});

const refundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findById(id).populate("userId", "name email");

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  payment.status = "refunded";
  payment.metadata = {
    ...(payment.metadata || {}),
    refundedBy: req.user._id,
    refundedAt: new Date().toISOString(),
  };
  await payment.save();

  if (payment.userId) {
    await User.findByIdAndUpdate(payment.userId._id, {
      isPremium: false,
      subscriptionPlan: "free",
      subscriptionStatus: "cancelled",
      subscriptionExpiryDate: new Date(),
      subscriptionExpiry: new Date(),
    });

    await Subscription.findOneAndUpdate(
      { user: payment.userId._id },
      {
        user: payment.userId._id,
        plan: "free",
        status: "cancelled",
        billingCycle: payment.planDuration,
        startDate: payment.subscriptionStartDate || payment.createdAt,
        expiryDate: new Date(),
        payment: payment._id,
        orderId: payment.orderId,
        paymentId: payment.paymentId || "",
        provider: payment.provider || "razorpay",
        metadata: {
          ...(payment.metadata || {}),
          refundedBy: req.user._id,
          refundedAt: new Date().toISOString(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  await AdminLog.create({
    admin: req.user._id,
    action: "refund_payment",
    metadata: {
      paymentId: payment._id,
      userId: payment.userId?._id,
      email: payment.userId?.email,
    },
  });

  // emit real-time update to admin dashboard and notify admins
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "payment_refunded",
      payment,
      admin: req.user._id,
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "Payment refunded",
      message: `Payment ${payment._id} was refunded by admin ${req.user._id}`,
      paymentId: payment._id,
      admin: req.user._id,
    });
    // notify the affected user directly so their UI updates in realtime
    try {
      if (payment.userId) {
        const updated = await User.findById(payment.userId._id);
        const { getSubscriptionSnapshot } = require("../utils/subscription");
        const snap = getSubscriptionSnapshot(updated);
        io.to(`user:${String(payment.userId._id)}`).emit("billing:update", {
          ...snap,
          subscriptionPlan: updated.subscriptionPlan,
        });
      }
    } catch (e) {}
  } catch (e) {}

  return res.json({ message: "Payment refunded", payment });
});

// Jobs
const listJobs = asyncHandler(async (_req, res) => {
  const jobs = await Job.find({}).sort({ createdAt: -1 }).limit(200);
  return res.json({ jobs });
});

const createJob = asyncHandler(async (req, res) => {
  const { title, company, location, description, skills, featured } = req.body;
  const job = await Job.create({
    title,
    company,
    location,
    description,
    skills: skills || [],
    featured: !!featured,
    postedBy: req.user._id,
  });

  await AdminLog.create({
    admin: req.user._id,
    action: "create_job",
    metadata: { jobId: job._id },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "job_created",
      job,
      admin: req.user._id,
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "Job posted",
      message: `Job ${job.title} was posted by admin ${req.user._id}`,
      jobId: job._id,
    });
    // also broadcast new job to all connected clients (public job feed)
    try {
      io.emit("job:new", job);
    } catch (e) {}
  } catch (e) {}

  return res.status(201).json({ job });
});

const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  Object.assign(job, req.body);
  await job.save();

  await AdminLog.create({
    admin: req.user._id,
    action: "update_job",
    metadata: { jobId: job._id },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "job_updated",
      job,
      admin: req.user._id,
    });
  } catch (e) {}

  return res.json({ job });
});

const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await Job.findByIdAndDelete(id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  await AdminLog.create({
    admin: req.user._id,
    action: "delete_job",
    metadata: { jobId: id },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "job_deleted",
      jobId: id,
      admin: req.user._id,
    });
  } catch (e) {}

  return res.json({ message: "Job deleted" });
});

// Support tickets
const listSupportTickets = asyncHandler(async (_req, res) => {
  const tickets = await SupportTicket.find({})
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({ tickets });
});

const getSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate(
    "userId",
    "name email",
  );
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  return res.json({ ticket });
});

const updateSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicket.findById(id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  const { status, adminId, message } = req.body;
  if (status) ticket.status = status;
  if (adminId) ticket.adminId = adminId;
  if (message)
    ticket.message = `${ticket.message}\n\n[Admin ${req.user._id}]: ${message}`;
  await ticket.save();

  await AdminLog.create({
    admin: req.user._id,
    action: "update_ticket",
    metadata: { ticketId: id },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "ticket_updated",
      ticket,
      admin: req.user._id,
    });
  } catch (e) {}

  return res.json({ ticket });
});

const deleteSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  await AdminLog.create({
    admin: req.user._id,
    action: "delete_ticket",
    metadata: { ticketId: req.params.id },
  });
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "ticket_deleted",
      ticketId: req.params.id,
      admin: req.user._id,
    });
  } catch (e) {}
  return res.json({ message: "Ticket deleted" });
});

// Admin notifications
const listAdminNotifications = asyncHandler(async (_req, res) => {
  const notes = await AdminNotification.find({})
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({ notifications: notes });
});

const createAdminNotification = asyncHandler(async (req, res) => {
  const { title, message, type, metadata } = req.body;
  const note = await AdminNotification.create({
    title,
    message,
    type: type || "info",
    metadata: metadata || {},
  });
  await AdminLog.create({
    admin: req.user._id,
    action: "create_notification",
    metadata: { notificationId: note._id },
  });
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "notification_created",
      notification: note,
      admin: req.user._id,
    });
    io.to("admin-dashboard").emit("notification:new", note);
  } catch (e) {}
  return res.status(201).json({ notification: note });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const note = await AdminNotification.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Notification not found" });
  note.read = true;
  await note.save();
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "notification_read",
      notification: note,
      admin: req.user._id,
    });
  } catch (e) {}
  return res.json({ notification: note });
});

const deleteAdminNotification = asyncHandler(async (req, res) => {
  const note = await AdminNotification.findByIdAndDelete(req.params.id);
  if (!note) return res.status(404).json({ message: "Notification not found" });
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "notification_deleted",
      notificationId: req.params.id,
      admin: req.user._id,
    });
  } catch (e) {}
  return res.json({ message: "Notification deleted" });
});

const listAdminActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 25), 100);
  const activity = await AdminLog.find({})
    .populate("admin", "name email role")
    .sort({ createdAt: -1 })
    .limit(limit);
  return res.json({ activity });
});

// Scheduled admin notifications
const ScheduledNotification = require("../models/ScheduledNotification");
const { getStats: getSchedulerStats } = require("../services/schedulerService");

const createScheduledAdminNotification = asyncHandler(async (req, res) => {
  const { title, message, type, metadata, dueAt } = req.body;
  if (!title || !message || !dueAt) {
    return res
      .status(400)
      .json({ message: "title, message and dueAt are required" });
  }
  const dt = new Date(dueAt);
  if (Number.isNaN(dt.getTime()))
    return res.status(400).json({ message: "Invalid dueAt" });

  const scheduled = await ScheduledNotification.create({
    title,
    message,
    type: type || "info",
    metadata: metadata || {},
    dueAt: dt,
    createdBy: req.user._id,
  });

  await AdminLog.create({
    admin: req.user._id,
    action: "schedule_notification",
    metadata: { scheduledId: scheduled._id },
  });

  return res.status(201).json({ scheduled });
});

const listScheduledAdminNotifications = asyncHandler(async (_req, res) => {
  const items = await ScheduledNotification.find({})
    .sort({ dueAt: 1 })
    .limit(500);
  return res.json({ scheduled: items });
});

const cancelScheduledAdminNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await ScheduledNotification.findById(id);
  if (!item)
    return res
      .status(404)
      .json({ message: "Scheduled notification not found" });
  item.cancelled = true;
  await item.save();
  await AdminLog.create({
    admin: req.user._id,
    action: "cancel_scheduled_notification",
    metadata: { scheduledId: id },
  });
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "scheduled_notification_cancelled",
      scheduledId: id,
      admin: req.user._id,
    });
  } catch (e) {}
  return res.json({
    message: "Scheduled notification cancelled",
    scheduled: item,
  });
});

const deleteScheduledAdminNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await ScheduledNotification.findByIdAndDelete(id);
  if (!item)
    return res
      .status(404)
      .json({ message: "Scheduled notification not found" });
  await AdminLog.create({
    admin: req.user._id,
    action: "delete_scheduled_notification",
    metadata: { scheduledId: id },
  });
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "scheduled_notification_deleted",
      scheduledId: id,
      admin: req.user._id,
    });
  } catch (e) {}
  return res.json({ message: "Scheduled notification deleted" });
});

const retryScheduledAdminNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await ScheduledNotification.findById(id);
  if (!item)
    return res
      .status(404)
      .json({ message: "Scheduled notification not found" });
  if (!item.deadLetter)
    return res
      .status(400)
      .json({ message: "Scheduled notification is not in dead-letter" });

  item.deadLetter = false;
  item.retryCount = 0;
  item.sent = false;
  item.cancelled = false;
  // if this was a simulated failure marker, clear it so retry can succeed
  if (String(item.title) === "SIMULATE_FAIL") {
    item.title = `SIMULATE_RETRIED_${new Date().toISOString()}`;
  }
  item.dueAt = new Date();
  await item.save();

  await AdminLog.create({
    admin: req.user._id,
    action: "retry_scheduled_notification",
    metadata: { scheduledId: id },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "scheduled_notification_requeued",
      scheduledId: id,
      admin: req.user._id,
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "Scheduled notification requeued",
      message: `Scheduled notification ${id} was requeued by admin ${req.user._id}`,
      scheduledId: id,
    });
  } catch (e) {}

  return res.json({
    message: "Scheduled notification requeued",
    scheduled: item,
  });
});

const forceDeadLetterScheduledAdminNotification = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const item = await ScheduledNotification.findById(id);
    if (!item)
      return res
        .status(404)
        .json({ message: "Scheduled notification not found" });
    item.deadLetter = true;
    item.lastError = item.lastError || "forcibly marked dead-letter by admin";
    await item.save();
    await AdminLog.create({
      admin: req.user._id,
      action: "force_deadletter_scheduled_notification",
      metadata: { scheduledId: id },
    });
    try {
      const io = getIo();
      io.to("admin-dashboard").emit("dashboard:update", {
        type: "scheduled_notification_deadletter",
        scheduledId: id,
        admin: req.user._id,
        lastError: item.lastError,
      });
      io.to("admin-dashboard").emit("notification:new", {
        title: "Scheduled notification forced to dead-letter",
        message: `Scheduled notification ${id} was forced to dead-letter by admin ${req.user._id}`,
        scheduledId: id,
        deadLetter: true,
      });
    } catch (e) {}
    return res.json({
      message: "Scheduled notification forced to dead-letter",
      scheduled: item,
    });
  },
);

const getSchedulerStatsHandler = asyncHandler(async (_req, res) => {
  const stats = await getSchedulerStats();
  return res.json({ stats });
});

module.exports = {
  getAdminOverview,
  listUsers,
  getUserById,
  updateUser,
  listPayments,
  listResumes,
  deleteResume,
  deleteUser,
  toggleBanUser,
  refundPayment,
  // jobs
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  // support tickets
  listSupportTickets,
  getSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  // admin notifications
  listAdminNotifications,
  createAdminNotification,
  markNotificationRead,
  deleteAdminNotification,
  listAdminActivity,
  createScheduledAdminNotification,
  listScheduledAdminNotifications,
  cancelScheduledAdminNotification,
  retryScheduledAdminNotification,
  forceDeadLetterScheduledAdminNotification,
  deleteScheduledAdminNotification,
  getSchedulerStatsHandler,
};
