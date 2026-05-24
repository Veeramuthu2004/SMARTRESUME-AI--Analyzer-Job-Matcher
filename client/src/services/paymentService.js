import api from "./api";

export const paymentService = {
  // Create payment order
  createOrder: async (plan, duration) =>
    (
      await api.post("/payment/create-order", {
        plan,
        duration,
      })
    ).data,

  // Verify payment signature
  verifyPayment: async (orderId, paymentId, signature) =>
    (
      await api.post("/payment/verify", {
        orderId,
        paymentId,
        signature,
      })
    ).data,

  // Get subscription status
  getStatus: async () => (await api.get("/payment/status")).data,

  // Get payment history
  getHistory: async () => (await api.get("/payment/history")).data,
};
