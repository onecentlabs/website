import { Counter } from "@/components/ui/Counter";

type KpiData = {
  label: string;
  value: number;
  format: "money-compact" | "compact" | "full";
  suffix?: string;
  sub: string;
};

const KPIS: KpiData[] = [
  {
    label: "Settled volume",
    value: 0,
    format: "money-compact",
    sub: "Across all chains",
  },
  {
    label: "Transactions settled",
    value: 0,
    format: "compact",
    sub: "Routed, quoted, and submitted",
  },
  {
    label: "Median latency",
    value: 0,
    format: "full",
    suffix: " ms",
    sub: "Quote → plan, p50",
  },
];

export function KpiStrip() {
  // Only show KPIs with real numbers; hide the section entirely if all are 0.
  const visible = KPIS.filter((k) => k.value > 0);
  if (visible.length === 0) return null;

  return (
    <section className="border-y hairline">
      <div className="shell py-14 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
        {visible.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>
    </section>
  );
}

function Kpi({ label, value, format, suffix, sub }: KpiData) {
  return (
    <div>
      <div className="font-display text-[10px] tracking-widest uppercase text-muted">{label}</div>
      <div className="mt-3 text-[clamp(2.25rem,4vw,3.75rem)] text-ink">
        <Counter value={value} format={format} />
        {suffix ? <span className="text-muted text-2xl">{suffix}</span> : null}
      </div>
      <div className="mt-3 text-xs text-muted">{sub}</div>
    </div>
  );
}
