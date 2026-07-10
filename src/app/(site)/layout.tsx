import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CursorTrail } from "@/components/effects/CursorTrail";
import { site } from "@/lib/site";

const press = Press_Start_2P({
  weight: "400",
  variable: "--font-press",
  subsets: ["latin"],
  display: "swap",
});

const vt = VT323({
  weight: "400",
  variable: "--font-vt",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

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
  sameAs: [site.github],
  description: site.description,
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${press.variable} ${vt.variable} ${inter.variable}`}>
      <body className="min-h-dvh flex flex-col bg-grid">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:pixel-btn focus:z-50"
        >
          Skip to content
        </a>
        <CursorTrail />
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(orgJsonLd)}
        </Script>
        <Script id="ld-site" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(siteJsonLd)}
        </Script>
      </body>
    </html>
  );
}
