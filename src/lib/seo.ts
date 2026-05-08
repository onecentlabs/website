import type { Metadata } from "next";
import { site } from "./site";

type Args = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
};

export function buildMetadata({ title, description, path = "/", image }: Args): Metadata {
  const url = new URL(path, site.url).toString();
  const desc = description ?? site.description;
  const ogImage = image ?? `/api/og?title=${encodeURIComponent(title)}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: site.name,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
      creator: site.twitter,
    },
  };
}
