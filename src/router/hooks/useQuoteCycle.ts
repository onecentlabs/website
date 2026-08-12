"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchQuote, type QuoteArgs } from "@r/lib/api";
import type { QuoteResponse } from "@r/lib/types";

const CYCLE_MS = 15_000;
const PREFETCH_AT_MS = 13_000; // fetch early so the fresh quote lands ~at the 15s mark
const SIM_MAX_RETRIES = 3; // when a simulation is expected but missing, retry the payload this many times
const SIM_RETRY_MS = 5_000; // gap between simulation retries

const IDLE: CycleState = { quote: null, quoteRawInput: null, error: null, loading: false, isStale: false, lastUpdated: null, simulationFailed: false };

type CycleState = {
  quote: QuoteResponse | null;
  quoteRawInput: string | null; // rawInputAmount the displayed quote was computed for
  error: string | null;
  loading: boolean;
  isStale: boolean; // fetch still in-flight past the 10s mark
  lastUpdated: number | null;
  simulationFailed: boolean; // expected a simulated amount but it's still missing after retries
};

/**
 * Drives the auto-refreshing quote. The 10s ring is anchored to the moment a
 * quote is *displayed* (commit time) — it does not run while the first quote is
 * still loading. At 8s after a commit it pre-fetches the next quote so the
 * fresh number usually lands right when the ring completes. Manual refresh /
 * any args change fetches immediately; the ring restarts when that lands.
 * When inputs go invalid the displayed quote is cleared.
 */
export function useQuoteCycle(args: QuoteArgs | null, enabled: boolean, expectSimulated = false) {
  const [state, setState] = useState<CycleState>(IDLE);

  const progressRef = useRef(0); // 0..1, read imperatively by the timer
  const argsRef = useRef(args);
  useEffect(() => {
    argsRef.current = args;
  });
  // Mirrored so commit() (a stable callback) reads the latest value.
  const expectSimRef = useRef(expectSimulated);
  useEffect(() => {
    expectSimRef.current = expectSimulated;
  });

  const commitRef = useRef(0); // performance.now() of last displayed quote; 0 = none yet
  const genRef = useRef(0);
  const prefetchStartedRef = useRef(false);
  const pendingRef = useRef<QuoteResponse | "pending" | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number>(0);
  const simRetryRef = useRef(0); // count of simulation retries spent on the current input
  const simRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runFetchRef = useRef<(commitImmediately: boolean) => void>(() => {});

  // A quote is displayed: anchor the ring here and reset the prefetch window.
  const commit = useCallback((res: QuoteResponse) => {
    commitRef.current = performance.now();
    prefetchStartedRef.current = false;
    pendingRef.current = null;
    progressRef.current = 0;

    // Simulation retry: with enough balance we expect amounts.output.simulated.
    // If it's missing, re-fetch the same payload up to SIM_MAX_RETRIES times (5s
    // apart) — the committed quote (routed net) keeps showing meanwhile. Once the
    // budget is spent, flag the failure (UI still shows the routed amount).
    if (simRetryTimerRef.current) {
      clearTimeout(simRetryTimerRef.current);
      simRetryTimerRef.current = null;
    }
    let simulationFailed = false;
    if (expectSimRef.current && res.amounts?.output?.simulated == null) {
      if (simRetryRef.current < SIM_MAX_RETRIES) {
        simRetryRef.current += 1;
        simRetryTimerRef.current = setTimeout(() => runFetchRef.current(true), SIM_RETRY_MS);
      } else {
        simulationFailed = true;
      }
    } else {
      simRetryRef.current = 0;
    }

    // args don't change within a cycle without a teardown/restart, so the live
    // ref still reflects the input this quote was fetched for.
    setState({ quote: res, quoteRawInput: argsRef.current?.rawInputAmount ?? null, error: null, loading: false, isStale: false, lastUpdated: Date.now(), simulationFailed });
  }, []);

  const runFetch = useCallback(
    (commitImmediately: boolean) => {
      const a = argsRef.current;
      if (!a) return;
      const gen = ++genRef.current;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setState((s) => ({ ...s, loading: true, error: null }));
      fetchQuote(a, ac.signal)
        .then((res) => {
          if (gen !== genRef.current) return;
          if (res?.error) {
            setState((s) => ({ ...s, loading: false, error: res.error!, isStale: false, quote: commitImmediately ? null : s.quote }));
            return;
          }
          if (commitImmediately) commit(res);
          else {
            pendingRef.current = res; // committed by the rAF loop at the 10s mark
            setState((s) => ({ ...s, loading: false }));
          }
        })
        .catch((err: Error) => {
          if (gen !== genRef.current || err.name === "AbortError") return;
          pendingRef.current = null;
          setState((s) => ({
            ...s,
            loading: false,
            isStale: false,
            error: err.message,
            quote: commitImmediately ? null : s.quote,
          }));
        });
    },
    [commit],
  );
  useEffect(() => {
    runFetchRef.current = runFetch;
  });

  const resetCounters = useCallback(() => {
    commitRef.current = 0;
    prefetchStartedRef.current = false;
    pendingRef.current = null;
    progressRef.current = 0;
    simRetryRef.current = 0;
    if (simRetryTimerRef.current) {
      clearTimeout(simRetryTimerRef.current);
      simRetryTimerRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    if (!argsRef.current || !enabled) return;
    resetCounters(); // ring waits until the fresh quote lands, then restarts
    runFetch(true);
  }, [enabled, resetCounters, runFetch]);

  // (Re)start whenever the request or enabled-state changes.
  const argsKey = args
    ? `${args.blockchainId}|${args.destinationBlockchainId}|${args.inputToken}|${args.outputToken}|${args.rawInputAmount}|${args.userAddress}|${args.receiverAddress}|${args.slippageBps}|${args.maxHops}|${args.optimizer}|${args.patchers}|${args.baselines}|${args.simulation}|${args.incognito}|${expectSimulated}`
    : "";

  useEffect(() => {
    if (!enabled || !args) {
      cancelAnimationFrame(rafRef.current);
      abortRef.current?.abort();
      genRef.current++;
      resetCounters();
      // Clear the displayed quote so a stale output amount never lingers.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(IDLE);
      return;
    }

    resetCounters();
    runFetch(true); // immediate first quote — ring stays idle until it commits

    const frame = (now: number) => {
      const cm = commitRef.current;
      if (cm !== 0) {
        const elapsed = now - cm;
        progressRef.current = Math.min(elapsed / CYCLE_MS, 1);

        if (elapsed >= PREFETCH_AT_MS && !prefetchStartedRef.current) {
          prefetchStartedRef.current = true;
          pendingRef.current = "pending";
          runFetch(false);
        }

        if (elapsed >= CYCLE_MS) {
          const pending = pendingRef.current;
          if (pending && pending !== "pending") {
            commit(pending); // anchors a fresh cycle
          } else if (pending === "pending") {
            setState((s) => (s.isStale ? s : { ...s, isStale: true })); // ring full, awaiting result
          } else {
            // prefetch errored — try again
            prefetchStartedRef.current = true;
            pendingRef.current = "pending";
            runFetch(false);
          }
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      abortRef.current?.abort();
      if (simRetryTimerRef.current) {
        clearTimeout(simRetryTimerRef.current);
        simRetryTimerRef.current = null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      genRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, argsKey]);

  return { ...state, progressRef, refresh };
}
