import { Page } from 'playwright';
import { BaseScraper, ProductData, ScraperConfig } from './BaseScraper';

export class CareemScraper extends BaseScraper {
  constructor() {
    super({
      platformName: 'Careem',
      baseUrl: 'https://www.careem.com',
      rateLimit: 15,
      timeout: 30000,
      retries: 3,
    });
  }

  /**
   * Scrape a single product from Careem
   * Note: Careem is primarily for food/groceries delivery
   */
  async scrapeProduct(url: string): Promise<ProductData> {
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        console.log(`[Careem] Scraping product: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle' });
        await this.randomDelay(1500, 2500);

        // Careem uses modern React/Next.js
        await page.waitForSelector('[class*="product"], [class*="item"]', { timeout: 10000 });

        const productData = await page.evaluate(() => {
          // Title
          const titleEl = document.querySelector('[class*="productName"], [class*="itemName"], h1, h2');
          const rawTitle = titleEl?.textContent?.trim() || '';

          // Price
          let price = 0;
          let currency = 'AED';
          
          const priceSelectors = [
            '[class*="price"]',
            '[class*="Price"]',
            '[data-testid*="price"]',
          ];

          for (const selector of priceSelectors) {
            const priceEl = document.querySelector(selector);
            if (priceEl) {
              const priceText = priceEl.textContent?.trim() || '';
              const match = priceText.match(/([A-Z]{3})?\s*([\d,]+\.?\d*)/);
              if (match) {
                currency = match[1] || 'AED';
                price = parseFloat(match[2]?.replace(/,/g, '') || '0');
                break;
              }
            }
          }

          // Availability
          let availability: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          const unavailableEl = document.querySelector('[class*="unavailable"], [class*="outOfStock"]');
          if (unavailableEl) {
            availability = 'out_of_stock';
          }

          // Image
          const imageEl = document.querySelector('img[class*="product"], img[class*="item"]') as HTMLImageElement;
          const imageUrl = imageEl?.src || imageEl?.getAttribute('data-src') || '';

          // Attributes
          const attributes: Record<string, any> = {};
          
          // Store/Vendor
          const storeEl = document.querySelector('[class*="store"], [class*="vendor"]');
          if (storeEl) {
            attributes.store = storeEl.textContent?.trim();
          }

          // Description
          const descEl = document.querySelector('[class*="description"]');
          if (descEl) {
            attributes.description = descEl.textContent?.trim();
          }

          return {
            rawTitle,
            price,
            currency,
            availability,
            imageUrl,
            attributes,
          };
        });

        await page.close();

        if (!productData.rawTitle || productData.price === 0) {
          throw new Error('Failed to extract product data');
        }

        return {
          ...productData,
          url,
        };
      } catch (error) {
        await page.close();
        throw error;
      }
    });
  }

  /**
   * Search for products on Careem
   */
  async searchProducts(query: string, options: { maxResults?: number } = {}): Promise<ProductData[]> {
    const maxResults = options.maxResults || 10;
    
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        const searchUrl = `${this.config.baseUrl}/search?q=${encodeURIComponent(query)}`;
        console.log(`[Careem] Searching: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle' });
        await this.randomDelay(1500, 2500);

        // Wait for search results
        await page.waitForSelector('[class*="product"], [class*="item"]', { timeout: 10000 });

        // Extract product URLs
        const productUrls = await page.evaluate((max) => {
          const results = document.querySelectorAll('[class*="product"], [class*="item"]');
          const urls: string[] = [];
          
          for (let i = 0; i < Math.min(results.length, max); i++) {
            const result = results[i];
            const linkEl = result?.querySelector('a') as HTMLAnchorElement;
            if (linkEl?.href) {
              urls.push(linkEl.href);
            }
          }
          
          return urls;
        }, maxResults);

        await page.close();

        // Scrape each product
        const products: ProductData[] = [];
        for (const url of productUrls) {
          try {
            const product = await this.scrapeProduct(url);
            products.push(product);
          } catch (error) {
            console.error(`[Careem] Failed to scrape ${url}:`, error);
          }
        }

        return products;
      } catch (error) {
        await page.close();
        throw error;
      }
    });
  }
}
