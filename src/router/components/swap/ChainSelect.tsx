"use client";

import { type SupportedChain } from "@r/lib/chains";
import { chainLogo } from "@r/lib/api";

/** Chain logo trigger. Opens the unified asset modal (chains switchable). */
export function ChainSelect({ value, onClick }: { value: SupportedChain; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-full border border-line bg-elev hover:border-accent/50 hover:-translate-y-px transition-all"
      onClick={onClick}
      title={`Network: ${value.label} — switch network or token`}
      aria-label={`Network: ${value.label}. Change network or token`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={chainLogo(value.logoKey ?? value.id)}
        alt={value.label}
        width={20}
        height={20}
        className="rounded-full shrink-0"
        onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
      />
      <svg width="10" height="10" viewBox="0 0 12 12" className="text-muted shrink-0">
        <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
