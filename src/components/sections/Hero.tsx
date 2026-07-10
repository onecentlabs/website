import { Typewriter } from "@/components/ui/Typewriter";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="shell flex flex-col justify-center min-h-[calc(100dvh-3.5rem)] py-20">
      <div>
        <span className="pixel-tag">
          <span className="dot" /> Pre-launch
        </span>
        <h1 className="mt-8 text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.05] max-w-[16ch]">
          DeFi, abstracted.
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1rem,1.4vw,1.15rem)] text-muted leading-relaxed">
          {site.name} is a unified suite of on-chain and off-chain services that abstract away the
          complexity of DeFi. One clean interface for{" "}
          <Typewriter
            words={["pricing", "routing", "solving", "bridging", "yields", "perps"]}
            className="text-ink"
          />
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href={`mailto:${site.email}`} className="pixel-btn">
            Get early access ▶
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="pixel-btn pixel-btn-ghost"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
