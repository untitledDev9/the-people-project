import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The admin area is deliberately NOT listed here (robots.txt is public). It is kept out of
    // search results by the noindex metadata in app/sharp/layout.tsx instead.
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
