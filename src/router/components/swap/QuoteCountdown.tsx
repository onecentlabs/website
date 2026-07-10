"use client";

import { useEffect, useRef, type RefObject } from "react";

type Props = {
  progressRef: RefObject<number>;
  active: boolean;
  spinning: boolean; // a fetch is in flight with no quote yet
  isStale: boolean; // cycle elapsed, awaiting the fresh quote
  onRefresh: () => void;
};

const SEGMENTS = 24;
// Each dash's "filled" color by position: light green (#86efac) → red (#ef4444).
const FROM = [134, 239, 172];
const TO = [239, 68, 68];
const FILL_COLORS = Array.from({ length: SEGMENTS }, (_, i) => {
  const t = i / (SEGMENTS - 1);
  const r = Math.round(FROM[0] + (TO[0] - FROM[0]) * t);
  const g = Math.round(FROM[1] + (TO[1] - FROM[1]) * t);
  const b = Math.round(FROM[2] + (TO[2] - FROM[2]) * t);
  return `rgb(${r} ${g} ${b})`;
});

/**
 * Segmented countdown for the To section. Dashes start gray and fill left → right
 * over the cycle; each filled dash is colored by its position (green at the
 * start, red at the end). Read imperatively from progressRef — no state churn.
 * The trailing button refreshes the quote on demand.
 */
export function QuoteCountdown({ progressRef, active, spinning, isStale, onRefresh }: Props) {
  const segsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = active ? Math.min(Math.max(progressRef.current ?? 0, 0), 1) : 0;
      const filled = active ? Math.round(p * SEGMENTS) : 0;
      const segs = segsRef.current;
      for (let i = 0; i < segs.length; i++) {
        const el = segs[i];
        if (el) el.style.background = i < filled ? FILL_COLORS[i] : "var(--line)";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, active]);

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className={`flex flex-1 items-center gap-[3px] ${isStale ? "animate-pulse" : ""}`}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              segsRef.current[i] = el;
            }}
            className="h-0.5 flex-1 rounded-full transition-colors"
            style={{ background: "var(--line)" }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={!active}
        title="Refresh quote"
        aria-label="Refresh quote"
        className="text-muted hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={spinning ? "animate-spin" : ""}
          style={spinning ? { animationDuration: "0.9s" } : undefined}
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
    </div>
  );
}
