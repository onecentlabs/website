export type DocLink = { href: string; title: string };

export const DOC_NAV: { title: string; items: DocLink[] }[] = [
  {
    title: "Start here",
    items: [
      { href: "/docs", title: "What is OneCent" },
      { href: "/docs/quickstart", title: "Quickstart" },
    ],
  },
  {
    title: "Router app",
    items: [
      { href: "/docs/trading", title: "Trading" },
      { href: "/docs/settings", title: "Settings & parameters" },
    ],
  },
  {
    title: "Developers",
    items: [
      { href: "/docs/api", title: "API access" },
      { href: "/docs/api/quote", title: "Quote API" },
      { href: "/docs/api/price", title: "Price API" },
    ],
  },
];

export const DOC_FLAT: DocLink[] = DOC_NAV.flatMap((g) => g.items);
