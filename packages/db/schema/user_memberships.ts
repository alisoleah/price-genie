import { pgTable, serial, uuid, integer, varchar, boolean, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { platforms } from './platforms';

export const userMemberships = pgTable('user_memberships', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platformId: integer('platform_id').notNull().references(() => platforms.id),
  membershipType: varchar('membership_type', { length: 50 }).notNull(),
  active: boolean('active').default(true).notNull(),
  benefits: jsonb('benefits').default('{}'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserPlatformMembership: unique('user_memberships_user_id_platform_id_membership_type_key').on(table.userId, table.platformId, table.membershipType),
}));

export const userMembershipsRelations = relations(userMemberships, ({ one }) => ({
  user: one(users, {
    fields: [userMemberships.userId],
    references: [users.id],
  }),
  platform: one(platforms, {
    fields: [userMemberships.platformId],
    references: [platforms.id],
  }),
}));

export type UserMembership = typeof userMemberships.$inferSelect;
export type NewUserMembership = typeof userMemberships.$inferInsert;
