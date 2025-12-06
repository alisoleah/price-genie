import { getProductPrices, calculateStaleness } from "./db";

export interface BasketItem {
  productId: number;
  quantity: number;
}

export interface UserMembership {
  platformId: number;
  platformName: string;
  discountPercent: number | null;
  freeShipping: boolean;
}

export interface OptimizationResult {
  totalCost: number;
  currency: string;
  vendorSplits: Array<{
    platformId: number;
    platformName: string;
    items: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      discount: number;
    }>;
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  }>;
  warnings: string[];
}

const SHIPPING_COSTS: Record<string, number> = {
  amazon: 1500, // 15 AED in fils
  noon: 1500,
  careem: 1000,
  talabat: 1000,
};

const MINIMUM_ORDER_VALUES: Record<string, number> = {
  amazon: 5000, // 50 AED minimum
  noon: 5000,
};

/**
 * Optimize basket to find the cheapest vendor split
 * This is an NP-hard problem, so we use a greedy heuristic with membership awareness
 */
export async function optimizeBasket(
  items: BasketItem[],
  memberships: UserMembership[]
): Promise<OptimizationResult> {
  const warnings: string[] = [];
  
  // Build membership lookup
  const membershipMap = new Map<number, UserMembership>();
  for (const membership of memberships) {
    membershipMap.set(membership.platformId, membership);
  }

  // Fetch prices for all items across all platforms
  const itemPrices = await Promise.all(
    items.map(async (item) => {
      const prices = await getProductPrices(item.productId);
      return {
        ...item,
        prices: prices.filter(p => p.availability !== 'out_of_stock'),
      };
    })
  );

  // Check for items with no available prices
  const unavailableItems = itemPrices.filter(item => item.prices.length === 0);
  
  // Filter out unavailable items
  const availableItems = itemPrices.filter(item => item.prices.length > 0);

  if (availableItems.length === 0) {
    if (unavailableItems.length > 0) {
      warnings.push(`${unavailableItems.length} item(s) not available on any platform`);
    }
    return {
      totalCost: 0,
      currency: "AED",
      vendorSplits: [],
      warnings: warnings.length > 0 ? warnings : ["No items available for purchase"],
    };
  }
  
  if (unavailableItems.length > 0) {
    warnings.push(`${unavailableItems.length} item(s) not available on any platform`);
  }

  // Calculate effective price for each item on each platform (considering memberships and staleness)
  const effectivePrices = availableItems.map(item => {
    const platformPrices = item.prices.map(price => {
      let effectivePrice = price.price;
      
      // Apply membership discount
      const membership = membershipMap.get(price.platformId);
      let discount = 0;
      if (membership && membership.discountPercent && membership.discountPercent > 0) {
        discount = Math.floor(effectivePrice * (membership.discountPercent / 100));
        effectivePrice -= discount;
      }

      // Add staleness penalty (10% for stale, 20% for expired)
      const staleness = calculateStaleness(price.scrapedAt);
      if (staleness === 'stale') {
        effectivePrice = Math.floor(effectivePrice * 1.1);
        warnings.push(`Stale price data for ${price.rawTitle} on ${price.platformName}`);
      } else if (staleness === 'expired') {
        effectivePrice = Math.floor(effectivePrice * 1.2);
        warnings.push(`Expired price data for ${price.rawTitle} on ${price.platformName}`);
      }

      return {
        ...price,
        effectivePrice,
        discount,
        staleness,
      };
    });

    // Sort by effective price
    platformPrices.sort((a, b) => a.effectivePrice - b.effectivePrice);

    return {
      ...item,
      platformPrices,
    };
  });

  // Greedy algorithm: assign each item to its cheapest platform
  const vendorAssignments = new Map<number, Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>>();

  for (const item of effectivePrices) {
    const cheapest = item.platformPrices[0];
    if (!cheapest) continue;

    const platformId = cheapest.platformId;
    if (!vendorAssignments.has(platformId)) {
      vendorAssignments.set(platformId, []);
    }

    const subtotal = cheapest.price * item.quantity;
    const discount = cheapest.discount * item.quantity;

    vendorAssignments.get(platformId)!.push({
      productId: item.productId,
      productName: cheapest.rawTitle,
      quantity: item.quantity,
      unitPrice: cheapest.price,
      discount,
      subtotal,
    });
  }

  // Calculate totals for each vendor including shipping
  const vendorSplits = Array.from(vendorAssignments.entries()).map(([platformId, items]) => {
    // Get platform name from the first item's price data
    const firstItemPrices = effectivePrices.find(ep => 
      ep.platformPrices.some(pp => pp.platformId === platformId)
    );
    const platformPrice = firstItemPrices?.platformPrices.find(pp => pp.platformId === platformId);
    const platformDisplayName = platformPrice?.platformName || 'Unknown';
    
    // Normalize platform name for shipping/minimum order lookups
    const platformName = platformDisplayName.toLowerCase().includes('amazon') ? 'amazon' :
                        platformDisplayName.toLowerCase().includes('noon') ? 'noon' :
                        platformDisplayName.toLowerCase().includes('careem') ? 'careem' :
                        platformDisplayName.toLowerCase().includes('talabat') ? 'talabat' : 'unknown';

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    
    // Check membership for free shipping
    const membership = membershipMap.get(platformId);
    const hasFreeShipping = membership?.freeShipping || false;
    
    // Calculate shipping
    let shipping = hasFreeShipping ? 0 : (SHIPPING_COSTS[platformName] || 1500);
    
    // Check minimum order value
    const minOrder = MINIMUM_ORDER_VALUES[platformName] || 0;
    if (minOrder > 0 && subtotal < minOrder) {
      warnings.push(`Order on ${platformName} below minimum (${minOrder / 100} AED). Consider consolidating.`);
    }

    const total = subtotal - totalDiscount + shipping;

    return {
      platformId,
      platformName,
      items,
      subtotal,
      discount: totalDiscount,
      shipping,
      total,
    };
  });

  // Sort by platform name for consistency
  vendorSplits.sort((a, b) => a.platformName.localeCompare(b.platformName));

  const totalCost = vendorSplits.reduce((sum, split) => sum + split.total, 0);

  return {
    totalCost,
    currency: "AED",
    vendorSplits,
    warnings,
  };
}

/**
 * Generate deep links for checkout
 */
export function generateDeepLink(platformName: string, productUrl: string): string {
  // In a real implementation, this would generate affiliate links
  // For MVP, we just return the product URL
  const affiliateParams = "?tag=pricegenie-21";
  return `${productUrl}${affiliateParams}`;
}
