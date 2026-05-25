import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";

let socket;
let listenersBound = false;
let activeUserId = null;
let lastJoinedRoom = null;
let lastConnectionState = null;
let lastConnectionToastAt = 0;
let lastRefreshKey = null;
let lastRefreshAt = 0;

// Helper to dispatch a lightweight connection-status event the UI can subscribe to
const dispatchConnectionStatus = (status) => {
  try {
    window.dispatchEvent(
      new CustomEvent("sra:connection-status", { detail: { status } }),
    );
  } catch (e) {}
};

export const useSocket = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const setConnectionState = (state, showToast = true) => {
        const TOAST_THROTTLE_MS = 5000;
        dispatchConnectionStatus(state);
        const now = Date.now();
        if (
          showToast &&
          state !== lastConnectionState &&
          now - lastConnectionToastAt > TOAST_THROTTLE_MS
        ) {
          lastConnectionToastAt = now;
          lastConnectionState = state;
          try {
            if (state === "connected")
              toast("Realtime connected", "success", { autoDismiss: true });
            else if (state === "connecting")
              toast("Realtime connecting…", "info", { autoDismiss: true });
            else if (state === "disconnected")
              toast("Realtime disconnected — offline", "error", {
                autoDismiss: true,
              });
          } catch (e) {}
        } else {
          lastConnectionState = state;
        }
      };

      const handleRefresh = (entity, action, payload, toastMsg) => {
        const now = Date.now();
        const refreshKey = `${entity}:${action}`;
        // dedupe burst events so dashboard refresh happens once
        if (lastRefreshKey === refreshKey && now - lastRefreshAt < 1200) return;
        lastRefreshKey = refreshKey;
        lastRefreshAt = now;

        window.dispatchEvent(
          new CustomEvent("sra:data-refresh", {
            detail: { entity, action, payload },
          }),
        );
        if (toastMsg) {
          try {
            toast(toastMsg, "info", { autoDismiss: true });
          } catch (e) {}
        }
      };

      if (!socket) {
        const token = localStorage.getItem("sra_access_token");
        const base = import.meta.env.VITE_API_BASE_URL
          ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
          : "https://smartresume-ai-analyzer-job-matcher-1.onrender.com";

        socket = io(base, {
          auth: { token },
          transports: import.meta.env.DEV
            ? ["polling"]
            : ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
          randomizationFactor: 0.5,
          autoConnect: true,
        });
      }

      if (!listenersBound && socket) {
        listenersBound = true;

        socket.on("connect", () => {
          try {
            if (activeUserId) {
              const room = `user:${activeUserId}`;
              if (lastJoinedRoom !== room) {
                socket.emit("join", room);
                lastJoinedRoom = room;
              }
            }
            setConnectionState("connected");
          } catch (e) {}
        });

        socket.on("reconnect_attempt", () =>
          setConnectionState("connecting", false),
        );
        socket.on("reconnecting", () =>
          setConnectionState("connecting", false),
        );

        socket.on("connect_error", () => {
          try {
            setConnectionState("connecting", false);
          } catch (e) {}
        });

        socket.on("disconnect", (reason) => {
          try {
            if (reason === "io server disconnect") {
              try {
                socket.connect();
              } catch (e) {}
            }
            setConnectionState("disconnected");
          } catch (e) {}
        });

        socket.on("billing:update", (data) => {
          handleRefresh("billing", "update", data, "Billing updated");
        });

        socket.on("analysis:created", (data) => {
          handleRefresh(
            "analysis",
            "created",
            data,
            "Analysis completed — report available",
          );
        });

        socket.on("resume:uploaded", (data) => {
          handleRefresh("resume", "uploaded", data, "Resume uploaded");
        });

        setConnectionState(
          socket.connected ? "connected" : "connecting",
          false,
        );
      }

      return undefined;
    } catch (e) {
      // ignore
    }
    return undefined;
  }, [toast]);

  useEffect(() => {
    activeUserId = user?.id || user?._id || null;
    if (!socket || !socket.connected || !activeUserId) return;
    const room = `user:${activeUserId}`;
    if (lastJoinedRoom === room) return;
    try {
      socket.emit("join", room);
      lastJoinedRoom = room;
    } catch (e) {}
  }, [user?.id, user?._id]);
};

export const getSocket = () => socket;
