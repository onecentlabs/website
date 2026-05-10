type Step = { n: string; t: string; d: string };

const STEPS: Step[] = [
  { n: "01", t: "Intent", d: "Order arrives via SDK or CoW batch." },
  { n: "02", t: "Quote", d: "Fused mid-price + confidence band." },
  { n: "03", t: "Search", d: "Beam search, pruned by gas + risk." },
  { n: "04", t: "Settle", d: "Surplus-maximizing plan submitted." },
];

export function Flow() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-24">
      <span className="pixel-tag">Flow</span>
      <h2 className="mt-5 text-2xl sm:text-3xl">From intent to settlement.</h2>
      <ol className="mt-10 grid sm:grid-cols-4 gap-px bg-line border hairline">
        {STEPS.map((s) => (
          <li key={s.n} className="bg-bg p-6">
            <div className="font-display text-[10px] tracking-widest text-accent">{s.n}</div>
            <div className="mt-3 font-display text-sm">{s.t}</div>
            <p className="mt-2 text-sm text-muted leading-relaxed">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
