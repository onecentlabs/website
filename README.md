# OneCent Labs — Website

Marketing site for OneCent Labs. Next.js 16 (App Router), Tailwind CSS v4, TypeScript.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint         # ESLint
```

## Project layout

```
src/
├── app/                          Next.js App Router
│   ├── api/og/route.tsx          Edge OG image generator
│   ├── globals.css               Design tokens + pixel components
│   ├── icon.svg                  Favicon (pixel cent)
│   ├── layout.tsx                Root layout: fonts, metadata, JSON-LD
│   ├── page.tsx                  Home (composes sections)
│   ├── robots.ts                 robots.txt route
│   └── sitemap.ts                sitemap.xml route
├── components/
│   ├── effects/                  Visual effects (cursor, particles)
│   │   └── CursorTrail.tsx
│   ├── layout/                   Site chrome
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   ├── sections/                 Page-level composable sections
│   │   ├── Cta.tsx
│   │   ├── Flow.tsx
│   │   ├── Hero.tsx
│   │   ├── KpiStrip.tsx
│   │   └── Pillars.tsx
│   └── ui/                       Reusable primitives
│       ├── Counter.tsx           Count-up animation
│       ├── Logo.tsx              Pixel cent mark
│       └── Typewriter.tsx        Rotating typed text
└── lib/
    ├── seo.ts                    buildMetadata helper for sub-pages
    └── site.ts                   Brand config (name, urls, keywords)
```

## Design system

Tokens live as CSS variables in `globals.css` and are exposed to Tailwind via `@theme inline` (Tailwind v4). Use them as `bg-bg`, `text-ink`, `text-accent`, `border-line`, etc.

| Token            | Value      | Use                              |
| ---------------- | ---------- | -------------------------------- |
| `--bg`           | `#0a0b0d`  | Page background                  |
| `--bg-2/-3`      | dark       | Cards, code blocks               |
| `--ink`          | `#f4f5f7`  | Primary text                     |
| `--muted`        | `#8a8f99`  | Secondary text                   |
| `--line`         | `#1f232b`  | Borders, hairlines               |
| `--accent`       | `#b6ff3c`  | Primary accent (lime)            |
| `--accent-2`     | `#43e7ff`  | Secondary accent (cyan)          |
| `--warn`         | `#ff5d8f`  | Cursor hover state               |

Custom utility classes (in `globals.css`):

- `.pixel-btn`, `.pixel-btn-ghost` — primary buttons
- `.pixel-tag` — eyebrow labels
- `.dot`, `.hairline`, `.bg-grid` — primitives
- `.kpi-num` — tabular mono digits (Counter)
- `.tw-cursor` — typewriter blink (Typewriter)
- `.cursor-pixel` — custom cursor element (CursorTrail)

## Adding pages

Drop a folder under `src/app/<route>/page.tsx`. Use `buildMetadata()` from `@/lib/seo` for SEO, and add the path to `sitemap.ts`.

```tsx
// src/app/docs/page.tsx
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs",
  description: "API reference and guides.",
  path: "/docs",
});

export default function DocsPage() { /* ... */ }
```

## Adding a new section to home

Create `src/components/sections/MySection.tsx`, then drop it into `src/app/page.tsx`:

```tsx
import { MySection } from "@/components/sections/MySection";
// ...
<Hero />
<MySection />
```

## Roadmap (scaffold-ready)

- `src/content/` — MDX blog/docs (add `next-mdx-remote` or `contentlayer`)
- `src/app/(docs)/` — route group for docs with shared layout
- `src/components/ui/` — additional primitives (PixelCard, Section wrapper, etc) when reused 2+ times
- `src/lib/analytics.ts` — page-view + event tracking
- Storybook for `components/ui/` primitives

## Conventions

- **One component per file**, named after the file
- **Section components** own their data; promote to `lib/` only when shared
- **No inline `style` in components** unless dynamic; everything else via Tailwind or `globals.css`
- **`use client`** only when component needs DOM events, refs, or state
- **`currentColor`** for icon SVGs so they inherit text color

## Deployment

Built for Vercel. The `/api/og` route uses the Edge runtime; everything else is statically rendered.
