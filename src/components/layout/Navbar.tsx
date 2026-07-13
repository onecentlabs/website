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
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/docs" className="pixel-btn pixel-btn-ghost min-w-[7.5rem]">
            Docs
          </Link>
          <Link href="/router" className="pixel-btn min-w-[7.5rem]">
            Router
          </Link>
        </nav>
      </div>
    </header>
  );
}
