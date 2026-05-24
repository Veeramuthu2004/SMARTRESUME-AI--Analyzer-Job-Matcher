const PAID_PLANS = new Set(["pro", "premium"]);

export const normalizeSubscriptionView = (raw) => {
  const source = raw || {};
  const rawPlan = String(
    source.plan || source.subscriptionPlan || "free",
  ).toLowerCase();
  const status = String(source.subscriptionStatus || "free").toLowerCase();
  const isPremium = Boolean(source.isPremium) || status === "active";

  // Mode is what the user can use right now (feature gating): free or paid plan.
  const mode = isPremium && PAID_PLANS.has(rawPlan) ? rawPlan : "free";

  return {
    mode,
    displayMode:
      mode === "free" ? "Free" : mode === "premium" ? "Premium" : "Pro",
    status,
    isPremium,
    expiry: source.subscriptionExpiryDate || source.subscriptionExpiry || null,
    monthlyUsageCount: Number(source.monthlyUsageCount || 0),
    monthlyUsageLimit: Number(source.monthlyUsageLimit || 5),
    remainingAnalyses: Number(source.remainingAnalyses || 0),
    raw: source,
  };
};
