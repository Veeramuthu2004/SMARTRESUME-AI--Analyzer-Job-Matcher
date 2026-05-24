import api from "./api";

export const billingService = {
  createStripeCheckout: async (payload) =>
    (await api.post("/billing/stripe/checkout", payload)).data,
};
