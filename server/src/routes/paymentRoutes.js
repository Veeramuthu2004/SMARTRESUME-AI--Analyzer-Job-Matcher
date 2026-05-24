const express = require("express");
const { z } = require("zod");
const validate = require("../middleware/validate");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Create Razorpay order
router.post(
  "/create-order",
  protect,
  validate(
    z.object({
      plan: z.enum(["pro", "premium"]),
      duration: z.enum(["monthly", "yearly"]),
    }),
  ),
  paymentController.createOrder,
);

// Verify payment
router.post(
  "/verify",
  protect,
  validate(
    z.object({
      orderId: z.string(),
      paymentId: z.string(),
      signature: z.string(),
    }),
  ),
  paymentController.verifyPayment,
);

// Webhook endpoint (raw body required)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.webhookHandler,
);

// Get subscription status
router.get("/status", protect, paymentController.getSubscriptionStatus);

// Get payment history
router.get("/history", protect, paymentController.getPaymentHistory);

module.exports = router;
