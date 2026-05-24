const express = require("express");
const { protect, requireAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");
const reportController = require("../controllers/reportController");
const asyncHandler = require("../utils/asyncHandler");
const {
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
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  listSupportTickets,
  getSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  listAdminNotifications,
  createAdminNotification,
  markNotificationRead,
  deleteAdminNotification,
  listAdminActivity,
} = adminController;

const router = express.Router();

const forceDeadLetterHandler =
  adminController.forceDeadLetterScheduledAdminNotification ||
  asyncHandler(async (_req, res) =>
    res.status(501).json({ message: "Dead-letter handler unavailable" }),
  );

router.get("/overview", protect, requireAdmin, getAdminOverview);
// alias for compatibility
router.get("/stats", protect, requireAdmin, getAdminOverview);
router.get("/users", protect, requireAdmin, listUsers);
router.get("/users/:id", protect, requireAdmin, getUserById);
router.patch("/users/:id", protect, requireAdmin, updateUser);
router.get("/payments", protect, requireAdmin, listPayments);
router.get("/resumes", protect, requireAdmin, listResumes);
router.delete("/resumes/:id", protect, requireAdmin, deleteResume);
router.patch("/users/:id/ban", protect, requireAdmin, toggleBanUser);
router.delete("/users/:id", protect, requireAdmin, deleteUser);
router.patch("/payments/:id/refund", protect, requireAdmin, refundPayment);

router.get("/activity", protect, requireAdmin, listAdminActivity);

// scheduler stats
router.get(
  "/scheduler/stats",
  protect,
  requireAdmin,
  adminController.getSchedulerStatsHandler,
);

// Jobs
router.get("/jobs", protect, requireAdmin, listJobs);
router.post("/jobs", protect, requireAdmin, createJob);
router.patch("/jobs/:id", protect, requireAdmin, updateJob);
router.delete("/jobs/:id", protect, requireAdmin, deleteJob);

// Support tickets
router.get("/support", protect, requireAdmin, listSupportTickets);
router.get("/support/:id", protect, requireAdmin, getSupportTicket);
router.patch("/support/:id", protect, requireAdmin, updateSupportTicket);
router.delete("/support/:id", protect, requireAdmin, deleteSupportTicket);

// Admin notifications
router.get("/notifications", protect, requireAdmin, listAdminNotifications);
router.post("/notifications", protect, requireAdmin, createAdminNotification);
// schedule notifications for later
router.post(
  "/notifications/schedule",
  protect,
  requireAdmin,
  adminController.createScheduledAdminNotification,
);
router.get(
  "/notifications/scheduled",
  protect,
  requireAdmin,
  adminController.listScheduledAdminNotifications,
);
router.patch(
  "/notifications/scheduled/:id/cancel",
  protect,
  requireAdmin,
  adminController.cancelScheduledAdminNotification,
);
router.delete(
  "/notifications/scheduled/:id",
  protect,
  requireAdmin,
  adminController.deleteScheduledAdminNotification,
);
router.patch(
  "/notifications/scheduled/:id/retry",
  protect,
  requireAdmin,
  adminController.retryScheduledAdminNotification,
);
// dev/testing: force a scheduled item into dead-letter for verification
router.patch(
  "/notifications/scheduled/:id/force-deadletter",
  protect,
  requireAdmin,
  forceDeadLetterHandler,
);
router.patch(
  "/notifications/:id/read",
  protect,
  requireAdmin,
  markNotificationRead,
);
router.delete(
  "/notifications/:id",
  protect,
  requireAdmin,
  deleteAdminNotification,
);

router.get(
  "/reports/summary",
  protect,
  requireAdmin,
  reportController.getReportsSummary,
);
router.get("/reports", protect, requireAdmin, reportController.listReports);
router.get(
  "/reports/pdf",
  protect,
  requireAdmin,
  reportController.downloadReportsPdf,
);

module.exports = router;
