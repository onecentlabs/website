import type { NextConfig } from "next";

/**
 * Baseline HTTP security headers applied to every response. Not a CSP — a full
 * Content-Security-Policy needs an allowlist for the wallet SDKs (Sequence,
 * WalletConnect relay, MetaMask, RPC + image hosts) and careful testing, so it's
 * tracked separately. These headers are safe defaults with no functional impact.
 */
const securityHeaders = [
  // Clickjacking: don't allow the site to be framed by other origins.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Belt-and-suspenders framing control for modern browsers.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  // Stop MIME sniffing (matters for the /api/logo image proxy especially).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Leak as little URL info as possible to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for a year (ignored over plain http, so safe in dev).
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Drop powerful features the dapp never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
