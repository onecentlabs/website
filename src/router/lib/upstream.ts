import "server-only";

/**
 * The ONLY place upstream URLs + the API key live. Imported exclusively by
 * Node-runtime route handlers (src/app/api/**). `server-only` makes the build
 * fail if this is ever pulled into a client component, so the key + the real
 * endpoints (core /quote /price /usd, the token registry) can never leak into
 * the browser bundle or the Network panel — the browser only ever talks to
 * our own same-origin /api/* routes.
 */

const API_BASE = (process.env.ONECENT_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");
const API_KEY = process.env.ONECENT_API_KEY || "";
const REGISTRY_BASE = (process.env.REGISTRY_BASE || "https://tokens-registry.onrender.com").replace(/\/+$/, "");
// Circle's public CCTP attestation service. Overridable for the sandbox.
const IRIS_BASE = (process.env.CCTP_IRIS_BASE || "https://iris-api.circle.com").replace(/\/+$/, "");

export type UpstreamResult = { status: number; body: unknown };
export type UpstreamText = { status: number; text: string; json: boolean };

const CORE_TIMEOUT_MS = 60_000;

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Call the core API (key-gated). Returns the RAW response text — never parsed
 * here — so big integers (amountOut in wei, > 2^53) keep full precision; the
 * route handler quotes them before they reach JSON.parse. A timeout guards
 * against the upstream holding the connection open (observed under load).
 */
export async function coreText(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
  signal?: AbortSignal,
): Promise<UpstreamText> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), CORE_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) ac.abort();
    else signal.addEventListener("abort", () => ac.abort(), { once: true });
  }
  try {
    const res = await fetch(`${API_BASE}${path}${qs(params)}`, {
      method: "GET",
      headers: { "x-api-key": API_KEY, accept: "application/json" },
      cache: "no-store",
      signal: ac.signal,
    });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    return { status: res.status, text, json: ct.includes("json") };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Query Circle's Iris CCTP attestation service for the messages emitted by
 * `txHash` on source domain `domain`. Keyed by the source tx hash — the
 * deterministic way to know a CCTP bridge settled (status flips
 * pending_confirmations → complete). A 404 means "no message indexed yet"; we
 * normalize it to an empty list so the caller can tell "not seen" apart from a
 * real error. Caller must pre-validate `domain`/`txHash` (this interpolates
 * them into the URL).
 */
export async function cctpMessages(domain: number, txHash: string): Promise<UpstreamResult> {
  let res: Response;
  try {
    res = await fetch(`${IRIS_BASE}/v2/messages/${domain}?transactionHash=${txHash}`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { status: 502, body: { error: "attestation service unavailable" } };
  }
  if (res.status === 404) return { status: 200, body: { messages: [] } };
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = { messages: [] };
  }
  return { status: res.status, body };
}

/** Call the public token registry (no key). */
export async function registry(
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
  revalidate = 300,
): Promise<UpstreamResult> {
  const res = await fetch(`${REGISTRY_BASE}${path}${qs(params)}`, {
    method: "GET",
    headers: { accept: "application/json" },
    next: { revalidate },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = { error: "registry returned non-JSON" };
  }
  return { status: res.status, body };
}

// ── Registry logo resolution cache ───────────────────────────────────
// Token list per chain is fetched once and cached so /api/logo can resolve a
// (chainId,address) → external logoURI server-side. The external URL never
// reaches the client; the browser only requests our /api/logo.

type RegToken = { address: string; symbol: string; name: string; decimals: number; logoURI?: string; tags?: string[] };
type CacheEntry = { at: number; byAddr: Map<string, RegToken> };

/** Unwrap the registry's `{ tokens: { <chainId>: [...] } }` envelope. */
function unwrapTokens(body: unknown): Record<string, RegToken[]> {
  const inner =
    body && typeof body === "object" && "tokens" in body
      ? (body as { tokens: unknown }).tokens
      : body;
  return (inner && typeof inner === "object" ? (inner as Record<string, RegToken[]>) : {}) ?? {};
}

const TOKEN_TTL = 5 * 60 * 1000;
const tokenCache = new Map<string, CacheEntry>();
const chainLogoCache: { at: number; byKey: Map<string, string> } = { at: 0, byKey: new Map() };

async function loadChainTokens(chainId: string): Promise<Map<string, RegToken>> {
  const hit = tokenCache.get(chainId);
  if (hit && Date.now() - hit.at < TOKEN_TTL) return hit.byAddr;
  const { body } = await registry("/tokens", { chains: chainId });
  const byAddr = new Map<string, RegToken>();
  const group = unwrapTokens(body)[chainId];
  if (Array.isArray(group)) {
    for (const t of group) {
      if (t?.address) byAddr.set(t.address.toLowerCase(), t);
    }
  }
  tokenCache.set(chainId, { at: Date.now(), byAddr });
  return byAddr;
}

export async function tokenLogoUrl(chainId: string, address: string): Promise<string | null> {
  const byAddr = await loadChainTokens(chainId);
  return byAddr.get(address.toLowerCase())?.logoURI ?? null;
}

export async function chainLogoUrl(key: string): Promise<string | null> {
  if (Date.now() - chainLogoCache.at >= TOKEN_TTL || chainLogoCache.byKey.size === 0) {
    const { body } = await registry("/chains");
    const list = Array.isArray(body) ? (body as Record<string, unknown>[]) : [];
    chainLogoCache.byKey.clear();
    for (const c of list) {
      const logo = c.logoURI as string | undefined;
      if (!logo) continue;
      for (const k of [c.key, c.id, c.name]) {
        if (k !== undefined && k !== null) chainLogoCache.byKey.set(String(k).toLowerCase(), logo);
      }
    }
    chainLogoCache.at = Date.now();
  }
  return chainLogoCache.byKey.get(key.toLowerCase()) ?? null;
}

/** Unwrap `{ tokens: {...} }` and strip logoURI from every token so external
 *  image hosts stay hidden — the client renders logos via our own
 *  /api/logo?c=&a= route. Returns the flat `{ <chainId>: Token[] }` map. */
export function stripLogos(body: unknown): Record<string, unknown[]> {
  const inner = unwrapTokens(body);
  const out: Record<string, unknown[]> = {};
  for (const [chainId, list] of Object.entries(inner)) {
    if (Array.isArray(list)) {
      out[chainId] = list.map((t) => {
        const { logoURI, ...rest } = t as RegToken & Record<string, unknown>;
        void logoURI;
        return rest;
      });
    }
  }
  return out;
}
