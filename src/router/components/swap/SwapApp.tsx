"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useBalance, useGasPrice } from "wagmi";
import { formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { ChainSelect } from "./ChainSelect";
import { TokenSelect } from "./TokenSelect";
import { AssetModal } from "./AssetModal";
import { SettingsPanel } from "./SettingsPanel";
import { ExecuteButton } from "./ExecuteButton";
import { CopyAddress } from "./CopyAddress";
import { RecipientModal } from "./RecipientModal";
import { addRecentRecipient, getRecipientLabel } from "@r/lib/recipients";
import { useTokens } from "@r/hooks/useRegistry";
import { useQuoteCycle } from "@r/hooks/useQuoteCycle";
import { fetchUsd, type QuoteArgs } from "@r/lib/api";
import { quoteOut, quoteMinOut, type QuoteSettings, type Token } from "@r/lib/types";
import { SUPPORTED_CHAINS, DEFAULT_MAX_HOPS, isNativeAddress, nativeGasBufferWei, chainKind, type SupportedChain } from "@r/lib/chains";
import { normalizeRecipient } from "@r/lib/address";
import { fromBaseUnits, toBaseUnits, fmtAmount, fmtUsd, shortAddr } from "@r/lib/format";

const PREVIEW_ADDRESS = "0x000000000000000000000000000000000000dEaD";
const ARBITRUM = SUPPORTED_CHAINS.find((c) => c.id === "arbitrum")!;

const SETTINGS_KEY = "ocr.settings";
const DEFAULT_SETTINGS: QuoteSettings = {
  slippageBps: null,
  amountSlider: false,
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

  // Incognito / private mode — reskins the widget and flags the quote as private.
  const [incognito, setIncognito] = useState(false);
  // Reskin the whole router page (bg, grid, glow) violet while private is on.
  useEffect(() => {
    const page = document.querySelector(".app-router");
    page?.classList.toggle("incognito", incognito);
    return () => page?.classList.remove("incognito");
  }, [incognito]);

  // Transient "coming soon" note when a not-yet-live section (Yields/RWAs) is tapped.
  const [soon, setSoon] = useState<string | null>(null);
  const soonTimer = useRef<number | undefined>(undefined);
  function showSoon(name: string) {
    setSoon(name);
    window.clearTimeout(soonTimer.current);
    soonTimer.current = window.setTimeout(() => setSoon(null), 2000);
  }

  // Optional receiver: send the swap output to an address other than the sender.
  // Validated + normalized against the OUTPUT chain's address family (EVM today).
  const [customRecv, setCustomRecv] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [recvModal, setRecvModal] = useState(false);
  const recvKind = chainKind(chainOut);
  const receiverNorm = normalizeRecipient(receiver, recvKind);
  const receiverValid = receiverNorm !== null;
  // Picked from the recipient modal — null resets to self (the connected wallet).
  function selectRecipient(addr: string | null) {
    if (addr) {
      const norm = normalizeRecipient(addr, recvKind) ?? addr;
      setReceiver(norm);
      setCustomRecv(true);
      addRecentRecipient(norm);
    } else {
      setCustomRecv(false);
      setReceiver("");
    }
    setRecvModal(false);
  }

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

  // Slider position (0–100) derived from the entered amount vs balance, so the
  // thumb stays in sync whether the user drags it or types the amount directly.
  const pctOfBalance = (() => {
    if (inBalValue == null || inBalValue === 0n || !effTokenIn) return 0;
    const n = parseFloat(amount);
    if (!isFinite(n) || n <= 0) return 0;
    const bal = Number(fromBaseUnits(String(inBalValue), effTokenIn.decimals));
    return bal > 0 ? Math.max(0, Math.min(100, (n / bal) * 100)) : 0;
  })();

  function applyPct(pct: number) {
    if (inBalValue == null || !effTokenIn) return;
    // Basis-point precision so fractional slider positions (e.g. 37.5%) work.
    const bps = BigInt(Math.round(Math.max(0, Math.min(100, pct)) * 100));
    let amt = (inBalValue * bps) / 10_000n;
    // Native MAX: keep a little aside for gas so the swap tx can still pay for
    // itself. Lower percentages already leave a remainder, so only adjust 100%.
    if (pct >= 100 && isNativeAddress(effTokenIn.address)) {
      const buffer = nativeGasBufferWei(chainIn.chainId);
      amt = amt > buffer ? amt - buffer : 0n;
    }
    setAmount(formatUnits(amt, effTokenIn.decimals));
  }

  // Magnetic snap: drag is smooth, but within SNAP_PCT of a breakpoint the value
  // jumps to it so the common 25/50/75/MAX stops are easy to hit exactly.
  const SNAP_PCT = 3;
  function snapPct(v: number): number {
    for (const bp of [0, 25, 50, 75, 100]) {
      if (Math.abs(v - bp) <= SNAP_PCT) return bp;
    }
    return v;
  }

  const amountNum = parseFloat(debouncedAmount);
  const amountValid = isFinite(amountNum) && amountNum > 0;
  const sameToken =
    !!effTokenIn && !!effTokenOut && effTokenIn.address.toLowerCase() === effTokenOut.address.toLowerCase();
  // Same token only blocks a *same-chain* swap; the identical asset on two
  // different chains is a valid bridge (e.g. USDC arbitrum → USDC base).
  const sameTokenSameChain = sameToken && !crossChain;

  // When sending to a custom address, require a valid one before quoting.
  const recvAddr = customRecv && receiverNorm ? receiverNorm : address ?? undefined;

  const ready =
    !sameTokenSameChain && !!effTokenIn && !!effTokenOut && amountValid && (!customRecv || receiverValid);

  // Always simulate: the backend funds the sim via state overrides (works even
  // for the preview address), so we get amounts.output.simulated +
  // computationUnits (the gas limit) regardless of wallet/balance.
  // hasSufficientBal only decides what a *missing* simulated amount means.
  const amountInBase = effTokenIn && amountValid ? toBaseUnits(debouncedAmount, effTokenIn.decimals) : null;
  const hasSufficientBal = !!address && inBalValue != null && amountInBase != null && inBalValue >= amountInBase;
  // Connected + valid amount, but the on-chain balance (public RPC) can't cover it.
  const insufficientBalance =
    !!address && inBalValue != null && amountInBase != null && inBalValue < amountInBase;

  const quoteArgs: QuoteArgs | null = ready
    ? {
        blockchainId: chainIn.id,
        inputToken: effTokenIn!.address,
        outputToken: effTokenOut!.address,
        // Atomic base units on every path — same-chain and bridge alike.
        // Sending rawInputAmount is what pins the quote to the sell side.
        rawInputAmount: amountInBase!.toString(),
        // Destination chain is sent only for actual bridges (src != dest); a
        // differing destinationBlockchainId is what puts core into bridge mode.
        ...(crossChain ? { destinationBlockchainId: chainOut.id } : {}),
        userAddress: address ?? PREVIEW_ADDRESS,
        receiverAddress: recvAddr,
        slippageBps: settings.slippageBps,
        maxHops: DEFAULT_MAX_HOPS,
        // Fixed: our router is the source of truth for the search config.
        optimizer: true,
        baselines: true,
        patchers: false,
        simulation: true,
        incognito,
      }
    : null;

  // Bridges don't return a simulation (core simulates same-chain only), so don't
  // expect one — otherwise every bridge quote flags a false "simulation failed".
  const { quote, quoteRawInput, error, loading, simulationFailed } =
    useQuoteCycle(quoteArgs, ready, hasSufficientBal && !crossChain);

  const usdIn = useUsd(chainIn.id, effTokenIn);
  const usdOut = useUsd(chainOut.id, effTokenOut);

  // Network fee: gas limit from the quote simulation (computationUnits) ×
  // live gas price, priced in USD via the wrapped-native token.
  const gasPrice = useGasPrice({
    chainId: chainIn.chainId,
    query: { refetchInterval: 30_000 },
  });
  const nativeToken = useMemo<Token>(
    () => ({
      chainId: chainIn.chainId,
      address: chainIn.wrappedNative,
      name: chainIn.nativeSymbol,
      symbol: chainIn.nativeSymbol,
      decimals: 18,
    }),
    [chainIn],
  );
  const usdNative = useUsd(chainIn.id, nativeToken);

  // Only show an output when the displayed quote matches the *current* input.
  // `amount === debouncedAmount` clears it the instant the user types/clears
  // (before the debounce fires); `quoteRawInput === amountInBase` keeps it
  // cleared while the fresh quote for the new amount is still in flight.
  const quoteMatchesInput =
    !!quote && amount === debouncedAmount && quoteRawInput === (amountInBase?.toString() ?? null);

  // Shows the net amount (output after fees). When we expect a simulation
  // (enough balance) but it's missing, the hook retries the payload;
  // simulationFailed flips once the retry budget is spent — the net amount is
  // still shown, but without a simulation there's no gas figure to go with it.
  const simFailed = quoteMatchesInput && simulationFailed;

  const outRaw = quoteMatchesInput && quote ? quoteOut(quote) : null;

  const outHuman = useMemo(
    () => (outRaw != null && effTokenOut ? fromBaseUnits(outRaw, effTokenOut.decimals) : null),
    [outRaw, effTokenOut],
  );

  const inUsd = amountValid && usdIn.data != null ? amountNum * usdIn.data : null;
  const outUsd = outHuman != null && usdOut.data != null ? outHuman * usdOut.data : null;

  const slipBps = settings.slippageBps;
  // Prefer core's guaranteed minimum from the quote (amounts.output.minimum,
  // slippage-aware incl. Auto). Fall back to the client estimate when core omits
  // it — bridges report "0", which quoteMinOut normalizes to null.
  const minReceived = useMemo(() => {
    const min = quoteMatchesInput && quote ? quoteMinOut(quote) : null;
    if (min != null && effTokenOut) return fromBaseUnits(min, effTokenOut.decimals);
    return slipBps != null && outHuman != null ? outHuman * (1 - slipBps / 10_000) : null;
  }, [quoteMatchesInput, quote, effTokenOut, slipBps, outHuman]);

  const gasUnits =
    quoteMatchesInput && quote?.computationUnits != null ? Number(quote.computationUnits) : null;
  const gasNative =
    gasUnits != null && isFinite(gasUnits) && gasUnits > 0 && gasPrice.data != null
      ? (gasUnits * Number(gasPrice.data)) / 1e18
      : null;
  const gasUsd = gasNative != null && usdNative.data != null ? gasNative * usdNative.data : null;

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
      {/* ── section rail + swap widget ── */}
      <div className="flex items-start justify-center gap-2.5 sm:gap-3">
        <SectionRail active="trade" onSoon={(name) => showSoon(name)} />
        <div className="flex-1 min-w-0">
        {/* coming-soon toast (Yields / RWAs) — above the widget */}
        {soon && (
          <div className="mb-2 flex justify-center">
            <span className="rounded-full border border-line-2 bg-elev px-3 py-1 text-[12px] text-muted">
              {soon} — coming soon
            </span>
          </div>
        )}
        <div className={`swap-card panel p-4 sm:p-5 space-y-3${incognito ? " incognito" : ""}`}>
        {/* header */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="dot shrink-0" aria-hidden />
            <h2 className="text-lg sm:text-[22px] tracking-tight truncate">
              {incognito && <span className="hidden sm:inline">Private </span>}Trade
            </h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <IncognitoToggle on={incognito} onToggle={() => setIncognito((v) => !v)} />
            <SettingsPanel settings={settings} onChange={setSettings} />
          </div>
        </div>

        {/* FROM — the source surface */}
        <div className="panel-inset p-4">
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="field-label">From</span>
                {effTokenIn && <CopyAddress address={effTokenIn.address} className="font-mono" />}
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
              <span className="text-[16px] text-ink/60 addr truncate">≈ {fmtUsd(inUsd ?? 0)}</span>
              {hasInBal && effTokenIn && (
                <button
                  type="button"
                  onClick={() => applyPct(100)}
                  title="Use max balance"
                  className="group flex items-center gap-1.5 text-[16px] text-ink/60 addr truncate transition-colors hover:text-accent"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70 group-hover:opacity-100" aria-hidden>
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                  {fmtAmount(fromBaseUnits(String(inBalValue), effTokenIn.decimals))} {effTokenIn.symbol}
                </button>
              )}
            </div>
            {/* balance slider — optional (Settings › Amount slider); snaps to 0/25/50/75/MAX */}
            {settings.amountSlider && (
            <div className="mt-4 px-0.5">
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={pctOfBalance}
                disabled={!hasInBal}
                onChange={(e) => applyPct(snapPct(Number(e.target.value)))}
                aria-label="Amount as percent of balance"
                className="bal-slider w-full"
                style={{ "--pct": `${pctOfBalance}%` } as React.CSSProperties}
              />
              <div className="mt-1.5 flex justify-between text-[13px] text-faint select-none">
                {[0, 25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={!hasInBal}
                    onClick={() => applyPct(p)}
                    className="font-mono hover:text-accent transition-colors disabled:pointer-events-none"
                  >
                    {p === 100 ? "MAX" : `${p}%`}
                  </button>
                ))}
              </div>
            </div>
            )}
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
        <div className="panel-inset p-4">
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="field-label">To</span>
                {effTokenOut && <CopyAddress address={effTokenOut.address} className="font-mono" />}
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
            {/* usd (left) + recipient "RECIPIENT: SELF" (right) share one row to save space */}
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-[16px] text-ink/60 addr truncate">≈ {fmtUsd(outUsd ?? 0)}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="field-label shrink-0">Recipient:</span>
                <button
                  type="button"
                  onClick={() => setRecvModal(true)}
                  className="group min-w-0 truncate !text-ink/70 hover:!text-accent transition-colors"
                  suppressHydrationWarning
                >
                  {customRecv && receiverValid ? (
                    // Address/label keeps its real casing (checksummed 0x…, not 0X…).
                    <span className="addr text-[16px] !text-ink/70 group-hover:!text-accent transition-colors">{getRecipientLabel(receiver) ?? shortAddr(receiver)}</span>
                  ) : (
                    <span className="field-label !text-ink/70 group-hover:!text-accent transition-colors">Self</span>
                  )}
                </button>
              </div>
            </div>
          </div>

        {/* review — a single terminal-style summary row binds inputs to the action */}
        {!sameTokenSameChain && (
          <div className="grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
            <Stat
              label="Network Cost"
              value={gasUsd != null ? fmtUsd(gasUsd) : loading ? "…" : "—"}
            />
            <Stat label="Max Slippage" value={slipBps == null ? "Auto" : `${slipBps / 100}%`} />
            <Stat label="Min Received" value={minReceived != null && effTokenOut ? `${fmtAmount(minReceived)} ${effTokenOut.symbol}` : loading ? "…" : "—"} />
          </div>
        )}

        {/* action — notices sit directly on the CTA so warnings read as part of it */}
        <div className="space-y-2">
          {sameTokenSameChain && <div className="px-1 text-[13px] text-muted">Choose two different tokens.</div>}
          {!sameTokenSameChain && error && (
            <div className="flex items-center gap-2 px-1 text-[13px] text-danger"><span aria-hidden>⚠</span> {error}</div>
          )}
          {!sameTokenSameChain && !error && simFailed && (
            <div className="flex items-center gap-2 px-1 text-[13px] text-danger"><span aria-hidden>⚠</span> Simulation failed — amount shown is a routing estimate.</div>
          )}
          <ExecuteButton chain={chainIn} destChain={chainOut} recipient={recvAddr} inputToken={effTokenIn} outputToken={effTokenOut} amount={debouncedAmount} quote={quote} ready={ready} insufficientBalance={insufficientBalance} />
        </div>
        </div>

        {/* attribution — sits below the card, centered under it */}
        <div className="mt-3 text-center text-[12px] text-faint">
          {incognito ? (
            <span className="inline-flex items-center gap-1.5">
              <IncognitoGlyph size={13} /> Private Trade · <span className="text-muted">OneCent Router</span>
            </span>
          ) : (
            <>Powered by <span className="text-muted">OneCent Router</span></>
          )}
        </div>
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

      {recvModal && (
        <RecipientModal
          selfAddress={address}
          current={customRecv && receiverValid ? receiver : null}
          kind={recvKind}
          onSelect={selectRecipient}
          onClose={() => setRecvModal(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-1 min-w-0 px-2">
      <span className="field-label">{label}</span>
      <span className="kpi-num text-[0.95rem] text-ink/70 truncate max-w-full">{value}</span>
    </div>
  );
}

/* ── Section rail — icon nav attached to the widget's left edge ── */

/** Bidirectional swap arrows — Trade. */
function TradeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 8h11M14 4l4 4-4 4" />
      <path d="M17 16H6M10 12l-4 4 4 4" />
    </svg>
  );
}

/** Upward trend line — Yields / APY (growth). */
function YieldsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

/** Bank / columned building — Real-World Assets. */
function RwaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21h18" />
      <path d="M12 3l9 5H3z" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
    </svg>
  );
}

