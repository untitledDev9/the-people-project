"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, LogOut, Plus, Settings, Users } from "lucide-react";
import { api, isUnauthorized } from "@/lib/api";
import * as admin from "@/services/admin";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/States";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/participants", label: "Participants", icon: Users, exact: false },
  { href: "/admin/participants/new", label: "Add Participant", icon: Plus, exact: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const isLogin = pathname === "/admin/login";
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(!isLogin);

  // Any 401 from an admin call sends the user back to sign in.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (err) => {
        const url: string = err?.config?.url ?? "";
        if (isUnauthorized(err) && !url.includes("/auth/login")) {
          setEmail(null);
          router.replace("/admin/login");
        }
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [router]);

  useEffect(() => {
    if (isLogin) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    admin
      .me()
      .then((u) => !cancelled && setEmail(u.email))
      .catch(() => !cancelled && router.replace("/admin/login"))
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [isLogin, router]);

  async function onLogout() {
    try {
      await admin.logout();
    } finally {
      toast.success("Signed out");
      router.replace("/admin/login");
    }
  }

  if (isLogin) return <>{children}</>;

  if (checking || !email) {
    return (
      <div className="container-x py-16" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  }

  const active = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/admin/participants/new";

  return (
    <div className="min-h-dvh bg-paper md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-ink/10 bg-ink text-paper md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 md:block md:py-8">
          <Link href="/admin" className="block leading-none">
            <span className="text-[13px] font-semibold uppercase tracking-[0.22em]">5,000 People</span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.34em] text-paper/50">Admin</span>
          </Link>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm text-paper/70 hover:text-paper md:hidden" aria-label="Log out">
            <LogOut className="size-4" /> Logout
          </button>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {nav.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href, exact) ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active(href, exact) ? "bg-paper text-ink" : "text-paper/70 hover:bg-paper/10 hover:text-paper"
              }`}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
          <Link href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-paper/70 hover:bg-paper/10 hover:text-paper">
            View site ↗
          </Link>
        </nav>
        <div className="hidden border-t border-paper/15 p-4 md:block">
          <p className="truncate text-xs text-paper/50">{email}</p>
          <button onClick={onLogout} className="mt-3 flex items-center gap-2 text-sm text-paper/80 hover:text-paper">
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>
      <div className="min-w-0 px-5 py-8 sm:px-8 md:px-12 md:py-12">{children}</div>
    </div>
  );
}
