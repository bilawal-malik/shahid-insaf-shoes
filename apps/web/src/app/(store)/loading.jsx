import { ProductGridSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function StoreLoading() {
  return (
    <div className="container-app py-6 lg:py-8">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-5 h-8 w-72" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-8">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
