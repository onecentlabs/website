/**
 * Display helpers. Amounts crossing the wire to /quote are HUMAN decimal
 * strings (inputAmount); amounts coming back (amountOut, edge amounts) are
 * RAW integer strings in token base units — convert with the token decimals.
 */

/** Raw integer base-unit string → human decimal number. */
export function fromBaseUnits(raw: string | number | null | undefined, decimals: number): number {
  if (raw === null || raw === undefined || raw === "") return 0;
  const s = String(raw);
  // Avoid float precision loss for big ints by string math.
  const neg = s.startsWith("-");
  const digits = (neg ? s.slice(1) : s).replace(/\D/g, "");
  if (!digits) return 0;
  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, padded.length - decimals) || "0";
  const fracPart = decimals > 0 ? padded.slice(padded.length - decimals) : "";
  const value = Number(`${intPart}.${fracPart}`);
  return neg ? -value : value;
}

/** Human decimal string → raw base-unit bigint (for approve / tx value). */
export function toBaseUnits(amount: string, decimals: number): bigint {
  const trimmed = (amount || "0").trim();
  if (!trimmed || trimmed === ".") return 0n;
  const neg = trimmed.startsWith("-");
  const unsigned = neg ? trimmed.slice(1) : trimmed;
  const [intRaw, fracRaw = ""] = unsigned.split(".");
  const int = intRaw.replace(/\D/g, "") || "0";
  const frac = fracRaw.replace(/\D/g, "").slice(0, decimals).padEnd(decimals, "0");
  const combined = `${int}${frac}`.replace(/^0+(?=\d)/, "");
  const val = BigInt(combined || "0");
  return neg ? -val : val;
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

/** Format a token amount for display with adaptive precision. */
export function fmtAmount(n: number): string {
  if (!isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return compact.format(n);
  if (abs >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (abs >= 0.0001) return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  // Tiny values: subscript-zero notation (0.0₆41) instead of scientific (4.1e-7).
  const m = abs.toFixed(18).match(/^0\.(0*)([1-9]\d*)/);
  if (!m) return "0";
  const sub = String(m[1].length).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[+d]);
  const sig = m[2].slice(0, 3).replace(/0+$/, "");
  return `${n < 0 ? "-" : ""}0.0${sub}${sig}`;
}

/** Format a USD value. */
export function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  if (n === 0) return "$0.00";
  if (Math.abs(n) >= 1_000_000) return "$" + compact.format(n);
  if (Math.abs(n) < 0.01) return "<$0.01";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function shortAddr(addr: string | undefined): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function bpsToPct(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}
