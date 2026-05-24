import React from "react";

export function FilterBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100"
      />
    </div>
  );
}
