import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

// Mirrors Next.js's default not-found layout (404 │ message, system font),
// with a subtle "Back home" link added below.
export default function NotFound() {
  return (
    <div
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      className="min-h-dvh flex items-center justify-center px-6"
    >
      <div className="text-center">
        <div className="inline-flex items-center">
          <h1
            className="text-ink"
            style={{
              margin: "0 20px 0 0",
              padding: "0 23px 0 0",
              fontSize: 24,
              fontWeight: 500,
              lineHeight: "49px",
              borderRight: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            404
          </h1>
          <h2 className="text-muted" style={{ fontSize: 14, fontWeight: 400, lineHeight: "49px", margin: 0 }}>
            Page not found
          </h2>
        </div>
        <div className="mt-6">
          <Link
            href="/"
            className="text-[13px] text-muted underline underline-offset-4 hover:text-ink transition-colors"
          >
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
