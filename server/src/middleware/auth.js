const { verifyAccessToken } = require("../utils/tokens");
const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    // Debug: log auth and origin when present to help diagnose dev CORS auth issues
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log(
          "[auth.protect] origin=",
          req.headers.origin,
          "authHeader=",
          authHeader ? "[REDACTED]" : "(none)",
        );
      } catch (e) {}
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Missing token" });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[auth.protect] token verification failed:",
          err && err.message,
        );
      }
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    const user = await User.findById(decoded.sub).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: Invalid user" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Account is banned" });
    }

    if (user.role !== "admin") {
      const settings = await SiteSettings.findOne({ key: "global" }).select(
        "maintenanceMode",
      );
      if (settings?.maintenanceMode) {
        return res.status(503).json({
          message:
            "The platform is currently under maintenance. Admin access only.",
          maintenanceMode: true,
        });
      }
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  // Development helper: allow promoting current user to admin via header
  // Development helper: allow promoting current user to admin via header
  // Only honored in development environment
  if (process.env.NODE_ENV === "development") {
    const devAdmin = String(req.headers["x-dev-as-admin"] || "").toLowerCase();
    if (devAdmin === "1" || devAdmin === "true") {
      if (req.user) {
        req.user.role = "admin";
        return next();
      }
    }
  }

  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  return next();
};

module.exports = { protect, requireAdmin };
