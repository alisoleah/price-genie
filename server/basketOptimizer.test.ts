import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizeBasket } from './basketOptimizer';
import * as db from './db';

// Mock the database functions
vi.mock('./db', () => ({
  getProductPrices: vi.fn(),
  calculateStaleness: vi.fn(),
}));

describe('Basket Optimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should optimize basket with single platform', async () => {
    // Mock product prices
    vi.mocked(db.getProductPrices).mockResolvedValue([
      {
        rawProductId: 1,
        price: 1000, // 10 AED in fils
        currency: 'AED',
        availability: 'in_stock',
        scrapedAt: new Date(),
        platformId: 1,
        platformName: 'Amazon UAE',
        url: 'https://amazon.ae/product1',
        rawTitle: 'Test Product',
      },
    ]);

    vi.mocked(db.calculateStaleness).mockReturnValue('fresh');

    const result = await optimizeBasket(
      [{ productId: 1, quantity: 1 }],
      []
    );

    expect(result.vendorSplits).toHaveLength(1);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it('should apply membership discounts correctly', async () => {
    vi.mocked(db.getProductPrices).mockResolvedValue([
      {
        rawProductId: 1,
        price: 10000, // 100 AED
        currency: 'AED',
        availability: 'in_stock',
        scrapedAt: new Date(),
        platformId: 1,
        platformName: 'Noon',
        url: 'https://noon.com/product1',
        rawTitle: 'Test Product',
      },
    ]);

    vi.mocked(db.calculateStaleness).mockReturnValue('fresh');

    const memberships = [
      {
        platformId: 1,
        platformName: 'noon',
        discountPercent: 10,
        freeShipping: true,
      },
    ];

    const result = await optimizeBasket(
      [{ productId: 1, quantity: 1 }],
      memberships
    );

    expect(result.vendorSplits[0]?.discount).toBeGreaterThan(0);
    expect(result.vendorSplits[0]?.shipping).toBe(0); // Free shipping
  });

  it('should handle out of stock items', async () => {
    vi.mocked(db.getProductPrices).mockResolvedValue([
      {
        rawProductId: 1,
        price: 1000,
        currency: 'AED',
        availability: 'out_of_stock',
        scrapedAt: new Date(),
        platformId: 1,
        platformName: 'Amazon UAE',
        url: 'https://amazon.ae/product1',
        rawTitle: 'Test Product',
      },
    ]);

    vi.mocked(db.calculateStaleness).mockReturnValue('fresh');

    const result = await optimizeBasket(
      [{ productId: 1, quantity: 1 }],
      []
    );

    expect(result.vendorSplits).toHaveLength(0);
    expect(result.warnings).toContain('1 item(s) not available on any platform');
  });

  it('should add staleness penalty to prices', async () => {
    vi.mocked(db.getProductPrices).mockResolvedValue([
      {
        rawProductId: 1,
        price: 1000,
        currency: 'AED',
        availability: 'in_stock',
        scrapedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        platformId: 1,
        platformName: 'Amazon UAE',
        url: 'https://amazon.ae/product1',
        rawTitle: 'Test Product',
      },
    ]);

    vi.mocked(db.calculateStaleness).mockReturnValue('expired');

    const result = await optimizeBasket(
      [{ productId: 1, quantity: 1 }],
      []
    );

    expect(result.warnings.some(w => w.includes('Expired price data'))).toBe(true);
  });

  it('should choose cheapest platform across multiple options', async () => {
    vi.mocked(db.getProductPrices).mockResolvedValue([
      {
        rawProductId: 1,
        price: 1500, // 15 AED
        currency: 'AED',
        availability: 'in_stock',
        scrapedAt: new Date(),
        platformId: 1,
        platformName: 'Amazon UAE',
        url: 'https://amazon.ae/product1',
        rawTitle: 'Test Product',
      },
      {
        rawProductId: 2,
        price: 1000, // 10 AED (cheaper)
        currency: 'AED',
        availability: 'in_stock',
        scrapedAt: new Date(),
        platformId: 2,
        platformName: 'Noon',
        url: 'https://noon.com/product1',
        rawTitle: 'Test Product',
      },
    ]);

    vi.mocked(db.calculateStaleness).mockReturnValue('fresh');

    const result = await optimizeBasket(
      [{ productId: 1, quantity: 1 }],
      []
    );

    // Should choose Noon (cheaper option)
    expect(result.vendorSplits[0]?.platformName).toBe('noon');
  });
});
