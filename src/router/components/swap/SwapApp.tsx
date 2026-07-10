"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { ChainSelect } from "./ChainSelect";
import { TokenSelect } from "./TokenSelect";
import { AssetModal } from "./AssetModal";
import { SettingsPanel } from "./SettingsPanel";
import { ExecuteButton } from "./ExecuteButton";
import { CopyAddress } from "./CopyAddress";
import { useTokens } from "@r/hooks/useRegistry";
import { useQuoteCycle } from "@r/hooks/useQuoteCycle";
import { fetchUsd, type QuoteArgs } from "@r/lib/api";
import type { QuoteSettings, Token } from "@r/lib/types";
import { SUPPORTED_CHAINS, DEFAULT_MAX_HOPS, isNativeAddress, nativeGasBufferWei, type SupportedChain } from "@r/lib/chains";
import { fromBaseUnits, toBaseUnits, fmtAmount, fmtUsd, shortAddr } from "@r/lib/format";

const PREVIEW_ADDRESS = "0x000000000000000000000000000000000000dEaD";
const ARBITRUM = SUPPORTED_CHAINS.find((c) => c.id === "arbitrum")!;

const SETTINGS_KEY = "ocr.settings";
const DEFAULT_SETTINGS: QuoteSettings = {
  slippageBps: null,
  patchers: true,
  baselines: true,
  maxHops: DEFAULT_MAX_HOPS,
};

function pickToken(list: Token[], symbols: string[], fallbackIndex: number): Token | null {
  for (const s of symbols) {
    const m = list.find((t) => t.symbol.toUpperCase() === s);
    if (m) return m;
  }
  return list[fallbackIndex] ?? list[0] ?? null;
}

function useUsd(chainName: string, token: Token | null) {
  return useQuery({
    queryKey: ["usd", chainName, token?.address],
    enabled: !!token,
    staleTime: 600_000,
    refetchInterval: 600_000, // USD prices move slowly — poll every 10 min
    queryFn: async () => {
      const r = await fetchUsd(chainName, token!.address);
      return typeof r.price === "number" ? r.price : null;
    },
  });
}

