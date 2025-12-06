import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Sparkles, 
  TrendingDown,
  ExternalLink,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Basket() {
  const { user, isAuthenticated } = useAuth();
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // Mock basket items for demo
  const mockBasketItems = [
    { id: 1, productId: 1, productName: "Apple iPhone 13 Pro Max 256GB Blue", quantity: 1 },
    { id: 2, productId: 6, productName: "Almarai Fresh Milk Full Cream 1L", quantity: 2 },
    { id: 3, productId: 7, productName: "Organic Eggs Large 12 Pack", quantity: 1 },
  ];

  const optimizeMutation = trpc.baskets.optimize.useMutation({
    onSuccess: (data) => {
      setOptimizationResult(data);
      setOptimizing(false);
      toast.success("Basket optimized!");
    },
    onError: () => {
      setOptimizing(false);
      toast.error("Failed to optimize basket");
    },
  });

  const handleOptimize = () => {
    if (!isAuthenticated) {
      toast.error("Please login to optimize your basket");
      return;
    }

    setOptimizing(true);
    optimizeMutation.mutate({
      items: mockBasketItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container py-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </header>

        <div className="container py-12 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login to view your basket</h2>
          <p className="text-muted-foreground mb-6">
            Save items and optimize your shopping across platforms
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/search">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">My Basket</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Basket Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Items ({mockBasketItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockBasketItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2">{item.productName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Optimize Button */}
        <Button 
          className="w-full h-12 text-base" 
          size="lg"
          onClick={handleOptimize}
          disabled={optimizing}
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {optimizing ? "Optimizing..." : "Optimize Basket"}
        </Button>

        {/* Optimization Results */}
        {optimizationResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Optimized Shopping Plan</h2>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  {(optimizationResult.totalCost / 100).toFixed(2)} AED
                </p>
              </div>
            </div>

            {optimizationResult.warnings && optimizationResult.warnings.length > 0 && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    Optimization Notes:
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    {optimizationResult.warnings.map((warning: string, i: number) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {optimizationResult.vendorSplits.map((vendor: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{vendor.platformName}</span>
                    <Badge variant="secondary">
                      {vendor.items.length} item{vendor.items.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {vendor.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="line-clamp-1">{item.productName}</span>
                      <span className="font-medium">
                        {(item.subtotal / 100).toFixed(2)} AED
                      </span>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{(vendor.subtotal / 100).toFixed(2)} AED</span>
                    </div>
                    
                    {vendor.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{(vendor.discount / 100).toFixed(2)} AED</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {vendor.shipping === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `${(vendor.shipping / 100).toFixed(2)} AED`
                        )}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span className="text-primary">
                        {(vendor.total / 100).toFixed(2)} AED
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Checkout on {vendor.platformName}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Savings Summary */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">
                      Optimized for best prices!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Shopping across {optimizationResult.vendorSplits.length} platform
                      {optimizationResult.vendorSplits.length > 1 ? 's' : ''} to save you money
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
