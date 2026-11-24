"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/people", label: "The People" },
  { href: "/about", label: "About" },
  { href: "/#follow", label: "Follow the Journey" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex flex-col leading-none" aria-label="The 5,000 People Project — home">
          <span className="text-[13px] font-semibold uppercase tracking-[0.22em]">The 5,000 People</span>
          <span className="mt-1 text-[9px] uppercase tracking-[0.34em] text-stone">No Introduction Needed</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`text-sm tracking-wide transition hover:text-ember ${
                isActive(l.href) ? "text-ink underline underline-offset-8" : "text-ink/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          className="-mr-2 flex size-11 items-center justify-center md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="fixed inset-x-0 top-16 bottom-0 animate-fade bg-ink px-6 pt-10 text-paper md:hidden"
        >
          <ul className="space-y-1">
            {links.map((l, i) => (
              <li key={l.href} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                <Link href={l.href} className="display block border-b border-paper/15 py-5 text-4xl" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
