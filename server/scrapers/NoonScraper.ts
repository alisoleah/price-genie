import { Page } from 'playwright';
import { BaseScraper, ProductData, ScraperConfig } from './BaseScraper';

export class NoonScraper extends BaseScraper {
  constructor() {
    super({
      platformName: 'Noon',
      baseUrl: 'https://www.noon.com',
      rateLimit: 20,
      timeout: 30000,
      retries: 3,
    });
  }

  /**
   * Scrape a single product from Noon
   */
  async scrapeProduct(url: string): Promise<ProductData> {
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        console.log(`[Noon] Scraping product: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle' });
        await this.randomDelay(1500, 2500);

        // Noon uses React/Next.js with dynamic content
        await page.waitForSelector('h1, [class*="productTitle"]', { timeout: 10000 });

        const productData = await page.evaluate(() => {
          // Title
          const titleEl = document.querySelector('h1, [class*="productTitle"], [class*="ProductTitle"]');
          const rawTitle = titleEl?.textContent?.trim() || '';

          // Price - Noon uses specific class names
          let price = 0;
          let currency = 'AED';
          
          const priceSelectors = [
            '[class*="priceNow"]',
            '[class*="sellingPrice"]',
            '[data-qa="product-price"]',
            '[class*="PriceAmount"]',
          ];

          for (const selector of priceSelectors) {
            const priceEl = document.querySelector(selector);
            if (priceEl) {
              const priceText = priceEl.textContent?.trim() || '';
              // Noon format: "AED 1,234.00" or "1,234.00 AED"
              const match = priceText.match(/([A-Z]{3})?\s*([\d,]+\.?\d*)\s*([A-Z]{3})?/);
              if (match) {
                currency = match[1] || match[3] || 'AED';
                price = parseFloat(match[2]?.replace(/,/g, '') || '0');
                break;
              }
            }
          }

          // Availability
          let availability: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          const availabilitySelectors = [
            '[class*="availability"]',
            '[class*="stockStatus"]',
            '[data-qa="product-availability"]',
          ];
          
          for (const selector of availabilitySelectors) {
            const availEl = document.querySelector(selector);
            if (availEl) {
              const availText = availEl.textContent?.toLowerCase() || '';
              if (availText.includes('out of stock') || availText.includes('sold out')) {
                availability = 'out_of_stock';
                break;
              } else if (availText.includes('only') && availText.includes('left')) {
                availability = 'low_stock';
                break;
              }
            }
          }

          // Image
          const imageEl = document.querySelector('[class*="productImage"] img, [class*="ProductImage"] img, img[alt*="product"]') as HTMLImageElement;
          const imageUrl = imageEl?.src || imageEl?.getAttribute('data-src') || '';

          // Attributes
          const attributes: Record<string, any> = {};
          
          // Brand
          const brandEl = document.querySelector('[class*="brand"], [class*="Brand"], [data-qa="product-brand"]');
          if (brandEl) {
            attributes.brand = brandEl.textContent?.trim();
          }

          // Rating
          const ratingEl = document.querySelector('[class*="rating"]');
          if (ratingEl) {
            const ratingMatch = ratingEl.textContent?.match(/([\d.]+)/);
            if (ratingMatch) {
              attributes.rating = parseFloat(ratingMatch[1] || '0');
            }
          }

          // SKU
          const skuEl = document.querySelector('[class*="sku"], [data-qa="product-sku"]');
          if (skuEl) {
            attributes.sku = skuEl.textContent?.trim();
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
   * Search for products on Noon
   */
  async searchProducts(query: string, options: { maxResults?: number } = {}): Promise<ProductData[]> {
    const maxResults = options.maxResults || 10;
    
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        const searchUrl = `${this.config.baseUrl}/uae-en/search?q=${encodeURIComponent(query)}`;
        console.log(`[Noon] Searching: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle' });
        await this.randomDelay(1500, 2500);

        // Wait for search results - Noon uses grid layout
        await page.waitForSelector('[class*="productContainer"], [data-qa="product-item"]', { timeout: 10000 });

        // Extract product URLs
        const productUrls = await page.evaluate((max) => {
          const results = document.querySelectorAll('[class*="productContainer"], [data-qa="product-item"]');
          const urls: string[] = [];
          
          for (let i = 0; i < Math.min(results.length, max); i++) {
            const result = results[i];
            const linkEl = result?.querySelector('a[href*="/product/"]') as HTMLAnchorElement;
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
            console.error(`[Noon] Failed to scrape ${url}:`, error);
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
