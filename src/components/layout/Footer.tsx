import { site } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t hairline">
      <div className="shell py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted font-mono">
        <div className="flex items-center gap-2.5">
          <Logo size={14} className="text-accent" />
          <span className="font-display text-[9px] tracking-[0.18em] uppercase text-ink/80">{site.name}</span>
          <span>· © {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-5">
          <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="link" href={site.github} target="_blank" rel="noreferrer">github</a>
        </div>
      </div>
    </footer>
  );
}
