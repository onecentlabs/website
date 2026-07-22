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
  blockchainId: string; // source chain
  /** destination chain for a bridge (cross-chain). Omit / equal to source for a same-chain swap. */
  destinationBlockchainId?: string;
  rawDestinationBlockchainId?: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string; // human decimal ("0.001") — same-chain and bridge alike
  userAddress: string;
  receiverAddress?: string;
  slippageBps?: number | null;
  maxHops?: number;
  patchers?: boolean;
  baselines?: boolean;
  simulation?: boolean;
  tokenData?: boolean;
  incognito?: boolean; // private-mode swap
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
  if (args.destinationBlockchainId) p.destinationBlockchainId = args.destinationBlockchainId;
  if (args.rawDestinationBlockchainId) p.rawDestinationBlockchainId = args.rawDestinationBlockchainId;
  if (args.receiverAddress) p.receiverAddress = args.receiverAddress;
  if (args.slippageBps != null) p.slippageBps = args.slippageBps;
  if (args.maxHops != null) p.maxHops = args.maxHops;
  if (args.patchers != null) p.patchers = args.patchers;
  if (args.baselines != null) p.baselines = args.baselines;
  if (args.incognito) p.incognito = true;
  return gateway<QuoteResponse>("q", p, signal);
}

export function fetchUsd(chain: string, token: string, signal?: AbortSignal): Promise<UsdResponse> {
  return gateway<UsdResponse>("u", { chain, token }, signal);
}

export function fetchTokens(chainId: number | string, signal?: AbortSignal): Promise<TokensResponse> {
  return gateway<TokensResponse>("t", { chains: String(chainId) }, signal);
}

/**
 * Dest-chain balance (decimal wei string, or null) of `token` held by `address`
 * on `chain` (our chain id). Used to poll for bridged funds landing on the
 * destination chain after the source-chain tx has confirmed.
 */
export function fetchBalance(
  chain: string,
  token: string,
  address: string,
  signal?: AbortSignal,
): Promise<{ balance: string | null }> {
  return gateway<{ balance: string | null }>("b", { chain, token, address }, signal);
}

export type CctpStatus = "none" | "pending" | "complete";

type IrisMessage = {
  status?: string;
  attestation?: string;
  decodedMessage?: { destinationDomain?: number | string } | null;
};

/**
 * CCTP settlement status for a bridge source tx, via Circle's Iris service
 * (proxied through /api/g). Deterministic — keyed by the source tx hash:
 *   "complete" — burn attested, funds will mint / have minted on the dest chain
 *   "pending"  — CCTP message seen, attestation not yet signed
 *   "none"     — no CCTP message for this tx (route isn't CCTP → use balance poll)
 * When `destDomain` is known we pick the message headed to that domain (a tx can
 * emit several), else the first.
 */
export async function fetchCctpStatus(
  srcDomain: number,
  txHash: string,
  destDomain: number | null,
  signal?: AbortSignal,
): Promise<CctpStatus> {
  const res = await gateway<{ messages?: IrisMessage[] }>("s", { domain: srcDomain, hash: txHash }, signal);
  const msgs = Array.isArray(res.messages) ? res.messages : [];
  if (msgs.length === 0) return "none";
  const match =
    destDomain != null
      ? msgs.find((m) => Number(m.decodedMessage?.destinationDomain) === destDomain) ?? msgs[0]
      : msgs[0];
  return match?.status === "complete" ? "complete" : "pending";
}

/** Build the same-origin logo URL for a token (image bytes proxied server-side). */
export function tokenLogo(chainId: number, address: string): string {
  return `/api/logo?c=${chainId}&a=${address.toLowerCase()}`;
}
export function chainLogo(key: string): string {
  return `/api/logo?ch=${encodeURIComponent(key)}`;
}
