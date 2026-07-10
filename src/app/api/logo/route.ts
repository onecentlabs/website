import { tokenLogoUrl, chainLogoUrl } from "@r/lib/upstream";

export const runtime = "nodejs";

/**
 * Logo image proxy. The client requests /api/logo?c=<chainId>&a=<address> for a
 * token logo, or /api/logo?ch=<chainKey> for a chain logo. We resolve the real
 * external image URL server-side (from the registry, cached) and stream the
 * bytes back — so the external image host (debank, etc.) and the registry host
 * never appear in the browser's Network panel.
 */

// 1x1 transparent gif fallback.
const BLANK = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

function blank() {
  return new Response(new Uint8Array(BLANK), {
    headers: { "content-type": "image/gif", "cache-control": "public, max-age=3600" },
  });
}

/**
 * SSRF guard for the resolved logo URL. The target comes from the registry
 * (not raw user input), but we still refuse anything that isn't a plain https
 * host: blocks other schemes (file:/data:/http) and any literal IP in a
 * loopback / private / link-local range — including the cloud metadata IP
 * 169.254.169.254. (Residual DNS-rebinding risk remains; fetch can't expose the
 * resolved IP, so host-level blocking is the practical ceiling here.)
 */
function isSafeRemoteUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host.includes(":")) return false; // IPv6 literal — block outright
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 10 || a === 127) return false; // this-host / private / loopback
    if (a === 169 && b === 254) return false; // link-local + metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return false; // private
    if (a === 192 && b === 168) return false; // private
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  }
  return true;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chainId = url.searchParams.get("c");
  const addr = url.searchParams.get("a");
  const chainKey = url.searchParams.get("ch");

  let target: string | null = null;
  try {
    if (chainKey) target = await chainLogoUrl(chainKey);
    else if (chainId && addr) target = await tokenLogoUrl(chainId, addr);
  } catch {
    return blank();
  }
  if (!target || !isSafeRemoteUrl(target)) return blank();

  try {
    const upstream = await fetch(target, {
      headers: { accept: "image/*" },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok || !upstream.body) return blank();
    const ct = upstream.headers.get("content-type") || "image/png";
    return new Response(upstream.body, {
      headers: {
        "content-type": ct,
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return blank();
  }
}
