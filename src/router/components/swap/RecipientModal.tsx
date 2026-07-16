"use client";

import { useEffect, useRef, useState } from "react";
import { shortAddr } from "@r/lib/format";
import { type ChainKind, normalizeRecipient } from "@r/lib/address";
import {
  type SavedRecipient,
  getRecentRecipients,
  getBookmarks,
  addBookmark,
  removeBookmark,
  isBookmarked,
} from "@r/lib/recipients";

/** Deterministic gradient avatar so every address is instantly recognisable. */
function Avatar({ address, size = 30 }: { address: string; size?: number }) {
  const a = address.toLowerCase().replace(/^0x/, "").padEnd(12, "0");
  const from = `#${a.slice(0, 6)}`;
  const to = `#${a.slice(6, 12)}`;
  return (
    <span
      aria-hidden
      className="shrink-0 rounded-full ring-1 ring-white/10"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})` }}
    />
  );
}

/**
 * Recipient picker. Send swap output to your own wallet ("Self") or any address,
 * with a personal address book: recent (auto) + bookmarked (labelled) wallets.
 */
export function RecipientModal({
  selfAddress,
  current,
  kind = "evm",
  onSelect,
  onClose,
}: {
  selfAddress?: string;
  current: string | null; // null = self
  kind?: ChainKind; // address family of the output chain (evm today)
  onSelect: (address: string | null) => void;
  onClose: () => void;
}) {
  const [recent, setRecent] = useState<SavedRecipient[]>([]);
  const [books, setBooks] = useState<SavedRecipient[]>([]);
  const [addr, setAddr] = useState("");
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // localStorage is client-only — load once on mount, then autofocus the input.
  useEffect(() => {
    setRecent(getRecentRecipients());
    setBooks(getBookmarks());
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trimmed = addr.trim();
  // Checksummed canonical form (EVM: EIP-55), or null when invalid for the chain.
  const normalized = normalizeRecipient(trimmed, kind);
  const valid = normalized !== null;
  const isSelfInput =
    valid && !!selfAddress && normalized!.toLowerCase() === selfAddress.toLowerCase();
  const inputBookmarked = valid && books.some((b) => b.address.toLowerCase() === normalized!.toLowerCase());

  // Always commit the checksummed form so the address book + quote agree.
  function use(a: string) {
    onSelect(a);
  }

  // Star toggles a bookmark for the address currently typed (keeps the label).
  function toggleInputBookmark() {
    if (!normalized) return;
    setBooks(inputBookmarked ? removeBookmark(normalized) : addBookmark(normalized, label));
  }

  function toggleBookmark(a: string, existingLabel?: string) {
    setBooks(isBookmarked(a) ? removeBookmark(a) : addBookmark(a, existingLabel));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div
        className="panel w-full max-w-md max-h-[85dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b hairline">
          <span className="text-[15px] font-semibold tracking-tight">Send to</span>
          <button className="text-muted hover:text-ink transition-colors" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto thin-scroll">
          {/* Self — send back to your own wallet */}
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-[var(--r-sm)] border transition-colors text-left ${
              current === null ? "border-accent/60 bg-accent/10" : "border-line-2 bg-elev hover:border-ink/40"
            }`}
          >
            {selfAddress ? <Avatar address={selfAddress} /> : <span className="w-[30px] h-[30px] rounded-full bg-line-2 shrink-0" />}
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">Self</span>
              <span className="block addr text-[12px] text-muted truncate">
                {selfAddress ? shortAddr(selfAddress) : "Connect a wallet"}
              </span>
            </span>
            {current === null && <span className="ml-auto text-accent text-xs font-semibold">Selected</span>}
          </button>

          {/* Enter a new address — the star (left) bookmarks it, then Use address */}
          <div className="space-y-2">
            <span className="field-label">Send to a different address</span>
            <div
              className={`flex items-center rounded-[var(--r-sm)] bg-bg-3 border transition-colors ${
                trimmed && !valid ? "border-danger" : valid ? "border-accent/50" : "border-line focus-within:border-accent/50"
              }`}
            >
              <button
                type="button"
                disabled={!valid}
                onClick={toggleInputBookmark}
                title={inputBookmarked ? "Remove bookmark" : "Bookmark this address"}
                aria-label={inputBookmarked ? "Remove bookmark" : "Bookmark this address"}
                className={`shrink-0 pl-3 pr-1.5 py-2.5 transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                  inputBookmarked ? "text-accent" : "text-faint hover:text-ink"
                }`}
              >
                <StarIcon filled={inputBookmarked} />
              </button>
              <input
                ref={inputRef}
                spellCheck={false}
                autoComplete="off"
                placeholder="0x recipient address"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && valid && use(normalized!)}
                className="bare addr w-full text-sm pr-3 py-2.5"
              />
            </div>
            {trimmed && !valid && <div className="text-[12px] text-danger px-1">Enter a valid 0x address.</div>}
            <input
              spellCheck={false}
              autoComplete="off"
              placeholder="Label (optional) — e.g. Cold wallet"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={24}
              onKeyDown={(e) => e.key === "Enter" && valid && use(normalized!)}
              className="bare w-full text-sm px-3 py-2.5 rounded-[var(--r-sm)] bg-bg-3 border border-line focus:border-accent/50 transition-colors"
            />
            <button
              type="button"
              disabled={!valid || isSelfInput}
              onClick={() => use(normalized!)}
              className="w-full py-2.5 text-[13px] font-semibold rounded-[var(--r-sm)] border border-line-2 bg-elev text-ink hover:border-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Use address
            </button>
            {isSelfInput && <div className="text-[12px] text-muted px-1">That&apos;s your own wallet — pick Self above.</div>}
          </div>

          {/* Bookmarked */}
          {books.length > 0 && (
            <Section title="Bookmarked">
              {books.map((r) => (
                <Row
                  key={r.address}
                  address={r.address}
                  label={r.label}
                  selected={!!current && current.toLowerCase() === r.address.toLowerCase()}
                  bookmarked
                  onUse={() => use(r.address)}
                  onStar={() => toggleBookmark(r.address, r.label)}
                />
              ))}
            </Section>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <Section title="Recent">
              {recent.map((r) => (
                <Row
                  key={r.address}
                  address={r.address}
                  label={books.find((b) => b.address.toLowerCase() === r.address.toLowerCase())?.label}
                  selected={!!current && current.toLowerCase() === r.address.toLowerCase()}
                  bookmarked={isBookmarked(r.address)}
                  onUse={() => use(r.address)}
                  onStar={() => toggleBookmark(r.address)}
                />
              ))}
            </Section>
          )}

          {books.length === 0 && recent.length === 0 && (
            <p className="text-[12px] text-muted text-center py-2">
              No saved wallets yet. Paste an address above — bookmark it with a label to save it here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="field-label">{title}</span>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  address,
  label,
  selected,
  bookmarked,
  onUse,
  onStar,
}: {
  address: string;
  label?: string;
  selected: boolean;
  bookmarked: boolean;
  onUse: () => void;
  onStar: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-3 p-2.5 rounded-[var(--r-sm)] border transition-colors ${
        selected ? "border-accent/60 bg-accent/10" : "border-transparent bg-bg-3 hover:bg-elev"
      }`}
    >
      <button type="button" onClick={onUse} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <Avatar address={address} />
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-ink truncate">{label}</span>}
          <span className={`block addr text-[12px] truncate ${label ? "text-muted" : "text-ink"}`}>{shortAddr(address)}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onStar}
        title={bookmarked ? "Remove bookmark" : "Bookmark"}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        className={`shrink-0 p-1.5 rounded-md transition-colors ${
          bookmarked ? "text-accent hover:text-danger" : "text-faint hover:text-ink"
        }`}
      >
        <StarIcon filled={bookmarked} />
      </button>
    </div>
  );
}

function StarIcon({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
