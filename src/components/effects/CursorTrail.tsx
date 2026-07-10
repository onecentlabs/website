"use client";

import { useEffect, useRef } from "react";

const HOVER_SELECTOR = 'a, button, [role="button"], input[type="submit"], input[type="button"], label, summary';

export function CursorTrail() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMove = (e: MouseEvent) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      cursor.style.opacity = "1";
      const target = e.target as Element | null;
      const isHover = !!(target && target.closest && target.closest(HOVER_SELECTOR));
      cursor.dataset.hover = isHover ? "true" : "false";
    };
    const onLeave = () => { cursor.style.opacity = "0"; };
    const onEnter = () => { cursor.style.opacity = "1"; };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
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
      {/* 16x16 grid, thicker plus arms (4px wide), pixel halo */}
      <svg viewBox="0 0 16 16" width="26" height="26" shapeRendering="crispEdges">
        {/* Outline / pixel halo */}
        <rect className="cp-bg" x="6" y="1" width="4" height="1" />
        <rect className="cp-bg" x="6" y="14" width="4" height="1" />
        <rect className="cp-bg" x="1" y="6" width="1" height="4" />
        <rect className="cp-bg" x="14" y="6" width="1" height="4" />
        <rect className="cp-bg" x="5" y="2" width="1" height="4" />
        <rect className="cp-bg" x="10" y="2" width="1" height="4" />
        <rect className="cp-bg" x="5" y="10" width="1" height="4" />
        <rect className="cp-bg" x="10" y="10" width="1" height="4" />
        <rect className="cp-bg" x="2" y="5" width="4" height="1" />
        <rect className="cp-bg" x="10" y="5" width="4" height="1" />
        <rect className="cp-bg" x="2" y="10" width="4" height="1" />
        <rect className="cp-bg" x="10" y="10" width="4" height="1" />
        {/* Plus body — thick */}
        <rect className="cp-fg" x="6" y="2" width="4" height="12" />
        <rect className="cp-fg" x="2" y="6" width="12" height="4" />
      </svg>
    </div>
  );
}
