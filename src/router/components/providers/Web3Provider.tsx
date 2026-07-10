"use client";

import { type ReactNode } from "react";
import { SequenceConnect, createConfig } from "@0xsequence/connect";
import { SUPPORTED_CHAINS } from "@r/lib/chains";

const projectAccessKey = process.env.NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY ?? "";
const waasConfigKey = process.env.NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY ?? "";
const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Only the chains the router executes on — keeps the wallet network list in sync
// with lib/chains.ts. Default to Arbitrum (the swap widget's default chain).
const chainIds = SUPPORTED_CHAINS.map((c) => c.chainId);

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
  // MetaMask + Coinbase come in via EIP-6963 injected discovery below — skip their
  // bundled SDK connectors so their telemetry endpoints (cca-lite.coinbase.com /
  // MetaMask analytics, blocked → "Failed to fetch") never run.
  coinbase: false,
  metaMask: false,
  walletConnect: wcProjectId ? { projectId: wcProjectId } : false,
  enableConfirmationModal: true,
  wagmiConfig: { multiInjectedProviderDiscovery: true },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return <SequenceConnect config={config}>{children}</SequenceConnect>;
}
