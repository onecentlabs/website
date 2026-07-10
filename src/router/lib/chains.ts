import { mainnet, base, arbitrum } from "wagmi/chains";
import type { Chain } from "viem";

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
};

export const SUPPORTED_CHAINS: SupportedChain[] = [
  { id: "ethereum", chainId: 1, label: "Ethereum", viem: mainnet, nativeSymbol: "ETH", wrappedNative: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" },
  { id: "base", chainId: 8453, label: "Base", viem: base, nativeSymbol: "ETH", wrappedNative: "0x4200000000000000000000000000000000000006" },
  { id: "arbitrum", chainId: 42161, label: "Arbitrum", viem: arbitrum, nativeSymbol: "ETH", wrappedNative: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1" },
];

export const CHAIN_BY_ID = new Map(SUPPORTED_CHAINS.map((c) => [c.id, c]));
export const CHAIN_BY_NUM = new Map(SUPPORTED_CHAINS.map((c) => [c.chainId, c]));

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

/** Router execution contract — same address on every supported chain. */
export const ROUTER_ADDRESS = "0xaa25c358cda5cb2972676dcecdf9a2b272c63493";

/**
 * Wei held back for gas when the user taps MAX on the native asset, so the
 * swap transaction still has gas to spend. L1 is pricier than the L2s.
 */
const NATIVE_GAS_BUFFER_WEI: Record<number, bigint> = {
  1: 1_500_000_000_000_000n, // Ethereum  ~0.0015 ETH
  42161: 50_000_000_000_000n, // Arbitrum ~0.00005 ETH
  8453: 50_000_000_000_000n, // Base      ~0.00005 ETH
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
