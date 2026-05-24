import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Home, Download, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import { emitAppRefresh } from "../lib/appEvents";

export default function PaymentSuccessPage() {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const data = await paymentService.getStatus();
        setSubscriptionData(data);
        emitAppRefresh({ entity: "billing", action: "refresh" });
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Not available";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const planName =
    subscriptionData?.plan || subscriptionData?.subscriptionPlan || "free";
  const expiryDate =
    subscriptionData?.subscriptionExpiryDate ||
    subscriptionData?.subscriptionExpiry;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center py-12 px-4">
      <motion.div
        className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          <CheckCircle className="w-24 h-24 text-green-500" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-4">
          Payment Successful! 🎉
        </h1>

        <p className="text-center text-slate-600 dark:text-slate-300 mb-8 text-lg">
          Thank you for upgrading your Smart Resume Analyzer account
        </p>

        {!loading && subscriptionData && (
          <motion.div
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-6 mb-8 border border-indigo-200 dark:border-indigo-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              {subscriptionData.subscriptionStatus === "active"
                ? "Subscription active"
                : "Subscription updated"}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Your Plan
                </h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                  {planName} Plan
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Valid Until
                </h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatDate(expiryDate)}
                </p>
              </div>
            </div>

            {subscriptionData.daysRemaining && (
              <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {subscriptionData.daysRemaining}
                  </span>{" "}
                  days of service remaining
                </p>
              </div>
            )}

            {typeof subscriptionData.monthlyUsageCount === "number" && (
              <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Monthly usage: {subscriptionData.monthlyUsageCount}/
                  {subscriptionData.monthlyUsageLimit || 5} analyses used
                </p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Features Unlocked:
          </h3>
          <ul className="space-y-3">
            {[
              "Unlimited resume analyses",
              "AI cover letter generator",
              "ATS score optimization",
              "Career coach consultation",
              "24/7 priority support",
            ].map((feature, index) => (
              <motion.li
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  {feature}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 mb-8 border border-blue-200 dark:border-blue-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            What's Next?
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Your premium features are now active</li>
            <li>✓ A confirmation email has been sent</li>
            <li>✓ Visit your dashboard to start using premium features</li>
          </ul>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Link
            to="/dashboard"
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>

          <a
            href="#"
            className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Receipt
          </a>
        </motion.div>

        <motion.p
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Need help?{" "}
          <a
            href="mailto:support@smartresume.dev"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Contact support
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
