import { pgTable, text, serial, boolean, jsonb, time } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color"),
  logoUrl: text("logo_url"),
  createdAt: text("createdAt").notNull().default(new Date().toISOString()),
  updatedAt: text("updatedAt").notNull().default(new Date().toISOString()),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  phone: text("phone"),
  isParent: boolean("isParent").default(false).notNull(),
  isAdmin: boolean("isAdmin").default(false).notNull(),
  createdAt: text("createdAt").notNull().default(new Date().toISOString()),
  householdId: serial("householdId").references(() => households.id),
});

export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  lastName: text("lastName").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zipCode").notNull(),
  primaryEmail: text("primaryEmail").notNull(),
  createdAt: text("createdAt").notNull().default(new Date().toISOString()),
});

export const complexes = pgTable("complexes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  rules: text("rules"),
  directions: text("directions"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hasLights: boolean("has_lights").default(false).notNull(),
  hasParking: boolean("has_parking").default(false).notNull(),
  specialInstructions: text("special_instructions"),
  complexId: serial("complex_id").references(() => complexes.id),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings, {
  name: z.string().min(1, "Organization name is required"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
  logoUrl: z.string().url("Invalid URL format").optional(),
});

export const selectOrganizationSettingsSchema = createSelectSchema(organizationSettings);

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isParent: z.boolean().optional(),
  householdId: z.number().optional(),
});

export const insertHouseholdSchema = createInsertSchema(households, {
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2),
  zipCode: z.string().min(5, "ZIP code is required").max(10),
  primaryEmail: z.string().email("Please enter a valid email address"),
});

export const insertComplexSchema = createInsertSchema(complexes, {
  name: z.string().min(1, "Complex name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  openTime: z.string().min(1, "Open time is required"),
  closeTime: z.string().min(1, "Close time is required"),
  rules: z.string().optional(),
  directions: z.string().optional(),
});

export const selectComplexSchema = createSelectSchema(complexes);

export const selectUserSchema = createSelectSchema(users);
export const selectHouseholdSchema = createSelectSchema(households);

export const insertFieldSchema = createInsertSchema(fields, {
  name: z.string().min(1, "Field name is required"),
  hasLights: z.boolean(),
  hasParking: z.boolean(),
  specialInstructions: z.string().optional(),
  complexId: z.number(),
});

export const selectFieldSchema = createSelectSchema(fields);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;
export type SelectHousehold = typeof households.$inferSelect;
export type InsertOrganizationSettings = typeof organizationSettings.$inferInsert;
export type SelectOrganizationSettings = typeof organizationSettings.$inferSelect;
export type InsertComplex = typeof complexes.$inferInsert;
export type SelectComplex = typeof complexes.$inferSelect;
export type InsertField = typeof fields.$inferInsert;
export type SelectField = typeof fields.$inferSelect;