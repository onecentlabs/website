import { NextResponse } from "next/server";
import { coreText, registry, stripLogos, cctpMessages } from "@r/lib/upstream";
import { rpcBalance } from "@r/lib/rpc";

// Node runtime (needs server env + fetch with secret header). Never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Single opaque gateway. The browser POSTs { a, p } here and only ever sees
 * THIS same-origin URL in its Network panel. `a` is a short action code that
 * maps server-side to a real upstream endpoint; `p` carries params. The
 * upstream host + x-api-key are injected here, server-side, and never shipped
 * to the client.
 */

const QUOTE_KEYS = [
  "blockchainId", "destinationBlockchainId", "rawDestinationBlockchainId",
  "inputToken", "outputToken", "rawInputAmount", "userAddress",
  "receiverAddress", "slippageBps", "maxHops",
  "simulation", "optimizer", "patchers", "baselines", "rawBlockchainId", "cid",
  "incognito",
] as const;

const PRICE_KEYS = ["chain", "token", "foreign_token", "max_hops"] as const;
const USD_KEYS = ["chain", "token", "max_hops"] as const;

function pick(p: Record<string, unknown>, keys: readonly string[]) {
  const out: Record<string, string | number | boolean> = {};
  for (const k of keys) {
    const v = p[k];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

const NO_STORE = { "content-type": "application/json", "cache-control": "no-store" };

function looksJson(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith("{") || t.startsWith("[");
}

function upstreamError(status: number): string {
  if (status === 502 || status === 503 || status === 504) return "Router temporarily unavailable, please retry";
  if (status === 401 || status === 403) return "API authorization failed";
  return "Upstream request failed";
}

async function relayCore(
  path: string,
  params: Record<string, string | number | boolean>,
  signal: AbortSignal,
): Promise<Response> {
  const { status, text, json } = await coreText(path, params, signal);
  if (status >= 200 && status < 300 && (json || looksJson(text))) {
    return new Response(text, { status, headers: NO_STORE });
  }
  // Surface upstream JSON error verbatim if it gave us one; else a clean message.
  if (looksJson(text)) return new Response(text, { status, headers: NO_STORE });
  return NextResponse.json({ error: upstreamError(status) }, { status: status || 502, headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let payload: { a?: string; p?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const action = payload?.a;
  const p = (payload?.p ?? {}) as Record<string, unknown>;

  try {
    switch (action) {
      case "q":
        return await relayCore("/quote", pick(p, QUOTE_KEYS), req.signal);
      case "p":
        return await relayCore("/price", pick(p, PRICE_KEYS), req.signal);
      case "u":
        return await relayCore("/usd", pick(p, USD_KEYS), req.signal);
      case "t": {
        const chains = typeof p.chains === "string" ? p.chains : undefined;
        const { status, body } = await registry("/tokens", chains ? { chains } : {});
        return NextResponse.json(stripLogos(body), { status, headers: { "cache-control": "no-store" } });
      }
      case "c": {
        const { status, body } = await registry("/chains");
        return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
      }
      case "b": {
        // Dest-chain balance for bridge settlement tracking (public RPCs).
        const chain = typeof p.chain === "string" ? p.chain : "";
        const token = typeof p.token === "string" ? p.token : "";
        const addr = typeof p.address === "string" ? p.address : "";
        if (!chain || !token || !addr) return NextResponse.json({ error: "bad request" }, { status: 400 });
        const balance = await rpcBalance(chain, token, addr);
        return NextResponse.json({ balance }, { headers: { "cache-control": "no-store" } });
      }
      case "s": {
        // CCTP attestation status for a bridge source tx (Circle Iris API).
        // Validate before interpolating into the upstream URL.
        const domain = typeof p.domain === "number" ? p.domain : Number(p.domain);
        const hash = typeof p.hash === "string" ? p.hash : "";
        if (!Number.isInteger(domain) || domain < 0 || domain > 99 || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
          return NextResponse.json({ error: "bad request" }, { status: 400 });
        }
        const { status, body } = await cctpMessages(domain, hash);
        return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
      }
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out, please retry" }, { status: 504 });
    }
    return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
  }
}
