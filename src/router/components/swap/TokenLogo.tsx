"use client";

import { tokenLogo } from "@r/lib/api";

/** Token logo via the same-origin /api/logo proxy. Symbol initial as fallback. */
export function TokenLogo({
  chainId,
  address,
  symbol,
  size = 28,
}: {
  chainId: number;
  address: string;
  symbol: string;
  size?: number;
}) {
  return (
    <span
      className="relative inline-grid place-items-center shrink-0 overflow-hidden rounded-full border border-line bg-bg-3"
      style={{ width: size, height: size }}
    >
      <span className="absolute kpi-num text-muted" style={{ fontSize: size * 0.42 }}>
        {symbol.slice(0, 1)}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tokenLogo(chainId, address)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="relative w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
    </span>
  );
}
