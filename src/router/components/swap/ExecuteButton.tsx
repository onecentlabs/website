"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { useOpenConnectModal } from "@0xsequence/connect";

const noopSubscribe = () => () => {};
import {
  readContract,
  writeContract,
  sendTransaction,
  waitForTransactionReceipt,
  switchChain,
} from "@wagmi/core";
import { erc20Abi, maxUint256, type Hex } from "viem";
import type { Token, QuoteResponse } from "@r/lib/types";
import { type SupportedChain, isNativeAddress, cctpDomain } from "@r/lib/chains";
import { toBaseUnits, fromBaseUnits, fmtAmount } from "@r/lib/format";
import { fetchBalance, fetchCctpStatus, type CctpStatus } from "@r/lib/api";

type Phase = "idle" | "switch" | "approve" | "swap" | "bridging" | "done" | "error";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Cross-chain settlement polling: how long to watch the dest chain, and how
// often. Bridges usually land in seconds-to-minutes; give it a generous cap.
const BRIDGE_TIMEOUT_MS = 20 * 60 * 1000;
const BRIDGE_POLL_MS = 10_000;
// After the recipient balance first rises but before it reaches the quoted
// minimum, wait this long for it to settle, then accept the increase. Covers a
// dest-side bridge fee / rounding that lands funds just under minAmountOut.
const BRIDGE_GRACE_MS = 60_000;
// CCTP attestation polling (Circle Iris). If no CCTP message appears within the
// probe window after the source tx, the route isn't CCTP → fall back to the
// dest-balance poll.
const CCTP_POLL_MS = 8_000;
const CCTP_PROBE_MS = 90_000;

