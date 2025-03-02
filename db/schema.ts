import { pgTable, serial, text, timestamp, integer, boolean, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Email configuration table
export const emailConfig = pgTable("email_config", {
  id: serial("id").primaryKey(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  secure: boolean("secure").default(true).notNull(),
  authUser: text("auth_user").notNull(),
  authPass: text("auth_pass").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderName: text("sender_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type EmailConfig = typeof emailConfig.$inferSelect;
export type InsertEmailConfig = typeof emailConfig.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

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
  firstname: text("first_name").notNull(),
  lastname: text("last_name").notNull(),
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