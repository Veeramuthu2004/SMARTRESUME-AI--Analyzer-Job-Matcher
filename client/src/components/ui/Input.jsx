import { cn } from "../../lib/utils";

export const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "h-11 w-full rounded-xl border border-slate-300/80 bg-white/90 px-4 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:placeholder:text-slate-400",
      className,
    )}
    {...props}
  />
);
