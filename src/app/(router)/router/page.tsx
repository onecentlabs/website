import { SwapApp } from "@r/components/swap/SwapApp";

export default function Page() {
  return (
    <div className="relative h-full overflow-hidden">
      {/* Wide cinematic glow, centered behind the card. */}
      <div className="hero-glow" aria-hidden />

      <div className="relative mx-auto flex h-full max-w-5xl items-center justify-center px-6">
        <div className="w-full max-w-lg lg:w-[29rem]">
          <SwapApp />
        </div>
      </div>
    </div>
  );
}
