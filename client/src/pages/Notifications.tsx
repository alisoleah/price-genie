import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser doesn't support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        // Register service worker and subscribe to push
        await registerPushNotifications();
        setNotificationsEnabled(true);
        toast.success("Notifications enabled!");
      } else {
        toast.error("Notification permission denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to enable notifications");
    }
  };

  const registerPushNotifications = async () => {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      
      // Get VAPID public key from server
      // const vapidPublicKey = await fetch("/api/vapid-public-key").then(r => r.text());
      const vapidPublicKey = ""; // TODO: Get from server

      if (!vapidPublicKey) {
        console.warn("VAPID public key not configured");
        return;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      // await fetch("/api/push/subscribe", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(subscription),
      // });

      console.log("Push subscription:", subscription);
    } catch (error) {
      console.error("Error registering push notifications:", error);
      throw error;
    }
  };

  const disableNotifications = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      setNotificationsEnabled(false);
      toast.success("Notifications disabled");
    } catch (error) {
      console.error("Error disabling notifications:", error);
      toast.error("Failed to disable notifications");
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("🎉 Test Notification", {
        body: "PriceGenie notifications are working!",
        icon: "/icon-192.png",
        badge: "/badge-72.png",
      });
      toast.success("Test notification sent!");
    } else {
      toast.error("Notifications not enabled");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to manage notification preferences
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Notification Preferences</h1>

        {/* Browser Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {notificationsEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              Browser Notifications
            </CardTitle>
            <CardDescription>
              Get notified when prices drop or products come back in stock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Permission Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                {permission === "granted" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium">
                    {permission === "granted" && "Notifications Enabled"}
                    {permission === "denied" && "Notifications Blocked"}
                    {permission === "default" && "Notifications Not Enabled"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {permission === "granted" && "You'll receive price alerts"}
                    {permission === "denied" && "Enable in browser settings"}
                    {permission === "default" && "Click to enable notifications"}
                  </p>
                </div>
              </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-toggle" className="flex-1">
                <span className="font-medium">Push Notifications</span>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for price drops and stock updates
                </p>
              </Label>
              <Switch
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestNotificationPermission();
                  } else {
                    disableNotifications();
                  }
                }}
                disabled={permission === "denied"}
              />
            </div>

            {/* Test Notification */}
            {notificationsEnabled && (
              <Button
                variant="outline"
                onClick={sendTestNotification}
                className="w-full"
              >
                Send Test Notification
              </Button>
            )}

            {/* Help Text */}
            {permission === "denied" && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Notifications are blocked.</strong> To enable them, click the lock icon in your browser's address bar and allow notifications for this site.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="price-drops">
                <span className="font-medium">Price Drops</span>
                <p className="text-sm text-muted-foreground">
                  When tracked products go on sale
                </p>
              </Label>
              <Switch id="price-drops" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="back-in-stock">
                <span className="font-medium">Back in Stock</span>
                <p className="text-sm text-muted-foreground">
                  When out-of-stock products become available
                </p>
              </Label>
              <Switch id="back-in-stock" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="price-targets">
                <span className="font-medium">Price Targets</span>
                <p className="text-sm text-muted-foreground">
                  When products reach your target price
                </p>
              </Label>
              <Switch id="price-targets" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
