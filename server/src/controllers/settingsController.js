const asyncHandler = require("../utils/asyncHandler");
const SiteSettings = require("../models/SiteSettings");
const AdminLog = require("../models/AdminLog");
const { getIo } = require("../services/socketService");

const DEFAULT_SETTINGS = {
  key: "global",
  maintenanceMode: false,
  branding: {
    appName: "Smart Resume Analyzer",
    tagline: "",
    logoUrl: "",
    primaryColor: "#22d3ee",
  },
  pricing: {
    proMonthly: 499,
    proYearly: 4999,
    premiumMonthly: 999,
    premiumYearly: 9999,
  },
  email: {
    supportEmail: "support@smartresume.dev",
    senderName: "Smart Resume Analyzer",
  },
  subscription: {
    trialDays: 7,
    gracePeriodDays: 3,
    monthlyAnalysisLimit: 5,
  },
  announcements: [],
};

const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne({ key: "global" });
  if (!settings) {
    settings = await SiteSettings.create(DEFAULT_SETTINGS);
  }
  return settings;
};

const sanitizeSettings = (settings) => ({
  _id: settings._id,
  key: settings.key,
  maintenanceMode: Boolean(settings.maintenanceMode),
  branding: settings.branding,
  pricing: settings.pricing,
  email: settings.email,
  subscription: settings.subscription,
  announcements: (settings.announcements || []).filter(
    (item) => item.enabled !== false,
  ),
  updatedAt: settings.updatedAt,
  createdAt: settings.createdAt,
});

const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrCreateSettings();
  return res.json({ settings: sanitizeSettings(settings) });
});

const getSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrCreateSettings();
  return res.json({ settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  const payload = req.body || {};

  const beforeMaintenance = Boolean(settings.maintenanceMode);

  if (typeof payload.maintenanceMode === "boolean") {
    settings.maintenanceMode = payload.maintenanceMode;
  }

  if (payload.branding && typeof payload.branding === "object") {
    settings.branding = {
      ...settings.branding.toObject(),
      ...payload.branding,
    };
  }

  if (payload.pricing && typeof payload.pricing === "object") {
    settings.pricing = { ...settings.pricing.toObject(), ...payload.pricing };
  }

  if (payload.email && typeof payload.email === "object") {
    settings.email = { ...settings.email.toObject(), ...payload.email };
  }

  if (payload.subscription && typeof payload.subscription === "object") {
    settings.subscription = {
      ...settings.subscription.toObject(),
      ...payload.subscription,
    };
  }

  if (Array.isArray(payload.announcements)) {
    settings.announcements = payload.announcements.map((item) => ({
      title: String(item.title || "").trim(),
      message: String(item.message || "").trim(),
      enabled: item.enabled !== false,
    }));
  }

  settings.updatedBy = req.user._id;
  await settings.save();

  await AdminLog.create({
    admin: req.user._id,
    action: "update_settings",
    metadata: {
      maintenanceMode: settings.maintenanceMode,
      appName: settings.branding?.appName,
    },
  });

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "settings_updated",
      settings: sanitizeSettings(settings),
      admin: req.user._id,
      maintenanceChanged:
        beforeMaintenance !== Boolean(settings.maintenanceMode),
    });
  } catch (error) {}

  return res.json({ settings });
});

module.exports = {
  getPublicSettings,
  getSettings,
  updateSettings,
  getOrCreateSettings,
};
