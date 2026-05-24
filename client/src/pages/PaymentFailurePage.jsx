import { motion } from "framer-motion";
import { XCircle, Home, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center py-12 px-4">
      <motion.div
        className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Error Icon */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          <XCircle className="w-24 h-24 text-red-500" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-4">
          Payment Failed
        </h1>

        {/* Subtitle */}
        <p className="text-center text-slate-600 dark:text-slate-300 mb-8 text-lg">
          Unfortunately, your payment could not be processed
        </p>

        {/* Error Details */}
        <motion.div
          className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-xl p-6 mb-8 border border-red-200 dark:border-red-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                What went wrong?
              </h3>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                <li>Your card was declined</li>
                <li>Insufficient funds in your account</li>
                <li>Invalid card details</li>
                <li>Your bank declined the transaction</li>
                <li>Network connectivity issue</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* What to Try */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            What you can try:
          </h3>
          <ul className="space-y-3">
            {[
              "Use a different payment method (debit card, credit card, or UPI)",
              "Ensure your card has sufficient balance",
              "Contact your bank to verify the transaction",
              "Check your internet connection and try again",
              "Clear your browser cache and retry",
            ].map((tip, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
              >
                <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                  {index + 1}.
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {tip}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Support Info */}
        <motion.div
          className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 mb-8 border border-blue-200 dark:border-blue-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Still having issues?
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Our support team is here to help. Contact us at{" "}
            <a
              href="mailto:support@smartresume.dev"
              className="font-semibold hover:underline"
            >
              support@smartresume.dev
            </a>{" "}
            or chat with us on the platform.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <Link
            to="/pricing"
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            Try Payment Again
          </Link>

          <Link
            to="/dashboard"
            className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Alternative */}
        <motion.p
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          You can continue using our Free plan while you resolve this issue.
        </motion.p>
      </motion.div>
    </div>
  );
}
