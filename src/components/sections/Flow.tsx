import { Reveal } from "@/components/effects/Reveal";

type Step = { n: string; t: string; d: string };

const STEPS: Step[] = [
  { n: "01", t: "Intent", d: "Your order arrives through the SDK." },
  { n: "02", t: "Search", d: "Beam search prunes routes by gas and risk." },
  { n: "03", t: "Quote", d: "A fused mid-price sets the quote and its confidence band." },
  { n: "04", t: "Settle", d: "The surplus-maximizing plan is submitted on-chain." },
];

export function Flow() {
  return (
    <section className="shell pb-24">
      <Reveal>
        <span className="pixel-tag">Execution Flow</span>
        <h2 className="mt-5 text-[clamp(1.5rem,2.5vw,2rem)]">From intent to settlement.</h2>
      </Reveal>
      <Reveal delay={120}>
        <ol className="mt-10 grid sm:grid-cols-4 gap-px bg-line border hairline">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-bg p-6 sm:p-7 transition-colors duration-200 hover:bg-bg-2">
              <div className="font-display text-[10px] tracking-widest text-accent">{s.n}</div>
              <div className="mt-3 font-display text-sm">{s.t}</div>
              <p className="mt-3 text-sm text-muted leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
