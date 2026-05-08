import { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type Tone = "default" | "cyan" | "magenta" | "lime" | "gold";

const toneClass: Record<Tone, string> = {
  default: "pixel-card",
  cyan: "pixel-card pixel-card-cyan",
  magenta: "pixel-card pixel-card-magenta",
  lime: "pixel-card pixel-card-lime",
  gold: "pixel-card pixel-card-gold",
};

const toneText: Record<Tone, string> = {
  default: "text-ink",
  cyan: "text-cyan",
  magenta: "text-magenta",
  lime: "text-lime",
  gold: "text-gold",
};

export function PixelCard({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <div className={clsx(toneClass[tone], "p-6 sm:p-8", className)}>{children}</div>;
}

export function PixelCardTitle({ children, tone = "default" }: { children: ReactNode; tone?: Tone }) {
  return <h3 className={clsx("text-base sm:text-lg", toneText[tone])}>{children}</h3>;
}
