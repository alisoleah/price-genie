import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Bell,
  LogOut,
  Crown
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();

  const { data: memberships, isLoading } = trpc.memberships.list.useQuery();
  const { data: platforms } = trpc.platforms.list.useQuery();

  const upsertMembership = trpc.memberships.upsert.useMutation({
    onSuccess: () => {
      utils.memberships.list.invalidate();
      toast.success("Membership updated");
    },
  });

  const deleteMembership = trpc.memberships.delete.useMutation({
    onSuccess: () => {
      utils.memberships.list.invalidate();
      toast.success("Membership removed");
    },
  });

  const handleToggleMembership = (platformId: number, platformName: string, isActive: boolean) => {
    if (isActive) {
      // Remove membership
      deleteMembership.mutate({ platformId });
    } else {
      // Add membership - show default values
      const defaultMemberships: Record<string, any> = {
        amazon: { type: "Prime", discount: 0, freeShipping: true },
        noon: { type: "Noon One", discount: 5, freeShipping: true },
        talabat: { type: "Talabat Plus", discount: 0, freeShipping: true },
        careem: { type: "Careem Plus", discount: 10, freeShipping: true },
      };

      const config = defaultMemberships[platformName.toLowerCase()] || { 
        type: "Premium", 
        discount: 0, 
        freeShipping: false 
      };

      upsertMembership.mutate({
        platformId,
        membershipType: config.type,
        discountPercent: config.discount,
        freeShipping: config.freeShipping,
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
  };

  if (!user) {
    return null;
  }

  const membershipMap = new Map(
    memberships?.map(m => [m.platformId, m]) || []
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name || "User"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email || "Not provided"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Memberships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Platform Memberships
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enable your memberships to get accurate pricing with discounts and free shipping
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              platforms?.map(platform => {
                const membership = membershipMap.get(platform.id);
                const isActive = !!membership;

                return (
                  <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{platform.displayName}</h3>
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">
                            {membership.membershipType}
                          </Badge>
                        )}
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {membership.discountPercent && membership.discountPercent > 0 && (
                            <span>{membership.discountPercent}% discount</span>
                          )}
                          {membership.freeShipping && (
                            <span>Free shipping</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggleMembership(platform.id, platform.name, isActive)}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Price Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Price Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/alerts">
              <Button variant="outline" className="w-full">
                Manage Alerts
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Panel */}
        {user.role === 'admin' && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="outline" className="w-full">
                  View Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
