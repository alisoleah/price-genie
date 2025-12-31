import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        {/* Image skeleton */}
        <div className="aspect-square bg-muted animate-shimmer" />
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-shimmer w-3/4" />
          <div className="h-4 bg-muted rounded animate-shimmer w-1/2" />
        </div>
        
        {/* Price skeleton */}
        <div className="h-6 bg-muted rounded animate-shimmer w-1/3" />
        
        {/* Platform badges skeleton */}
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-muted rounded-full animate-shimmer" />
          <div className="h-5 w-16 bg-muted rounded-full animate-shimmer" />
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {/* Button skeleton */}
        <div className="h-10 bg-muted rounded animate-shimmer w-full" />
      </CardFooter>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
