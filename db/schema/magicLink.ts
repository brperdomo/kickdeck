import { pgTable, serial, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from '@db/schema';

/**
 * Schema for magic link authentication tokens
 */
export const magicLinkTokens = pgTable('magic_link_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  usedAt: timestamp('used_at'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});