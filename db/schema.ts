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

// Accounting Codes table
export const accountingCodes = pgTable("accounting_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

// Age Group Settings table
export const ageGroupSettings = pgTable("age_group_settings", {
  id: serial("id").primaryKey(),
  seasonalScopeId: integer("seasonal_scope_id").notNull(),
  ageGroup: text("age_group").notNull(),
  birthYear: integer("birth_year").notNull(),
  gender: text("gender").notNull(),
  divisionCode: text("division_code").notNull(),
  minBirthYear: integer("min_birth_year").notNull(),
  maxBirthYear: integer("max_birth_year").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
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

export const insertAccountingCodeSchema = createInsertSchema(accountingCodes, {
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
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

// Seasonal Scopes table
export const seasonalScopes = pgTable("seasonal_scopes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

// Events table (if not already defined elsewhere)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  description: text("description"),
  seasonalScopeId: integer("seasonal_scope_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

// Event Fees table
export const eventFees = pgTable("event_fees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  beginDate: timestamp("begin_date"),
  endDate: timestamp("end_date"),
  applyToAll: boolean("apply_to_all").default(false),
  accountingCodeId: integer("accounting_code_id").references(() => accountingCodes.id),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SelectHousehold = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

export type SelectEmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export type SelectSeasonalScope = typeof seasonalScopes.$inferSelect;
export type InsertSeasonalScope = typeof seasonalScopes.$inferInsert;

export type SelectAgeGroupSetting = typeof ageGroupSettings.$inferSelect;
export type InsertAgeGroupSetting = typeof ageGroupSettings.$inferInsert;

// Event Age Groups table
export const eventAgeGroups = pgTable("event_age_groups", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender"),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

// Event Age Group Fees join table
export const eventAgeGroupFees = pgTable("event_age_group_fees", {
  id: serial("id").primaryKey(),
  ageGroupId: integer("age_group_id").notNull(),
  feeId: integer("fee_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// Event Complexes join table
export const eventComplexes = pgTable("event_complexes", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  complexId: integer("complex_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// Event Field Sizes table
export const eventFieldSizes = pgTable("event_field_sizes", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  fieldId: integer("field_id").notNull(),
  fieldSize: text("field_size").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// Event Scoring Rules table
export const eventScoringRules = pgTable("event_scoring_rules", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  winPoints: integer("win_points").notNull().default(3),
  drawPoints: integer("draw_points").notNull().default(1),
  lossPoints: integer("loss_points").notNull().default(0),
  forfeitPoints: integer("forfeit_points").notNull().default(0),
  maxGoalDifferential: integer("max_goal_differential"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),
  amount: integer("amount").notNull(),
  expirationDate: timestamp("expiration_date"),
  description: text("description"),
  eventId: integer("event_id"),
  maxUses: integer("max_uses"),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SelectEvent = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type SelectAccountingCode = typeof accountingCodes.$inferSelect;
export type InsertAccountingCode = typeof accountingCodes.$inferInsert;

export type SelectEventFee = typeof eventFees.$inferSelect;
export type InsertEventFee = typeof eventFees.$inferInsert;

export type SelectEventAgeGroup = typeof eventAgeGroups.$inferSelect;
export type InsertEventAgeGroup = typeof eventAgeGroups.$inferInsert;

export type SelectEventAgeGroupFee = typeof eventAgeGroupFees.$inferSelect;
export type InsertEventAgeGroupFee = typeof eventAgeGroupFees.$inferInsert;

export type SelectEventComplex = typeof eventComplexes.$inferSelect;
export type InsertEventComplex = typeof eventComplexes.$inferInsert;

export type SelectEventFieldSize = typeof eventFieldSizes.$inferSelect;
export type InsertEventFieldSize = typeof eventFieldSizes.$inferInsert;

export type SelectEventScoringRule = typeof eventScoringRules.$inferSelect;
export type InsertEventScoringRule = typeof eventScoringRules.$inferInsert;

export type SelectCoupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

export const insertCouponSchema = createInsertSchema(coupons, {
  code: z.string().min(1, "Coupon code is required"),
  discountType: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "Discount type must be percentage or fixed" }),
  }),
  amount: z.number().min(1, "Amount must be greater than 0"),
  description: z.string().optional(),
  maxUses: z.number().optional(),
  expirationDate: z.date().optional(),
});