const asyncHandler = require("../utils/asyncHandler");
const {
  canAccessPlan,
  getSubscriptionSnapshot,
  syncSubscriptionState,
} = require("../utils/subscription");

const createPlanGuard = (requiredPlan) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const syncResult = syncSubscriptionState(req.user);
    if (syncResult.changed) {
      await req.user.save();
    }

    if (!canAccessPlan(req.user, requiredPlan)) {
      const snapshot = getSubscriptionSnapshot(req.user);
      return res.status(403).json({
        message:
          requiredPlan === "premium"
            ? "Premium subscription required to access this feature"
            : "Pro subscription required to access this feature",
        requiresUpgrade: true,
        requiredPlan,
        currentPlan: snapshot.plan,
        subscriptionStatus: snapshot.subscriptionStatus,
      });
    }

    return next();
  });

const requirePro = createPlanGuard("pro");
const requirePremium = createPlanGuard("premium");

module.exports = { requirePremium, requirePro };
