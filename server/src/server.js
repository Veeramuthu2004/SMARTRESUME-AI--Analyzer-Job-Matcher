const connectDb = require("./config/db");
const env = require("./config/env");
const app = require("./app");
const http = require("http");
const { init } = require("./services/socketService");

const start = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log(
      env.nodeEnv === "production"
        ? "Production Environment Loaded"
        : "Development Environment Loaded",
    );
    await connectDb();
    // In development, ensure there's a test admin account for interactive testing
    try {
      if (process.env.NODE_ENV !== "production") {
        // create a default admin if none exists
        // require here so models are registered after mongoose connects
        const User = require("./models/User");
        const adminEmail = process.env.DEV_ADMIN_EMAIL || "admin@example.com";
        const adminPassword = process.env.DEV_ADMIN_PASSWORD || "Admin@123";
        const existing = await User.findOne({
          email: adminEmail.toLowerCase(),
        }).exec();
        if (!existing) {
          const u = new User({
            name: "Administrator",
            email: adminEmail,
            password: adminPassword,
            role: "admin",
          });
          await u.save();
          // eslint-disable-next-line no-console
          console.log(
            `Created development admin: ${adminEmail} / ${adminPassword}`,
          );
        }
      }
    } catch (seedErr) {
      // eslint-disable-next-line no-console
      console.warn("Dev admin seed failed:", seedErr.message);
    }
    const server = http.createServer(app);

    // initialize socket service (optional)
    try {
      init(server);
      // eslint-disable-next-line no-console
      console.log("Socket.io initialized");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Socket.io initialization failed:", err.message);
    }

    // start scheduler for scheduled admin notifications
    try {
      const { startScheduler } = require("./services/schedulerService");
      startScheduler({ intervalMs: 30000 });
      // periodic backfill to infer company names for JobDescription docs
      try {
        const {
          startBackfillScheduler,
        } = require("./services/backfillService");
        // default to daily in production, but use a short interval in development for faster feedback
        const defaultInterval =
          process.env.NODE_ENV !== "production" ? "60000" : "86400000"; // 1m dev, 24h prod
        const backfillInterval = parseInt(
          process.env.BACKFILL_INTERVAL_MS || defaultInterval,
          10,
        );
        startBackfillScheduler({ intervalMs: backfillInterval });
        console.log(
          "Backfill scheduler started (intervalMs=",
          backfillInterval,
          ")",
        );
      } catch (bfErr) {
        console.warn(
          "Backfill scheduler failed to start:",
          bfErr.message || bfErr,
        );
      }
      // eslint-disable-next-line no-console
      console.log("Scheduler started");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Scheduler failed to start:", err.message);
    }

    server.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server Running on port ${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
