import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Sparkles, 
  TrendingDown,
  ExternalLink,
  Trash2,
  Plus,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";


export default function Basket() {
  const { user, isAuthenticated } = useAuth();
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [newBasketName, setNewBasketName] = useState("");
  const [selectedBasketId, setSelectedBasketId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Fetch user's baskets
  const { data: baskets, isLoading: basketsLoading } = trpc.baskets.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Fetch selected basket with items
  const { data: currentBasket, isLoading: basketLoading } = trpc.baskets.get.useQuery(
    { basketId: selectedBasketId! },
    { enabled: selectedBasketId !== null }
  );

  // Mutations
  const createBasketMutation = trpc.baskets.create.useMutation({
    onSuccess: (data) => {
      utils.baskets.list.invalidate();
      setSelectedBasketId(data.basketId);
      setNewBasketName("");
      toast.success("Basket created!");
    },
    onError: () => {
      toast.error("Failed to create basket");
    },
  });

  const removeItemMutation = trpc.baskets.removeItem.useMutation({
    onSuccess: () => {
      utils.baskets.get.invalidate();
      toast.success("Item removed");
    },
  });

  const updateQuantityMutation = trpc.baskets.updateQuantity.useMutation({
    onSuccess: () => {
      utils.baskets.get.invalidate();
    },
  });

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

  const handleCreateBasket = () => {
    if (!newBasketName.trim()) {
      toast.error("Please enter a basket name");
      return;
    }
    createBasketMutation.mutate({ name: newBasketName });
  };

  const handleOptimize = () => {
    if (!currentBasket || !currentBasket.items.length) {
      toast.error("Add items to your basket first");
      return;
    }

    setOptimizing(true);
    optimizeMutation.mutate({
      items: currentBasket.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  };

  const handleUpdateQuantity = (itemId: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQty });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
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

  // Auto-select first basket if none selected
  if (!selectedBasketId && baskets && baskets.length > 0) {
    setSelectedBasketId(baskets[0]!.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Baskets</h1>
            <p className="text-muted-foreground">
              Manage your shopping lists and optimize across platforms
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Basket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Basket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="e.g., Weekly Groceries"
                  value={newBasketName}
                  onChange={(e) => setNewBasketName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateBasket()}
                />
                <Button onClick={handleCreateBasket} className="w-full">
                  Create Basket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {basketsLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading baskets...</p>
          </div>
        ) : !baskets || baskets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No baskets yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first basket to start shopping
            </p>
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Basket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Basket</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="e.g., Weekly Groceries"
                      value={newBasketName}
                      onChange={(e) => setNewBasketName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateBasket()}
                    />
                    <Button onClick={handleCreateBasket} className="w-full">
                      Create Basket
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Basket List Sidebar */}
            <div className="space-y-2">
              <h3 className="font-semibold mb-4">Your Baskets</h3>
              {baskets.map((basket) => (
                <Button
                  key={basket.id}
                  variant={selectedBasketId === basket.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedBasketId(basket.id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {basket.name}
                </Button>
              ))}
            </div>

            {/* Basket Content */}
            <div className="space-y-6">
              {basketLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading basket...</p>
                </div>
              ) : !currentBasket ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Select a basket</h2>
                  <p className="text-muted-foreground">
                    Choose a basket from the sidebar to view its contents
                  </p>
                </div>
              ) : currentBasket.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Basket is empty</h2>
                  <p className="text-muted-foreground mb-6">
                    Add products from the search page to start shopping
                  </p>
                  <Button asChild>
                    <Link href="/search">Browse Products</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Basket Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        {currentBasket.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentBasket.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <img
                            src={item.imageUrl || "/placeholder-product.png"}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.brand} • {item.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItemMutation.mutate({ itemId: item.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Optimize Button */}
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleOptimize}
                    disabled={optimizing}
                  >
                    {optimizing ? (
                      "Optimizing..."
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Optimize Basket
                      </>
                    )}
                  </Button>

                  {/* Optimization Results */}
                  {optimizationResult && (
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                          <TrendingDown className="h-5 w-5" />
                          Optimization Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          {optimizationResult.platformSplit.map((split: any) => (
                            <div key={split.platformId} className="space-y-3 p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-sm">{split.platformName}</Badge>
                                <span className="font-bold text-lg">{split.totalCost.toFixed(2)} AED</span>
                              </div>
                              
                              {/* Items List */}
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Items</p>
                                {split.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {item.productName} × {item.quantity}
                                    </span>
                                    <span className="font-medium">{(item.price * item.quantity).toFixed(2)} AED</span>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Cost Breakdown */}
                              <div className="space-y-1 pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Subtotal:</span>
                                  <span>{split.subtotal.toFixed(2)} AED</span>
                                </div>
                                {split.membershipDiscount > 0 && (
                                  <div className="flex justify-between text-sm text-primary">
                                    <span>Membership Discount:</span>
                                    <span>-{split.membershipDiscount.toFixed(2)} AED</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Shipping:</span>
                                  <span>{split.shippingCost > 0 ? `${split.shippingCost.toFixed(2)} AED` : 'FREE'}</span>
                                </div>
                                <div className="flex justify-between font-semibold pt-1 border-t">
                                  <span>Total:</span>
                                  <span>{split.totalCost.toFixed(2)} AED</span>
                                </div>
                              </div>
                              
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <a href={split.checkoutUrl} target="_blank" rel="noopener noreferrer">
                                  Checkout on {split.platformName}
                                  <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Cost:</span>
                            <span className="font-semibold">{optimizationResult.totalCost.toFixed(2)} AED</span>
                          </div>
                          {optimizationResult.totalSavings > 0 && (
                            <div className="flex justify-between text-sm text-primary">
                              <span>Total Savings:</span>
                              <span className="font-semibold">{optimizationResult.totalSavings.toFixed(2)} AED</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
