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
import { type SupportedChain, isNativeAddress, ROUTER_ADDRESS } from "@r/lib/chains";
import { toBaseUnits, fromBaseUnits, fmtAmount } from "@r/lib/format";

type Phase = "idle" | "switch" | "approve" | "swap" | "done" | "error";

export function ExecuteButton({
  chain,
  inputToken,
  outputToken,
  amount,
  quote,
  ready,
  insufficientBalance = false,
}: {
  chain: SupportedChain;
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
  useEffect(
    () => () => {
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

      // Safety pin: the router contract is the same known address on every
      // supported chain. Refuse to approve spend or send funds to anything else,
      // so a compromised/buggy quote can't redirect approval or value.
      if (router.toLowerCase() !== ROUTER_ADDRESS.toLowerCase()) {
        setPhase("error");
        setMsg("Unexpected router address — aborting for your safety.");
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
      if (receipt.status === "success") {
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
      } else {
        setPhase("error");
        setMsg("Transaction reverted");
      }
    } catch (e) {
      setPhase("error");
      const m = e instanceof Error ? e.message : "Transaction failed";
      setMsg(m.length > 120 ? m.slice(0, 120) + "…" : m);
    }
  }

  const busy = phase === "switch" || phase === "approve" || phase === "swap";
  const label = !connected
    ? "Connect wallet to trade"
    : !ready
      ? "Enter an amount"
      : insufficientBalance
        ? "Insufficient Balance"
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
      {msg && phase !== "done" && (
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
