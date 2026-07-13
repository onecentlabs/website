import { Press_Start_2P, VT323, Inter } from "next/font/google";
import "./globals.css";
import { CursorTrail } from "@/components/effects/CursorTrail";

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

// Single root layout: navigating between the landing pages and /router is a
// client-side transition (no full document reload), so the custom cursor
// never resets to the native one. Each route group renders its own chrome
// (nav, footer, providers) and token scope (.app-site / .app-router).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${press.variable} ${vt.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <CursorTrail />
        {children}
      </body>
    </html>
  );
}
