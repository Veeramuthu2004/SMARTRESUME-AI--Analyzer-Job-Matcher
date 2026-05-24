import { useEffect } from "react";
import { io } from "socket.io-client";

let socket;

export function useAdminSocket() {
  useEffect(() => {
    try {
      const token = localStorage.getItem("sra_access_token");
      const base = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")
        : window.location.origin;

      socket = io(base, {
        auth: { token },
        transports: import.meta.env.DEV
          ? ["polling"]
          : ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        // console.log('admin socket connected', socket.id);
      });

      socket.on("dashboard:update", (data) => {
        window.dispatchEvent(new CustomEvent("admin-update", { detail: data }));
      });

      socket.on("notification:new", (data) => {
        window.dispatchEvent(
          new CustomEvent("admin-notification", { detail: data }),
        );
      });

      return () => {
        try {
          socket.disconnect();
        } catch (e) {}
      };
    } catch (e) {
      // ignore
    }
  }, []);
}

export function getAdminSocket() {
  return socket;
}
