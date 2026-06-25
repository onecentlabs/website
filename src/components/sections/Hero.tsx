import { Typewriter } from "@/components/ui/Typewriter";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-24 sm:pt-36 pb-24 sm:pb-32">
        <span className="pixel-tag">
          <span className="dot" /> Pre-launch
        </span>
        <h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl leading-[1.05] max-w-4xl">
          DeFi, abstracted.
        </h1>
        <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">
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
