"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  life: number;
  max: number;
  size: number;
  color: string;
};

const COLORS_DEFAULT = ["#b6ff3c", "#43e7ff", "#f4f5f7"];
const COLORS_HOVER = ["#ff5d8f", "#ffd23f", "#f4f5f7"];
const HOVER_SELECTOR = 'a, button, [role="button"], input[type="submit"], input[type="button"], label, summary';

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -100, y: -100, vx: 0, vy: 0, lastX: -100, lastY: -100 });
  const visible = useRef(false);
  const hovering = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!canvas || !cursor) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener("resize", resize);

    const setHover = (on: boolean) => {
      if (hovering.current === on) return;
      hovering.current = on;
      cursor.dataset.hover = on ? "true" : "false";
    };

    let lastSpawn = 0;
    let traveled = 0;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - mouse.current.x;
      const dy = e.clientY - mouse.current.y;
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      visible.current = true;
      cursor.style.opacity = "1";

      const target = e.target as Element | null;
      const isHover = !!(target && target.closest && target.closest(HOVER_SELECTOR));
      setHover(isHover);

      const palette = isHover ? COLORS_HOVER : COLORS_DEFAULT;
      traveled += Math.hypot(dx, dy);
      const now = performance.now();
      if (traveled >= 6 && now - lastSpawn > 16) {
        traveled = 0;
        lastSpawn = now;
        for (let i = 0; i < 3; i++) {
          const ox = (Math.random() - 0.5) * 10;
          const oy = (Math.random() - 0.5) * 10;
          const max = 60 + Math.random() * 24;
          particles.current.push({
            x: Math.round(e.clientX + ox),
            y: Math.round(e.clientY + oy),
            life: max,
            max,
            size: Math.random() < 0.5 ? 3 : 4,
            color: palette[Math.floor(Math.random() * palette.length)],
          });
        }
      }
      mouse.current.lastX = e.clientX;
      mouse.current.lastY = e.clientY;
      if (particles.current.length > 200) {
        particles.current.splice(0, particles.current.length - 200);
      }
    };

    const onLeave = () => {
      visible.current = false;
      cursor.style.opacity = "0";
    };
    const onEnter = () => {
      visible.current = true;
      cursor.style.opacity = "1";
    };
    const onDown = () => {
      const palette = hovering.current ? COLORS_HOVER : COLORS_DEFAULT;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        const r = 5 + Math.random() * 5;
        particles.current.push({
          x: mouse.current.x + Math.cos(a) * r,
          y: mouse.current.y + Math.sin(a) * r,
          life: 18,
          max: 18,
          size: 3,
          color: palette[Math.floor(Math.random() * palette.length)],
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onEnter);
    window.addEventListener("mousedown", onDown);

    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const list = particles.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= 1;
        if (p.life <= 0) {
          list.splice(i, 1);
          continue;
        }
        const alpha = p.life / p.max;
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      if (visible.current) {
        cursor.style.transform = `translate(${mouse.current.x}px, ${mouse.current.y}px) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9998,
        }}
      />
      <div
        ref={cursorRef}
        aria-hidden
        data-hover="false"
        className="cursor-pixel"
      >
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
    </>
  );
}
