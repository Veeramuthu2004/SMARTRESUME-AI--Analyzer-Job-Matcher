import axios from "axios";

const rawApiBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://smartresume-ai-analyzer-job-matcher-2.onrender.com/api";

const normalizeApiBaseUrl = (value) => String(value || "").replace(/\/+$/, "");

export const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);
export const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  // allow sending/receiving cookies for refresh-token flow
  withCredentials: true,
});

const shouldLogApi =
  import.meta.env.DEV || import.meta.env.VITE_API_DEBUG === "true";

const logApi = (...args) => {
  if (shouldLogApi) {
    console.debug("[api]", ...args);
  }
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object" && typeof data.message === "string") {
    return data.message;
  }
  if (!error?.response) {
    return `Unable to reach the API at ${apiBaseUrl}. Check the backend, CORS, and Vercel environment variables.`;
  }
  return error?.message || "Unexpected API response";
};

let refreshPromise = null;

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

  logApi("request", {
    method: String(config.method || "get").toUpperCase(),
    url: config.url,
    baseURL: config.baseURL || apiBaseUrl,
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    const contentType = String(response?.headers?.["content-type"] || "");
    if (
      contentType.includes("application/json") &&
      response.data === undefined
    ) {
      const error = new Error("Invalid API response from server.");
      error.isInvalidApiResponse = true;
      throw error;
    }

    logApi("response", {
      method: String(response?.config?.method || "get").toUpperCase(),
      url: response?.config?.url,
      status: response?.status,
    });

    return response;
  },
  (error) => {
    const originalRequest = error.config || {};
    const status = error?.response?.status;
    const message = getErrorMessage(error);
    const authEndpoints = [
      "/auth/register",
      "/auth/login",
      "/auth/signup",
      "/auth/google",
      "/auth/refresh",
      "/auth/logout",
    ];
    const isAuthRequest = authEndpoints.some((path) =>
      error?.config?.url?.includes(path),
    );

    if (!error.response) {
      error.message = message;
      error.isNetworkError = true;
      logApi("network error", {
        method: String(originalRequest.method || "get").toUpperCase(),
        url: originalRequest.url,
        message,
      });
      return Promise.reject(error);
    }

    if (
      typeof error?.response?.data === "string" &&
      /<html|<!doctype/i.test(error.response.data)
    ) {
      error.message = "Invalid API response from server.";
      error.isInvalidApiResponse = true;
      logApi("invalid response", {
        method: String(originalRequest.method || "get").toUpperCase(),
        url: originalRequest.url,
        status,
      });
      return Promise.reject(error);
    }

    // Attempt to refresh token once on 401 (except for auth endpoints). If
    // the refresh succeeds, retry the original request. Otherwise invalidate
    // local session and redirect to login.
    if (status === 401 && !isAuthRequest) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh", {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }

        return refreshPromise
          .then((r) => {
            const accessToken = r?.data?.accessToken;
            if (accessToken) {
              localStorage.setItem("sra_access_token", accessToken);
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              logApi("refresh success", { url: originalRequest.url });
              return api(originalRequest);
            }
            const invalidResponse = new Error(
              "Invalid API response from server.",
            );
            invalidResponse.isInvalidApiResponse = true;
            throw invalidResponse;
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
            logApi("refresh failed", {
              message: refreshErr?.message || message,
            });
            return Promise.reject(refreshErr);
          });
      }
    }

    error.message = message;
    logApi("error", {
      method: String(originalRequest.method || "get").toUpperCase(),
      url: originalRequest.url,
      status,
      message,
    });

    return Promise.reject(error);
  },
);

export default api;
