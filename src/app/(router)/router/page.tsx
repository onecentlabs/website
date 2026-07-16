import { SwapApp } from "@r/components/swap/SwapApp";

export default function Page() {
  return (
    <div className="relative min-h-full md:h-full md:overflow-hidden">
      {/* Wide cinematic glow, centered behind the card. */}
      <div className="hero-glow" aria-hidden />

      {/* Mobile: top-aligned with breathing room and natural scroll. Desktop:
          vertically centered in the fixed viewport. */}
      <div className="relative mx-auto flex min-h-full max-w-5xl items-start justify-center px-4 py-5 sm:px-6 md:items-center md:py-0">
        <div className="w-full max-w-lg lg:w-[31rem]">
          <SwapApp />
        </div>
      </div>
    </div>
  );
}
