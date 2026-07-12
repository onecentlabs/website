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
      // The path tip is at (4,4) but the 4px miter halo stroke extends the
      // visible tip to ~(0.5,0.5) — align that onto the pointer hotspot.
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-0.5px, -0.5px)`;
      const target = e.target as Element | null;
      // Sequence connect modal lives in a shadow DOM we can't restyle —
      // hide our cursor there and let the native one take over.
      if (target?.closest?.("[data-shadow-host]")) {
        cursor.style.opacity = "0";
        return;
      }
      cursor.style.opacity = "1";
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
      {/* Solid lime arrow pointer with a concave notch and rounded corners.
          Sharp tip top-left, right point, tail bottom. */}
      <svg viewBox="0 0 24 24" width="24" height="24">
        {/* Outline halo — same path, drawn wider underneath */}
        <path className="cp-bg" d="M4 4 L11.07 21 L13.58 13.61 L21 11.06 Z" />
        {/* Fill */}
        <path className="cp-fg" d="M4 4 L11.07 21 L13.58 13.61 L21 11.06 Z" />
      </svg>
    </div>
  );
}
