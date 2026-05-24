import React from "react";

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(pages, page + 1));

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={prev}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
      >
        Prev
      </button>
      <div className="text-sm font-medium text-slate-500 dark:text-slate-300">
        Page {page} of {pages}
      </div>
      <button
        onClick={next}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
      >
        Next
      </button>
    </div>
  );
}
