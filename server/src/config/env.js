const dotenv = require("dotenv");

// Only load .env files in non-production environments. On Render/Vercel,
// the platform-provided environment variables must win over any committed
// local .env values in the repository.
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const isProduction = process.env.NODE_ENV === "production";
const requiredProductionEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL",
];

if (isProduction) {
  const missing = requiredProductionEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    const message = `Missing required production environment variable(s): ${missing.join(
      ", ",
    )}`;
    // eslint-disable-next-line no-console
    console.error(message);
  }
}

const maskMongoUri = (uri) => {
  if (!uri) return "";
  try {
    const withMaskedCreds = uri.replace(
      /(mongodb(?:\+srv)?:\/\/)([^@/]+)@/i,
      "$1****:****@",
    );
    return withMaskedCreds.replace(/([?&]password=)[^&]+/i, "$1****");
  } catch {
    return "****";
  }
};

if (process.env.MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.info(`Using MongoDB URI: ${maskMongoUri(process.env.MONGODB_URI)}`);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl:
    process.env.CLIENT_URL || (isProduction ? "" : "http://localhost:5173"),
  jwtSecret: process.env.JWT_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiApiUrl: process.env.GEMINI_API_URL || "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpaySecret:
    process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET || "",
  aiProvider: (process.env.AI_PROVIDER || "heuristic").toLowerCase(),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "noreply@smartresume.dev",
  supportEmail: process.env.SUPPORT_EMAIL || process.env.MAIL_FROM || "",
  // Jobs provider configuration (external job search via RapidAPI JSearch by default)
  jobsProvider: (process.env.JOBS_PROVIDER || "none").toLowerCase(),
  jobsRapidApiKey: process.env.JOBS_RAPIDAPI_KEY || "",
  jobsRapidApiHost: process.env.JOBS_RAPIDAPI_HOST || "",
  adzunaAppId: process.env.ADZUNA_APP_ID || "",
  adzunaAppKey: process.env.ADZUNA_APP_KEY || "",
  jobsDefaultPageSize: Number(process.env.JOBS_DEFAULT_PAGE_SIZE || 20),
};

module.exports = env;
