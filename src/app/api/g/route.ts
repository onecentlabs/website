import { NextResponse } from "next/server";
import { coreText, registry, stripLogos } from "@r/lib/upstream";
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
  "inputToken", "outputToken", "inputAmount", "userAddress",
  "receiverAddress", "simulationAddress", "slippageBps", "maxHops",
  "simulation", "patchers", "baselines", "rawBlockchainId", "cid",
  "tokenData", "incognito",
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

/**
 * Quote big integers (amountOut / minAmountOut / netAmountOut / simulatedAmountOut
 * come back as bare JSON numbers in wei, which lose precision past 2^53 once
 * JSON.parse runs). We wrap them in quotes at the text level so the client parses
 * exact strings. Path edge amounts are already quoted upstream, so the
 * lookbehind-free regex (digits immediately after the colon, no quote) never
 * touches them.
 */
function quoteBigInts(text: string): string {
  return text.replace(
    /"(amountOut|minAmountOut|netAmountOut|simulatedAmountOut)":\s*(-?\d+)(?=\s*[,}])/g,
    '"$1":"$2"',
  );
}

async function relayCore(
  path: string,
  params: Record<string, string | number | boolean>,
  signal: AbortSignal,
  transform?: (t: string) => string,
): Promise<Response> {
  const { status, text, json } = await coreText(path, params, signal);
  if (status >= 200 && status < 300 && (json || looksJson(text))) {
    return new Response(transform ? transform(text) : text, { status, headers: NO_STORE });
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
        return await relayCore("/quote", pick(p, QUOTE_KEYS), req.signal, quoteBigInts);
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
