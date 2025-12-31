import { pgTable, serial, uuid, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const userBaskets = pgTable('user_baskets', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).default('My Basket'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  activeBasketIdx: index('idx_user_baskets_active').on(table.userId),
}));

export const userBasketsRelations = relations(userBaskets, ({ one }) => ({
  user: one(users, {
    fields: [userBaskets.userId],
    references: [users.id],
  }),
}));

export type UserBasket = typeof userBaskets.$inferSelect;
export type NewUserBasket = typeof userBaskets.$inferInsert;
