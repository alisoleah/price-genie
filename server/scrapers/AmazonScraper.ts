import { Page } from 'playwright';
import { BaseScraper, ProductData, ScraperConfig } from './BaseScraper';

export class AmazonScraper extends BaseScraper {
  constructor() {
    super({
      platformName: 'Amazon UAE',
      baseUrl: 'https://www.amazon.ae',
      rateLimit: 20, // 20 requests per minute
      timeout: 30000,
      retries: 3,
    });
  }

  /**
   * Scrape a single product from Amazon UAE
   */
  async scrapeProduct(url: string): Promise<ProductData> {
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        console.log(`[Amazon] Scraping product: ${url}`);
        
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await this.randomDelay(1000, 2000);

        // Wait for key elements
        await page.waitForSelector('#productTitle, h1[id*="title"]', { timeout: 10000 });

        // Extract product data
        const productData = await page.evaluate(() => {
          // Title
          const titleEl = document.querySelector('#productTitle, h1[id*="title"]');
          const rawTitle = titleEl?.textContent?.trim() || '';

          // Price - Amazon has multiple price selectors
          let price = 0;
          let currency = 'AED';
          
          const priceSelectors = [
            '.a-price .a-offscreen',
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            '.a-price-whole',
            '[data-a-color="price"] .a-offscreen',
          ];

          for (const selector of priceSelectors) {
            const priceEl = document.querySelector(selector);
            if (priceEl) {
              const priceText = priceEl.textContent?.trim() || '';
              const match = priceText.match(/([A-Z]{3})\s*([\d,]+\.?\d*)/);
              if (match) {
                currency = match[1] || 'AED';
                price = parseFloat(match[2]?.replace(/,/g, '') || '0');
                break;
              }
            }
          }

          // Availability
          let availability: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          const availabilityEl = document.querySelector('#availability span, #availability');
          const availabilityText = availabilityEl?.textContent?.toLowerCase() || '';
          
          if (availabilityText.includes('out of stock') || availabilityText.includes('unavailable')) {
            availability = 'out_of_stock';
          } else if (availabilityText.includes('only') && availabilityText.includes('left')) {
            availability = 'low_stock';
          }

          // Image
          const imageEl = document.querySelector('#landingImage, #imgBlkFront, .a-dynamic-image') as HTMLImageElement;
          const imageUrl = imageEl?.src || imageEl?.getAttribute('data-old-hires') || '';

          // Attributes
          const attributes: Record<string, any> = {};
          
          // Brand
          const brandEl = document.querySelector('#bylineInfo, .po-brand .po-break-word');
          if (brandEl) {
            attributes.brand = brandEl.textContent?.trim().replace('Visit the ', '').replace(' Store', '');
          }

          // Rating
          const ratingEl = document.querySelector('[data-hook="rating-out-of-text"], .a-icon-alt');
          if (ratingEl) {
            const ratingMatch = ratingEl.textContent?.match(/([\d.]+)\s*out of/);
            if (ratingMatch) {
              attributes.rating = parseFloat(ratingMatch[1] || '0');
            }
          }

          // Review count
          const reviewEl = document.querySelector('#acrCustomerReviewText, [data-hook="total-review-count"]');
          if (reviewEl) {
            const reviewMatch = reviewEl.textContent?.match(/([\d,]+)/);
            if (reviewMatch) {
              attributes.reviewCount = parseInt(reviewMatch[1]?.replace(/,/g, '') || '0');
            }
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
   * Search for products on Amazon UAE
   */
  async searchProducts(query: string, options: { maxResults?: number } = {}): Promise<ProductData[]> {
    const maxResults = options.maxResults || 10;
    
    return this.withRetry(async () => {
      await this.rateLimit();
      
      const page = await this.createPage();
      
      try {
        const searchUrl = `${this.config.baseUrl}/s?k=${encodeURIComponent(query)}`;
        console.log(`[Amazon] Searching: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await this.randomDelay(1000, 2000);

        // Wait for search results
        await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 });

        // Extract product URLs
        const productUrls = await page.evaluate((max) => {
          const results = document.querySelectorAll('[data-component-type="s-search-result"]');
          const urls: string[] = [];
          
          for (let i = 0; i < Math.min(results.length, max); i++) {
            const result = results[i];
            const linkEl = result?.querySelector('h2 a, .a-link-normal.s-no-outline') as HTMLAnchorElement;
            if (linkEl?.href) {
              urls.push(linkEl.href);
            }
          }
          
          return urls;
        }, maxResults);

        await page.close();

        // Scrape each product (with rate limiting)
        const products: ProductData[] = [];
        for (const url of productUrls) {
          try {
            const product = await this.scrapeProduct(url);
            products.push(product);
          } catch (error) {
            console.error(`[Amazon] Failed to scrape ${url}:`, error);
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
