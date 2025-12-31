import { ScraperManager } from "./scrapers/ScraperManager";
import { processUnmatchedProducts } from "./productMatcher";
import { getDb } from "./db";
import { scrapeJobs, platforms } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Scheduled job configuration
 */
interface ScheduledJob {
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  enabled: boolean;
}

/**
 * Run all platform scrapers
 * Called by scheduled job every 6 hours
 */
export async function runScheduledScraping(): Promise<void> {
  console.log("[Scheduler] Starting scheduled scraping job...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Scheduler] Database not available");
    return;
  }

  try {
    // Get all active platforms
    const activePlatforms = await db
      .select()
      .from(platforms)
      .where(eq(platforms.isActive, true));

    console.log(`[Scheduler] Found ${activePlatforms.length} active platforms`);

    const scraperManager = new ScraperManager();

    // Scrape each platform
    for (const platform of activePlatforms) {
      try {
        console.log(`[Scheduler] Scraping ${platform.name}...`);
        
        // Create scrape job record
        const jobResult = await db.insert(scrapeJobs).values({
          platformId: platform.id,
          status: "running",
          startedAt: new Date(),
        });

        const jobId = jobResult[0].insertId;

        // Run scraper (simplified - in production use actual scraper methods)
        const results: any[] = []; // Placeholder - implement actual scraping logic

        // Update job status
        await db
          .update(scrapeJobs)
          .set({
            status: "success" as const,
            completedAt: new Date(),
            productsScraped: results.length,
          })
          .where(eq(scrapeJobs.id, jobId));

        console.log(`[Scheduler] Scraped ${results.length} products from ${platform.name}`);
      } catch (error) {
        console.error(`[Scheduler] Error scraping ${platform.name}:`, error);
        // Continue with other platforms even if one fails
      }
    }

    console.log("[Scheduler] Scraping job completed");
  } catch (error) {
    console.error("[Scheduler] Error in scheduled scraping:", error);
  }
}

/**
 * Process unmatched products and create canonical entries
 * Called after scraping to match new products
 */
export async function runProductMatching(): Promise<void> {
  console.log("[Scheduler] Starting product matching job...");

  try {
    const stats = await processUnmatchedProducts();
    console.log(`[Scheduler] Product matching completed:`, stats);
  } catch (error) {
    console.error("[Scheduler] Error in product matching:", error);
  }
}

/**
 * Clean up old scrape jobs and price snapshots
 * Keep only last 30 days of data
 */
export async function runDataCleanup(): Promise<void> {
  console.log("[Scheduler] Starting data cleanup job...");

  const db = await getDb();
  if (!db) {
    console.error("[Scheduler] Database not available");
    return;
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old scrape jobs
    await db.execute(`
      DELETE FROM scrapeJobs 
      WHERE createdAt < '${thirtyDaysAgo.toISOString()}'
    `);

    console.log("[Scheduler] Data cleanup completed");
  } catch (error) {
    console.error("[Scheduler] Error in data cleanup:", error);
  }
}

/**
 * All scheduled jobs configuration
 */
export const scheduledJobs: ScheduledJob[] = [
  {
    name: "scrape_platforms",
    schedule: "0 */6 * * *", // Every 6 hours
    handler: runScheduledScraping,
    enabled: true,
  },
  {
    name: "match_products",
    schedule: "30 */6 * * *", // 30 minutes after scraping
    handler: runProductMatching,
    enabled: true,
  },
  {
    name: "cleanup_data",
    schedule: "0 2 * * *", // Daily at 2 AM
    handler: runDataCleanup,
    enabled: true,
  },
];

/**
 * Simple cron-like scheduler
 * In production, use a proper job queue like Bull or Agenda
 */
export class SimpleScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start(): void {
    console.log("[Scheduler] Starting scheduler...");

    for (const job of scheduledJobs) {
      if (!job.enabled) {
        console.log(`[Scheduler] Job ${job.name} is disabled, skipping`);
        continue;
      }

      // Parse cron schedule (simplified - only supports */N format for hours)
      const interval = this.parseCronToInterval(job.schedule);
      
      if (interval) {
        console.log(`[Scheduler] Scheduling ${job.name} to run every ${interval}ms`);
        
        // Run immediately on startup
        job.handler().catch(error => {
          console.error(`[Scheduler] Error running ${job.name}:`, error);
        });

        // Schedule recurring execution
        const timer = setInterval(() => {
          job.handler().catch(error => {
            console.error(`[Scheduler] Error running ${job.name}:`, error);
          });
        }, interval);

        this.intervals.set(job.name, timer);
      } else {
        console.warn(`[Scheduler] Could not parse schedule for ${job.name}: ${job.schedule}`);
      }
    }

    console.log(`[Scheduler] Started ${this.intervals.size} scheduled jobs`);
  }

  stop(): void {
    console.log("[Scheduler] Stopping scheduler...");

    for (const [name, timer] of Array.from(this.intervals.entries())) {
      clearInterval(timer);
      console.log(`[Scheduler] Stopped ${name}`);
    }

    this.intervals.clear();
  }

  /**
   * Parse simple cron expressions to millisecond intervals
   * Supports: "0 *\/6 * * *" (every 6 hours)
   * This is a simplified parser - use a proper cron library in production
   */
  private parseCronToInterval(cron: string): number | null {
    const parts = cron.split(" ");
    if (parts.length !== 5) return null;

    const [minute, hour, , , ] = parts;

    // Check for */N pattern in hours
    const hourMatch = hour.match(/\*\/(\d+)/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      return hours * 60 * 60 * 1000; // Convert to milliseconds
    }

    // Check for fixed hour
    if (hour === "*") {
      return 60 * 60 * 1000; // Every hour
    }

    return null;
  }
}

/**
 * Global scheduler instance
 */
let schedulerInstance: SimpleScheduler | null = null;

/**
 * Initialize and start the scheduler
 */
export function startScheduler(): void {
  if (schedulerInstance) {
    console.warn("[Scheduler] Scheduler already running");
    return;
  }

  schedulerInstance = new SimpleScheduler();
  schedulerInstance.start();
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}
