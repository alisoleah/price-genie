import { AmazonScraper } from './AmazonScraper';
import { NoonScraper } from './NoonScraper';
import { TalabatScraper } from './TalabatScraper';
import { CareemScraper } from './CareemScraper';
import { BaseScraper, ProductData } from './BaseScraper';

export type PlatformName = 'amazon_uae' | 'noon' | 'talabat' | 'careem';

export interface ScraperResult {
  platform: PlatformName;
  products: ProductData[];
  success: boolean;
  error?: string;
  scrapedAt: Date;
}

export class ScraperManager {
  private scrapers: Map<PlatformName, BaseScraper>;

  constructor() {
    this.scrapers = new Map([
      ['amazon_uae', new AmazonScraper()],
      ['noon', new NoonScraper()],
      ['talabat', new TalabatScraper()],
      ['careem', new CareemScraper()],
    ]);
  }

  /**
   * Get scraper for a specific platform
   */
  getScraper(platform: PlatformName): BaseScraper | undefined {
    return this.scrapers.get(platform);
  }

  /**
   * Scrape a single product URL from a specific platform
   */
  async scrapeProduct(platform: PlatformName, url: string): Promise<ProductData> {
    const scraper = this.scrapers.get(platform);
    if (!scraper) {
      throw new Error(`Scraper not found for platform: ${platform}`);
    }

    try {
      return await scraper.scrapeProduct(url);
    } catch (error) {
      console.error(`[ScraperManager] Failed to scrape ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Search for products across a specific platform
   */
  async searchPlatform(
    platform: PlatformName,
    query: string,
    options?: { maxResults?: number }
  ): Promise<ProductData[]> {
    const scraper = this.scrapers.get(platform);
    if (!scraper) {
      throw new Error(`Scraper not found for platform: ${platform}`);
    }

    try {
      return await scraper.searchProducts(query, options);
    } catch (error) {
      console.error(`[ScraperManager] Failed to search ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Search for products across multiple platforms in parallel
   */
  async searchAllPlatforms(
    query: string,
    platforms?: PlatformName[],
    options?: { maxResults?: number }
  ): Promise<ScraperResult[]> {
    const targetPlatforms = platforms || Array.from(this.scrapers.keys());
    
    const results = await Promise.allSettled(
      targetPlatforms.map(async (platform) => {
        const scraper = this.scrapers.get(platform);
        if (!scraper) {
          throw new Error(`Scraper not found: ${platform}`);
        }

        const products = await scraper.searchProducts(query, options);
        return {
          platform,
          products,
          success: true,
          scrapedAt: new Date(),
        };
      })
    );

    return results.map((result, index) => {
      const platform = targetPlatforms[index]!;
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          platform,
          products: [],
          success: false,
          error: result.reason?.message || 'Unknown error',
          scrapedAt: new Date(),
        };
      }
    });
  }

  /**
   * Refresh prices for existing raw products
   */
  async refreshPrices(productUrls: Array<{ platform: PlatformName; url: string }>): Promise<ScraperResult[]> {
    const results = await Promise.allSettled(
      productUrls.map(async ({ platform, url }) => {
        const scraper = this.scrapers.get(platform);
        if (!scraper) {
          throw new Error(`Scraper not found: ${platform}`);
        }

        const product = await scraper.scrapeProduct(url);
        return {
          platform,
          products: [product],
          success: true,
          scrapedAt: new Date(),
        };
      })
    );

    return results.map((result, index) => {
      const { platform } = productUrls[index]!;
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          platform,
          products: [],
          success: false,
          error: result.reason?.message || 'Unknown error',
          scrapedAt: new Date(),
        };
      }
    });
  }

  /**
   * Close all scrapers and clean up resources
   */
  async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.scrapers.values()).map(scraper => scraper.close())
    );
  }

  /**
   * Health check - test if scrapers can reach their platforms
   */
  async healthCheck(): Promise<Record<PlatformName, boolean>> {
    const health: Partial<Record<PlatformName, boolean>> = {};

    await Promise.all(
      Array.from(this.scrapers.entries()).map(async ([platform, scraper]) => {
        try {
          await scraper.initialize();
          health[platform] = true;
        } catch (error) {
          console.error(`[ScraperManager] Health check failed for ${platform}:`, error);
          health[platform] = false;
        }
      })
    );

    return health as Record<PlatformName, boolean>;
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager();
