import { Typewriter } from "@/components/ui/Typewriter";
import { Reveal } from "@/components/effects/Reveal";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="bg-grid">
      <div className="shell flex flex-col justify-center min-h-[calc(100dvh-3.5rem)] py-20">
      <Reveal>
        <span className="pixel-tag">
          <span className="dot" /> Pre-launch
        </span>
        <h1 className="mt-8 text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.05] max-w-[16ch]">
          DeFi, <span className="text-accent">abstracted</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1rem,1.4vw,1.15rem)] text-muted leading-relaxed">
          One platform. Every primitive.
        </p>
        <div className="mt-7 font-mono text-[clamp(1.35rem,2vw,1.7rem)] leading-none" aria-live="polite">
          <span className="text-muted select-none">&gt;&nbsp;</span>
          <Typewriter
            words={["pricing", "routing", "solving", "bridging", "yields", "perps"]}
            className="text-accent"
          />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <a href="#contact" className="pixel-btn min-w-[15.5rem] justify-center">
            Request early access
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="pixel-btn pixel-btn-ghost min-w-[15.5rem] justify-center"
          >
            View on GitHub
          </a>
        </div>
      </Reveal>
      </div>
    </section>
  );
}
