import { pgTable, serial, integer, decimal, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { rawProducts } from './raw_products';

export const priceSnapshots = pgTable('price_snapshots', {
  id: serial('id').primaryKey(),
  rawProductId: integer('raw_product_id').notNull().references(() => rawProducts.id),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('AED'),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }),
  availability: varchar('availability', { length: 20 }).notNull(),
  shippingFee: decimal('shipping_fee', { precision: 10, scale: 2 }),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
  isStale: 'boolean' as any, // Computed column
}, (table) => ({
  latestPriceIdx: index('idx_price_snapshots_latest').on(table.rawProductId, table.scrapedAt),
}));

export const priceSnapshotsRelations = relations(priceSnapshots, ({ one }) => ({
  rawProduct: one(rawProducts, {
    fields: [priceSnapshots.rawProductId],
    references: [rawProducts.id],
  }),
}));

export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type NewPriceSnapshot = typeof priceSnapshots.$inferInsert;
