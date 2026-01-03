import { eq, and, desc, sql, inArray, or, like, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, platforms, products, rawProducts, priceSnapshots,
  userMemberships, priceAlerts, baskets, basketItems, scrapeJobs,
  conversations, messages
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Platform operations
export async function getAllPlatforms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(platforms).where(eq(platforms.isActive, true));
}

export async function getPlatformById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(platforms).where(eq(platforms.id, id)).limit(1);
  return result[0] || null;
}

// Product search with fuzzy matching
export async function searchProducts(query: string, filters?: {
  category?: string;
  brand?: string;
  platformIds?: number[];
  maxPrice?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  // Build search conditions
  const conditions = [];
  
  if (query) {
    conditions.push(
      or(
        like(products.canonicalName, `%${query}%`),
        like(products.brand, `%${query}%`),
        like(products.category, `%${query}%`)
      )
    );
  }
  
  if (filters?.category) {
    conditions.push(eq(products.category, filters.category));
  }
  
  if (filters?.brand) {
    conditions.push(eq(products.brand, filters.brand));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return db.select().from(products).where(whereClause).limit(50);
}

// Get latest prices for a product across all platforms
export async function getProductPrices(productId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all raw products matching this canonical product
  const rawProds = await db
    .select()
    .from(rawProducts)
    .where(eq(rawProducts.matchedProductId, productId));

  if (rawProds.length === 0) return [];

  // Get latest price snapshot for each raw product
  const rawProductIds = rawProds.map(rp => rp.id);
  
  const latestPrices = await db
    .select({
      rawProductId: priceSnapshots.rawProductId,
      price: priceSnapshots.price,
      currency: priceSnapshots.currency,
      availability: priceSnapshots.availability,
      scrapedAt: priceSnapshots.scrapedAt,
      platformId: rawProducts.platformId,
      platformName: platforms.displayName,
      url: rawProducts.url,
      rawTitle: rawProducts.rawTitle,
    })
    .from(priceSnapshots)
    .innerJoin(rawProducts, eq(priceSnapshots.rawProductId, rawProducts.id))
    .innerJoin(platforms, eq(rawProducts.platformId, platforms.id))
    .where(inArray(priceSnapshots.rawProductId, rawProductIds))
    .orderBy(desc(priceSnapshots.scrapedAt));

  // Group by rawProductId and take the latest
  const grouped = new Map();
  for (const price of latestPrices) {
    if (!grouped.has(price.rawProductId)) {
      grouped.set(price.rawProductId, price);
    }
  }

  return Array.from(grouped.values());
}

// Calculate price staleness
export function calculateStaleness(scrapedAt: Date): 'fresh' | 'stale' | 'expired' {
  const now = Date.now();
  const scraped = scrapedAt.getTime();
  const hoursSince = (now - scraped) / (1000 * 60 * 60);

  if (hoursSince < 1) return 'fresh';
  if (hoursSince < 24) return 'stale';
  return 'expired';
}

// User membership operations
export async function getUserMemberships(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: userMemberships.id,
      platformId: userMemberships.platformId,
      platformName: platforms.name,
      platformDisplayName: platforms.displayName,
      membershipType: userMemberships.membershipType,
      discountPercent: userMemberships.discountPercent,
      freeShipping: userMemberships.freeShipping,
      isActive: userMemberships.isActive,
      expiresAt: userMemberships.expiresAt,
    })
    .from(userMemberships)
    .innerJoin(platforms, eq(userMemberships.platformId, platforms.id))
    .where(and(
      eq(userMemberships.userId, userId),
      eq(userMemberships.isActive, true)
    ));
}

export async function upsertUserMembership(data: {
  userId: number;
  platformId: number;
  membershipType: string;
  discountPercent?: number;
  freeShipping?: boolean;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(userMemberships).values({
    userId: data.userId,
    platformId: data.platformId,
    membershipType: data.membershipType,
    discountPercent: data.discountPercent || 0,
    freeShipping: data.freeShipping || false,
    isActive: true,
    expiresAt: data.expiresAt,
  }).onDuplicateKeyUpdate({
    set: {
      membershipType: data.membershipType,
      discountPercent: data.discountPercent || 0,
      freeShipping: data.freeShipping || false,
      isActive: true,
      expiresAt: data.expiresAt,
      updatedAt: new Date(),
    }
  });
}

export async function deleteUserMembership(userId: number, platformId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(userMemberships)
    .set({ isActive: false })
    .where(and(
      eq(userMemberships.userId, userId),
      eq(userMemberships.platformId, platformId)
    ));
}

// Basket operations
export async function getUserBaskets(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(baskets)
    .where(and(
      eq(baskets.userId, userId),
      eq(baskets.isActive, true)
    ))
    .orderBy(desc(baskets.updatedAt));
}

export async function getBasketWithItems(basketId: number) {
  const db = await getDb();
  if (!db) return null;

  const basket = await db.select().from(baskets).where(eq(baskets.id, basketId)).limit(1);
  if (!basket[0]) return null;

  const items = await db
    .select({
      id: basketItems.id,
      productId: basketItems.productId,
      quantity: basketItems.quantity,
      productName: products.canonicalName,
      category: products.category,
      brand: products.brand,
      imageUrl: products.imageUrl,
    })
    .from(basketItems)
    .innerJoin(products, eq(basketItems.productId, products.id))
    .where(eq(basketItems.basketId, basketId));

  return {
    ...basket[0],
    items,
  };
}

export async function createBasket(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(baskets).values({
    userId,
    name,
    isActive: true,
  });

  return result.insertId;
}

export async function addBasketItem(basketId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(basketItems).values({
    basketId,
    productId,
    quantity,
  });
}

export async function removeBasketItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(basketItems).where(eq(basketItems.id, itemId));
}

