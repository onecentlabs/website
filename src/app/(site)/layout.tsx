import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: site.keywords,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    images: [{ url: "/api/og", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    creator: site.twitter,
    images: ["/api/og"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  category: "technology",
  icons: { icon: "/icon.svg" },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/icon.svg`,
  description: site.description,
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-site bg-grid min-h-dvh flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:pixel-btn focus:z-50"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(orgJsonLd)}
      </Script>
      <Script id="ld-site" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(siteJsonLd)}
      </Script>
    </div>
  );
}
