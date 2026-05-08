import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./Logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 h-14">
        <Link href="/" className="flex items-center gap-2.5" aria-label={site.name}>
          <Logo size={20} />
          <span className="font-display text-[10px] tracking-[0.18em] uppercase">{site.name}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="font-display text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors px-3 py-2"
          >
            GitHub
          </a>
          <a href={`mailto:${site.email}`} className="pixel-btn">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
