import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Web3Provider } from "@r/components/providers/Web3Provider";
import { Guards } from "@r/components/effects/Guards";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectButton } from "@r/components/swap/ConnectButton";
import { site } from "@r/lib/site";

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

export default function RouterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-router bg-grid h-dvh overflow-hidden flex flex-col">
      <Web3Provider>
        <Guards />
        <Navbar
          actions={
            <>
              <Link href="/docs" className="pixel-btn pixel-btn-ghost min-w-0 sm:min-w-[7.5rem]">
                Docs
              </Link>
              <ConnectButton />
            </>
          }
        />
        <main className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden">{children}</main>
      </Web3Provider>
    </div>
  );
}
