import type { Token } from "./types";

/**
 * Per-chain "recently used" tokens, persisted in localStorage so each user gets
 * a personal shortlist surfaced at the top of the asset picker.
 */
const KEY = "oc_recent_tokens_v1";
const MAX = 6;

type Store = Record<string, Token[]>; // chainId -> tokens (most-recent first)

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function getRecentTokens(chainId: number): Token[] {
  return read()[String(chainId)] ?? [];
}

export function addRecentToken(chainId: number, token: Token): Token[] {
  const store = read();
  const key = String(chainId);
  const addr = token.address.toLowerCase();
  const next = [token, ...(store[key] ?? []).filter((t) => t.address.toLowerCase() !== addr)].slice(0, MAX);
  store[key] = next;
  write(store);
  return next;
}
