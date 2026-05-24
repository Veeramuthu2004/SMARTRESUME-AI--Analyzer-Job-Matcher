import api from "./api";

export const authService = {
  signup: async (payload) => (await api.post("/auth/signup", payload)).data,
  login: async (payload) => (await api.post("/auth/login", payload)).data,
  googleLogin: async (idToken) =>
    (await api.post("/auth/google", { idToken })).data,
  forgotPassword: async (email) =>
    (await api.post("/auth/forgot-password", { email })).data,
  resetPassword: async (payload) =>
    (await api.post("/auth/reset-password", payload)).data,
  me: async () => (await api.get("/auth/me")).data,
  refresh: async () =>
    (await api.post("/auth/refresh", {}, { withCredentials: true })).data,
  logout: async () =>
    (await api.post("/auth/logout", {}, { withCredentials: true })).data,
};
