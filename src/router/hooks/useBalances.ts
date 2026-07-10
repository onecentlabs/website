"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useGetTokenBalancesSummary } from "@0xsequence/hooks";
import { isNativeAddress } from "@r/lib/chains";

export type TokenBal = { raw: bigint; usd: number };

/**
 * Connected user's token balances for one chain, via the Sequence indexer.
 * Returns a `balanceOf(address)` lookup (native resolved by sentinel), the held
 * count, and connection/loading flags. Tokens with zero balance are dropped.
 */
export function useChainBalances(chainId: number) {
  const { address } = useAccount();

  const query = useGetTokenBalancesSummary(
    { chainIds: [chainId], filter: { accountAddresses: address ? [address] : [], omitNativeBalances: false } },
    { disabled: !address },
  );

  const { erc20, native } = useMemo(() => {
    const erc20 = new Map<string, TokenBal>();
    let native: TokenBal | null = null;
    for (const page of query.data?.pages ?? []) {
      for (const b of page.balances) {
        let raw: bigint;
        try {
          raw = BigInt(b.balance ?? "0");
        } catch {
          raw = 0n;
        }
        if (raw <= 0n) continue;
        const bal: TokenBal = { raw, usd: Number(b.balanceUSD ?? "0") || 0 };
        if (String(b.contractType) === "NATIVE") native = bal;
        else erc20.set(b.contractAddress.toLowerCase(), bal);
      }
    }
    return { erc20, native };
  }, [query.data]);

  const balanceOf = useMemo(
    () =>
      (addr: string): TokenBal | null =>
        isNativeAddress(addr) ? native : erc20.get(addr.toLowerCase()) ?? null,
    [erc20, native],
  );

  return { balanceOf, hasAddress: !!address, isLoading: query.isLoading };
}
