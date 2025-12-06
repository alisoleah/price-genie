/**
 * Background worker system for scraping and product matching
 * 
 * In a production environment, this would use Celery/BullMQ/etc.
 * For the MVP, we implement a simple in-memory task queue
 */

import * as db from "./db";

interface Task {
  id: string;
  type: 'scrape' | 'embed' | 'match';
  payload: any;
  retries: number;
  maxRetries: number;
  scheduledAt: Date;
}

class WorkerQueue {
  private tasks: Map<string, Task> = new Map();
  private processing: Set<string> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) return;
    
    console.log('[Workers] Starting background worker queue');
    
    // Process tasks every 10 seconds
    this.intervalId = setInterval(() => {
      this.processTasks();
    }, 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  addTask(type: Task['type'], payload: any, maxRetries = 3) {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const task: Task = {
      id,
      type,
      payload,
      retries: 0,
      maxRetries,
      scheduledAt: new Date(),
    };
    
    this.tasks.set(id, task);
    console.log(`[Workers] Added task ${id} of type ${type}`);
    
    return id;
  }

  private async processTasks() {
    const now = Date.now();
    
    for (const [id, task] of Array.from(this.tasks.entries())) {
      // Skip if already processing
      if (this.processing.has(id)) continue;
      
      // Skip if not yet scheduled
      if (task.scheduledAt.getTime() > now) continue;

      this.processing.add(id);
      
      try {
        console.log(`[Workers] Processing task ${id}`);
        
        switch (task.type) {
          case 'scrape':
            await this.handleScrapeTask(task);
            break;
          case 'embed':
            await this.handleEmbedTask(task);
            break;
          case 'match':
            await this.handleMatchTask(task);
            break;
        }
        
        // Task completed successfully
        this.tasks.delete(id);
        console.log(`[Workers] Completed task ${id}`);
        
      } catch (error) {
        console.error(`[Workers] Task ${id} failed:`, error);
        
        task.retries++;
        
        if (task.retries >= task.maxRetries) {
          console.error(`[Workers] Task ${id} exceeded max retries, removing`);
          this.tasks.delete(id);
        } else {
          // Exponential backoff: 2^retries minutes
          const delayMinutes = Math.pow(2, task.retries);
          task.scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);
          console.log(`[Workers] Rescheduling task ${id} in ${delayMinutes} minutes`);
        }
      } finally {
        this.processing.delete(id);
      }
    }
  }

  private async handleScrapeTask(task: Task) {
    const { platformId, category } = task.payload;
    
    // Create scrape job
    const jobId = await db.createScrapeJob(platformId, category);
    
    try {
      await db.updateScrapeJobStatus(jobId, 'running');
      
      // Get platform details
      const platform = await db.getPlatformById(platformId);
      if (!platform) {
        throw new Error(`Platform ${platformId} not found`);
      }

      console.log(`[Scraper] Starting scrape for ${platform.displayName}`);
      
      // Mock scraping - in production, this would use Playwright/Puppeteer
      const mockProducts = await this.mockScrape(platform, category);
      
      console.log(`[Scraper] Scraped ${mockProducts.length} products from ${platform.displayName}`);
      
      await db.updateScrapeJobStatus(jobId, 'success', {
        productsScraped: mockProducts.length,
      });
      
      // Schedule embedding generation for new products
      if (mockProducts.length > 0) {
        this.addTask('embed', { productIds: mockProducts });
      }
      
    } catch (error: any) {
      await db.updateScrapeJobStatus(jobId, 'failed', {
        errors: [{
          message: error.message,
          timestamp: new Date().toISOString(),
        }],
      });
      throw error;
    }
  }

  private async mockScrape(platform: any, category?: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In production, this would:
    // 1. Use httpx/axios with random user agents
    // 2. Parse HTML with BeautifulSoup/Cheerio
    // 3. Extract product data
    // 4. Handle rate limiting and retries
    
    // For MVP, return empty array (data already seeded)
    return [];
  }

  private async handleEmbedTask(task: Task) {
    const { productIds } = task.payload;
    
    console.log(`[Embedder] Generating embeddings for ${productIds.length} products`);
    
    // In production, this would use sentence-transformers
    // For MVP, embeddings are already generated in seed data
    
    // Schedule matching for products with embeddings
    for (const productId of productIds) {
      this.addTask('match', { productId });
    }
  }

  private async handleMatchTask(task: Task) {
    const { productId } = task.payload;
    
    console.log(`[Matcher] Matching product ${productId}`);
    
    // In production, this would:
    // 1. Find top 5 candidates using vector similarity
    // 2. Calculate fuzzy string match scores
    // 3. Compare attributes
    // 4. Update matched_product_id and confidence
    
    // For MVP, products are already matched in seed data
  }
}

// Singleton instance
export const workerQueue = new WorkerQueue();

// Auto-start workers
if (process.env.NODE_ENV !== 'test') {
  workerQueue.start();
}
