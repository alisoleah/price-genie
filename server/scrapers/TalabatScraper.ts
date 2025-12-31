import { Page } from 'playwright';
import { BaseScraper, ProductData, ScraperConfig } from './BaseScraper';

export class TalabatScraper extends BaseScraper {
  constructor() {
    super({
      platformName: 'Talabat',
      baseUrl: 'https://www.talabat.com',
      rateLimit: 15, // More conservative for food delivery
      timeout: 30000,
      retries: 3,
    });
  }

  /**
   * Scrape a single product from Talabat
   * Note: Talabat is primarily for food/groceries, structure differs from e-commerce
   */
  async scrapeProduct(url: string): Promise<ProductData> {
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        console.log(`[Talabat] Scraping product: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle' });
        await this.randomDelay(1500, 2500);

        // Talabat uses React with dynamic content
        await page.waitForSelector('[class*="item"], [class*="product"]', { timeout: 10000 });

        const productData = await page.evaluate(() => {
          // Title - Talabat shows item names in various formats
          const titleEl = document.querySelector('[class*="itemName"], [class*="productName"], h1, h2');
          const rawTitle = titleEl?.textContent?.trim() || '';

          // Price - Talabat format
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
              // Talabat format: "AED 12.50" or "12.50"
              const match = priceText.match(/([A-Z]{3})?\s*([\d,]+\.?\d*)/);
              if (match) {
                currency = match[1] || 'AED';
                price = parseFloat(match[2]?.replace(/,/g, '') || '0');
                break;
              }
            }
          }

          // Availability - Talabat shows sold out items differently
          let availability: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          const soldOutEl = document.querySelector('[class*="soldOut"], [class*="unavailable"]');
          if (soldOutEl) {
            availability = 'out_of_stock';
          }

          // Image
          const imageEl = document.querySelector('img[class*="item"], img[class*="product"]') as HTMLImageElement;
          const imageUrl = imageEl?.src || imageEl?.getAttribute('data-src') || '';

          // Attributes
          const attributes: Record<string, any> = {};
          
          // Restaurant/Vendor name
          const vendorEl = document.querySelector('[class*="vendor"], [class*="restaurant"]');
          if (vendorEl) {
            attributes.vendor = vendorEl.textContent?.trim();
          }

          // Description
          const descEl = document.querySelector('[class*="description"], [class*="Description"]');
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
   * Search for products on Talabat
   * Note: Talabat search works differently - usually by restaurant/category
   */
  async searchProducts(query: string, options: { maxResults?: number } = {}): Promise<ProductData[]> {
    const maxResults = options.maxResults || 10;
    
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        // Talabat UAE - search endpoint
        const searchUrl = `${this.config.baseUrl}/uae/search?q=${encodeURIComponent(query)}`;
        console.log(`[Talabat] Searching: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle' });
        await this.randomDelay(1500, 2500);

        // Wait for search results
        await page.waitForSelector('[class*="item"], [class*="product"]', { timeout: 10000 });

        // Extract product/item URLs
        const productUrls = await page.evaluate((max) => {
          const results = document.querySelectorAll('[class*="item"], [class*="product"]');
          const urls: string[] = [];
          
          for (let i = 0; i < Math.min(results.length, max); i++) {
            const result = results[i];
            const linkEl = result?.querySelector('a') as HTMLAnchorElement;
            if (linkEl?.href && !linkEl.href.includes('/restaurant/')) {
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
            console.error(`[Talabat] Failed to scrape ${url}:`, error);
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