export function SwapApp() {
  const { address } = useAccount();

  const [chainIn, setChainIn] = useState(ARBITRUM);
  const [chainOut, setChainOut] = useState(ARBITRUM);
  // null = "use the auto-picked default for this chain"; set = explicit user pick.
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  // Debounced amount drives the (expensive) quote — gives the user a moment to
  // finish typing before we fetch. The input + percentage buttons stay instant.
  const [debouncedAmount, setDebouncedAmount] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedAmount(amount), 350);
    return () => clearTimeout(id);
  }, [amount]);

  const [settings, setSettings] = useState<QuoteSettings>(DEFAULT_SETTINGS);
  // Restore saved settings after mount (post-hydration to avoid SSR mismatch),
  // then persist on every change.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings((s) => ({ ...s, ...(JSON.parse(raw) as Partial<QuoteSettings>) }));
    } catch {
      /* ignore unreadable/corrupt storage */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota/availability errors */
    }
  }, [settings]);

  // Optional receiver: send the swap output to an address other than the sender.
  const [customRecv, setCustomRecv] = useState(false);
  const [receiver, setReceiver] = useState("");
  const receiverValid = /^0x[a-fA-F0-9]{40}$/.test(receiver.trim());

  const crossChain = chainIn.id !== chainOut.id;

  const { data: tokensIn = [] } = useTokens(chainIn.chainId);
  const { data: tokensOut = [] } = useTokens(chainOut.chainId);

  // Effective tokens: explicit pick, else a sensible default derived from the
  // loaded list (no effect/setState — chain changes reset the explicit pick).
  const effTokenIn = useMemo(
    () => tokenIn ?? (tokensIn.length ? pickToken(tokensIn, ["WETH", "ETH"], 0) : null),
    [tokenIn, tokensIn],
  );
  const effTokenOut = useMemo(
    () => tokenOut ?? (tokensOut.length ? pickToken(tokensOut, ["USDC", "USDT", "USDC.e"], 1) : null),
    [tokenOut, tokensOut],
  );

  // Exact on-chain balance of the input token (current block) — drives the
  // "Balance" readout + the 5/10/25/50/75/MAX quick-fill buttons.
  const inBal = useBalance({
    address,
    token: effTokenIn && !isNativeAddress(effTokenIn.address) ? (effTokenIn.address as `0x${string}`) : undefined,
    chainId: chainIn.chainId,
    query: { enabled: !!address && !!effTokenIn },
  });
  const inBalValue = inBal.data?.value ?? null;
  const hasInBal = inBalValue != null && inBalValue > 0n;

  function applyPct(pct: number) {
    if (inBalValue == null || !effTokenIn) return;
    let amt = (inBalValue * BigInt(pct)) / 100n;
    // Native MAX: keep a little aside for gas so the swap tx can still pay for
    // itself. Lower percentages already leave a remainder, so only adjust 100%.
    if (pct === 100 && isNativeAddress(effTokenIn.address)) {
      const buffer = nativeGasBufferWei(chainIn.chainId);
      amt = amt > buffer ? amt - buffer : 0n;
    }
    setAmount(formatUnits(amt, effTokenIn.decimals));
  }

  const amountNum = parseFloat(debouncedAmount);
  const amountValid = isFinite(amountNum) && amountNum > 0;
  const sameToken =
    !!effTokenIn && !!effTokenOut && effTokenIn.address.toLowerCase() === effTokenOut.address.toLowerCase();

  // When sending to a custom address, require a valid one before quoting.
  const recvAddr = customRecv && receiverValid ? receiver.trim() : address ?? undefined;

  const ready =
    !crossChain && !!effTokenIn && !!effTokenOut && amountValid && !sameToken && (!customRecv || receiverValid);

  // Always simulate: the backend funds the sim via state overrides (works even
  // for the preview address), so we get simulatedAmountOut + computationUnits
  // (the gas limit) regardless of wallet/balance. hasSufficientBal only decides
  // what a *missing* simulatedAmountOut means (see below).
  const amountInBase = effTokenIn && amountValid ? toBaseUnits(debouncedAmount, effTokenIn.decimals) : null;
  const hasSufficientBal = !!address && inBalValue != null && amountInBase != null && inBalValue >= amountInBase;

  const quoteArgs: QuoteArgs | null = ready
    ? {
        blockchainId: chainIn.id,
        inputToken: effTokenIn!.address,
        outputToken: effTokenOut!.address,
        inputAmount: debouncedAmount,
        userAddress: address ?? PREVIEW_ADDRESS,
        receiverAddress: recvAddr,
        slippageBps: settings.slippageBps,
        maxHops: settings.maxHops,
        patchers: settings.patchers,
        baselines: settings.baselines,
        simulation: true,
      }
    : null;

  const { quote, quoteInputAmount, error, loading, simulationFailed } =
    useQuoteCycle(quoteArgs, ready, hasSufficientBal);

  const usdIn = useUsd(chainIn.id, effTokenIn);
  const usdOut = useUsd(chainOut.id, effTokenOut);

  // Only show amountOut when the displayed quote matches the *current* input.
  // `amount === debouncedAmount` clears it the instant the user types/clears
  // (before the debounce fires); `quoteInputAmount === debouncedAmount` keeps it
  // cleared while the fresh quote for the new amount is still in flight.
  const quoteMatchesInput =
    !!quote && amount === debouncedAmount && quoteInputAmount === debouncedAmount;

  // Prefer simulatedAmountOut; otherwise show routing amountOut. When we expect a
  // simulation (enough balance) but it's missing, the hook retries the payload
  // and amountOut shows meanwhile; simulationFailed flips once retries are spent.
  const simOut = quoteMatchesInput ? quote?.simulatedAmountOut ?? null : null;
  const simFailed = quoteMatchesInput && simulationFailed;

  const outRaw = quoteMatchesInput && quote ? simOut ?? quote.amountOut : null;

  const outHuman = useMemo(
    () => (outRaw != null && effTokenOut ? fromBaseUnits(outRaw, effTokenOut.decimals) : null),
    [outRaw, effTokenOut],
  );

  const inUsd = amountValid && usdIn.data != null ? amountNum * usdIn.data : null;
  const outUsd = outHuman != null && usdOut.data != null ? outHuman * usdOut.data : null;

  // null = Auto: /quote picks the slippage, so we can't compute a min client-side.
  const slipBps = settings.slippageBps;
  const minReceived = slipBps != null && outHuman != null ? outHuman * (1 - slipBps / 10_000) : null;

  function flip() {
    const a = effTokenIn;
    const b = effTokenOut;
    setChainIn(chainOut);
    setChainOut(chainIn);
    setTokenIn(b);
    setTokenOut(a);
  }

  // Unified asset picker (chain + token in one popup).
  const [modal, setModal] = useState<{ side: "in" | "out"; chainEditable: boolean } | null>(null);

  function pickAsset(c: SupportedChain, t: Token) {
    if (modal?.side === "in") {
      if (c.id !== chainIn.id) setChainIn(c);
      setTokenIn(t);
    } else {
      if (c.id !== chainOut.id) setChainOut(c);
      setTokenOut(t);
    }
    setModal(null);
  }

  return (
    <div className="w-full">
      {/* ── swap widget ── */}
      <div className="panel p-5 space-y-2.5">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="dot" aria-hidden />
            <h2 className="font-display text-sm tracking-wide">Swap</h2>
          </div>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </div>

        {/* FROM — the source surface */}
        <div className="panel-inset p-3">
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="field-label">From</span>
                {effTokenIn && !isNativeAddress(effTokenIn.address) && <CopyAddress address={effTokenIn.address} />}
              </div>
              <ChainSelect value={chainIn} onClick={() => setModal({ side: "in", chainEditable: true })} />
            </div>
            <div className="flex items-center gap-3">
              <input
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*\.?\d*$/.test(v)) setAmount(v);
                }}
                className="bare amount-input flex-1 min-w-0"
              />
              <TokenSelect
                chainId={chainIn.chainId}
                value={effTokenIn}
                onClick={() => setModal({ side: "in", chainEditable: false })}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[13px] text-ink/60 addr truncate">{inUsd != null ? `≈ ${fmtUsd(inUsd)}` : ""}</span>
              {hasInBal && effTokenIn && (
                <span className="text-[13px] text-ink/60 addr truncate">
                  {fmtAmount(fromBaseUnits(String(inBalValue), effTokenIn.decimals))} {effTokenIn.symbol}
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              {[5, 10, 25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  disabled={!hasInBal}
                  onClick={() => applyPct(pct)}
                  className="flex-1 py-1.5 text-[11px] font-mono rounded-[var(--r-sm)] border border-line-2 bg-elev text-ink/80 hover:border-accent hover:text-accent hover:bg-accent/10 active:scale-[0.95] transition-all disabled:opacity-45 disabled:pointer-events-none"
                >
                  {pct === 100 ? "MAX" : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

        {/* flip — circular, centered between the cards */}
        <div className="flex justify-center">
          <button
            onClick={flip}
            className="flip-btn -my-4 relative z-10"
            aria-label="Switch direction"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3v9M5 12l-2.2-2.2M5 12l2.2-2.2M11 13V4M11 4l-2.2 2.2M11 4l2.2 2.2" />
            </svg>
          </button>
        </div>

        {/* TO — destination surface */}
        <div className="panel-inset p-3">
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="field-label">To</span>
                {effTokenOut && !isNativeAddress(effTokenOut.address) && <CopyAddress address={effTokenOut.address} />}
              </div>
              <ChainSelect value={chainOut} onClick={() => setModal({ side: "out", chainEditable: true })} />
            </div>
            <div className="flex items-center gap-3">
              <div className="amount-input flex-1 min-w-0 truncate">
                {outHuman != null ? fmtAmount(outHuman) : <span className="text-faint">0.0</span>}
              </div>
              <TokenSelect
                chainId={chainOut.chainId}
                value={effTokenOut}
                onClick={() => setModal({ side: "out", chainEditable: false })}
              />
            </div>
            <div className="mt-1.5 h-4 text-[13px] text-ink/60 addr">{outUsd != null ? `≈ ${fmtUsd(outUsd)}` : ""}</div>

            {/* recipient — defaults to self, opt in to a different address */}
            <div className="pt-3 flex items-center justify-between gap-2">
              <span className="field-label">Recipient</span>
              {!customRecv ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="rounded-[var(--r-sm)] border border-line bg-elev px-2 py-0.5 font-display text-[0.5rem] uppercase tracking-wider text-muted">Self</span>
                  <span className="addr text-[12px] text-muted truncate empty:hidden" suppressHydrationWarning>{address ? shortAddr(address) : ""}</span>
                  <button
                    type="button"
                    onClick={() => setCustomRecv(true)}
                    className="text-[11px] text-muted hover:text-ink transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setCustomRecv(false); setReceiver(""); }}
                  className="text-[11px] text-muted hover:text-accent transition-colors"
                >
                  Use self
                </button>
              )}
            </div>
            {customRecv && (
              <div className="mt-2">
                <input
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="0x recipient address"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className={`bare addr w-full text-sm px-2.5 py-2 border transition-colors ${
                    receiver.trim() && !receiverValid ? "border-danger" : "border-line focus:border-accent"
                  }`}
                />
                {receiver.trim() && !receiverValid && (
                  <div className="mt-1 text-[11px] text-danger">Enter a valid 0x address.</div>
                )}
              </div>
            )}
          </div>

        {/* review — a single terminal-style summary row binds inputs to the action */}
        {!crossChain && !sameToken && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4 px-1">
            <Stat label="Network" value={chainIn.label} />
            <Stat label="Max slippage" value={slipBps == null ? "Auto" : `${slipBps / 100}%`} />
            <Stat label="Min received" value={minReceived != null && effTokenOut ? `${fmtAmount(minReceived)} ${effTokenOut.symbol}` : loading ? "…" : "—"} />
          </div>
        )}

        {/* action — notices sit directly on the CTA so warnings read as part of it */}
        <div className="space-y-2">
          {crossChain && (
            <div className="flex items-center gap-2 px-1 text-[13px] text-accent-2">
              <span className="dot" style={{ background: "var(--accent-2)" }} /> Cross-chain routing is coming soon — choose the same network on both sides.
            </div>
          )}
          {!crossChain && sameToken && <div className="px-1 text-[13px] text-muted">Choose two different tokens.</div>}
          {!crossChain && !sameToken && error && (
            <div className="flex items-center gap-2 px-1 text-[13px] text-danger"><span aria-hidden>⚠</span> {error}</div>
          )}
          {!crossChain && !sameToken && !error && simFailed && (
            <div className="flex items-center gap-2 px-1 text-[13px] text-danger"><span aria-hidden>⚠</span> Simulation failed — amount shown is a routing estimate.</div>
          )}
          <ExecuteButton chain={chainIn} inputToken={effTokenIn} amount={debouncedAmount} quote={quote} ready={ready} />
        </div>
      </div>

      {modal && (
        <AssetModal
          chain={modal.side === "in" ? chainIn : chainOut}
          chainEditable={modal.chainEditable}
          excludeAddress={modal.side === "in" ? effTokenOut?.address : effTokenIn?.address}
          excludeChainId={modal.side === "in" ? chainOut.chainId : chainIn.chainId}
          onPick={pickAsset}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="field-label">{label}</span>
      <span className="kpi-num text-[13px] text-ink truncate">{value}</span>
    </div>
  );
}
