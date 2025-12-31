import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userMemberships } from './user_memberships';
import { userBaskets } from './user_baskets';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  authProvider: varchar('auth_provider', { length: 20 }).notNull(),
  authProviderId: varchar('auth_provider_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(userMemberships),
  baskets: many(userBaskets),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
