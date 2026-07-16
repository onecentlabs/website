"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTokens } from "@r/hooks/useRegistry";
import { useChainBalances } from "@r/hooks/useBalances";
import type { Token } from "@r/lib/types";
import { SUPPORTED_CHAINS, isNativeAddress, type SupportedChain } from "@r/lib/chains";
import { chainLogo } from "@r/lib/api";
import { fromBaseUnits, fmtAmount, fmtUsd } from "@r/lib/format";
import { getRecentTokens, addRecentToken } from "@r/lib/recentTokens";
import { TokenLogo } from "./TokenLogo";
import { CopyAddress } from "./CopyAddress";

const LIST_CAP = 300;
const REVEAL_INITIAL = 30; // paint a cheap first screen, grow as the user scrolls
const REVEAL_STEP = 30;

/**
 * Unified asset picker. Chains run across the top; the token list/search below
 * reflects the active chain. Tokens the user holds float to the top (sorted by
 * USD value), then their recent/priority picks, then the rest. Picking commits
 * both the (possibly new) chain and the token at once.
 */
export function AssetModal({
  chain,
  chainEditable,
  excludeAddress,
  excludeChainId,
  onPick,
  onClose,
}: {
  chain: SupportedChain;
  chainEditable: boolean;
  excludeAddress?: string;
  excludeChainId?: number;
  onPick: (chain: SupportedChain, token: Token) => void;
  onClose: () => void;
}) {
  const [active, setActive] = useState<SupportedChain>(chain);
  const [query, setQuery] = useState("");
  const [recentState, setRecentState] = useState(() => ({ id: active.chainId, list: getRecentTokens(active.chainId) }));
  const { data: tokens = [], isLoading } = useTokens(active.chainId);
  const { balanceOf, hasAddress } = useChainBalances(active.chainId);

  // Reload the personal shortlist when the active chain changes — a render-time
  // state adjustment, no effect required.
  if (recentState.id !== active.chainId) {
    setRecentState({ id: active.chainId, list: getRecentTokens(active.chainId) });
  }

  const exAddr = excludeChainId === active.chainId ? excludeAddress?.toLowerCase() : undefined;
  const recentRank = useMemo(() => {
    const m = new Map<string, number>();
    recentState.list.forEach((t, i) => m.set(t.address.toLowerCase(), i));
    return m;
  }, [recentState.list]);

  function pick(token: Token) {
    setRecentState({ id: active.chainId, list: addRecentToken(active.chainId, token) });
    onPick(active, token);
  }

  // held (by USD value) → recent/priority → rest. Balances re-read per render
  // (cheap Map lookup) so the ordering tracks the latest indexer data.
  const { list, heldCount } = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = tokens;
    if (exAddr) base = base.filter((t) => t.address.toLowerCase() !== exAddr);
    if (q) {
      base = base.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.address.toLowerCase() === q,
      );
    }

    const held: { t: Token; usd: number; raw: bigint }[] = [];
    const priority: Token[] = [];
    const rest: Token[] = [];
    for (const t of base) {
      const b = balanceOf(t.address);
      if (b && b.raw > 0n) held.push({ t, usd: b.usd, raw: b.raw });
      else if (recentRank.has(t.address.toLowerCase())) priority.push(t);
      else rest.push(t);
    }
    held.sort((a, b) => b.usd - a.usd || (a.raw < b.raw ? 1 : a.raw > b.raw ? -1 : 0));
    priority.sort(
      (a, b) => (recentRank.get(a.address.toLowerCase()) ?? 0) - (recentRank.get(b.address.toLowerCase()) ?? 0),
    );

    const ordered = [...held.map((h) => h.t), ...priority, ...rest].slice(0, LIST_CAP);
    return { list: ordered, heldCount: held.length };
  }, [tokens, query, exAddr, recentRank, balanceOf]);

  // Progressive reveal: render REVEAL_INITIAL rows, then grow toward the full
  // list as a bottom sentinel scrolls into view. Resets when the chain/search
  // changes (render-time adjustment, no effect).
  const revealKey = `${active.chainId}|${query.trim()}`;
  const [reveal, setReveal] = useState({ key: revealKey, n: REVEAL_INITIAL });
  if (reveal.key !== revealKey) setReveal({ key: revealKey, n: REVEAL_INITIAL });

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || typeof IntersectionObserver === "undefined") return;
    const len = list.length;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setReveal((r) => (r.n >= len ? r : { ...r, n: Math.min(len, r.n + REVEAL_STEP) }));
      },
      { root, rootMargin: "240px" },
    );
    io.observe(target);
    return () => io.disconnect();
    // Re-attach once the list first populates (sentinel mounts) and whenever the
    // reset drops us back to the initial window.
  }, [list.length, reveal.key]);

  const shown = list.slice(0, reveal.n);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div className="panel w-full max-w-md max-h-[78vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b hairline">
          <span className="text-[15px] font-semibold tracking-tight">Select a token</span>
          <button className="text-muted hover:text-ink transition-colors" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* chains row — only when switching is allowed (hidden when token-locked) */}
        {chainEditable && (
          <div className="px-4 pt-4">
            <span className="field-label block mb-2">Network</span>
            <div className="flex gap-2 overflow-x-auto thin-scroll pb-1">
              {SUPPORTED_CHAINS.map((c) => {
                const isActive = c.id === active.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActive(c)}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 border shrink-0 transition-colors ${
                      isActive
                        ? "border-accent text-ink bg-accent/10"
                        : "border-line text-muted hover:border-line-2 hover:text-ink"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={chainLogo(c.id)} alt="" width={18} height={18} className="rounded-full" onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
                    <span className="text-[13px]">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* search */}
        <div className="px-4 pt-4 pb-2">
          <div className="panel-inset flex items-center gap-2 px-3 py-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" className="text-muted shrink-0"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or paste address"
              className="bare w-full text-sm"
            />
          </div>
        </div>

        {/* held / shown count — subtle, only when connected */}
        {hasAddress && (
          <div className="flex items-center justify-between px-5 pb-2">
            <span className="field-label">{heldCount > 0 ? "Your tokens on top" : "No balances here"}</span>
            <span className="field-label">{heldCount} / {list.length}</span>
          </div>
        )}

        {/* token list */}
        <div ref={scrollRef} className="overflow-y-auto thin-scroll flex-1 border-t hairline">
          {isLoading && list.length === 0 && <div className="px-5 py-8 text-sm text-muted">Loading tokens…</div>}
          {!isLoading && list.length === 0 && <div className="px-5 py-8 text-sm text-muted">No tokens found.</div>}
          {shown.map((t) => {
            const bal = balanceOf(t.address);
            return (
              <button
                key={t.address}
                className="group w-full flex items-center gap-3 px-5 py-3 hover:bg-bg-3 transition-colors text-left"
                onClick={() => pick(t)}
              >
                <TokenLogo chainId={active.chainId} address={t.address} symbol={t.symbol} size={32} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium truncate">{t.symbol}</span>
                  {isNativeAddress(t.address) ? (
                    <span className="block text-xs text-muted truncate">{t.name}</span>
                  ) : (
                    <>
                      <span className="block text-xs text-muted truncate group-hover:hidden group-focus-within:hidden">{t.name}</span>
                      <span className="hidden group-hover:block group-focus-within:block">
                        <CopyAddress address={t.address} />
                      </span>
                    </>
                  )}
                </span>
                {bal && (
                  <span className="text-right shrink-0">
                    <span className="block text-[13px] kpi-num">{fmtAmount(fromBaseUnits(String(bal.raw), t.decimals))}</span>
                    {bal.usd > 0 && <span className="block text-[11px] text-muted kpi-num">{fmtUsd(bal.usd)}</span>}
                  </span>
                )}
              </button>
            );
          })}
          {reveal.n < list.length && <div ref={sentinelRef} className="h-10" aria-hidden />}
        </div>
      </div>
    </div>
  );
}
