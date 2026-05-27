import api from "./api";

const ensureObjectResponse = (data, context) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    const error = new Error(
      `Invalid API response from server during ${context}.`,
    );
    error.isInvalidApiResponse = true;
    throw error;
  }
  return data;
};

export const authService = {
  signup: async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    const result = ensureObjectResponse(data, "signup");
    if (!result.accessToken || !result.user) {
      throw new Error("Invalid API response from server during signup.");
    }
    return result;
  },
  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    const result = ensureObjectResponse(data, "login");
    if (!result.accessToken || !result.user) {
      throw new Error("Invalid API response from server during login.");
    }
    return result;
  },
  googleLogin: async (idToken) =>
    ensureObjectResponse(
      (await api.post("/auth/google", { idToken })).data,
      "google login",
    ),
  forgotPassword: async (email) =>
    (await api.post("/auth/forgot-password", { email })).data,
  resetPassword: async (payload) =>
    (await api.post("/auth/reset-password", payload)).data,
  me: async () => ensureObjectResponse((await api.get("/auth/me")).data, "me"),
  refresh: async () => {
    const { data } = await api.post(
      "/auth/refresh",
      {},
      { withCredentials: true },
    );
    const result = ensureObjectResponse(data, "refresh");
    if (!result.accessToken || !result.user) {
      throw new Error("Invalid API response from server during refresh.");
    }
    return result;
  },
  logout: async () =>
    ensureObjectResponse(
      (await api.post("/auth/logout", {}, { withCredentials: true })).data,
      "logout",
    ),
};
