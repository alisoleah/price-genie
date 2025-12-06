import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ShoppingCart, 
  ExternalLink, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id ? parseInt(params.id) : 0;

  const { data: prices, isLoading } = trpc.products.getPrices.useQuery(
    { productId },
    { enabled: productId > 0 }
  );

  const addToBasketMutation = trpc.baskets.addItem.useMutation({
    onSuccess: () => {
      toast.success("Added to basket!");
    },
  });

  const handleAddToBasket = (platformName: string) => {
    // For MVP, we'll just show a toast
    toast.success(`Added to basket from ${platformName}`);
  };

  const getStalenessIcon = (staleness: string) => {
    switch (staleness) {
      case 'fresh':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'stale':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800 border-green-200">In Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-6">
          <Link href="/search">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
          <p className="text-center text-muted-foreground mt-12">
            No prices available for this product
          </p>
        </div>
      </div>
    );
  }

  const lowestPrice = Math.min(...prices.map(p => p.priceInAED));
  const productName = prices[0]?.rawTitle || "Product";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <Link href="/search">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Product Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{productName}</h1>
          
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">Best price:</span>
            <span className="price-large">{lowestPrice.toFixed(2)} AED</span>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Available on {prices.length} platform{prices.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Compare Prices</h2>
          
          {prices
            .sort((a, b) => a.priceInAED - b.priceInAED)
            .map((price, index) => (
              <Card key={price.rawProductId} className={index === 0 ? "border-primary border-2" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">
                          {price.platformName}
                        </h3>
                        {index === 0 && (
                          <Badge className="bg-primary text-primary-foreground">
                            Lowest Price
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">
                            {price.priceInAED.toFixed(2)} AED
                          </span>
                          {index > 0 && (
                            <span className="text-sm text-muted-foreground">
                              (+{(price.priceInAED - lowestPrice).toFixed(2)} AED)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          {getAvailabilityBadge(price.availability)}
                          
                          <div className="flex items-center gap-1">
                            {getStalenessIcon(price.staleness)}
                            <span className={`badge-${price.staleness} px-2 py-0.5 rounded text-xs`}>
                              {price.staleness === 'fresh' && 'Updated recently'}
                              {price.staleness === 'stale' && 'Updated today'}
                              {price.staleness === 'expired' && 'Outdated'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        disabled={price.availability === 'out_of_stock'}
                        onClick={() => handleAddToBasket(price.platformName)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={price.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Price Alert CTA */}
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Set Price Alert</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when price drops
                </p>
              </div>
              <Button variant="outline">
                Set Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
