import { pgTable, serial, integer, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { platforms } from './platforms';

export const scrapeJobs = pgTable('scrape_jobs', {
  id: serial('id').primaryKey(),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  jobType: varchar('job_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  productsScraped: integer('products_scraped').default(0),
  productsFailed: integer('products_failed').default(0),
  errors: jsonb('errors').default('[]'),
  nextRetryAt: timestamp('next_retry_at'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scrapeJobsRelations = relations(scrapeJobs, ({ one }) => ({
  platform: one(platforms, {
    fields: [scrapeJobs.platformId],
    references: [platforms.id],
  }),
}));

export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type NewScrapeJob = typeof scrapeJobs.$inferInsert;
