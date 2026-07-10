import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-bg/80 backdrop-blur">
      <div className="shell flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5" aria-label={site.name}>
          <Logo size={18} className="text-accent" />
          <span className="font-display text-[10px] tracking-[0.18em] uppercase">{site.name}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href="/router"
            className="font-display text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors px-3 py-2"
          >
            Router
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="font-display text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors px-3 py-2"
          >
            GitHub
          </a>
          <a href="/#contact" className="pixel-btn">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
