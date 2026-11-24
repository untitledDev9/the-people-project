import type { NextConfig } from "next";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The browser talks to /api on THIS domain and Next forwards it to the Express API. That keeps the
  // admin session cookie first-party, so it is not dropped by Safari / Brave / Chrome incognito, which
  // block cookies set by a different domain (e.g. onrender.com while the site is on vercel.app).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
