import { PortraitGridSkeleton, Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div className="container-x py-16" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-14 w-2/3 max-w-xl" />
      <div className="mt-14">
        <PortraitGridSkeleton count={8} />
      </div>
    </div>
  );
}
