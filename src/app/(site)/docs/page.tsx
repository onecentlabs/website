import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs",
  description: "OneCent Labs documentation — coming soon.",
};

export default function DocsPage() {
  return (
    <section>
      <div className="shell flex flex-col justify-center items-center text-center min-h-[calc(100dvh-3.5rem)] py-20">
        <span className="pixel-tag">Docs</span>
        <div className="mt-8 font-display text-[clamp(0.85rem,1.6vw,1.15rem)] leading-relaxed">
          <span className="text-muted select-none">&gt;&nbsp;</span>
          <span className="text-accent">docs --status: in progress_</span>
        </div>
        <p className="mt-6 max-w-md text-muted">
          Guides and API references for the OneCent router are being written.
        </p>
      </div>
    </section>
  );
}
