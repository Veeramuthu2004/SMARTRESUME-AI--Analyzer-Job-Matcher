import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.03] hover:shadow-xl hover:shadow-cyan-500/35 active:scale-[0.99]",
        outline:
          "border border-slate-300/80 bg-white/80 text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800/80",
        ghost:
          "text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800/70",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export const Button = ({
  className,
  variant,
  size,
  as: Comp = "button",
  loading = false,
  ...props
}) => {
  const disabled = Boolean(props.disabled || loading);

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {props.children}
      </span>
    </Comp>
  );
};
