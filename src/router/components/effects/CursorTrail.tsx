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
      // The sharp tip sits at (9.5,22) in the 24px viewBox — pull it onto the
      // pointer so the hotspot is the arrow's point.
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-9.5px, -22px)`;
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
      {/* Solid lime arrow pointer with a concave notch and rounded corners.
          Blunt back top-left, right point, sharp tip bottom-left. */}
      <svg viewBox="0 0 24 24" width="24" height="24">
        {/* Outline halo — same path, drawn wider underneath */}
        <path className="cp-bg" d="M2.5 2.5 L22 11 L14 14 L9.5 22 Z" />
        {/* Fill */}
        <path className="cp-fg" d="M2.5 2.5 L22 11 L14 14 L9.5 22 Z" />
      </svg>
    </div>
  );
}
