import { site } from "@/lib/site";

export function Cta() {
  return (
    <section className="shell pb-24 text-center">
      <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] max-w-2xl mx-auto leading-tight">
        Build on top.<br />Not around.
      </h2>
      <p className="mt-5 text-muted max-w-xl mx-auto">
        We&apos;re onboarding design partners. Solvers, wallets, and exchanges welcome.
      </p>
      <div className="mt-8 flex justify-center">
        <a href={`mailto:${site.email}`} className="pixel-btn">
          {site.email}
        </a>
      </div>
    </section>
  );
}
