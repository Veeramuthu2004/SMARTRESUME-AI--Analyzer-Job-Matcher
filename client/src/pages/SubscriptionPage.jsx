import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { formatDate } from "../lib/utils";
import { useAppRefresh } from "../hooks/useAppRefresh";
import { normalizeSubscriptionView } from "../lib/subscriptionView";

export const SubscriptionPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch authoritative billing snapshot for accurate Free/Pro mode
      const status = await paymentService.getStatus();
      setData(status);
    } catch (e) {
      // Fallback to auth snapshot if payment endpoint temporarily fails
      if (user) setData(user);
      console.error("Failed to load subscription status", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useAppRefresh((event) => {
    const d = event?.detail || {};
    // refresh on billing, resume uploads, or analysis updates (these can change usage)
    if (
      !d.entity ||
      d.entity === "billing" ||
      d.entity === "resume" ||
      d.entity === "analysis"
    ) {
      loadStatus();
    }
  });

  if (loading) return <div className="p-6">Loading subscription...</div>;

  const billingView = normalizeSubscriptionView(data || user);
  const plan = billingView.displayMode;
  const status = billingView.status || "free";
  const expiry = billingView.expiry;
  const monthlyUsageCount = billingView.monthlyUsageCount;
  const monthlyUsageLimit = billingView.monthlyUsageLimit;

  return (
    <div className="space-y-6">
      <motion.h1
        className="text-3xl font-bold text-slate-900 dark:text-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Subscription
      </motion.h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Current plan
          </p>
          <h2 className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            {plan}
          </h2>
          <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">
            Status: {status}
          </p>
          <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">
            Valid until: {expiry ? formatDate(expiry) : "Not available"}
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monthly usage
          </p>
          <h3 className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            {monthlyUsageCount}/{monthlyUsageLimit}
          </h3>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{
                width: `${Math.min(
                  100,
                  (monthlyUsageCount / monthlyUsageLimit) * 100,
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
