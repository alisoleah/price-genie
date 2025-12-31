import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, float, index, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  pushSubscription: json("pushSubscription").$type<{
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * E-commerce platforms (Amazon, Noon, Careem, Talabat, etc.)
 */
export const platforms = mysqlTable("platforms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  baseUrl: varchar("baseUrl", { length: 500 }).notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  scrapingConfig: json("scrapingConfig").$type<{
    rateLimit?: number; // requests per minute
    selectors?: Record<string, string>;
    headers?: Record<string, string>;
    enabled?: boolean;
  }>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = typeof platforms.$inferInsert;

/**
 * Canonical/normalized products (deduplicated across platforms)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  canonicalName: varchar("canonicalName", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  attributes: json("attributes").$type<{
    size?: string;
    color?: string;
    weight?: string;
    unit?: string;
    [key: string]: string | undefined;
  }>(),
  // Store embedding as JSON array since MySQL doesn't have native vector type
  // We'll use JSON_EXTRACT and custom functions for similarity search
  embedding: json("embedding").$type<number[]>(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  brandIdx: index("brand_idx").on(table.brand),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Raw scraped products (unnormalized, one per platform)
 */
export const rawProducts = mysqlTable("rawProducts", {
  id: int("id").autoincrement().primaryKey(),
  platformId: int("platformId").notNull().references(() => platforms.id),
  rawTitle: text("rawTitle").notNull(),
  rawDescription: text("rawDescription"),
  url: varchar("url", { length: 1000 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  matchedProductId: int("matchedProductId").references(() => products.id),
  matchConfidence: float("matchConfidence"), // 0.0 to 1.0
  embedding: json("embedding").$type<number[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  platformIdx: index("platform_idx").on(table.platformId),
  matchedProductIdx: index("matched_product_idx").on(table.matchedProductId),
  urlUnique: unique("url_unique").on(table.platformId, table.url),
}));

export type RawProduct = typeof rawProducts.$inferSelect;
export type InsertRawProduct = typeof rawProducts.$inferInsert;

/**
 * Price snapshots with staleness tracking
 */
export const priceSnapshots = mysqlTable("priceSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  rawProductId: int("rawProductId").notNull().references(() => rawProducts.id),
  price: int("price").notNull(), // Store as cents/fils to avoid decimal issues
  currency: varchar("currency", { length: 3 }).default("AED").notNull(),
  availability: mysqlEnum("availability", ["in_stock", "low_stock", "out_of_stock"]).default("in_stock").notNull(),
  scrapedAt: timestamp("scrapedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  rawProductScrapedIdx: index("raw_product_scraped_idx").on(table.rawProductId, table.scrapedAt),
}));

export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type InsertPriceSnapshot = typeof priceSnapshots.$inferInsert;

/**
 * User memberships (Amazon Prime, Noon One, Talabat Plus, etc.)
 */
export const userMemberships = mysqlTable("userMemberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  platformId: int("platformId").notNull().references(() => platforms.id),
  membershipType: varchar("membershipType", { length: 100 }).notNull(), // "prime", "one", "plus"
  discountPercent: float("discountPercent").default(0), // e.g., 5 for 5%
  freeShipping: boolean("freeShipping").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userPlatformUnique: unique("user_platform_unique").on(table.userId, table.platformId),
}));

export type UserMembership = typeof userMemberships.$inferSelect;
export type InsertUserMembership = typeof userMemberships.$inferInsert;

/**
 * Scrape jobs for monitoring and fault tolerance
 */
export const scrapeJobs = mysqlTable("scrapeJobs", {
  id: int("id").autoincrement().primaryKey(),
  platformId: int("platformId").notNull().references(() => platforms.id),
  status: mysqlEnum("status", ["pending", "running", "success", "failed"]).default("pending").notNull(),
  category: varchar("category", { length: 100 }), // Optional category filter
  productsScraped: int("productsScraped").default(0),
  errors: json("errors").$type<Array<{ message: string; timestamp: string; productUrl?: string }>>(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  nextRetryAt: timestamp("nextRetryAt"),
  retryCount: int("retryCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  platformStatusIdx: index("platform_status_idx").on(table.platformId, table.status),
  startedAtIdx: index("started_at_idx").on(table.startedAt),
}));

export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type InsertScrapeJob = typeof scrapeJobs.$inferInsert;

/**
 * Price alerts for user notifications
 */
export const priceAlerts = mysqlTable("priceAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  productId: int("productId").notNull().references(() => products.id),
  targetPrice: int("targetPrice").notNull(), // In cents/fils
  currency: varchar("currency", { length: 3 }).default("AED").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastNotifiedAt: timestamp("lastNotifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userProductIdx: index("user_product_idx").on(table.userId, table.productId),
  activeIdx: index("active_idx").on(table.isActive),
}));

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = typeof priceAlerts.$inferInsert;

/**
 * Saved baskets for users
 */
export const baskets = mysqlTable("baskets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type Basket = typeof baskets.$inferSelect;
export type InsertBasket = typeof baskets.$inferInsert;

/**
 * Items in saved baskets
 */
export const basketItems = mysqlTable("basketItems", {
  id: int("id").autoincrement().primaryKey(),
  basketId: int("basketId").notNull().references(() => baskets.id),
  productId: int("productId").notNull().references(() => products.id),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  basketIdx: index("basket_idx").on(table.basketId),
}));

export type BasketItem = typeof basketItems.$inferSelect;
export type InsertBasketItem = typeof basketItems.$inferInsert;

/**
 * Chat conversations for AI shopping assistant
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages in AI shopping assistant conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<{
    productIds?: number[];
    basketId?: number;
    suggestions?: string[];
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("conversation_idx").on(table.conversationId),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Product categories with hierarchical structure
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  parentId: int("parentId").references((): any => categories.id),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  parentIdx: index("parent_idx").on(table.parentId),
  slugIdx: index("slug_idx").on(table.slug),
}));

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Search history for analytics and suggestions
 */
export const searchHistory = mysqlTable("searchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  query: varchar("query", { length: 500 }).notNull(),
  resultsCount: int("resultsCount").default(0).notNull(),
  clickedProductId: int("clickedProductId").references(() => products.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  queryIdx: index("query_idx").on(table.query),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

/**
 * Product views for popularity tracking
 */
export const productViews = mysqlTable("productViews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  userId: int("userId").references(() => users.id),
  sessionId: varchar("sessionId", { length: 64 }),
  referrer: varchar("referrer", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  userIdx: index("user_idx").on(table.userId),
  sessionIdx: index("session_idx").on(table.sessionId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type ProductView = typeof productViews.$inferSelect;
export type InsertProductView = typeof productViews.$inferInsert;
