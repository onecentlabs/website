import type { Metadata, Viewport } from "next";
import { Inter, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@r/components/providers/Web3Provider";
import { CursorTrail } from "@r/components/effects/CursorTrail";
import { Guards } from "@r/components/effects/Guards";
import { RouterNav } from "@r/components/layout/RouterNav";
import { site } from "@r/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mono = VT323({ weight: "400", variable: "--font-mono", subsets: ["latin"], display: "swap" });
const pixel = Press_Start_2P({ weight: "400", variable: "--font-pixel", subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  icons: { icon: "/icon.svg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${pixel.variable}`}>
      <body className="h-dvh overflow-hidden flex flex-col bg-grid">
        <Web3Provider>
          <Guards />
          <CursorTrail />
          <RouterNav />
          <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
