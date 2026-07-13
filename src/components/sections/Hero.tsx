import { Typewriter } from "@/components/ui/Typewriter";
import { Reveal } from "@/components/effects/Reveal";

export function Hero() {
  return (
    <section>
      <div className="shell flex flex-col justify-center min-h-[calc(100dvh-3.5rem)] py-20">
      <Reveal>
        <h1 className="text-[clamp(2.75rem,6.5vw,5.25rem)] leading-[1.08] tracking-tight max-w-[16ch]">
          DeFi, <span className="text-accent">abstracted</span>.
        </h1>
        <div
          className="mt-10 sm:mt-14 font-mono text-[clamp(1.35rem,2vw,1.7rem)] leading-none"
          aria-live="polite"
        >
          <span className="text-muted select-none">&gt;&nbsp;</span>
          <Typewriter
            words={["pricing", "routing", "solving", "bridging", "yields"]}
            className="text-accent"
          />
        </div>
        <div className="mt-16 sm:mt-24 flex flex-wrap items-center gap-6">
          <a href="#contact" className="pixel-btn min-w-[15.5rem] justify-center">
            Request early access
          </a>
        </div>
      </Reveal>
      </div>
    </section>
  );
}
