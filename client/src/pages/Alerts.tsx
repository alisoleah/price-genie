import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Bell, 
  Trash2,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { formatDistanceToNow } from "date-fns";

export default function Alerts() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: alerts, isLoading } = trpc.alerts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteAlertMutation = trpc.alerts.delete.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      toast.success("Alert deleted");
    },
  });

  const handleDeleteAlert = (alertId: number) => {
    deleteAlertMutation.mutate({ alertId });
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
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login to manage price alerts</h2>
          <p className="text-muted-foreground mb-6">
            Get notified when products drop below your target price
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
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Price Alerts</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">How Price Alerts Work</h3>
                <p className="text-sm text-muted-foreground">
                  Set a target price for any product. We'll notify you when the price drops below your target on any platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Alerts ({alerts?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              alerts.map(alert => (
                <div key={alert.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2">{alert.productName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingDown className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Target: <span className="font-semibold text-primary">
                            {alert.targetPriceInAED.toFixed(2)} AED
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant={alert.isActive ? "default" : "secondary"}>
                      {alert.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span>
                      Created {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                    {alert.lastNotifiedAt && (
                      <span>
                        Last notified {formatDistanceToNow(new Date(alert.lastNotifiedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No price alerts yet</p>
                <Link href="/search">
                  <Button variant="outline">
                    Browse Products
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
