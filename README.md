# The 5,000 People Project: Website

Next.js (App Router) + TypeScript + Tailwind CSS v4 + Axios + Lucide. The public site and admin dashboard for **The 5,000 People Project** by *No Introduction Needed*. It talks directly to the Express API in the separate `server` repository. There are no secrets in this repo.

## Requirements

- Node.js 20+
- The API running (see the server repo's README)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://localhost:3000
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `http://localhost:4000` (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of this site. Used for Open Graph, canonical URLs, the sitemap and robots.txt |

For production, set these two variables in your host's dashboard (Vercel: Project Settings → Environment Variables). `.env.production` is git-ignored; `.env.production.example` shows the shape. `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.

Admin lives at `/sharp` (redirects to `/sharp/login`). The admin account is created from the **server** repo with `npm run create-admin`.

## Scripts

`npm run dev`, `npm run build`, `npm start`, `npm run typecheck`

## Pages

- Public: `/`, `/people`, `/people/[number]`, `/about`, `/contact`, `/privacy`
- Admin (`/sharp`): login, overview, participants (list, new, edit, preview), settings
- SEO: `/sitemap.xml` (static pages + every published person, refreshed hourly), `/robots.txt`, favicon (`app/icon.svg`), default share image (`app/opengraph-image.tsx`)

The admin can manage participants (publish/unpublish, preview, media uploads) and site settings (name, tagline, About text, contact email, social links, featured people, hero image). Publishing requires the participant's consent, which the API enforces.

## Demo data

`public/demo/` holds placeholder SVGs used by the server's `seed:demo` script. They are only used if you run that script, and can be deleted along with it.

## Deployment

Deploy to Vercel, Netlify or similar. Set `NEXT_PUBLIC_API_URL` to the API's public URL and `NEXT_PUBLIC_SITE_URL` to this site's URL. On the API, set `CLIENT_ORIGIN` to this site's URL, and see the server README for the cookie settings that depend on whether the two share a parent domain.

## Structure

```
app/(site)/    public pages
app/sharp/     admin pages (URL is /sharp)
components/    reusable UI (+ admin/, ui/)
services/      Axios API calls (public.ts, admin.ts)
lib/ types/    helpers and shared types
```
