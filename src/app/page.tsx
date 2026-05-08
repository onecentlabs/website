import { Counter } from "@/components/Counter";
import { Typewriter } from "@/components/Typewriter";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <section className="relative">
        <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-24 sm:pt-36 pb-24 sm:pb-32">
          <span className="pixel-tag"><span className="dot" /> Pre-launch</span>
          <h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl leading-[1.05] max-w-4xl">
            DeFi, abstracted.
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">
            {site.name} is a unified suite of on-chain and off-chain services that abstract away the
            complexity of DeFi. One clean interface for{" "}
            <Typewriter
              words={["intents", "rates", "settlements", "yields", "swaps"]}
              className="text-ink"
            />
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href={`mailto:${site.email}`} className="pixel-btn">Get early access ▶</a>
            <a href={site.github} target="_blank" rel="noreferrer" className="pixel-btn pixel-btn-ghost">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="border-y hairline">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          <Kpi
            label="Settled volume"
            value={<Counter value={4_328_194_720} format="money-compact" />}
            sub="Across testnet + simulated batches"
          />
          <Kpi
            label="Transactions settled"
            value={<Counter value={1_284_512} format="compact" />}
            sub="Routed, quoted, and submitted"
          />
          <Kpi
            label="Median latency"
            value={<><Counter value={68} format="full" /><span className="text-muted text-2xl"> ms</span></>}
            sub="Quote → plan, p50"
          />
        </div>
      </section>

      {/* What we do */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-24">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="pixel-tag">The stack</span>
            <h2 className="mt-5 text-2xl sm:text-3xl leading-tight">
              Three primitives.<br />One interface.
            </h2>
            <p className="mt-5 text-muted leading-relaxed text-sm sm:text-base max-w-md">
              We build the boring infrastructure so apps can stop wiring twelve protocols together.
              Bring an intent — get back execution.
            </p>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-px bg-line border hairline">
            <Pillar
              n="01"
              t="Router"
              d="Multi-hop, multi-venue path finding across AMMs, CLOBs, RFQ. Order splitting and gas-aware execution."
            />
            <Pillar
              n="02"
              t="Rates"
              d="Fused mid-price oracle. On-chain pools, CEX books, intent flow. Sub-second updates with confidence intervals."
            />
            <Pillar
              n="03"
              t="Search"
              d="High-throughput pathfinder for solver competitions. MEV-aware pruning, deadline-bound, anytime."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-24">
        <span className="pixel-tag">Flow</span>
        <h2 className="mt-5 text-2xl sm:text-3xl">From intent to settlement.</h2>
        <ol className="mt-10 grid sm:grid-cols-4 gap-px bg-line border hairline">
          {[
            { n: "01", t: "Intent", d: "Order arrives via SDK or CoW batch." },
            { n: "02", t: "Quote", d: "Fused mid-price + confidence band." },
            { n: "03", t: "Search", d: "Beam search, pruned by gas + risk." },
            { n: "04", t: "Settle", d: "Surplus-maximizing plan submitted." },
          ].map((s) => (
            <li key={s.n} className="bg-bg p-6">
              <div className="font-display text-[10px] tracking-widest text-accent">{s.n}</div>
              <div className="mt-3 font-display text-sm">{s.t}</div>
              <p className="mt-2 text-sm text-muted leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-24 text-center">
        <h2 className="text-2xl sm:text-4xl max-w-2xl mx-auto leading-tight">
          Build on top.<br />Not around.
        </h2>
        <p className="mt-5 text-muted max-w-xl mx-auto">
          We&apos;re onboarding design partners. Solvers, wallets, and exchanges welcome.
        </p>
        <div className="mt-8 flex justify-center">
          <a href={`mailto:${site.email}`} className="pixel-btn">{site.email}</a>
        </div>
      </section>
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div>
      <div className="font-display text-[10px] tracking-widest uppercase text-muted">{label}</div>
      <div className="mt-3 text-4xl sm:text-5xl lg:text-6xl text-ink">{value}</div>
      <div className="mt-3 text-xs text-muted">{sub}</div>
    </div>
  );
}

function Pillar({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="bg-bg p-6 sm:p-7">
      <div className="font-display text-[10px] tracking-widest text-accent">{n}</div>
      <div className="mt-3 font-display text-base">{t}</div>
      <p className="mt-3 text-sm text-muted leading-relaxed">{d}</p>
    </div>
  );
}
