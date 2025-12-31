import { pgTable, serial, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const platforms = pgTable('platforms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  baseUrl: varchar('base_url', { length: 255 }).notNull(),
  logoUrl: varchar('logo_url', { length: 255 }),
  scrapeConfig: jsonb('scrape_config').notNull().default('{}'),
  affiliateId: varchar('affiliate_id', { length: 100 }),
  deepLinkTemplate: varchar('deep_link_template', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Platform = typeof platforms.$inferSelect;
export type NewPlatform = typeof platforms.$inferInsert;
