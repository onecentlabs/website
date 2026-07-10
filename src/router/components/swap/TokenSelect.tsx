"use client";

import type { Token } from "@r/lib/types";
import { TokenLogo } from "./TokenLogo";

/** Token pill trigger. Opens the unified asset modal (chain locked). */
export function TokenSelect({
  chainId,
  value,
  onClick,
}: {
  chainId: number;
  value: Token | null;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-line bg-elev shadow-[0_2px_10px_-6px_rgba(0,0,0,0.7)] hover:border-accent/50 hover:-translate-y-px transition-all shrink-0"
      onClick={onClick}
    >
      {value ? (
        <>
          <TokenLogo chainId={chainId} address={value.address} symbol={value.symbol} size={32} />
          <span className="text-[15px] font-semibold tracking-tight">{value.symbol}</span>
        </>
      ) : (
        <span className="text-base font-semibold pl-1.5">Select</span>
      )}
      <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted shrink-0">
        <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
