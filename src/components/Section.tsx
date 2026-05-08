import { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div" | "main" | "article";
};

export function Section({ children, className, id, as = "section" }: Props) {
  const Tag = as;
  return (
    <Tag id={id} className={clsx("relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24", className)}>
      {children}
    </Tag>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <header className={clsx("mb-10 sm:mb-14 max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <span className="pixel-tag pixel-tag-cyan">{eyebrow}</span>}
      <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl leading-tight">{title}</h2>
      {description && <p className="mt-4 text-muted text-base sm:text-lg leading-relaxed">{description}</p>}
    </header>
  );
}
