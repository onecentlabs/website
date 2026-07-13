"use client";

import Link from "next/link";
import { Logo } from "@r/components/ui/Logo";
import { ConnectButton } from "@r/components/swap/ConnectButton";
import { site } from "@r/lib/site";

export function RouterNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 h-16">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label={site.name}>
          <Logo size={18} className="text-accent/70 group-hover:text-accent transition-colors" />
          <span className="font-display text-[10px] tracking-[0.18em] uppercase text-ink/65 group-hover:text-ink/90 transition-colors">
            OneCent
          </span>
        </Link>
        <ConnectButton />
      </div>
    </header>
  );
}
