export const ProgressBar = ({ value = 0 }) => (
  <div className="h-3 w-full rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);
