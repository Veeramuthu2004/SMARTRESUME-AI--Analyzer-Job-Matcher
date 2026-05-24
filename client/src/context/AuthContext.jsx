import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService";
import { emitAppRefresh } from "../lib/appEvents";
import { settingsService } from "../services/settingsService";

const fallbackAuth = {
  user: null,
  loading: true,
  signup: async () => {
    throw new Error("Auth provider is not ready");
  },
  login: async () => {
    throw new Error("Auth provider is not ready");
  },
  googleLogin: async () => {
    throw new Error("Auth provider is not ready");
  },
  refreshUser: async () => {
    throw new Error("Auth provider is not ready");
  },
  logout: () => {},
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState(null);

  const setAuthState = (data) => {
    localStorage.setItem("sra_access_token", data.accessToken);
    localStorage.setItem("sra_refresh_token", data.refreshToken);
    setUser(data.user);
    // notify app that auth/billing state changed so pages can refresh
    try {
      emitAppRefresh({ entity: "billing", action: "refresh" });
      emitAppRefresh({ entity: "user", action: "login" });
    } catch (e) {}
  };

  const clearAuth = useCallback(() => {
    localStorage.removeItem("sra_access_token");
    localStorage.removeItem("sra_refresh_token");
    setUser(null);
    try {
      emitAppRefresh({ entity: "billing", action: "refresh" });
      emitAppRefresh({ entity: "user", action: "logout" });
    } catch (e) {}
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const publicSettingsPromise = settingsService
          .getPublicSettings()
          .then((data) => setSiteSettings(data.settings || null))
          .catch(() => setSiteSettings(null));

        let token = localStorage.getItem("sra_access_token");
        // If no access token is present, attempt a refresh using httpOnly cookie
        if (!token) {
          try {
            const data = await authService.refresh();
            if (data && data.accessToken) {
              setAuthState(data);
              token = data.accessToken;
            }
          } catch (err) {
            // silent — we'll fall back to unauthenticated state
          }
        }

        if (!token) {
          await publicSettingsPromise;
          setLoading(false);
          return;
        }
        // Try a fast local decode of the access token so UI can render immediately
        // (useful in dev when /me might fail or be slow). Token will be verified
        // by the server on any protected API calls; we still attempt to refresh
        // the full user object from the server afterwards.
        let payload;
        try {
          // base64url -> base64
          const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
          const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
          payload = JSON.parse(atob(padded));
          setUser({
            id: payload.sub,
            name: payload.name || payload.email || "Administrator",
            email: payload.email,
            role: payload.role || "user",
            avatarUrl: payload.avatarUrl || "",
          });
        } catch (err) {
          // ignore decode errors and fall back to fetching /me
        }

        // Always refresh authoritative user from server to ensure role and
        // permissions are correct. Keep locally-decoded user briefly for UI
        // responsiveness while /me is fetched.
        try {
          const { user: me } = await authService.me();
          setUser(me);
        } catch (err) {
          // If /me fails, clear auth to avoid operating with stale/invalid token
          clearAuth();
        }

        await publicSettingsPromise;
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [clearAuth]);

  useEffect(() => {
    const onAuthInvalid = () => {
      clearAuth();
      setLoading(false);
    };

    window.addEventListener("sra-auth-invalid", onAuthInvalid);
    return () => {
      window.removeEventListener("sra-auth-invalid", onAuthInvalid);
    };
  }, [clearAuth]);

  const signup = useCallback(async (payload) => {
    const data = await authService.signup(payload);
    setAuthState(data);
    return data;
  }, []);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    setAuthState(data);
    return data;
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const data = await authService.googleLogin(idToken);
    setAuthState(data);
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: me } = await authService.me();
    setUser(me);
    return me;
  }, []);

  // Listen for billing updates from the app-level refresh events and
  // refresh the authoritative user profile so UI reflects plan changes
  useEffect(() => {
    let lastHandledAt = 0;
    let lastHandledKey = "";

    const handler = async (e) => {
      try {
        const d = e?.detail || {};
        const key = `${d.entity || ""}:${d.action || ""}`;
        const now = Date.now();

        // prevent refresh storms from duplicated realtime events
        if (lastHandledKey === key && now - lastHandledAt < 1200) return null;

        const shouldRefresh =
          d.entity === "billing" ||
          (d.entity === "user" && ["login", "logout"].includes(d.action));

        if (shouldRefresh) {
          lastHandledKey = key;
          lastHandledAt = now;
          try {
            return await refreshUser();
          } catch (err) {
            // ignore refresh errors
          }
        }
      } catch (err) {}
      return null;
    };

    window.addEventListener("sra:data-refresh", handler);
    return () => window.removeEventListener("sra:data-refresh", handler);
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      siteSettings,
      signup,
      login,
      googleLogin,
      refreshUser,
      logout: clearAuth,
    }),
    [
      user,
      loading,
      siteSettings,
      signup,
      login,
      googleLogin,
      refreshUser,
      clearAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || fallbackAuth;
};
