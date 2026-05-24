import { cn } from "../../lib/utils";

export const Card = ({ className, children }) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-slate-900 shadow-lg shadow-slate-200/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 dark:border-slate-800 dark:bg-slate-900/72 dark:text-slate-100 dark:shadow-black/35",
      className,
    )}
  >
    {children}
  </div>
);
