# OneCent Labs — Website

The OneCent Labs marketing site **and** the OneCent Router trading app, in one Next.js project.

- **Landing** (`/`) — what OneCent Labs is.
- **Router** (`/router`) — a swap/trade widget that finds the best on-chain route across venues and executes it in one transaction.

Built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, **TypeScript**, **wagmi/viem**, and **Sequence** for wallets.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

Requires Node 20+.

| Script          | What it does               |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Serve the production build |
| `npm run lint`  | ESLint                     |

---

## Environment

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is gitignored — **never commit real secrets**.

**Server-only** (no `NEXT_PUBLIC_` prefix — never shipped to the browser):

| Variable           | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `ONECENT_API_BASE` | Base URL of the core API (`/quote`, `/price`, `/usd`).  |
| `ONECENT_API_KEY`  | API key for the core API. Injected server-side only.    |
| `REGISTRY_BASE`    | Public token registry (token lists + logos).            |

**Client-visible** (safe to expose):

| Variable                                  | Purpose                                         |
| ----------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`    | WalletConnect project id (optional).            |
| `NEXT_PUBLIC_SEQUENCE_PROJECT_ACCESS_KEY` | Sequence WaaS access key (from sequence.build). |
| `NEXT_PUBLIC_SEQUENCE_WAAS_CONFIG_KEY`    | Sequence WaaS config key.                       |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`            | Google social login (optional; blank hides it). |

---

## How it works

The browser never talks to the core API or the token registry directly — it calls
same-origin routes under `/api/*`, and the server injects the upstream host + API
key. The key and the real endpoints never reach the client bundle or the Network panel.

```
browser ──▶ /api/g     ──▶ core API (/quote, /price, /usd)   [key-gated, server-side]
browser ──▶ /api/logo  ──▶ token/chain logo hosts            [SSRF-guarded, streamed]
```

Before sending a trade, the client pins the router contract to a known address and
refuses to approve or send funds anywhere else, so a bad quote can't redirect value.

---

## Project structure

```
src/
├── app/
│   ├── (site)/               Marketing site (landing, docs)
│   ├── (router)/             Router trading app (/router)
│   ├── api/
│   │   ├── g/route.ts        Same-origin proxy → core API (key-gated)
│   │   ├── logo/route.ts     Logo image proxy (SSRF-guarded)
│   │   └── og/route.tsx      OpenGraph image
│   ├── layout.tsx            Root layout (fonts, custom cursor)
│   └── globals.css           Design tokens + shared component styles
├── components/               Site chrome + landing sections
├── lib/                      Shared site config
└── router/                   Everything scoped to the Router app
    ├── components/           Swap widget, modals, wallet providers
    ├── hooks/                Token registry, balances, quote cycle
    └── lib/                  Chains, API client, formatting, address utils
```

Path aliases: `@/*` → `src/*`, `@r/*` → `src/router/*`.

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (design tokens as CSS variables, exposed via `@theme inline`)
- **wagmi** + **viem** for chain interaction
- **Sequence** (`@0xsequence/connect`) for wallet connection, including embedded (WaaS) wallets

---

## Deployment

Deploys as a standard Next.js app (e.g. Vercel). Set the environment variables above
in your host's project settings before building.