export function ExecuteButton({
  chain,
  destChain,
  recipient,
  inputToken,
  outputToken,
  amount,
  quote,
  ready,
  insufficientBalance = false,
}: {
  chain: SupportedChain;
  /** Destination chain — differs from `chain` on a bridge. */
  destChain?: SupportedChain;
  /** Address that receives the output (self or a custom recipient). */
  recipient?: string;
  inputToken: Token | null;
  outputToken?: Token | null;
  amount: string;
  quote: QuoteResponse | null;
  ready: boolean;
  insufficientBalance?: boolean;
}) {
  const { address, isConnected } = useAccount();
  // Wallet state is client-only; gate it so SSR + first client render agree
  // (wagmi auto-reconnects on the client → otherwise hydration mismatches).
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const connected = mounted && isConnected;
  const activeChainId = useChainId();
  const config = useConfig();
  const { setOpenConnectModal } = useOpenConnectModal();
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState<string>("");
  const [txHash, setTxHash] = useState<Hex | null>(null);
  // Success notification (top-right); auto-dismisses after 10s, slides out on close.
  const [toast, setToast] = useState<{ url: string; text: string } | null>(null);
  const [closing, setClosing] = useState(false);
  const autoTimer = useRef<number | undefined>(undefined);
  const exitTimer = useRef<number | undefined>(undefined);
  // Set on unmount so an in-flight bridge poll stops touching state.
  const cancelledRef = useRef(false);
  useEffect(
    () => () => {
      cancelledRef.current = true;
      window.clearTimeout(autoTimer.current);
      window.clearTimeout(exitTimer.current);
    },
    [],
  );

  function dismissToast() {
    window.clearTimeout(autoTimer.current);
    setClosing(true); // triggers the slide-out; remove once it finishes
    exitTimer.current = window.setTimeout(() => {
      setToast(null);
      setClosing(false);
    }, 300);
  }

  function showToast(url: string, text: string) {
    window.clearTimeout(autoTimer.current);
    window.clearTimeout(exitTimer.current);
    setClosing(false);
    setToast({ url, text });
    autoTimer.current = window.setTimeout(dismissToast, 10_000);
  }

  const explorer = chain.viem.blockExplorers?.default?.url;
  const crossChain = !!destChain && destChain.chainId !== chain.chainId;

  async function execute() {
    if (!quote || !inputToken || !address) return;
    setTxHash(null);
    setMsg("");
    try {
      // 1. Right chain
      if (activeChainId !== chain.chainId) {
        setPhase("switch");
        setMsg(`Switch wallet to ${chain.label}`);
        await switchChain(config, { chainId: chain.chainId });
      }

      const native = isNativeAddress(inputToken.address);
      const amountWei = toBaseUnits(amount, inputToken.decimals);
      const router = quote.routerAddress as Hex;

      // The router comes from the quote response — it can differ per chain and
      // per bridge route, so there's no single constant to pin against. Guard
      // against a malformed / zero address so a broken quote can never redirect
      // an approval or a value transfer to garbage.
      if (!/^0x[0-9a-fA-F]{40}$/.test(router) || isNativeAddress(router)) {
        setPhase("error");
        setMsg("Invalid router address in quote — aborting for your safety.");
        return;
      }

      // 2. Approve ERC20 if needed
      if (!native) {
        setPhase("approve");
        setMsg("Checking allowance…");
        const allowance = (await readContract(config, {
          abi: erc20Abi,
          address: inputToken.address as Hex,
          functionName: "allowance",
          args: [address, router],
          chainId: chain.chainId,
        })) as bigint;

        if (allowance < amountWei) {
          setMsg("Approve token in wallet…");
          const approveHash = await writeContract(config, {
            abi: erc20Abi,
            address: inputToken.address as Hex,
            functionName: "approve",
            args: [router, maxUint256],
            chainId: chain.chainId,
          });
          setMsg("Confirming approval…");
          await waitForTransactionReceipt(config, { hash: approveHash, chainId: chain.chainId });
        }
      }

      // Cross-chain: snapshot the recipient's dest-chain balance BEFORE sending
      // so we can detect the exact increase once the bridge settles. Falls back
      // to null when the read fails (then we can't confirm settlement).
      const to = recipient ?? address;
      let destBefore: bigint | null = null;
      if (crossChain && destChain && outputToken && to) {
        // Retry a few times — a single flaky RPC read shouldn't permanently
        // disable settlement tracking (previously one failure → null → no poll).
        // A NULL balance means "couldn't read" (not zero: rpcBalance returns the
        // string "0" for a genuine zero). Leave destBefore null on repeated nulls
        // so the explorer fallback fires instead of coercing to 0n and polling a
        // blind chain for the full 20-minute timeout.
        for (let i = 0; i < 3 && destBefore == null; i++) {
          try {
            const { balance } = await fetchBalance(destChain.id, outputToken.address, to);
            if (balance != null) {
              destBefore = BigInt(balance);
              break;
            }
          } catch {
            /* fall through to retry */
          }
          if (i < 2) await sleep(1_500);
        }
      }

      // 3. Trade — send the router calldata verbatim
      setPhase("swap");
      setMsg("Confirm trade in wallet…");
      const hash = await sendTransaction(config, {
        to: router,
        data: quote.calldata as Hex,
        value: native ? amountWei : 0n,
        chainId: chain.chainId,
      });
      setTxHash(hash);
      setMsg("Executing trade…");
      const receipt = await waitForTransactionReceipt(config, { hash, chainId: chain.chainId });
      if (receipt.status !== "success") {
        setPhase("error");
        setMsg("Transaction reverted");
        return;
      }

      // Same-chain swap: the output is already in the recipient's wallet.
      if (!crossChain || !destChain) {
        setPhase("done");
        setMsg(""); // success surfaces as the top-right notification, not inline
        if (explorer) {
          const raw = quote.simulatedAmountOut ?? quote.amountOut;
          const recv =
            outputToken && raw != null
              ? `${fmtAmount(fromBaseUnits(raw, outputToken.decimals))} ${outputToken.symbol}`
              : "";
          showToast(`${explorer}/tx/${hash}`, recv);
        }
        return;
      }

      // ── Cross-chain settlement tracking ──────────────────────────────────
      // Prefer Circle CCTP attestation: deterministic, keyed by the SOURCE tx
      // hash, so it's immune to the dest token/recipient mismatches that break
      // balance polling (e.g. a CCTP mint routed through a settlement address,
      // or output delivered as WETH vs native ETH). Falls back to the balance
      // poll below only when the route isn't CCTP.
      setPhase("bridging");
      setMsg(`Bridging to ${destChain.label}…`);
      const srcDomain = cctpDomain(chain);
      const dstDomain = cctpDomain(destChain);
      if (srcDomain != null) {
        const probeUntil = Date.now() + CCTP_PROBE_MS; // window to decide "is this CCTP?"
        const deadline = Date.now() + BRIDGE_TIMEOUT_MS;
        let cctpRoute = false;
        let settled = false;
        while (Date.now() < deadline) {
          if (cancelledRef.current) return;
          let status: CctpStatus = "none";
          try {
            status = await fetchCctpStatus(srcDomain, hash, dstDomain);
          } catch {
            /* transient — keep polling */
          }
          if (status === "complete") {
            settled = true;
            break;
          }
          if (status === "pending") cctpRoute = true;
          // No CCTP message within the probe window → not a CCTP route; stop and
          // let the balance poll below handle it.
          if (!cctpRoute && Date.now() > probeUntil) break;
          await sleep(CCTP_POLL_MS);
        }
        const destExplorer = destChain.viem.blockExplorers?.default?.url;
        if (settled) {
          setPhase("done");
          setMsg("");
          const raw = quote.simulatedAmountOut ?? quote.amountOut;
          const recv =
            outputToken && raw != null
              ? `${fmtAmount(fromBaseUnits(raw, outputToken.decimals))} ${outputToken.symbol}`
              : "";
          if (destExplorer && to) showToast(`${destExplorer}/address/${to}`, recv);
          else setMsg(`Bridge completed on ${destChain.label}.`);
          return;
        }
        if (cctpRoute) {
          // CCTP route confirmed, but attestation didn't sign before the timeout.
          setPhase("done");
          const track = destExplorer && to ? ` Track it here: ${destExplorer}/address/${to}` : "";
          setMsg(`Bridge attestation still pending for ${destChain.label} — this can take a few minutes.${track}`);
          return;
        }
        // Not CCTP → fall through to the balance poll.
      }

      // Non-CCTP route: the source tx only INITIATES the bridge. Without a
      // baseline (or output token) we can't confirm settlement — point the user
      // at the dest explorer instead of falsely claiming receipt.
      if (!outputToken || destBefore == null) {
        setPhase("done");
        setMsg(`Bridge sent to ${destChain.label}. Track your funds on the destination explorer.`);
        return;
      }

      // Poll the dest chain until the recipient's balance rises past the
      // guaranteed minimum (destBefore + minAmountOut). Transient RPC failures
      // are swallowed so a single bad poll doesn't abort tracking.
      setMsg(`Bridging to ${destChain.label} — waiting for funds…`);

      // Two-tier detection against the pre-send snapshot:
      //   • strongTarget = destBefore + minOut → confident the bridge settled.
      //   • any increase over destBefore → funds arrived but under minOut (a
      //     dest-side bridge fee / rounding); confirm after a grace window.
      // The old single ">= destBefore + minOut" gate reported these near-miss
      // settlements as "not detected" — the main false negative.
      let minOut = 0n;
      const minOutStr = quote.minAmountOut ?? quote.simulatedAmountOut ?? quote.amountOut;
      try {
        if (minOutStr != null) minOut = BigInt(minOutStr);
      } catch {
        /* leave 0n → any increase counts */
      }
      const strongTarget = destBefore + (minOut > 0n ? minOut : 1n);
      const started = Date.now();
      let firstIncreaseAt = 0;
      let nullStreak = 0;
      let received: bigint | null = null;
      while (Date.now() - started < BRIDGE_TIMEOUT_MS) {
        await sleep(BRIDGE_POLL_MS);
        if (cancelledRef.current) return;
        try {
          const { balance } = await fetchBalance(destChain.id, outputToken.address, to!);
          const bal = balance != null ? BigInt(balance) : null;
          if (bal == null) {
            // RPC went dark mid-bridge — bail after ~2 min of blind reads to the
            // explorer fallback rather than spinning the full timeout.
            if (++nullStreak >= 12) break;
            continue;
          }
          nullStreak = 0;
          if (bal >= strongTarget) {
            received = bal - destBefore; // confident settlement
            break;
          }
          if (bal > destBefore) {
            // Some funds landed, short of minOut — let the balance finish
            // climbing, then accept the increase.
            if (firstIncreaseAt === 0) firstIncreaseAt = Date.now();
            else if (Date.now() - firstIncreaseAt >= BRIDGE_GRACE_MS) {
              received = bal - destBefore;
              break;
            }
          }
        } catch {
          /* transient RPC failure — keep polling */
        }
      }

      setPhase("done");
      const destExplorer = destChain.viem.blockExplorers?.default?.url;
      if (received != null && received > 0n) {
        setMsg("");
        const recv = `${fmtAmount(fromBaseUnits(received.toString(), outputToken.decimals))} ${outputToken.symbol}`;
        if (destExplorer && to) showToast(`${destExplorer}/address/${to}`, recv);
        else setMsg(`Received ${recv} on ${destChain.label}.`);
      } else {
        // Never saw the balance move. Source tx is confirmed; settlement just
        // isn't visible yet — point at the dest address so the user can verify.
        const track = destExplorer && to ? ` Track it here: ${destExplorer}/address/${to}` : "";
        setMsg(
          `Bridge initiated on ${chain.label} — funds not yet detected on ${destChain.label}. Bridges can take several minutes.${track}`,
        );
      }
    } catch (e) {
      setPhase("error");
      const m = e instanceof Error ? e.message : "Transaction failed";
      setMsg(m.length > 120 ? m.slice(0, 120) + "…" : m);
    }
  }

  const busy = phase === "switch" || phase === "approve" || phase === "swap" || phase === "bridging";
  const label = !connected
    ? "Connect wallet to trade"
    : !ready
      ? "Enter an amount"
      : insufficientBalance
        ? "Insufficient Balance"
        : phase === "bridging"
          ? "Bridging…"
          : busy
            ? "Working…"
            : phase === "done"
              ? "Trade again"
              : inputToken && amount
                ? `Trade ${amount} ${inputToken.symbol}`
                : "Trade";

  return (
    <div className="space-y-2">
      <button
        className="pixel-btn btn-cta w-full !py-4 text-[0.72rem]"
        data-idle={connected ? undefined : ""}
        disabled={connected ? !ready || !quote || busy || insufficientBalance : !mounted}
        onClick={connected ? execute : () => setOpenConnectModal(true)}
      >
        {label}
      </button>
      {msg && !toast && (
        <div className={`text-xs font-mono px-1 ${phase === "error" ? "text-danger" : "text-muted"}`}>
          {msg}
          {txHash && explorer && (
            <>
              {" · "}
              <a className="underline hover:text-accent" href={`${explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">
                view tx
              </a>
            </>
          )}
        </div>
      )}

      {/* Success notification — top-right, click to view the tx, ✕ to dismiss. */}
      {toast && (
        <div className={`fixed right-3 top-[4.25rem] z-50 sm:right-5 sm:top-20 w-[min(19rem,calc(100vw-1.5rem))] ${closing ? "toast-out" : "toast-in"}`}>
          <div className="flex items-center gap-3 rounded-[var(--r-sm)] border border-accent/40 bg-bg-2 px-3.5 py-3 shadow-[var(--shadow-card)]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <a
              href={toast.url}
              target="_blank"
              rel="noreferrer"
              className="group min-w-0 flex-1 leading-snug"
              onClick={dismissToast}
            >
              <div className="text-[15px] font-semibold text-ink">Trade Completed</div>
              <div className="truncate text-[13px] text-muted">
                {toast.text && <>Received <span className="text-ink/80">{toast.text}</span> · </>}
                <span className="text-accent group-hover:underline">view txn ↗</span>
              </div>
            </a>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissToast}
              className="shrink-0 self-start -mr-1 -mt-1 p-1 text-muted hover:text-ink transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
