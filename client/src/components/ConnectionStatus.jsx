import { useEffect, useState } from "react";

export const ConnectionStatus = () => {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const handler = (e) => setStatus(e.detail?.status || "disconnected");
    window.addEventListener("sra:connection-status", handler);
    return () => window.removeEventListener("sra:connection-status", handler);
  }, []);

  const color =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-yellow-400"
        : "bg-rose-500";
  const label =
    status === "connected"
      ? "Realtime: online"
      : status === "connecting"
        ? "Realtime: connecting"
        : "Realtime: offline";

  return (
    <div className="fixed right-4 top-4 z-50">
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white shadow ${color}`}
      >
        <span className="h-2 w-2 rounded-full block" />
        <span>{label}</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