const SECTIONS = [
  { id: "trade", label: "Trade", Icon: TradeIcon },
  { id: "yields", label: "Yields", Icon: YieldsIcon },
  { id: "rwas", label: "RWAs", Icon: RwaIcon },
] as const;

/** Compact vertical icon rail beside the widget. Icon-only; the name flies out
 *  on hover. The active section is highlighted; not-yet-live ones raise a
 *  "coming soon" note. */
function SectionRail({ active, onSoon }: { active: string; onSoon: (name: string) => void }) {
  return (
    <div className="mt-[4rem] sm:mt-[4.25rem] flex shrink-0 flex-col gap-1 rounded-[calc(var(--r)+2px)] border border-line-2 bg-bg-2 p-1.5 shadow-[var(--shadow-sm)]">
      {SECTIONS.map((s) => {
        const isActive = s.id === active;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => !isActive && onSoon(s.label)}
            aria-label={s.label}
            aria-current={isActive ? "page" : undefined}
            title={s.label}
            className={`group relative grid h-11 w-11 place-items-center rounded-full transition-colors ${
              isActive
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-ink hover:bg-white/[0.05]"
            }`}
          >
            <s.Icon />
            {/* hover label — flies left on desktop, right on mobile (avoids clipping) */}
            <span className="pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-md border border-line-2 bg-elev px-2 py-1 text-[11px] font-medium text-ink opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 right-full mr-2.5 max-sm:right-auto max-sm:left-full max-sm:mr-0 max-sm:ml-2.5">
              {s.label}
              {!isActive && <span className="ml-1 text-faint">· Soon</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Incognito "glasses + hat" glyph — the universal private-browsing mark. */
function IncognitoGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h16M8 8l-1 4M16 8l1 4" />
      <circle cx="7.5" cy="15" r="2.5" />
      <circle cx="16.5" cy="15" r="2.5" />
      <path d="M10 15c.7-.6 1.3-.6 2 0" />
    </svg>
  );
}

/** Open-eye glyph — the "public" counterpart to the incognito mark. */
function PublicGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

/** Icon + label + switch. The label shows the CURRENT mode (Public / Private). */
function IncognitoToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      title={on ? "Private mode on — click to trade publicly" : "Public mode — click to trade privately"}
      aria-label="Private mode"
      className={`group inline-flex items-center gap-2 rounded-full border pl-2.5 pr-1 py-1 transition-colors ${
        on ? "border-accent bg-accent/10 text-accent" : "border-line-2 bg-elev text-muted hover:text-ink"
      }`}
    >
      {on ? <IncognitoGlyph size={14} /> : <PublicGlyph size={14} />}
      <span className="text-[11px] font-mono uppercase tracking-wider">{on ? "Private" : "Public"}</span>
      {/* switch track */}
      <span
        className={`relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors ${
          on ? "bg-accent" : "bg-line-2"
        }`}
      >
        <span
          className={`inline-flex h-3.5 w-3.5 rounded-full bg-bg transition-transform duration-200 ${
            on ? "translate-x-[1.05rem]" : "translate-x-[0.15rem]"
          }`}
        />
      </span>
    </button>
  );
}
