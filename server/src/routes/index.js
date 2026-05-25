const express = require("express");
const authRoutes = require("./authRoutes");
const resumeRoutes = require("./resumeRoutes");
const analysisRoutes = require("./analysisRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const userRoutes = require("./userRoutes");
const adminRoutes = require("./adminRoutes");
const jobDescriptionRoutes = require("./jobDescriptionRoutes");
const jobsRoutes = require("./jobsRoutes");
const savedJobsRoutes = require("./savedJobsRoutes");
const paymentRoutes = require("./paymentRoutes");
const contactRoutes = require("./contactRoutes");
const settingsRoutes = require("./settingsRoutes");

const router = express.Router();

router.get("/health", (_req, res) =>
  res.json({ ok: true, service: "smart-resume-api" }),
);

router.use("/auth", authRoutes);
router.use("/resumes", resumeRoutes);
router.use("/analyses", analysisRoutes);
router.use("/analysis", analysisRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/job-descriptions", jobDescriptionRoutes);
router.use("/jobs", jobsRoutes);
// saved jobs (protected)
router.use("/jobs/saved", savedJobsRoutes);
router.use("/payment", paymentRoutes);
router.use("/contact", contactRoutes);
router.use("/settings", settingsRoutes);

// Development helper: create an admin user in the running DB for local testing.
// This route is only active when NODE_ENV === 'development'.
router.post("/dev/seed-admin", async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ message: "Not allowed" });
    }
    const User = require("../models/User");
    const email = req.body?.email || "admin@example.com";
    const password = req.body?.password || "Admin@123";
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: "Dev Admin",
        email,
        password,
        role: "admin",
      });
      return res
        .status(201)
        .json({ message: "Admin created", user: { email: user.email } });
    }
    // If user exists but not admin, update role
    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
      return res.json({
        message: "Existing user promoted to admin",
        user: { email: user.email },
      });
    }
    return res.json({
      message: "Admin already exists",
      user: { email: user.email },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: "Failed to seed admin" });
  }
});

// Protected seeding endpoint: create or promote an admin when provided a
// matching secret in the `x-seed-secret` header. This allows creating an
// admin in non-development environments without exposing an open endpoint.
// To use:
//  - Set `SEED_SECRET` in your environment (Render/production).
//  - POST to /dev/seed-admin-protected with header `x-seed-secret: <secret>`
// Example body: { "email": "admin@example.com", "password": "Admin12345!" }
router.post("/dev/seed-admin-protected", async (req, res) => {
  try {
    const seedSecret = process.env.SEED_SECRET;
    const incoming = req.headers["x-seed-secret"] || req.headers["x-seed_secret"];
    if (!seedSecret) {
      return res.status(403).json({ message: "Seed secret not configured on server" });
    }
    if (!incoming || incoming !== seedSecret) {
      return res.status(403).json({ message: "Invalid seed secret" });
    }

    const User = require("../models/User");
    const email = req.body?.email || "admin@example.com";
    const password = req.body?.password || "Admin@123";
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: "Seeded Admin",
        email,
        password,
        role: "admin",
      });
      return res.status(201).json({ message: "Admin created", user: { email: user.email } });
    }
    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
      return res.json({ message: "Existing user promoted to admin", user: { email: user.email } });
    }
    return res.json({ message: "Admin already exists", user: { email: user.email } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: "Failed to seed admin (protected)" });
  }
});

// Also expose a direct route for job-description search on the main router
// (some environments may not surface nested router mounts reliably).
const {
  searchJobDescriptions,
} = require("../controllers/jobDescriptionController");
router.get("/job-descriptions/search", searchJobDescriptions);

// Development helper: trigger a billing update event to a user or broadcast to all
// Useful for QA — only enabled in development.
router.post("/dev/trigger-billing", async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ message: "Not allowed" });
    }
    const { userId, payload } = req.body || {};
    const { getIo } = require("../services/socketService");
    try {
      const io = getIo();
      if (userId) {
        // also update user document so clients that poll/refresh get the new state
        try {
          const User = require("../models/User");
          const u = await User.findById(userId);
          if (u && payload) {
            if (typeof payload.plan !== "undefined")
              u.subscriptionPlan = payload.plan;
            if (typeof payload.subscriptionStatus !== "undefined")
              u.subscriptionStatus = payload.subscriptionStatus;
            if (typeof payload.subscriptionExpiryDate !== "undefined")
              u.subscriptionExpiryDate = payload.subscriptionExpiryDate;
            if (typeof payload.monthlyUsageCount !== "undefined")
              u.monthlyUsageCount = payload.monthlyUsageCount;
            if (typeof payload.monthlyUsageLimit !== "undefined")
              u.monthlyUsageLimit = payload.monthlyUsageLimit;
            await u.save();
          }
        } catch (dbErr) {
          console.warn(
            "Dev trigger billing: failed to update user",
            dbErr.message || dbErr,
          );
        }
        io.to(`user:${String(userId)}`).emit("billing:update", payload || {});
      } else {
        io.emit("billing:update", payload || {});
      }
    } catch (e) {
      console.warn("Socket emit failed (dev/trigger-billing)", e.message || e);
    }
    return res.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to trigger billing update" });
  }
});

module.exports = router;
