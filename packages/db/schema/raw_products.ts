import { pgTable, serial, integer, varchar, text, decimal, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { platforms } from './platforms';
import { products } from './products';
import { priceSnapshots } from './price_snapshots';

export const rawProducts = pgTable('raw_products', {
  id: serial('id').primaryKey(),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  platformSku: varchar('platform_sku', { length: 100 }),
  rawTitle: varchar('raw_title', { length: 1000 }).notNull(),
  rawDescription: text('raw_description'),
  url: varchar('url', { length: 1000 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  matchedProductId: integer('matched_product_id').references(() => products.id),
  matchConfidence: decimal('match_confidence', { precision: 3, scale: 2 }),
  matchStatus: varchar('match_status', { length: 20 }).default('PENDING'),
  embedding: 'vector(768)' as any, // pgvector type
  lastScrapedAt: timestamp('last_scraped_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniquePlatformUrl: unique('unique_platform_url').on(table.platformId, table.url),
}));

export const rawProductsRelations = relations(rawProducts, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [rawProducts.platformId],
    references: [platforms.id],
  }),
  matchedProduct: one(products, {
    fields: [rawProducts.matchedProductId],
    references: [products.id],
  }),
  priceSnapshots: many(priceSnapshots),
}));

export type RawProduct = typeof rawProducts.$inferSelect;
export type NewRawProduct = typeof rawProducts.$inferInsert;
