import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://smartresume-ai-analyzer-job-matcher-1.onrender.com/api",
  // allow sending/receiving cookies for refresh-token flow
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sra_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Some browsers/devtools add cache-related headers that trigger noisy CORS
  // preflight errors in development. Strip them unless a request explicitly
  // needs them.
  if (config.headers) {
    delete config.headers["Cache-Control"];
    delete config.headers["cache-control"];
    delete config.headers.Pragma;
    delete config.headers.pragma;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";
    const authEndpoints = [
      "/auth/login",
      "/auth/signup",
      "/auth/google",
      "/auth/refresh",
      "/auth/logout",
    ];
    const isAuthRequest = authEndpoints.some((path) =>
      error?.config?.url?.includes(path),
    );
    // Attempt to refresh token once on 401 (except for auth endpoints). If
    // the refresh succeeds, retry the original request. Otherwise invalidate
    // local session and redirect to login.
    if (status === 401 && !isAuthRequest) {
      // avoid infinite loops
      const originalRequest = error.config || {};
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        return api
          .post("/auth/refresh", {}, { withCredentials: true })
          .then((r) => {
            const accessToken = r?.data?.accessToken;
            if (accessToken) {
              localStorage.setItem("sra_access_token", accessToken);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return api(originalRequest);
            }
            throw error;
          })
          .catch((refreshErr) => {
            // refresh failed — clear auth and notify
            localStorage.removeItem("sra_access_token");
            localStorage.removeItem("sra_refresh_token");
            window.dispatchEvent(
              new CustomEvent("sra-auth-invalid", {
                detail: {
                  message: message || "Session expired. Please sign in again.",
                },
              }),
            );
            if (
              window.location.pathname !== "/login" &&
              window.location.pathname !== "/signup"
            ) {
              window.location.href = "/login";
            }
            return Promise.reject(refreshErr);
          });
      }
    }

    return Promise.reject(error);
  },
);

export default api;
