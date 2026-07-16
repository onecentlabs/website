import { isValidRecipient } from "./address";

/**
 * Recipient address book — recent (auto-tracked on use) + bookmarked (saved by
 * hand, with an optional short label). Persisted in localStorage so the list is
 * personal to the browser. Addresses are compared case-insensitively.
 */
export type SavedRecipient = { address: string; label?: string };

const RECENT_KEY = "oc_recent_recipients_v1";
const BOOK_KEY = "oc_bookmarked_recipients_v1";
const MAX_RECENT = 8;

function read(key: string): SavedRecipient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as SavedRecipient[]) : [];
    return Array.isArray(parsed) ? parsed.filter((r) => r && typeof r.address === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, list: SavedRecipient[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* quota / private mode — ignore */
  }
}

const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** EVM checksum-aware validity (kept for callers importing from here). */
export function isValidAddress(addr: string): boolean {
  return isValidRecipient(addr, "evm");
}

/* ---------- recent ---------- */
export function getRecentRecipients(): SavedRecipient[] {
  return read(RECENT_KEY);
}

export function addRecentRecipient(address: string): SavedRecipient[] {
  const next = [{ address }, ...read(RECENT_KEY).filter((r) => !eq(r.address, address))].slice(0, MAX_RECENT);
  write(RECENT_KEY, next);
  return next;
}

/* ---------- bookmarks ---------- */
export function getBookmarks(): SavedRecipient[] {
  return read(BOOK_KEY);
}

/** Add or update a bookmark (label optional; empty label clears it). */
export function addBookmark(address: string, label?: string): SavedRecipient[] {
  const clean = label?.trim() || undefined;
  const next = [{ address, label: clean }, ...read(BOOK_KEY).filter((r) => !eq(r.address, address))];
  write(BOOK_KEY, next);
  return next;
}

export function removeBookmark(address: string): SavedRecipient[] {
  const next = read(BOOK_KEY).filter((r) => !eq(r.address, address));
  write(BOOK_KEY, next);
  return next;
}

export function isBookmarked(address: string): boolean {
  return read(BOOK_KEY).some((r) => eq(r.address, address));
}

/** Label for a bookmarked address, if any — used to show a friendly name. */
export function getRecipientLabel(address: string): string | undefined {
  return read(BOOK_KEY).find((r) => eq(r.address, address))?.label;
}
