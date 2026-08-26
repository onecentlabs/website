import type { Metadata } from "next";
import { DocsMobileNav, DocsPager, DocsSidebar } from "./DocsNav";

export const metadata: Metadata = {
  title: { default: "Docs", template: "%s · Docs · OneCent Labs" },
};

export default function DocsLayout(props: LayoutProps<"/docs">) {
  return (
    <div className="shell py-12 sm:py-16">
      <DocsMobileNav />
      <div className="flex gap-12 xl:gap-20">
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-[calc(56px+3rem)]">
            <DocsSidebar />
          </div>
        </aside>
        <div className="min-w-0 flex-1 pt-8 lg:pt-0">
          {props.children}
          <DocsPager />
        </div>
      </div>
    </div>
  );
}
