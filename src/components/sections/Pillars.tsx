type Pillar = { n: string; t: string; d: string };

const PILLARS: Pillar[] = [
  {
    n: "01",
    t: "Router",
    d: "Multi-hop, multi-venue path finding across AMMs, CLOBs, RFQ. Order splitting and gas-aware execution.",
  },
  {
    n: "02",
    t: "Bridge",
    d: "Cross-chain routing and settlement. Liquidity-aware bridge selection, fees, finality, and fallback execution.",
  },
  {
    n: "03",
    t: "Rates",
    d: "Fused mid-price oracle. On-chain pools, CEX books, intent flow. Sub-second updates with confidence intervals.",
  }
];

export function Pillars() {
  return (
    <section className="shell py-24">
      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <span className="pixel-tag">Our stack</span>
          <h2 className="mt-5 text-[clamp(1.5rem,2.5vw,2rem)] leading-tight">
            Three primitives.<br />One interface.
          </h2>
          <p className="mt-5 text-muted leading-relaxed text-sm sm:text-base max-w-md">
            We build the boring infrastructure so apps can stop wiring twelve protocols together.
            Bring an intent, take back execution.
          </p>
        </div>
        <div className="lg:col-span-8 grid sm:grid-cols-3 gap-px bg-line border hairline">
          {PILLARS.map((p) => (
            <PillarCard key={p.n} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ n, t, d }: Pillar) {
  return (
    <div className="bg-bg p-6 sm:p-7">
      <div className="font-display text-[10px] tracking-widest text-accent">{n}</div>
      <div className="mt-3 font-display text-base">{t}</div>
      <p className="mt-3 text-sm text-muted leading-relaxed">{d}</p>
    </div>
  );
}
