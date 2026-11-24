import Link from "next/link";
import type { SiteSettings } from "@/types";

export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  const s = settings?.socialLinks;
  const socials = [
    { label: "TikTok", href: s?.tiktok },
    { label: "Instagram", href: s?.instagram },
    { label: "YouTube", href: s?.youtube },
  ].filter((x) => x.href);

  return (
    <footer className="bg-ink text-paper">
      <div className="container-x py-16 sm:py-20">
        <p className="display max-w-2xl text-3xl leading-snug sm:text-4xl">
          {settings?.tagline ?? "5,000 people. 5,000 stories. One journey."}
        </p>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em]">The 5,000 People Project</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.34em] text-paper/50">No Introduction Needed</p>
          </div>
          <FooterList title="Explore">
            <Link href="/people">The People</Link>
            <Link href="/about">About the project</Link>
            <Link href="/#milestones">Milestones</Link>
          </FooterList>
          <FooterList title="Follow">
            {socials.length ? (
              socials.map((x) => (
                <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer">
                  {x.label} ↗
                </a>
              ))
            ) : (
              <span className="text-paper/50">Links coming soon</span>
            )}
          </FooterList>
          <FooterList title="Contact">
            <Link href="/contact">Get in touch</Link>
            <Link href="/privacy">Privacy policy</Link>
          </FooterList>
        </div>

        <p className="mt-16 border-t border-paper/15 pt-6 text-xs text-paper/50">
          © {new Date().getFullYear()} The 5,000 People Project · No Introduction Needed
        </p>
      </div>
    </footer>
  );
}

function FooterList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.28em] text-paper/50">{title}</p>
      <div className="mt-4 flex flex-col gap-2.5 text-sm [&_a]:w-fit [&_a]:text-paper/90 [&_a]:transition [&_a:hover]:text-paper [&_a:hover]:underline [&_a:hover]:underline-offset-4">
        {children}
      </div>
    </div>
  );
}
