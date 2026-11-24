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
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10">
      {/* The blur lives on its own layer: backdrop-filter on the header itself would make the
          fixed mobile menu size itself against the 64px header instead of the screen. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-paper/85 backdrop-blur-md" />
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 flex-col leading-none" aria-label="The 5,000 People Project — home">
          <span className="truncate text-[12px] font-semibold uppercase tracking-[0.16em] min-[380px]:text-[13px] min-[380px]:tracking-[0.22em]">
            The 5,000 People
          </span>
          <span className="mt-1 truncate text-[8px] uppercase tracking-[0.26em] text-stone min-[380px]:text-[9px] min-[380px]:tracking-[0.34em]">
            No Introduction Needed
          </span>
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
          className="-mr-2 flex size-11 shrink-0 items-center justify-center md:hidden"
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
          className="fixed inset-x-0 top-16 bottom-0 animate-fade overflow-y-auto overscroll-contain bg-ink px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 text-paper md:hidden"
        >
          <ul className="space-y-1">
            {links.map((l, i) => (
              <li key={l.href} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                <Link href={l.href} className="display block border-b border-paper/15 py-4 text-3xl min-[380px]:py-5 min-[380px]:text-4xl" onClick={() => setOpen(false)}>
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
