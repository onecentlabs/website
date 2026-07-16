"use client";

import { useState, useSyncExternalStore } from "react";
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
import { toBaseUnits } from "@r/lib/format";

type Phase = "idle" | "switch" | "approve" | "swap" | "done" | "error";

export function ExecuteButton({
  chain,
  inputToken,
  amount,
  quote,
  ready,
  insufficientBalance = false,
}: {
  chain: SupportedChain;
  inputToken: Token | null;
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
        setMsg("Trade complete");
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
      {msg && (
        <div
          className={`text-xs font-mono px-1 ${
            phase === "error" ? "text-danger" : phase === "done" ? "text-accent" : "text-muted"
          }`}
        >
          {phase === "done" && "✓ "}
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
    </div>
  );
}
