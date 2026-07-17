"use client";

import { type ReactNode } from "react";
import { http } from "wagmi";
import type { Chain, Transport } from "viem";
import { SequenceConnect, createConfig } from "@0xsequence/connect";
import { SUPPORTED_CHAINS } from "@r/lib/chains";

const projectAccessKey = process.env.NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY ?? "";
const waasConfigKey = process.env.NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY ?? "";
const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Sequence WaaS only accepts chains it supports. Feed it just those; chains it
// can't handle (e.g. Robinhood) are excluded here but still registered with wagmi
// below, so external wallets can trade on them.
const chainIds = SUPPORTED_CHAINS.filter((c) => c.waasSupported !== false).map((c) => c.chainId);

// Give wagmi the FULL chain set (incl. WaaS-unsupported ones). Passing our own
// `chains` + `transports` also bypasses Sequence's getDefaultChains(), which
// throws on any chain it doesn't recognise.
const allChains = SUPPORTED_CHAINS.map((c) => c.viem) as [Chain, ...Chain[]];
const transports: Record<number, Transport> = Object.fromEntries(
  SUPPORTED_CHAINS.map((c) => [c.chainId, http()]),
);

// Sequence WaaS config. Built once at module scope; SequenceConnect provides the
// Wagmi + React Query context and the embedded-wallet connect modal.
const config = createConfig("waas", {
  projectAccessKey,
  waasConfigKey,
  appName: "OneCent Router",
  defaultChainId: 42161,
  chainIds,
  position: "center",
  defaultTheme: "dark",
  signIn: { projectName: "OneCent Router" },
  // Silence analytics network calls (the "Failed to fetch" console noise).
  disableAnalytics: true,
  email: true,
  guest: true,
  google: googleClientId ? { clientId: googleClientId } : false,
  // Explicit MetaMask/Coinbase connectors so they always show as options (the
  // modal dedupes them against EIP-6963-discovered extensions). Other installed
  // wallet extensions (Rabby, etc.) appear via multiInjectedProviderDiscovery.
  coinbase: true,
  metaMask: true,
  walletConnect: wcProjectId ? { projectId: wcProjectId } : false,
  enableConfirmationModal: true,
  wagmiConfig: { multiInjectedProviderDiscovery: true, chains: allChains, transports },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return <SequenceConnect config={config}>{children}</SequenceConnect>;
}
