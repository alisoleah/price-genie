import { pgTable, serial, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';

// Custom vector type for pgvector
export const vector = (dimensions: number) => ({
  dataType: 'vector',
  dimensions,
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  canonicalName: varchar('canonical_name', { length: 500 }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  brand: varchar('brand', { length: 100 }),
  attributes: jsonb('attributes').notNull().default('{}'),
  embedding: vector(768) as any, // pgvector type
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
