import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { DOC_FLAT } from "./(site)/docs/nav";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: site.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...DOC_FLAT.map((doc) => ({
      url: `${site.url}${doc.href}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
