import { eq, and, desc, sql, inArray, or, like } from "drizzle-orm";
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
