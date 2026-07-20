import "server-only";

/**
 * Public RPC access for dest-chain settlement tracking. A bridge tx confirms on
 * the SOURCE chain, but the user's funds land later on the DEST chain — so after
 * the source tx we poll the recipient's balance here until it rises.
 *
 * PUBLIC_RPC_URLS is a server env of the shape:
 *   {"arbitrum":["https://…","https://…"],"base":["https://…"]}
 * keyed by our chain id (SUPPORTED_CHAINS.id). The list is a fallback chain —
 * we try each URL until one answers, so a single flaky endpoint doesn't stall
 * tracking. Kept server-side so the URL list never bloats the client bundle.
 */

type RpcMap = Record<string, string[]>;

let cached: RpcMap | null = null;
function rpcMap(): RpcMap {
  if (cached) return cached;
  try {
    cached = JSON.parse(process.env.PUBLIC_RPC_URLS || "{}") as RpcMap;
  } catch {
    cached = {};
  }
  return cached;
}

// EIP-7528 native sentinel + zero address both mean "native coin" — read via
// eth_getBalance rather than an erc20 balanceOf call.
const NATIVE = new Set(["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "0x0000000000000000000000000000000000000000"]);

const RPC_TIMEOUT_MS = 8_000;

async function rpcCall(urls: string[], method: string, params: unknown[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        cache: "no-store",
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { result?: unknown; error?: unknown };
      if (json?.error || typeof json?.result !== "string") continue;
      return json.result;
    } catch {
      continue; // network error / timeout / bad JSON — fall through to next URL
    }
  }
  return null;
}

/**
 * Balance of `token` held by `address` on `chain` (our chain id), as a decimal
 * wei string. Returns null when no RPC answers or the chain isn't configured.
 */
export async function rpcBalance(chain: string, token: string, address: string): Promise<string | null> {
  const urls = rpcMap()[chain];
  if (!urls || urls.length === 0) return null;

  let hex: string | null;
  if (NATIVE.has(token.toLowerCase())) {
    hex = await rpcCall(urls, "eth_getBalance", [address, "latest"]);
  } else {
    // balanceOf(address) — selector 0x70a08231 + 32-byte left-padded address.
    const data = "0x70a08231" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
    hex = await rpcCall(urls, "eth_call", [{ to: token, data }, "latest"]);
  }
  if (!hex || hex === "0x") return null;
  try {
    return BigInt(hex).toString();
  } catch {
    return null;
  }
}
