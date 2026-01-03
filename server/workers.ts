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
    const { platformId, category, query } = task.payload;
    
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
      
      // Use real Playwright scrapers
      const products = await this.realScrape(platform, query);
      
      console.log(`[Scraper] Scraped ${products.length} products from ${platform.displayName}`);
      
      // Save scraped products to database
      const productIds = await this.saveScrapedProducts(platformId, products);
      
      await db.updateScrapeJobStatus(jobId, 'success', {
        productsScraped: products.length,
      });
      
      // Schedule embedding generation for new products
      if (productIds.length > 0) {
        this.addTask('embed', { productIds });
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

  private async realScrape(platform: any, query?: string) {
    // Import scrapers dynamically to avoid initialization issues
    const { scraperManager } = await import('./scrapers/ScraperManager');
    
    // Map platform name to scraper platform name
    const platformMap: Record<string, any> = {
      'Amazon UAE': 'amazon_uae',
      'Noon': 'noon',
      'Talabat': 'talabat',
      'Careem': 'careem',
    };
    
    const scraperPlatform = platformMap[platform.displayName];
    if (!scraperPlatform) {
      throw new Error(`No scraper configured for ${platform.displayName}`);
    }
    
    // If query provided, search for products
    if (query) {
      return await scraperManager.searchPlatform(scraperPlatform, query, { maxResults: 10 });
    }
    
    // Otherwise, return empty (would need category-based scraping logic)
    return [];
  }

  private async saveScrapedProducts(platformId: number, products: any[]) {
    const productIds: number[] = [];
    
    for (const product of products) {
      try {
        // Download and upload image to S3 if available
        let s3ImageUrl = product.imageUrl;
        if (product.imageUrl && product.imageUrl.startsWith('http')) {
          try {
            const { downloadAndUploadImage } = await import('./imageStorage');
            const result = await downloadAndUploadImage(product.imageUrl, 0); // temp ID
            if (result) {
              s3ImageUrl = result.url;
              console.log(`[Scraper] Uploaded image to S3: ${s3ImageUrl}`);
            }
          } catch (imgError) {
            console.error(`[Scraper] Failed to upload image for ${product.rawTitle}:`, imgError);
            // Continue with original URL if upload fails
          }
        }
        
        // Create raw product entry
        const rawProductId = await db.createRawProduct({
          platformId,
          rawTitle: product.rawTitle,
          url: product.url,
          imageUrl: s3ImageUrl,
          rawDescription: product.attributes?.description || '',
        });
        
        // Create price snapshot
        await db.createPriceSnapshot({
          rawProductId,
          price: product.price,
          currency: product.currency,
          availability: product.availability,
        });
        
        productIds.push(rawProductId);
      } catch (error) {
        console.error(`[Scraper] Failed to save product ${product.rawTitle}:`, error);
      }
    }
    
    return productIds;
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
