import type { QuoteResponse, TokensResponse, UsdResponse } from "./types";

/**
 * Client-side calls. EVERYTHING goes through the single same-origin gateway
 * /api/g — the browser never learns the real upstream URLs or the API key.
 */
async function gateway<T>(a: string, p: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await fetch("/api/g", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ a, p }),
    signal,
  });
  const body = (await res.json()) as T;
  if (!res.ok) {
    const msg = (body as { error?: string })?.error || `request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

export type QuoteArgs = {
  blockchainId: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string; // human decimal
  userAddress: string;
  receiverAddress?: string;
  slippageBps?: number | null;
  maxHops?: number;
  patchers?: boolean;
  baselines?: boolean;
  simulation?: boolean;
  tokenData?: boolean;
};

export function fetchQuote(args: QuoteArgs, signal?: AbortSignal): Promise<QuoteResponse> {
  const p: Record<string, unknown> = {
    blockchainId: args.blockchainId,
    inputToken: args.inputToken,
    outputToken: args.outputToken,
    inputAmount: args.inputAmount,
    userAddress: args.userAddress,
    simulation: args.simulation ?? true,
    // tokenIn/tokenOut metadata is only returned when tokenData is true
    // (upstream defaults it to false), so always request it.
    tokenData: args.tokenData ?? true,
  };
  if (args.receiverAddress) p.receiverAddress = args.receiverAddress;
  if (args.slippageBps != null) p.slippageBps = args.slippageBps;
  if (args.maxHops != null) p.maxHops = args.maxHops;
  if (args.patchers != null) p.patchers = args.patchers;
  if (args.baselines != null) p.baselines = args.baselines;
  return gateway<QuoteResponse>("q", p, signal);
}

export function fetchUsd(chain: string, token: string, signal?: AbortSignal): Promise<UsdResponse> {
  return gateway<UsdResponse>("u", { chain, token }, signal);
}

export function fetchTokens(chainId: number | string, signal?: AbortSignal): Promise<TokensResponse> {
  return gateway<TokensResponse>("t", { chains: String(chainId) }, signal);
}

/** Build the same-origin logo URL for a token (image bytes proxied server-side). */
export function tokenLogo(chainId: number, address: string): string {
  return `/api/logo?c=${chainId}&a=${address.toLowerCase()}`;
}
export function chainLogo(key: string): string {
  return `/api/logo?ch=${encodeURIComponent(key)}`;
}
