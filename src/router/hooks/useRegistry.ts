"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTokens } from "@r/lib/api";
import type { Token } from "@r/lib/types";

/** Token list for a chain, via the opaque gateway. Cached 5 min by react-query. */
export function useTokens(chainId: number | undefined) {
  return useQuery({
    queryKey: ["tokens", chainId],
    enabled: chainId != null,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Token[]> => {
      const body = await fetchTokens(chainId!);
      const list = body[String(chainId)] ?? [];
      // VERIFIED / common tokens first, then alphabetical by symbol.
      return [...list].sort((a, b) => {
        const av = a.tags?.includes("VERIFIED") || a.tags?.includes("POPULAR") ? 0 : 1;
        const bv = b.tags?.includes("VERIFIED") || b.tags?.includes("POPULAR") ? 0 : 1;
        if (av !== bv) return av - bv;
        return a.symbol.localeCompare(b.symbol);
      });
    },
  });
}
