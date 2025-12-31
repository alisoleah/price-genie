import webpush from "web-push";
import { getDb } from "./db";
import { priceAlerts, users } from "../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";

/**
 * Push Notification Service
 * Handles web push notifications for price alerts
 */

// VAPID keys for web push (in production, store in env variables)
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@pricegenie.com";

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[Push] VAPID keys not configured, skipping push notification");
    return false;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours
      }
    );
    
    console.log("[Push] Notification sent successfully");
    return true;
  } catch (error: any) {
    console.error("[Push] Error sending notification:", error);
    
    // Handle expired subscriptions
    if (error.statusCode === 410) {
      console.log("[Push] Subscription expired, should be removed from database");
      // TODO: Remove expired subscription from database
    }
    
    return false;
  }
}

/**
 * Send price drop notification
 */
export async function sendPriceDropNotification(
  subscription: PushSubscription,
  productName: string,
  oldPrice: number,
  newPrice: number,
  platform: string
): Promise<boolean> {
  const savingsPercent = (((oldPrice - newPrice) / oldPrice) * 100).toFixed(0);
  
  const payload: NotificationPayload = {
    title: "🎉 Price Drop Alert!",
    body: `${productName} is now ${(newPrice / 100).toFixed(2)} AED on ${platform} (${savingsPercent}% off)`,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data: {
      type: "price_drop",
      productName,
      oldPrice,
      newPrice,
      platform,
    },
    actions: [
      { action: "view", title: "View Product" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  return sendPushNotification(subscription, payload);
}

/**
 * Send back-in-stock notification
 */
export async function sendBackInStockNotification(
  subscription: PushSubscription,
  productName: string,
  price: number,
  platform: string
): Promise<boolean> {
  const payload: NotificationPayload = {
    title: "✅ Back in Stock!",
    body: `${productName} is now available on ${platform} for ${(price / 100).toFixed(2)} AED`,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data: {
      type: "back_in_stock",
      productName,
      price,
      platform,
    },
    actions: [
      { action: "view", title: "View Product" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  return sendPushNotification(subscription, payload);
}

/**
 * Check price alerts and send notifications
 * Called by scheduled job
 */
export async function checkPriceAlertsAndNotify(): Promise<{
  checked: number;
  sent: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[Push] Database not available");
    return { checked: 0, sent: 0, failed: 0 };
  }

  try {
    // Get all active price alerts
    const alerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.isActive, true));

    console.log(`[Push] Checking ${alerts.length} price alerts`);

    let sent = 0;
    let failed = 0;

    for (const alert of alerts) {
      try {
        // Get current prices for the product
        const { getPriceStats } = await import("./db");
        const stats = await getPriceStats(alert.productId, 1); // Last 24 hours

        // Check if current price is below target
        if (stats.current > 0 && stats.current <= alert.targetPrice) {
          // Get user's push subscription
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, alert.userId))
            .limit(1);

          if (user.length > 0 && user[0].pushSubscription) {
            const subscription = user[0].pushSubscription as PushSubscription;
            
            // Send notification
            const success = await sendPriceDropNotification(
              subscription,
              "Product", // TODO: Get actual product name
              alert.targetPrice,
              stats.current,
              "Platform" // TODO: Get actual platform
            );

            if (success) {
              sent++;
              
              // Mark alert as triggered
              await db
                .update(priceAlerts)
                .set({
                  lastNotifiedAt: new Date(),
                  isActive: false, // Deactivate after triggering
                })
                .where(eq(priceAlerts.id, alert.id));
            } else {
              failed++;
            }
          }
        }
      } catch (error) {
        console.error(`[Push] Error processing alert ${alert.id}:`, error);
        failed++;
      }
    }

    console.log(`[Push] Notifications sent: ${sent}, failed: ${failed}`);
    return { checked: alerts.length, sent, failed };
  } catch (error) {
    console.error("[Push] Error checking price alerts:", error);
    return { checked: 0, sent: 0, failed: 0 };
  }
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
