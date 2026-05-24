const Razorpay = require("razorpay");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { getIo } = require("../services/socketService");
const {
  getCycleStart,
  getSubscriptionSnapshot,
  syncSubscriptionState,
} = require("../utils/subscription");

// Plan configuration
const PLANS = {
  pro: {
    name: "Pro Plan",
    monthlyAmount: 49900, // 499 INR in paise
    yearlyAmount: 499900, // 4999 INR in paise
  },
  premium: {
    name: "Premium Plan",
    monthlyAmount: 99900, // 999 INR in paise
    yearlyAmount: 999900, // 9999 INR in paise
  },
};

const getRazorpayInstance = () => {
  if (!env.razorpayKeyId || !env.razorpaySecret) {
    const error = new Error("Razorpay is not configured on the server");
    error.statusCode = 503;
    throw error;
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpaySecret,
  });
};

const normalizeUserId = (user) => (user?._id || user?.id || null)?.toString();

const getExpiryForPlan = (duration, startDate = new Date()) => {
  const expiryDate = new Date(startDate);
  if (duration === "yearly") {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  } else {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  }
  return expiryDate;
};

const applySuccessfulPayment = async (paymentRecord, paymentEntity = null) => {
  const now = new Date();
  const expiryDate = getExpiryForPlan(paymentRecord.planDuration, now);

  paymentRecord.status = "success";
  paymentRecord.paymentId =
    paymentRecord.paymentId || paymentEntity?.id || null;
  paymentRecord.subscriptionStartDate = now;
  paymentRecord.subscriptionExpiryDate = expiryDate;
  paymentRecord.metadata = {
    ...(paymentRecord.metadata || {}),
    razorpayPaymentData:
      paymentEntity || paymentRecord.metadata?.razorpayPaymentData || {},
  };

  await paymentRecord.save();

  await User.findByIdAndUpdate(paymentRecord.userId, {
    isPremium: true,
    subscriptionPlan: paymentRecord.subscriptionPlan,
    subscriptionStatus: "active",
    subscriptionStartDate: now,
    subscriptionExpiryDate: expiryDate,
    subscriptionExpiry: expiryDate,
    monthlyUsageCount: 0,
    lastUsageReset: getCycleStart(now),
  });

  await Subscription.findOneAndUpdate(
    { user: paymentRecord.userId },
    {
      user: paymentRecord.userId,
      plan: paymentRecord.subscriptionPlan,
      status: "active",
      billingCycle: paymentRecord.planDuration,
      startDate: now,
      expiryDate,
      payment: paymentRecord._id,
      orderId: paymentRecord.orderId,
      paymentId: paymentRecord.paymentId || paymentEntity?.id || "",
      provider: paymentRecord.provider || "razorpay",
      metadata: {
        ...(paymentRecord.metadata || {}),
        razorpayPaymentData:
          paymentEntity || paymentRecord.metadata?.razorpayPaymentData || {},
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  try {
    const io = getIo();
    io.to("admin-dashboard").emit("dashboard:update", {
      type: "payment_success",
      payment: paymentRecord,
      admin: null,
    });
    io.to("admin-dashboard").emit("notification:new", {
      title: "Payment successful",
      message: `Payment ${paymentRecord.orderId || paymentRecord._id} captured successfully`,
      paymentId: paymentRecord._id,
    });
    // emit a user-specific billing update so the user's UI can refresh in realtime
    try {
      const updatedUser = await User.findById(paymentRecord.userId);
      const snapshot = getSubscriptionSnapshot(updatedUser);
      io.to(`user:${String(paymentRecord.userId)}`).emit("billing:update", {
        ...snapshot,
        subscriptionPlan: updatedUser.subscriptionPlan,
      });
    } catch (e) {}
  } catch (error) {}

  return expiryDate;
};

const createOrder = asyncHandler(async (req, res) => {
  const { plan, duration } = req.body;
  const userId = normalizeUserId(req.user);

  console.log("[createOrder] incoming request", {
    userId,
    plan,
    duration,
    headers: {
      authorization: req.headers.authorization ? "present" : "missing",
    },
  });

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!PLANS[plan]) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  if (!["monthly", "yearly"].includes(duration)) {
    return res.status(400).json({ message: "Invalid duration" });
  }

  const razorpay = getRazorpayInstance();
  const planConfig = PLANS[plan];
  const amount =
    duration === "monthly" ? planConfig.monthlyAmount : planConfig.yearlyAmount;

  try {
    const shortReceipt = `rcpt_${userId.toString().slice(-6)}_${Date.now()
      .toString()
      .slice(-6)}`;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: shortReceipt,
      notes: {
        userId,
        plan,
        duration,
      },
    });

    await Payment.create({
      userId,
      orderId: order.id,
      amount,
      currency: "INR",
      status: "pending",
      subscriptionPlan: plan,
      planDuration: duration,
      receipt: order.receipt,
      billingCycle: duration,
      provider: "razorpay",
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpayKeyId,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      message: "Failed to create payment order",
      error: error.message,
    });
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  const userId = normalizeUserId(req.user);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", env.razorpaySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      await Payment.findOneAndUpdate(
        { orderId },
        {
          status: "failed",
          errorMessage: "Signature verification failed",
        },
      );

      try {
        const io = getIo();
        io.to("admin-dashboard").emit("dashboard:update", {
          type: "payment_failed",
          orderId,
          paymentId,
        });
      } catch (error) {}

      return res.status(400).json({ message: "Payment verification failed" });
    }

    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);

    const paymentRecord = await Payment.findOneAndUpdate(
      { orderId },
      {
        paymentId,
        signature,
        status: payment.status === "captured" ? "success" : "failed",
        metadata: {
          razorpayPaymentData: payment,
        },
      },
      { new: true },
    );

    if (!paymentRecord || paymentRecord.status !== "success") {
      try {
        const io = getIo();
        io.to("admin-dashboard").emit("dashboard:update", {
          type: "payment_failed",
          orderId,
          paymentId,
        });
      } catch (error) {}

      return res
        .status(400)
        .json({ message: "Payment not captured successfully" });
    }

    const expiryDate = await applySuccessfulPayment(paymentRecord, payment);

    res.json({
      success: true,
      message: "Payment verified successfully",
      plan: paymentRecord.subscriptionPlan,
      expiryDate,
      subscriptionStatus: "active",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res
      .status(500)
      .json({ message: "Payment verification failed", error: error.message });
  }
});

