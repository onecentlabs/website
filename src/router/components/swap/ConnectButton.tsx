"use client";

import { useSyncExternalStore } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useOpenConnectModal } from "@0xsequence/connect";
import { shortAddr } from "@r/lib/format";

const noop = () => () => {};

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpenConnectModal } = useOpenConnectModal();
  // false on server + first client render, true after hydration — no setState.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  // Avoid hydration mismatch — wallet state is client-only.
  if (!mounted) {
    return <span className="pixel-btn pixel-btn-ghost opacity-50">Connect</span>;
  }

  if (isConnected && address) {
    return (
      <div className="flex items-stretch gap-2">
        <span className="pixel-btn pixel-btn-ghost">
          <span className="dot" /> {shortAddr(address)}
        </span>
        <button
          onClick={() => disconnect()}
          title="Disconnect"
          aria-label="Disconnect"
          className="inline-flex items-center justify-center px-3 border-2 border-line text-muted hover:text-danger hover:border-danger transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button className="pixel-btn" onClick={() => setOpenConnectModal(true)}>
      Connect Wallet
    </button>
  );
}
