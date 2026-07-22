import { mainnet, base, arbitrum, bsc, polygon } from "wagmi/chains";
import { defineChain, type Chain } from "viem";

/** Robinhood Chain — not in viem/wagmi, defined here from its published params. */
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
});

/**
 * Chains the router supports for execution. Mirrors core's
 * applications/router/server/constants.py CHAINS (the EVM entries) and
 * engine/config _SUPPORTED_CHAINS. Solana is intentionally excluded — it
 * has no calldata-based execution path here.
 */
export type SupportedChain = {
  /** blockchainId sent to /quote (core's chain name) */
  id: string;
  /** numeric EVM chain id */
  chainId: number;
  /** display label */
  label: string;
  /** viem/wagmi chain object for the wallet client */
  viem: Chain;
  /** native coin symbol */
  nativeSymbol: string;
  /** wrapped-native token address — the /usd endpoint prices this, not the native sentinel */
  wrappedNative: string;
  /** address family (defaults to EVM); set "svm" when Solana is added */
  kind?: ChainKind;
  /** registry key for the logo lookup, when it differs from `id` (defaults to `id`) */
  logoKey?: string;
  /**
   * Whether Sequence WaaS supports this chain. Chains set to `false` are kept out
   * of the Sequence `chainIds` (its embedded/guest/social wallets can't sign for
   * them) but still registered with wagmi, so external wallets (MetaMask,
   * WalletConnect, injected) can transact on them. Defaults to true.
   */
  waasSupported?: boolean;
};

/** Address family — drives recipient validation. Solana ("svm") is future. */
export type ChainKind = "evm" | "svm";

/** Address family of a chain — EVM unless explicitly marked otherwise. */
export function chainKind(chain: SupportedChain | undefined): ChainKind {
  return chain?.kind ?? "evm";
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  { id: "ethereum", chainId: 1, label: "Ethereum", viem: mainnet, nativeSymbol: "ETH", wrappedNative: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" },
  { id: "base", chainId: 8453, label: "Base", viem: base, nativeSymbol: "ETH", wrappedNative: "0x4200000000000000000000000000000000000006" },
  { id: "arbitrum", chainId: 42161, label: "Arbitrum", viem: arbitrum, nativeSymbol: "ETH", wrappedNative: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1" },
  { id: "binance", chainId: 56, label: "Binance", viem: bsc, nativeSymbol: "BNB", wrappedNative: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c" },
  { id: "polygon", chainId: 137, label: "Polygon", viem: polygon, nativeSymbol: "POL", wrappedNative: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" },
  // Robinhood: Sequence WaaS doesn't support 4663 → external wallets only (see waasSupported).
  { id: "robinhood", chainId: 4663, label: "Robinhood", viem: robinhoodChain, nativeSymbol: "ETH", wrappedNative: "0x0bd7d308f8e1639fab988df18a8011f41eacad73", waasSupported: false },
];

export const CHAIN_BY_ID = new Map(SUPPORTED_CHAINS.map((c) => [c.id, c]));
export const CHAIN_BY_NUM = new Map(SUPPORTED_CHAINS.map((c) => [c.chainId, c]));

/**
 * Circle CCTP domain IDs (NOT EVM chain ids) for the chains we support that
 * CCTP covers — used to query the Iris attestation API for bridge settlement.
 * See https://developers.circle.com/cctp. Chains absent here (binance,
 * robinhood) aren't CCTP domains → bridge tracking falls back to balance polls.
 */
const CCTP_DOMAINS: Record<string, number> = {
  ethereum: 0,
  arbitrum: 3,
  base: 6,
  polygon: 7,
};

/** CCTP domain id for a chain, or null when the chain isn't a CCTP domain. */
export function cctpDomain(chain: SupportedChain | undefined): number | null {
  if (!chain) return null;
  const d = CCTP_DOMAINS[chain.id];
  return d === undefined ? null : d;
}

export function chainById(id: string | undefined): SupportedChain | undefined {
  return id ? CHAIN_BY_ID.get(id) : undefined;
}

/** EIP-7528 native-asset sentinel used by most routers for "native ETH". */
export const NATIVE_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isNativeAddress(addr: string | undefined): boolean {
  if (!addr) return false;
  const a = addr.toLowerCase();
  return a === NATIVE_SENTINEL || a === ZERO_ADDRESS;
}

/**
 * Wei held back for gas when the user taps MAX on the native asset, so the
 * swap transaction still has gas to spend. L1 is pricier than the L2s.
 */
const NATIVE_GAS_BUFFER_WEI: Record<number, bigint> = {
  1: 1_500_000_000_000_000n, // Ethereum  ~0.0015 ETH
  42161: 50_000_000_000_000n, // Arbitrum ~0.00005 ETH
  8453: 50_000_000_000_000n, // Base      ~0.00005 ETH
  56: 2_000_000_000_000_000n, // BNB Chain ~0.002 BNB
  137: 50_000_000_000_000_000n, // Polygon ~0.05 POL
};

export function nativeGasBufferWei(chainId: number): bigint {
  return NATIVE_GAS_BUFFER_WEI[chainId] ?? 200_000_000_000_000n; // default ~0.0002
}

/** Default user-facing slippage when none supplied (core: 300 bps = 3%). */
export const DEFAULT_SLIPPAGE_BPS = 300;
export const SLIPPAGE_MIN_BPS = 1;
export const SLIPPAGE_MAX_BPS = 5000;
export const DEFAULT_MAX_HOPS = 3;
export const HARD_MAX_HOPS = 4;
