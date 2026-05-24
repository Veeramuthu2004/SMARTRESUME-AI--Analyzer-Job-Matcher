import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";

export const ConfirmationModal = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const confirmClass =
    tone === "danger"
      ? "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-rose-500/30"
      : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:shadow-cyan-500/30";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg"
          >
            <Card className="relative overflow-hidden border border-white/10 bg-white/80 shadow-2xl shadow-black/30 dark:bg-slate-950/80">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-cyan-500/10 dark:from-white/5" />
              <div className="relative">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 inline-flex rounded-full bg-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:bg-slate-900/70 dark:text-slate-300">
                      Please confirm
                    </p>
                    <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                      {title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-full border border-white/20 bg-white/80 p-2 text-slate-600 transition hover:scale-105 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </p>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    className="bg-white/80 dark:bg-slate-900/70"
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className={confirmClass}
                  >
                    {loading ? "Working..." : confirmLabel}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
