import { pgTable, serial, text, timestamp, integer, boolean, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Households table
export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  lastName: text("last_name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  primaryEmail: text("primary_email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SelectHousehold = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isParent: boolean("is_parent").default(false).notNull(),
  householdId: integer("household_id").references(() => households.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Define the schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  isParent: z.boolean().default(false),
});

export const insertHouseholdSchema = z.object({
  lastName: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  primaryEmail: z.string().email(),
});

// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  household: one(households, {
    fields: [users.householdId],
    references: [households.id],
  }),
}));

export const householdsRelations = relations(households, ({ many }) => ({
  users: many(users),
}));