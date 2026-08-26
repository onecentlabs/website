import { Typewriter } from "@/components/ui/Typewriter";
import { Reveal } from "@/components/effects/Reveal";

export function Hero() {
  return (
    <section>
      <div className="shell flex flex-col justify-center min-h-[calc(100dvh-3.5rem)] py-20">
      <Reveal>
        <h1 className="max-w-full text-[clamp(1.4rem,3.5vw,3.25rem)] leading-none tracking-tight">
          <span className="block whitespace-nowrap text-accent uppercase">One interface</span>
          <span className="mt-[0.6em] ml-[1ch] block whitespace-nowrap uppercase sm:ml-[4.75ch]">
            For onchain markets
          </span>
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
            Request access
          </a>
        </div>
      </Reveal>
      </div>
    </section>
  );
}
