"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_FLAT, DOC_NAV } from "./nav";

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs">
      {DOC_NAV.map((group) => (
        <div key={group.title} className="doc-nav-group">
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

/** Mobile: one flat, horizontally scrollable strip instead of the sidebar. */
export function DocsMobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs" className="lg:hidden overflow-x-auto no-scrollbar border-b hairline">
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

/** Previous / next links at the foot of a page, derived from the nav order. */
export function DocsPager() {
  const pathname = usePathname();
  const i = DOC_FLAT.findIndex((d) => d.href === pathname);
  if (i === -1) return null;
  const prev = DOC_FLAT[i - 1];
  const next = DOC_FLAT[i + 1];
  return (
    <div className="mt-16 flex flex-wrap justify-between gap-4 border-t hairline pt-6">
      {prev ? <PagerLink dir="Previous" {...prev} /> : <span />}
      {next && <PagerLink dir="Next" align="right" {...next} />}
    </div>
  );
}

function PagerLink({
  dir,
  href,
  title,
  align,
}: DocLinkProps) {
  return (
    <Link href={href} className={`group ${align === "right" ? "text-right" : ""}`}>
      <span className="pixel-tag">{dir}</span>
      <span className="mt-1.5 block text-sm text-muted transition-colors group-hover:text-accent">
        {title}
      </span>
    </Link>
  );
}

type DocLinkProps = {
  dir: string;
  href: string;
  title: string;
  align?: "right";
};
