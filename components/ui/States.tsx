import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded-md bg-sand ${className}`} aria-hidden />;
}

export function PortraitGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="mt-4 h-3 w-1/3" />
          <Skeleton className="mt-2 h-5 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="display text-3xl">{title}</p>
      {children && <p className="mt-3 text-stone">{children}</p>}
      {action && (
        <Link href={action.href} className="btn-outline mt-7">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ErrorState({ message = "We couldn't load this right now." }: { message?: string }) {
  return (
    <div role="alert" className="mx-auto max-w-md py-20 text-center">
      <AlertTriangle className="mx-auto size-8 text-ember" />
      <p className="display mt-4 text-3xl">Something went wrong</p>
      <p className="mt-3 text-stone">{message} Please refresh the page or try again in a moment.</p>
    </div>
  );
}
