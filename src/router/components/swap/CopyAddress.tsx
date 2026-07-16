"use client";

import { useState } from "react";
import { shortAddr } from "@r/lib/format";

/**
 * Clickable short token address. The text itself copies on click (turns accent
 * on hover, shows "Copied" briefly). Rendered inside token-row <button>s, so it
 * uses role="button" (not a nested <button>) and stops propagation.
 */
export function CopyAddress({ address, className = "" }: { address: string; className?: string }) {
  const [done, setDone] = useState(false);

  function copy(e: React.SyntheticEvent) {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard
      ?.writeText(address)
      .then(() => {
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      })
      .catch(() => {});
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Copy address"
      title={done ? "Copied" : "Copy address"}
      onClick={copy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") copy(e);
      }}
      className={`addr text-[13px] transition-colors ${className} ${done ? "text-accent" : "text-ink/70 hover:text-accent"}`}
    >
      {done ? "Copied" : shortAddr(address)}
    </span>
  );
}