export async function updateBasketItemQuantity(itemId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(basketItems)
    .set({ quantity })
    .where(eq(basketItems.id, itemId));
}

// Price alert operations
export async function getUserPriceAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: priceAlerts.id,
      productId: priceAlerts.productId,
      productName: products.canonicalName,
      targetPrice: priceAlerts.targetPrice,
      currency: priceAlerts.currency,
      isActive: priceAlerts.isActive,
      lastNotifiedAt: priceAlerts.lastNotifiedAt,
      createdAt: priceAlerts.createdAt,
    })
    .from(priceAlerts)
    .innerJoin(products, eq(priceAlerts.productId, products.id))
    .where(and(
      eq(priceAlerts.userId, userId),
      eq(priceAlerts.isActive, true)
    ))
    .orderBy(desc(priceAlerts.createdAt));
}

export async function createPriceAlert(userId: number, productId: number, targetPrice: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(priceAlerts).values({
    userId,
    productId,
    targetPrice,
    currency: "AED",
    isActive: true,
  });
}

export async function deletePriceAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(priceAlerts)
    .set({ isActive: false })
    .where(and(
      eq(priceAlerts.id, alertId),
      eq(priceAlerts.userId, userId)
    ));
}

// Scrape job operations
export async function getRecentScrapeJobs(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: scrapeJobs.id,
      platformId: scrapeJobs.platformId,
      platformName: platforms.displayName,
      status: scrapeJobs.status,
      category: scrapeJobs.category,
      productsScraped: scrapeJobs.productsScraped,
      startedAt: scrapeJobs.startedAt,
      completedAt: scrapeJobs.completedAt,
      retryCount: scrapeJobs.retryCount,
    })
    .from(scrapeJobs)
    .innerJoin(platforms, eq(scrapeJobs.platformId, platforms.id))
    .orderBy(desc(scrapeJobs.createdAt))
    .limit(limit);
}

export async function createScrapeJob(platformId: number, category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(scrapeJobs).values({
    platformId,
    category,
    status: "pending",
  });

  return result.insertId;
}

export async function updateScrapeJobStatus(
  jobId: number, 
  status: "running" | "success" | "failed",
  data?: {
    productsScraped?: number;
    errors?: Array<{ message: string; timestamp: string; productUrl?: string }>;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  
  if (status === "running") {
    updateData.startedAt = new Date();
  } else if (status === "success" || status === "failed") {
    updateData.completedAt = new Date();
  }

  if (data?.productsScraped !== undefined) {
    updateData.productsScraped = data.productsScraped;
  }

  if (data?.errors) {
    updateData.errors = data.errors;
  }

  return db
    .update(scrapeJobs)
    .set(updateData)
    .where(eq(scrapeJobs.id, jobId));
}

// Conversation operations for AI assistant
export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(20);
}

export async function createConversation(userId: number, title?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(conversations).values({
    userId,
    title: title || "New Conversation",
  });

  return result.insertId;
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function addMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string,
  metadata?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(messages).values({
    conversationId,
    role,
    content,
    metadata,
  });
}

