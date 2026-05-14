import { Counter } from "@/components/ui/Counter";

type KpiData = {
  label: string;
  value: React.ReactNode;
  sub: string;
};

const KPIS: KpiData[] = [
  {
    label: "Settled volume",
    value: <Counter value={0} format="money-compact" />,
    sub: "Across all chains",
  },
  {
    label: "Transactions settled",
    value: <Counter value={0} format="compact" />,
    sub: "Routed, quoted, and submitted",
  },
  {
    label: "Median latency",
    value: (
      <>
        <Counter value={0} format="full" />
        <span className="text-muted text-2xl"> ms</span>
      </>
    ),
    sub: "Quote → plan, p50",
  },
];

export function KpiStrip() {
  return (
    <section className="border-y hairline">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
        {KPIS.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>
    </section>
  );
}

function Kpi({ label, value, sub }: KpiData) {
  return (
    <div>
      <div className="font-display text-[10px] tracking-widest uppercase text-muted">{label}</div>
      <div className="mt-3 text-4xl sm:text-5xl lg:text-6xl text-ink">{value}</div>
      <div className="mt-3 text-xs text-muted">{sub}</div>
    </div>
  );
}
