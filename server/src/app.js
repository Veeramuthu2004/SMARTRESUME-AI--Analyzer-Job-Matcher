const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = Array.from(
  new Set(
    [
      env.clientUrl,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ].filter(Boolean),
  ),
);

// In development allow all origins to simplify local testing (dev tokens /
// different dev ports). In production enforce a strict allowlist.
const corsOptions =
  env.nodeEnv === "production"
    ? {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);
          return callback(new Error(`CORS blocked for origin ${origin}`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Cache-Control",
          "cache-control",
          "Pragma",
          "pragma",
        ],
      }
    : {
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Cache-Control",
          "cache-control",
          "Pragma",
          "pragma",
        ],
      };

app.use(cors(corsOptions));
// Ensure preflight requests are handled for all routes
// Use '/*' for Express route matching
// Note: explicit app.options is not needed because the CORS middleware above
// will handle preflight OPTIONS requests for registered routes.
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(cookieParser());

// Ensure the Razorpay webhook route can receive raw JSON (body-parser would otherwise
// consume it). Register a route-specific raw middleware before the general json parser.
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// Regular routes with JSON body parsing
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    skip: (req) => {
      const origin = req.headers.origin || "";
      const ip = req.ip || "";
      const isLocalOrigin =
        origin.includes("localhost") || origin.includes("127.0.0.1");
      const isLocalIp = ip.includes("127.0.0.1") || ip.includes("::1");
      // Prevent local QA and realtime polling from getting 429 spam.
      return env.nodeEnv !== "production" || isLocalOrigin || isLocalIp;
    },
    // In development the app can make many API calls due to HMR, polling,
    // socket reconnects, and repeated browser verification flows. Keep the
    // limit high enough so the UI remains responsive while still protecting
    // production.
    max: env.nodeEnv === "production" ? 300 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
