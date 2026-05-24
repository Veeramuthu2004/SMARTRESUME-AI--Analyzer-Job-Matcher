import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);
let toastId = 0;

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className:
      "border-emerald-400/20 bg-emerald-500/15 text-emerald-50 shadow-emerald-500/10",
    accent: "text-emerald-300",
  },
  error: {
    icon: XCircle,
    className:
      "border-rose-400/20 bg-rose-500/15 text-rose-50 shadow-rose-500/10",
    accent: "text-rose-300",
  },
  warning: {
    icon: TriangleAlert,
    className:
      "border-amber-400/20 bg-amber-500/15 text-amber-50 shadow-amber-500/10",
    accent: "text-amber-300",
  },
  info: {
    icon: Info,
    className:
      "border-cyan-400/20 bg-cyan-500/15 text-cyan-50 shadow-cyan-500/10",
    accent: "text-cyan-300",
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info", options = {}) => {
      const id = ++toastId;
      const nextToast = {
        id,
        message,
        type,
        timeout: options.timeout ?? 3500,
      };

      setToasts((prev) => [...prev, nextToast]);

      if (nextToast.timeout !== 0) {
        window.setTimeout(() => removeToast(id), nextToast.timeout);
      }

      return id;
    },
    [removeToast],
  );

  const value = useMemo(() => ({ toast, removeToast }), [toast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        <AnimatePresence>
          {toasts.map((item) => {
            const config = toastStyles[item.type] || toastStyles.info;
            const Icon = config.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${config.className}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-white/10 p-2">
                    <Icon className={`h-4 w-4 ${config.accent}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-5 text-white">
                      {item.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(item.id)}
                    className="rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
};