const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const syncResult = syncSubscriptionState(user);
  if (syncResult.changed) {
    await user.save();
  }

  const snapshot = getSubscriptionSnapshot(user);

  res.json({
    ...snapshot,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpiry: snapshot.subscriptionExpiry,
    subscriptionExpiryDate: snapshot.subscriptionExpiryDate,
  });
});

const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const payments = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(payments);
});

const webhookHandler = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const raw = req.body;

  const webhookSecret = env.razorpayWebhookSecret || env.razorpaySecret || null;
  if (webhookSecret && signature) {
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(raw)
      .digest("hex");
    if (expected !== signature) {
      console.warn("Razorpay webhook signature mismatch");
      return res.status(400).send("invalid signature");
    }
  }

  let payload;
  try {
    payload = JSON.parse(raw.toString());
  } catch (err) {
    console.error("Failed to parse webhook payload", err);
    return res.status(400).send("invalid payload");
  }

  const event = payload.event;
  try {
    const paymentEntity = payload.payload?.payment?.entity;
    if (paymentEntity && paymentEntity.order_id) {
      const paymentRecord = await Payment.findOne({
        orderId: paymentEntity.order_id,
      });
      if (paymentRecord) {
        if (paymentEntity.status === "captured") {
          paymentRecord.metadata = {
            ...(paymentRecord.metadata || {}),
            webhook: paymentEntity,
          };
          await applySuccessfulPayment(paymentRecord, paymentEntity);
        } else if (paymentEntity.status === "failed") {
          paymentRecord.paymentId = paymentEntity.id;
          paymentRecord.status = "failed";
          paymentRecord.metadata = {
            ...(paymentRecord.metadata || {}),
            webhook: paymentEntity,
          };
          await paymentRecord.save();

          try {
            const io = getIo();
            io.to("admin-dashboard").emit("dashboard:update", {
              type: "payment_failed",
              payment: paymentRecord,
            });
          } catch (error) {}
        }
      }
    }

    console.log(`Razorpay webhook received: ${event}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook processing failed", err);
    return res.status(500).send("webhook processing failed");
  }
});

module.exports = {
  createOrder,
  verifyPayment,
  getSubscriptionStatus,
  getPaymentHistory,
  webhookHandler,
};
