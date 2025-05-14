import { pgTable, serial, integer, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from '../schema';

/**
 * Schema for magic link authentication tokens
 */
export const magicLinkTokens = pgTable('magic_link_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 100 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  userAgent: varchar('user_agent', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 })
});