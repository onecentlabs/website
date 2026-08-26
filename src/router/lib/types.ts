export type Token = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  tags?: string[];
};

/** /tokens response: { "<chainId>": Token[] } (logoURI stripped by proxy). */
export type TokensResponse = Record<string, Token[]>;

/**
 * One side (input/output) of a quote, all raw base units as strings. The side
 * the caller pinned carries `specified`; the solved side carries `quoted` /
 * `net` plus a bound — `minimum` on a sell, `maximum` on a buy. `simulated` is
 * only populated when simulation=true (and never for bridges).
 */
export type QuoteSide = {
  specified?: string | null;
  quoted?: string | null;
  net?: string | null;
  minimum?: string | null;
  maximum?: string | null;
  simulated?: string | null;
};

export type QuoteResponse = {
  qid: string;
  orderType?: "sell" | "buy";
  routerAddress: string;
  calldata: string;
  computationUnits?: number | string | null; // gas units; null unless simulation=true
  amounts?: { input: QuoteSide; output: QuoteSide };
  error?: string;
};

/** Output to display: `net` is what the user actually receives (routed amount
 *  less fees). Falls back to the simulated/quoted figures when core omits it
 *  (bridges report net: null). */
export function quoteOut(q: QuoteResponse): string | null {
  const o = q.amounts?.output;
  return o?.net ?? o?.simulated ?? o?.quoted ?? null;
}

/** Guaranteed minimum output. Bridges report "0" — treat that as "no bound". */
export function quoteMinOut(q: QuoteResponse): string | null {
  const m = q.amounts?.output?.minimum;
  return m != null && m !== "0" ? m : null;
}

export type UsdResponse = {
  chain: string;
  token: string;
  foreign_token: string;
  price: number | null;
  confidence: number | null;
  status: string;
  source?: string;
};

export type QuoteSettings = {
  slippageBps: number | null; // null → backend default (300)
  amountSlider?: boolean; // show the balance % slider in the From field (off by default)
};
