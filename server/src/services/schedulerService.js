const ScheduledNotification = require("../models/ScheduledNotification");
const AdminNotification = require("../models/AdminNotification");
const AdminLog = require("../models/AdminLog");
const { getIo } = require("./socketService");
const { sendSupportEmail, sendNotificationEmail } = require("./emailService");
const env = require("../config/env");

let intervalHandle = null;

// simple in-memory metrics for the scheduler (exported via API)
const metrics = {
  processed: 0,
  succeeded: 0,
  failed: 0,
  deadLettered: 0,
  lastRun: null,
  lastError: null,
};

/**
 * Get current scheduler stats/metrics
 */
const getStats = async () => {
  const pending = await ScheduledNotification.countDocuments({
    sent: false,
    cancelled: false,
    deadLetter: false,
  });
  const dead = await ScheduledNotification.countDocuments({ deadLetter: true });
  return {
    ...metrics,
    pending,
    deadLetterCount: dead,
  };
};

const processDueNotifications = async ({ baseRetryDelayMs = 60000 } = {}) => {
  try {
    metrics.lastRun = new Date();
    const now = new Date();
    const due = await ScheduledNotification.find({
      dueAt: { $lte: now },
      sent: false,
      cancelled: false,
      deadLetter: false,
    }).limit(50);
    if (!due || due.length === 0) return;
    const io = getIo();
    // process each
    for (const item of due) {
      metrics.processed += 1;
      // testing helper: allow simulating a processing failure for items with title 'SIMULATE_FAIL'
      // this sets maxRetries to 1 so they go straight to dead-letter on first failure
      if (String(item.title) === "SIMULATE_FAIL") {
        try {
          item.maxRetries = 1;
          await item.save();
        } catch (e) {}
      }
      try {
        // force a simulated error for the special title to exercise dead-letter handling
        if (String(item.title) === "SIMULATE_FAIL")
          throw new Error("simulated failure for testing");
        const note = await AdminNotification.create({
          title: item.title,
          message: item.message,
          type: item.type || "info",
          metadata: item.metadata || {},
        });
        // mark as sent
        item.sent = true;
        await item.save();
        await AdminLog.create({
          admin: item.createdBy,
          action: "scheduled_notification_sent",
          metadata: { scheduledId: item._id, notificationId: note._id },
        });
        metrics.succeeded += 1;
        if (io) {
          try {
            io.to("admin-dashboard").emit("dashboard:update", {
              type: "scheduled_notification_sent",
              notification: note,
              scheduledId: item._id,
            });
            io.to("admin-dashboard").emit("notification:new", note);
          } catch (e) {}
        }
      } catch (e) {
        // handle retry logic
        metrics.failed += 1;
        metrics.lastError = (e && e.message) || String(e);
        // eslint-disable-next-line no-console
        console.warn(
          "Failed to process scheduled notification",
          item._id,
          e.message,
        );
        try {
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = metrics.lastError;
          const maxRetries = item.maxRetries || 3;
          if (maxRetries > 0 && item.retryCount >= maxRetries) {
            item.deadLetter = true;
            await AdminLog.create({
              admin: item.createdBy,
              action: "scheduled_notification_deadletter",
              metadata: { scheduledId: item._id, lastError: item.lastError },
            });
            metrics.deadLettered += 1;
            // emit a severe notification to admins about dead-letter
            try {
              const io2 = getIo();
              io2.to("admin-dashboard").emit("dashboard:update", {
                type: "scheduled_notification_deadletter",
                scheduledId: item._id,
                admin: item.createdBy,
                lastError: item.lastError,
              });
              io2.to("admin-dashboard").emit("notification:new", {
                title: "Scheduled notification failed (dead-letter)",
                message: `Scheduled notification ${item._id} moved to dead-letter.`,
                scheduledId: item._id,
                deadLetter: true,
              });
            } catch (emitErr) {}
            // send support email to configured support address with details
            try {
              const supportMsg = `Scheduled notification ${item._id} (title: ${item.title}) has been moved to dead-letter. Last error: ${item.lastError}`;
              // prefer sendSupportEmail which targets supportEmail configured
              if (typeof sendSupportEmail === "function") {
                await sendSupportEmail({
                  fromName: "Scheduler",
                  fromEmail: env.mailFrom,
                  message: supportMsg,
                });
              } else if (
                typeof sendNotificationEmail === "function" &&
                env.supportEmail
              ) {
                await sendNotificationEmail({
                  to: env.supportEmail,
                  title: "Scheduled notification dead-letter",
                  message: supportMsg,
                });
              }
            } catch (emailErr) {
              // ignore email send failures
            }
          } else {
            // exponential backoff: schedule next attempt later
            const delay =
              Math.pow(2, Math.max(0, item.retryCount - 1)) * baseRetryDelayMs; // e.g., 1m,2m,4m
            item.dueAt = new Date(Date.now() + delay);
            await AdminLog.create({
              admin: item.createdBy,
              action: "scheduled_notification_retry",
              metadata: {
                scheduledId: item._id,
                retryCount: item.retryCount,
                nextAttempt: item.dueAt,
              },
            });
          }
          await item.save();
        } catch (inner) {
          // eslint-disable-next-line no-console
          console.warn(
            "Failed to update scheduled notification retry state",
            item._id,
            inner.message,
          );
        }
      }
    }
  } catch (err) {
    metrics.lastError = err?.message || String(err);
    // eslint-disable-next-line no-console
    console.warn("Scheduler error", err.message || err);
  }
};

const startScheduler = ({
  intervalMs = 30000,
  baseRetryDelayMs = 60000,
} = {}) => {
  if (intervalHandle) return;
  intervalHandle = setInterval(
    () => processDueNotifications({ baseRetryDelayMs }),
    intervalMs,
  );
  // run immediately on start
  processDueNotifications({ baseRetryDelayMs });
};

const stopScheduler = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  processDueNotifications,
  getStats,
};
