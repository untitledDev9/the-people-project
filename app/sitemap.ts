import type { MetadataRoute } from "next";
import { pad } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { getParticipants } from "@/services/public";

// Rebuilt at most once an hour so new people appear without a redeploy.
export const revalidate = 3600;

const PAGE_SIZE = 48; // API maximum
const MAX_PAGES = 200; // safety cap (9,600 people) for a 5,000-person project

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/people`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const people: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    let totalPages = 1;
    do {
      const res = await getParticipants({ page, limit: PAGE_SIZE, sort: "oldest" });
      totalPages = res.totalPages;
      for (const p of res.items) {
        people.push({ url: `${SITE_URL}/people/${pad(p.number)}`, changeFrequency: "monthly", priority: 0.7 });
      }
      page += 1;
    } while (page <= totalPages && page <= MAX_PAGES);
  } catch (err) {
    // API unreachable at build/request time: still serve the static pages.
    console.error("Sitemap: could not load participants", err);
  }

  return [...staticPages, ...people];
}
