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

export type PathEdge = {
  tokenIn: string;
  tokenOut: string;
  protocolId: string;
  poolAddress: string;
  amountIn: string; // raw base units
  amountOut: string; // raw base units
  hop: number;
};

export type QuoteResponse = {
  qid: string;
  amountOut: string; // raw base units of output token
  minAmountOut?: string | null; // raw base units — guaranteed minimum (slippage-adjusted) from core
  netAmountOut?: string | null; // raw base units — output net of fees, when core provides it
  routerAddress: string;
  calldata: string;
  simulatedAmountOut?: string | null;
  computationUnits?: number | string | null;
  /** Detailed route. Absent on older core builds — UI synthesizes a single leg. */
  path?: PathEdge[];
  error?: string;
};

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
