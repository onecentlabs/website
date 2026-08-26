"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_FLAT, DOC_NAV } from "./nav";

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs">
      {DOC_NAV.map((group) => (
        <div className="doc-nav-group" key={group.title}>
          <span className="doc-nav-title">{group.title}</span>
          <div className="mt-3">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="doc-nav-link"
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DocsMobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Docs"
      className="lg:hidden overflow-x-auto no-scrollbar border-b hairline"
    >
      <div className="flex w-max gap-5 pb-3">
        {DOC_FLAT.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className="whitespace-nowrap text-sm text-muted aria-[current=page]:text-accent"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function DocsPager() {
  const pathname = usePathname();
  const i = DOC_FLAT.findIndex((d) => d.href === pathname);
  if (i === -1) return null;
  const prev = i > 0 ? DOC_FLAT[i - 1] : null;
  const next = i < DOC_FLAT.length - 1 ? DOC_FLAT[i + 1] : null;

  return (
    <div className="mt-16 flex flex-wrap justify-between gap-4 border-t hairline pt-6">
      {prev ? (
        <Link href={prev.href} className="group">
          <span className="pixel-tag">Previous</span>
          <span className="mt-1.5 block text-sm text-muted transition-colors group-hover:text-accent">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="group text-right">
          <span className="pixel-tag">Next</span>
          <span className="mt-1.5 block text-sm text-muted transition-colors group-hover:text-accent">
            {next.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
