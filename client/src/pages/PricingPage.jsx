import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { emitAppRefresh } from "../lib/appEvents";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for getting started",
    features: [
      "5 resume analyses per month",
      "Basic job matching",
      "Resume optimization tips",
      "Email support",
    ],
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: { monthly: 499, yearly: 4999 },
    description: "For active job seekers",
    features: [
      "Unlimited resume analyses",
      "Advanced job matching",
      "AI-powered resume optimization",
      "Cover letter generator",
      "Interview preparation guide",
      "Priority email support",
    ],
    buttonText: "Upgrade Now",
    recommended: true,
  },
  {
    name: "Premium",
    price: { monthly: 999, yearly: 9999 },
    description: "For serious career advancement",
    features: [
      "Everything in Pro",
      "Personal career coach consultation",
      "ATS score optimization",
      "LinkedIn profile optimization",
      "Job application tracking",
      "Interview mock sessions",
      "24/7 priority support",
      "Salary negotiation guide",
    ],
    buttonText: "Upgrade Now",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      setStatusLoading(true);
      const token = localStorage.getItem("sra_access_token");
      if (!token) {
        setStatusLoading(false);
        return;
      }

      try {
        const data = await paymentService.getStatus();
        if (mounted) setSubscription(data);
      } catch (error) {
        console.warn("Unable to load subscription status", error);
        if (mounted) setSubscription(null);
      } finally {
        if (mounted) setStatusLoading(false);
      }
    };

    loadStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const currentPlan = subscription?.isPremium
    ? subscription?.plan || subscription?.subscriptionPlan || "free"
    : "free";
  const currentPlanRank = useMemo(
    () =>
      ({ free: 0, pro: 1, premium: 2 })[String(currentPlan).toLowerCase()] || 0,
    [currentPlan],
  );

  const handleUpgrade = async (plan) => {
    if (plan === "Free") return;

    // Require authentication before creating an order
    const token = localStorage.getItem("sra_access_token");
    if (!token) {
      // redirect to login with returnTo so user can continue
      window.location.assign("/login?returnTo=/pricing");
      return;
    }

    setLoading(plan);
    try {
      // Create order
      const duration = isYearly ? "yearly" : "monthly";
      const planLower = plan.toLowerCase();
      const orderData = await paymentService.createOrder(planLower, duration);

      // Initialize Razorpay
      const razorpayKey =
        orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Payment gateway is not configured yet.");
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: "INR",
        order_id: orderData.orderId,
        name: "Smart Resume Analyzer",
        description: `${plan} Plan - ${duration}`,
        prefill: {
          email: orderData.email || "",
        },
        handler: async (response) => {
          // Verify payment on backend
          const verifyData = await paymentService.verifyPayment(
            orderData.orderId,
            response.razorpay_payment_id,
            response.razorpay_signature,
          );

          if (verifyData.success) {
            toast("Payment successful", "success");
            // refresh authoritative user profile so UI reflects new plan immediately
            try {
              await refreshUser();
            } catch (err) {}
            emitAppRefresh({ entity: "billing", action: "payment" });
            window.location.href = "/payment/success";
          } else {
            toast("Payment verification failed", "error");
            window.location.href = "/payment/failure";
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      setLoading(null);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to initiate payment";
      toast(message, "error");
    }
  };

  const handleManageSubscription = () => {
    navigate("/dashboard#billing");
  };

  const getPlanAction = (planName) => {
    const planLower = planName.toLowerCase();
    const planRank = { free: 0, pro: 1, premium: 2 }[planLower] || 0;

    if (currentPlanRank >= planRank) {
      if (planLower !== "free") {
        return {
          disabled: false,
          label:
            planLower === currentPlan
              ? "Manage Subscription"
              : "Included in your plan",
          manage: planLower === currentPlan,
        };
      }

      return {
        disabled: true,
        label:
          planLower === currentPlan ? "Current Plan" : "Included in your plan",
      };
    }

    return {
      disabled: false,
      label: planName === "Free" ? "Current Plan" : "Upgrade Now",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {subscription && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Current plan: <span className="capitalize">{currentPlan}</span>
              {subscription.daysRemaining ? (
                <span>· {subscription.daysRemaining} days left</span>
              ) : null}
              {typeof subscription.monthlyUsageCount === "number" ? (
                <span>
                  · {subscription.monthlyUsageCount}/
                  {subscription.monthlyUsageLimit} analyses used
                </span>
              ) : null}
            </div>
          )}
          {statusLoading && (
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Syncing billing status...
            </p>
          )}

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Choose the plan that's right for you
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm font-medium transition-colors ${
                !isYearly
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-300 dark:bg-slate-700 transition-colors"
            >
              <motion.span
                className="inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900"
                animate={{ x: isYearly ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                isYearly
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Yearly
              <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                Save 17%
              </span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl transition-all ${
                plan.recommended
                  ? "md:scale-105 border-2 border-indigo-600 dark:border-indigo-400"
                  : "border border-slate-200 dark:border-slate-700"
              } bg-white dark:bg-slate-800 shadow-lg overflow-hidden`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  <span className="inline-flex items-center gap-2">
                    {plan.name}
                    {plan.name.toLowerCase() === currentPlan && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </span>
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  {plan.name !== "Free" ? (
                    <>
                      <div className="text-4xl font-bold text-slate-900 dark:text-white">
                        ₹{isYearly ? plan.price.yearly : plan.price.monthly}
                        <span className="text-lg text-slate-600 dark:text-slate-400">
                          /{isYearly ? "year" : "month"}
                        </span>
                      </div>
                      {isYearly && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          ₹{Math.round(plan.price.yearly / 12)}/month billed
                          annually
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">
                      Free
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {(() => {
                  const action = getPlanAction(plan.name);
                  return (
                    <motion.button
                      onClick={() =>
                        action.manage
                          ? handleManageSubscription()
                          : handleUpgrade(plan.name)
                      }
                      disabled={
                        plan.disabled ||
                        action.disabled ||
                        loading === plan.name
                      }
                      className={`w-full py-3 rounded-lg font-semibold transition-all mb-8 flex items-center justify-center gap-2 ${
                        plan.disabled || action.disabled
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                          : plan.recommended
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                      whileHover={
                        !plan.disabled && !action.disabled
                          ? { scale: 1.02 }
                          : {}
                      }
                      whileTap={
                        !plan.disabled && !action.disabled
                          ? { scale: 0.98 }
                          : {}
                      }
                    >
                      {loading === plan.name ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        action.label
                      )}
                    </motion.button>
                  );
                })()}

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
                    >
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          className="mt-20 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Can I switch plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major debit cards, credit cards, UPI, and other payment methods via Razorpay.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! Start with our Free plan to try all basic features. Upgrade anytime when you need more.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 7-day money-back guarantee on all paid plans. Contact support within 7 days for a refund.",
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + idx * 0.05 }}
              >
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {faq.q}
                </h4>
                <p className="text-slate-600 dark:text-slate-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
