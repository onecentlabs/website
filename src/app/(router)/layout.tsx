import type { Metadata, Viewport } from "next";
import { Web3Provider } from "@r/components/providers/Web3Provider";
import { Guards } from "@r/components/effects/Guards";
import { RouterNav } from "@r/components/layout/RouterNav";
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
        <RouterNav />
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </Web3Provider>
    </div>
  );
}
