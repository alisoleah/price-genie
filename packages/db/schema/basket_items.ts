import { pgTable, serial, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userBaskets } from './user_baskets';
import { products } from './products';
import { platforms } from './platforms';

export const basketItems = pgTable('basket_items', {
  id: serial('id').primaryKey(),
  basketId: integer('basket_id').notNull().references(() => userBaskets.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').default(1).notNull(),
  preferredPlatformId: integer('preferred_platform_id').references(() => platforms.id),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
  uniqueBasketProduct: unique('unique_basket_product').on(table.basketId, table.productId),
}));

export const basketItemsRelations = relations(basketItems, ({ one }) => ({
  basket: one(userBaskets, {
    fields: [basketItems.basketId],
    references: [userBaskets.id],
  }),
  product: one(products, {
    fields: [basketItems.productId],
    references: [products.id],
  }),
  preferredPlatform: one(platforms, {
    fields: [basketItems.preferredPlatformId],
    references: [platforms.id],
  }),
}));

export type BasketItem = typeof basketItems.$inferSelect;
export type NewBasketItem = typeof basketItems.$inferInsert;
