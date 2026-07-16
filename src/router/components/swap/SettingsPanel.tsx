"use client";

import { useEffect, useState } from "react";
import type { QuoteSettings } from "@r/lib/types";
import { SLIPPAGE_MAX_BPS, SLIPPAGE_MIN_BPS } from "@r/lib/chains";

const SLIPPAGE_PRESETS = [10, 50, 100];

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: QuoteSettings;
  onChange: (s: QuoteSettings) => void;
}) {
  const [open, setOpen] = useState(false);

  // Close on Escape while the popup is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const set = (patch: Partial<QuoteSettings>) => onChange({ ...settings, ...patch });
  const slipPct = settings.slippageBps == null ? null : settings.slippageBps / 100;
  const isCustomSlip = settings.slippageBps != null && !SLIPPAGE_PRESETS.includes(settings.slippageBps);
  // Local text buffer so intermediate values like "4." survive (a numeric
  // controlled value would strip the trailing dot and block typing decimals).
  const [customStr, setCustomStr] = useState(isCustomSlip ? String(slipPct) : "");

  return (
    <>
      <button
        className="grid place-items-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-elev transition-colors"
        title="Settings"
        onClick={() => setOpen(true)}
        aria-label="Settings"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="panel w-full max-w-sm max-h-[85vh] overflow-y-auto thin-scroll" onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-center justify-between px-6 py-5 border-b hairline">
              <span className="text-[15px] font-semibold tracking-tight">Settings</span>
              <button className="text-muted hover:text-ink transition-colors" onClick={() => setOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="p-6">
              {/* Slippage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="field-label !text-[0.78rem]">Max slippage</span>
                  <span className="kpi-num text-base text-accent">
                    {slipPct == null ? "Auto" : `${slipPct}%`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-2.5 text-sm font-mono border border-line transition-colors ${
                      settings.slippageBps == null ? "border-accent text-accent" : "hover:border-ink"
                    }`}
                    onClick={() => {
                      setCustomStr("");
                      set({ slippageBps: null });
                    }}
                  >
                    Auto
                  </button>
                  {SLIPPAGE_PRESETS.map((bps) => (
                    <button
                      key={bps}
                      className={`flex-1 py-2.5 text-sm font-mono border border-line transition-colors ${
                        settings.slippageBps === bps ? "border-accent text-accent" : "hover:border-ink"
                      }`}
                      onClick={() => {
                        setCustomStr("");
                        set({ slippageBps: bps });
                      }}
                    >
                      {bps / 100}%
                    </button>
                  ))}
                  {/* Custom % occupies the last slot — typing here deselects the presets. */}
                  <input
                    inputMode="decimal"
                    placeholder="Custom"
                    value={customStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!/^\d*\.?\d*$/.test(v)) return;
                      setCustomStr(v);
                      if (v === "" || v === ".") return set({ slippageBps: null });
                      const bps = Math.round(parseFloat(v) * 100);
                      if (Number.isFinite(bps)) {
                        set({ slippageBps: Math.min(SLIPPAGE_MAX_BPS, Math.max(SLIPPAGE_MIN_BPS, bps)) });
                      }
                    }}
                    className={`flex-1 min-w-0 bare px-2 py-2.5 text-sm font-mono text-center border transition-colors ${
                      isCustomSlip ? "border-accent text-accent" : "border-line hover:border-ink"
                    }`}
                  />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Your trade reverts if the price moves against you by more than this.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