// Raw product operations for scrapers
export async function createRawProduct(data: {
  platformId: number;
  rawTitle: string;
  url: string;
  imageUrl?: string;
  rawDescription?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(rawProducts).values({
    platformId: data.platformId,
    rawTitle: data.rawTitle,
    url: data.url,
    imageUrl: data.imageUrl,
    rawDescription: data.rawDescription,
    matchConfidence: 0,
  });

  return result.insertId;
}

export async function createPriceSnapshot(data: {
  rawProductId: number;
  price: number;
  currency: string;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(priceSnapshots).values({
    rawProductId: data.rawProductId,
    price: data.price,
    currency: data.currency,
    availability: data.availability,
    scrapedAt: new Date(),
  });
}


// ============================================================================
// Categories
// ============================================================================

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  
  const { categories } = await import("../drizzle/schema");
  return await db.select().from(categories).where(eq(categories.isActive, true));
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { categories } = await import("../drizzle/schema");
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

// ============================================================================
// Search History & Analytics
// ============================================================================

export async function recordSearch(userId: number | null, query: string, resultsCount: number) {
  const db = await getDb();
  if (!db) return;
  
  const { searchHistory } = await import("../drizzle/schema");
  await db.insert(searchHistory).values({
    userId: userId || undefined,
    query,
    resultsCount,
  });
}

export async function recordProductView(productId: number, userId: number | null, sessionId?: string) {
  const db = await getDb();
  if (!db) return;
  
  const { productViews } = await import("../drizzle/schema");
  await db.insert(productViews).values({
    productId,
    userId: userId || undefined,
    sessionId,
  });
}

export async function getPopularProducts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const { productViews, products } = await import("../drizzle/schema");
  
  // Get products with most views in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const result = await db
    .select({
      product: products,
      viewCount: sql<number>`COUNT(${productViews.id})`,
    })
    .from(productViews)
    .innerJoin(products, eq(productViews.productId, products.id))
    .where(gte(productViews.createdAt, sevenDaysAgo))
    .groupBy(products.id)
    .orderBy(desc(sql`COUNT(${productViews.id})`))
    .limit(limit);
  
  return result.map(r => r.product);
}

export async function getPopularSearches(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const { searchHistory } = await import("../drizzle/schema");
  
  // Get most common searches in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const result = await db
    .select({
      query: searchHistory.query,
      searchCount: sql<number>`COUNT(*)`,
    })
    .from(searchHistory)
    .where(gte(searchHistory.createdAt, thirtyDaysAgo))
    .groupBy(searchHistory.query)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);
  
  return result;
}


// ============================================================================
// Price History & Trends
// ============================================================================

export async function getPriceHistory(
  productId: number,
  days: number = 30
): Promise<Array<{
  date: Date;
  platform: string;
  price: number;
  availability: string;
}>> {
  const db = await getDb();
  if (!db) return [];
  
  const { priceSnapshots, platforms, rawProducts } = await import("../drizzle/schema");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const history = await db
    .select({
      date: priceSnapshots.scrapedAt,
      platform: platforms.name,
      price: priceSnapshots.price,
      availability: priceSnapshots.availability,
    })
    .from(priceSnapshots)
    .innerJoin(rawProducts, eq(priceSnapshots.rawProductId, rawProducts.id))
    .innerJoin(platforms, eq(rawProducts.platformId, platforms.id))
    .where(
      and(
        eq(rawProducts.matchedProductId, productId),
        gte(priceSnapshots.scrapedAt, startDate)
      )
    )
    .orderBy(priceSnapshots.scrapedAt);
  
  return history;
}

export async function getPriceStats(productId: number, days: number = 30): Promise<{
  lowest: number;
  highest: number;
  average: number;
  current: number;
  trend: "up" | "down" | "stable";
}> {
  const db = await getDb();
  if (!db) {
    return { lowest: 0, highest: 0, average: 0, current: 0, trend: "stable" };
  }
  
  const { priceSnapshots, rawProducts } = await import("../drizzle/schema");
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const prices = await db
    .select({ price: priceSnapshots.price, date: priceSnapshots.scrapedAt })
    .from(priceSnapshots)
    .innerJoin(rawProducts, eq(priceSnapshots.rawProductId, rawProducts.id))
    .where(
      and(
        eq(rawProducts.matchedProductId, productId),
        gte(priceSnapshots.scrapedAt, startDate)
      )
    )
    .orderBy(priceSnapshots.scrapedAt);
  
  if (prices.length === 0) {
    return { lowest: 0, highest: 0, average: 0, current: 0, trend: "stable" };
  }
  
  const priceValues = prices.map(p => p.price);
  const lowest = Math.min(...priceValues);
  const highest = Math.max(...priceValues);
  const average = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
  const current = priceValues[priceValues.length - 1];
  
  // Calculate trend based on first half vs second half
  const midpoint = Math.floor(prices.length / 2);
  const firstHalfAvg = priceValues.slice(0, midpoint).reduce((sum, p) => sum + p, 0) / midpoint;
  const secondHalfAvg = priceValues.slice(midpoint).reduce((sum, p) => sum + p, 0) / (priceValues.length - midpoint);
  
  let trend: "up" | "down" | "stable" = "stable";
  const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  if (changePercent > 5) trend = "up";
  else if (changePercent < -5) trend = "down";
  
  return { lowest, highest, average, current, trend };
}


// Get products with stale prices for priority re-scraping
export async function getPriorityRescrapeProducts(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  // Get products with stale or expired prices (older than 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  try {
    const staleProducts = await db
      .select({
        id: rawProducts.id,
        matchedProductId: rawProducts.matchedProductId,
        platformId: rawProducts.platformId,
        updatedAt: rawProducts.updatedAt,
      })
      .from(rawProducts)
      .where(sql`${rawProducts.updatedAt} < ${twentyFourHoursAgo}`)
      .orderBy(sql`${rawProducts.updatedAt} ASC`)
      .limit(limit);

    return staleProducts;
  } catch (error) {
    console.error("[Database] Failed to get priority rescrape products:", error);
    return [];
  }
}
