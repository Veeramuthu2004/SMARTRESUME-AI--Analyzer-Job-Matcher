const MONTHLY_ANALYSIS_LIMIT = 5;

const PLAN_RANK = {
  free: 0,
  pro: 1,
  premium: 2,
};

const normalizePlan = (plan) => (PLAN_RANK[plan] != null ? plan : "free");

const getCycleStart = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const getStoredExpiry = (user) =>
  user?.subscriptionExpiryDate || user?.subscriptionExpiry || null;

const getStoredStart = (user) => user?.subscriptionStartDate || null;

const hasActiveSubscription = (user, now = new Date()) => {
  if (!user) return false;
  const status = user.subscriptionStatus || "free";
  const expiry = getStoredExpiry(user);
  const plan = normalizePlan(user.subscriptionPlan);

  if (plan === "free") return false;
  if (status === "expired" || status === "canceled") return false;
  if (expiry && new Date(expiry) < now) return false;
  return Boolean(user.isPremium);
};

const canAccessPlan = (user, requiredPlan = "pro", now = new Date()) => {
  const currentPlan = hasActiveSubscription(user, now)
    ? normalizePlan(user.subscriptionPlan)
    : "free";

  return (PLAN_RANK[currentPlan] || 0) >= (PLAN_RANK[requiredPlan] || 0);
};

const syncSubscriptionState = (user, now = new Date()) => {
  if (!user) {
    return { changed: false };
  }

  let changed = false;
  const cycleStart = getCycleStart(now);
  const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : null;

  if (
    !lastReset ||
    lastReset.getFullYear() !== cycleStart.getFullYear() ||
    lastReset.getMonth() !== cycleStart.getMonth()
  ) {
    user.lastUsageReset = cycleStart;
    user.monthlyUsageCount = 0;
    changed = true;
  }

  const expiry = getStoredExpiry(user);
  const hasPaidPlan = normalizePlan(user.subscriptionPlan) !== "free";

  if (hasPaidPlan && expiry && new Date(expiry) < now) {
    if (user.subscriptionStatus !== "expired") {
      user.subscriptionStatus = "expired";
      changed = true;
    }

    if (user.isPremium) {
      user.isPremium = false;
      changed = true;
    }
  }

  if (!hasPaidPlan && user.subscriptionStatus !== "free") {
    user.subscriptionStatus = "free";
    changed = true;
  }

  if (user.subscriptionPlan == null) {
    user.subscriptionPlan = "free";
    changed = true;
  }

  return { changed };
};

const getSubscriptionSnapshot = (user, now = new Date()) => {
  const expiry = getStoredExpiry(user);
  const startDate = getStoredStart(user);
  const plan = normalizePlan(user?.subscriptionPlan);
  const active = hasActiveSubscription(user, now);
  const usageCount = Number(user?.monthlyUsageCount || 0);
  const usageLimit = MONTHLY_ANALYSIS_LIMIT;

  return {
    plan,
    isPremium: active,
    subscriptionStatus: active ? "active" : user?.subscriptionStatus || "free",
    subscriptionStartDate: startDate,
    subscriptionExpiryDate: expiry,
    subscriptionExpiry: expiry,
    monthlyUsageCount: usageCount,
    monthlyUsageLimit: usageLimit,
    remainingAnalyses: Math.max(0, usageLimit - usageCount),
    usageResetAt: getCycleStart(now),
    daysRemaining: expiry
      ? Math.ceil(
          (new Date(expiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null,
  };
};

module.exports = {
  MONTHLY_ANALYSIS_LIMIT,
  PLAN_RANK,
  canAccessPlan,
  getCycleStart,
  getStoredExpiry,
  getStoredStart,
  getSubscriptionSnapshot,
  hasActiveSubscription,
  normalizePlan,
  syncSubscriptionState,
};
