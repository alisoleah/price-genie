import { chromium, Browser, Page, BrowserContext } from 'playwright';
import UserAgent from 'user-agents';

export interface ScraperConfig {
  platformName: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
  timeout: number; // milliseconds
  retries: number;
}

export interface ProductData {
  rawTitle: string;
  price: number;
  currency: string;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock';
  url: string;
  imageUrl?: string;
  attributes?: Record<string, any>;
}

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected lastRequestTime: number = 0;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Initialize browser with anti-bot measures
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    const userAgent = new UserAgent({ deviceCategory: 'desktop' });

    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: userAgent.toString(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'Asia/Dubai',
      permissions: [],
      // Add realistic browser fingerprint
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Override navigator.webdriver
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Add realistic plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Add realistic languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });
  }

  /**
   * Create a new page with anti-detection measures
   */
  protected async createPage(): Promise<Page> {
    if (!this.context) {
      await this.initialize();
    }

    const page = await this.context!.newPage();
    
    // Set realistic navigation timeout
    page.setDefaultTimeout(this.config.timeout);
    page.setDefaultNavigationTimeout(this.config.timeout);

    return page;
  }

  /**
   * Rate limiting - ensure we don't exceed platform limits
   */
  protected async rateLimit(): Promise<void> {
    const minInterval = (60 * 1000) / this.config.rateLimit; // ms between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.retries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(
            `[${this.config.platformName}] Attempt ${attempt + 1} failed, retrying in ${backoffTime}ms...`
          );
          await this.sleep(backoffTime);
        }
      }
    }
    
    throw new Error(
      `[${this.config.platformName}] Failed after ${retries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Random delay to appear more human-like
   */
  protected async randomDelay(min: number = 500, max: number = 2000): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await this.sleep(delay);
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Abstract methods to be implemented by platform-specific scrapers
   */
  abstract scrapeProduct(url: string): Promise<ProductData>;
  abstract searchProducts(query: string, options?: any): Promise<ProductData[]>;
}
