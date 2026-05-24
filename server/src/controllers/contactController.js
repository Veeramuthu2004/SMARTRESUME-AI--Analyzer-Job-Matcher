const asyncHandler = require("../utils/asyncHandler");
const { sendSupportEmail } = require("../services/emailService");
const SupportTicket = require("../models/SupportTicket");
const AdminLog = require("../models/AdminLog");
const { getIo } = require("../services/socketService");

const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  // Create a support ticket so admins can triage in the dashboard
  const subject = `Contact: ${String(message).slice(0, 60)}`;

  const ticket = await SupportTicket.create({
    subject,
    message,
    metadata: { fromName: name, fromEmail: email },
    userId: req.user?._id,
  });

  if (req.user && req.user._id) {
    await AdminLog.create({
      admin: req.user._id,
      action: "create_ticket",
      metadata: { ticketId: ticket._id },
    });
  }

  // attempt to send an email to support, but don't fail the request if email isn't configured
  let delivered = false;
  try {
    delivered = await sendSupportEmail({
      fromName: name,
      fromEmail: email,
      message,
    });
  } catch (e) {
    delivered = false;
  }

  // emit a real-time notification to connected admin dashboards
  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "ticket_created",
      ticket,
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "New support ticket",
      message: `${name || "Guest"} created a support ticket`,
      ticketId: ticket._id,
    });
  } catch (e) {
    // ignore emit errors
  }

  return res.json({
    message: delivered
      ? "Your message was sent successfully."
      : "Your message was received. Support email may not be configured yet.",
    ticket: { _id: ticket._id },
  });
});

module.exports = { submitContactMessage };
