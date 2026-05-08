import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-32 border-t hairline">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted font-mono">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <div className="flex items-center gap-5">
          <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
          <a className="link" href={site.github} target="_blank" rel="noreferrer">github</a>
        </div>
      </div>
    </footer>
  );
}
