import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  phone: text('phone'),
  isAdmin: boolean('is_admin').default(false),
  isParent: boolean('is_parent').default(false),
  householdId: integer('household_id'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
});

// Households table
export const households = pgTable('households', {
  id: serial('id').primaryKey(),
  lastName: text('last_name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  primaryEmail: text('primary_email'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
});

// Household Invitations table
export const householdInvitations = pgTable('household_invitations', {
  id: serial('id').primaryKey(),
  householdId: integer('household_id').notNull(),
  email: text('email').notNull(),
  token: text('token').notNull(),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

// Email Templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("html_content").notNull(),
  senderEmail: text("sender_email"),
  senderName: text("sender_name"),
  isDefault: boolean("is_default").default(false),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  isParent: z.boolean().default(false),
});

export const insertHouseholdSchema = createInsertSchema(households, {
  lastName: z.string().min(1, "Last name is required"),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Type is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  senderEmail: z.string().email("Invalid sender email").optional(),
  senderName: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  household: one(households, {
    fields: [users.householdId],
    references: [households.id],
  }),
}));

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(users),
}));

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SelectHousehold = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

export type SelectEmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;