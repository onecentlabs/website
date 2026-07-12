import { Reveal } from "@/components/effects/Reveal";

type Pillar = { n: string; t: string; d: string };

const PILLARS: Pillar[] = [
  {
    n: "01",
    t: "Router",
    d: "Searches every venue and every path at once — AMMs, order books, RFQ. Orders are split and gas is priced in, so the route returned is the route worth taking.",
  },
  {
    n: "02",
    t: "Bridge",
    d: "Moves value across chains with liquidity-aware bridge selection — fees, finality, and fallbacks handled for you.",
  },
  {
    n: "03",
    t: "Rates",
    d: "A fused mid-price from on-chain pools, CEX books, and intent flow — sub-second updates with confidence bands.",
  }
];

export function Pillars() {
  return (
    <section className="shell py-24">
      <div className="grid lg:grid-cols-12 gap-10">
        <Reveal className="lg:col-span-4">
          <span className="pixel-tag">Our stack</span>
          <h2 className="mt-5 text-[clamp(1.5rem,2.5vw,2rem)] leading-tight">
            Three primitives.<br />One interface.
          </h2>
          <p className="mt-5 text-muted leading-relaxed text-sm sm:text-base max-w-md">
            The best price in DeFi is scattered across hundreds of venues. We aggregate it
            behind one interface — you name the outcome, we handle the execution.
          </p>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-8 grid sm:grid-cols-3 gap-px bg-line border hairline">
          {PILLARS.map((p) => (
            <PillarCard key={p.n} {...p} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function PillarCard({ n, t, d }: Pillar) {
  return (
    <div className="bg-bg p-6 sm:p-7 transition-colors duration-200 hover:bg-bg-2">
      <div className="font-display text-[10px] tracking-widest text-accent">{n}</div>
      <div className="mt-3 font-display text-base">{t}</div>
      <p className="mt-3 text-sm text-muted leading-relaxed">{d}</p>
    </div>
  );
}
