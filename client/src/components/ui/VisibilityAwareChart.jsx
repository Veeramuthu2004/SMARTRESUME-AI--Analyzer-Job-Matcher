import { useEffect, useRef, useState } from "react";

/**
 * VisibilityAwareChart
 * Wrap chart containers so Recharts only mount when the container
 * is visible and has a measurable width/height. This prevents
 * "width/height <= 0" warnings from Recharts when components mount
 * while hidden (tabs, collapsed panels, etc.).
 */
export const VisibilityAwareChart = ({
  children,
  minWidth = 20,
  minHeight = 20,
}) => {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isIntersecting = false;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          isIntersecting = e.isIntersecting;
        }
        // rely on ResizeObserver to decide final readiness
      },
      { root: null, threshold: 0.01 },
    );
    io.observe(el);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const ok = isIntersecting && width > minWidth && height > minHeight;
        setReady(ok);
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [minWidth, minHeight]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {ready ? children : null}
    </div>
  );
};

export default VisibilityAwareChart;
