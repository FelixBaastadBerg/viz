import { useEffect, useState } from "react";
import { smooth } from "./math";

/**
 * Manim-style smooth() progress 0→1 over `durationMs`, starting after
 * `delayMs`. Drives the intro choreography (draw-in, fades).
 */
export function useIntro(durationMs: number, delayMs = 0): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / durationMs, 0), 1);
      setP(smooth(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, delayMs]);
  return p;
}

/**
 * Element size that is never 0 and tracks resizes (a 0 height makes Mafs'
 * view transform singular). Pass the ref of the stage wrapper.
 */
export function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 800, height: 500 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return { width: Math.max(size.width, 200), height: Math.max(size.height, 200) };
}
