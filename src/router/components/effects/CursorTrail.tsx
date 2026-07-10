"use client";

import { useEffect, useRef } from "react";

const HOVER_SELECTOR = 'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="click"]';

/**
 * Custom cursor: a classic arrow silhouette redesigned in neon green — flat,
 * sharp-angled, with a lime→green gradient, a crisp brighter outline, a soft
 * outer glow and a thin top-left inner highlight. The tip (3,2) is the hotspot.
 * No particle trail. Pointer-fine devices only.
 */
export function CursorTrail() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMove = (e: MouseEvent) => {
      // The arrow tip sits at (3,2) in the 24px viewBox — pull it back onto the
      // pointer so the hotspot is the sharp point, like a native arrow cursor.
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-3px, -2px)`;
      cursor.style.opacity = "1";
      const target = e.target as Element | null;
      const isHover = !!(target && target.closest && target.closest(HOVER_SELECTOR));
      cursor.dataset.hover = isHover ? "true" : "false";
    };
    const onLeave = () => { cursor.style.opacity = "0"; };
    const onEnter = () => { cursor.style.opacity = "1"; };

    window.addEventListener("mousemove", onMove);
    // mouseleave/enter on <html> fire reliably on viewport exit (window does not).
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    // Switching apps/tabs leaves no mouseleave — hide on focus loss too.
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <div ref={cursorRef} aria-hidden data-hover="false" className="cursor-pixel">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <defs>
          {/* bright lime (top-left) → deeper neon green (bottom-right) */}
          <linearGradient id="oc-cursor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#CBFF66" />
            <stop offset="0.55" stopColor="#A8FF2A" />
            <stop offset="1" stopColor="#6FD400" />
          </linearGradient>
        </defs>
        {/* arrow head — flat triangular pointer (no tail), thin brighter outline */}
        <path
          className="cp-arrow"
          d="M3 2 L3 19 L15.5 13.2 Z"
          fill="url(#oc-cursor)"
          stroke="#DBFF85"
          strokeWidth="1"
          strokeLinejoin="miter"
        />
        {/* inner highlight — a hairline of light along the top-left edge */}
        <path
          d="M4 3.6 L4 16"
          fill="none"
          stroke="rgba(240,255,200,0.55)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
