import { useLayoutEffect, useRef, useState } from "react";

/**
 * MeasuredChart
 * Provides explicit width/height to chart children using a render prop.
 * This avoids Recharts ResponsiveContainer warnings when a chart mounts
 * before its parent has settled layout (route transitions, hidden panels, etc.).
 */
export const MeasuredChart = ({
  children,
  minWidth = 280,
  minHeight = 320,
  className = "",
}) => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let raf = 0;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    };

    measure();

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const ready = size.width >= minWidth && size.height >= minHeight;

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height: "100%", minHeight }}
    >
      {ready ? children({ width: size.width, height: size.height }) : null}
    </div>
  );
};

export default MeasuredChart;
