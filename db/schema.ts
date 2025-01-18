import { pgTable, text, serial, boolean, jsonb, time, integer, date } from "drizzle-orm/pg-core";
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
  isOpen: boolean("is_open").default(true).notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hasLights: boolean("has_lights").default(false).notNull(),
  hasParking: boolean("has_parking").default(false).notNull(),
  isOpen: boolean("is_open").default(true).notNull(),
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
  isOpen: z.boolean().optional(),
});

export const selectComplexSchema = createSelectSchema(complexes);

export const selectUserSchema = createSelectSchema(users);
export const selectHouseholdSchema = createSelectSchema(households);

export const insertFieldSchema = createInsertSchema(fields, {
  name: z.string().min(1, "Field name is required"),
  hasLights: z.boolean(),
  hasParking: z.boolean(),
  isOpen: z.boolean(),
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


export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  timezone: text("timezone").notNull(),
  applicationDeadline: text("application_deadline").notNull(),
  details: text("details"),
  agreement: text("agreement"),
  refundPolicy: text("refund_policy"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const eventAgeGroups = pgTable("event_age_groups", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  gender: text("gender").notNull(),
  projectedTeams: integer("projected_teams").notNull(),
  birthDateStart: text("birth_date_start").notNull(),
  birthDateEnd: text("birth_date_end").notNull(),
  scoringRule: text("scoring_rule"),
  ageGroup: text("age_group").notNull(),
  fieldSize: text("field_size").notNull(),
  amountDue: integer("amount_due"),
  createdAt: text("created_at").notNull(),
});

export const eventComplexes = pgTable("event_complexes", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  complexId: integer("complex_id").notNull().references(() => complexes.id),
  createdAt: text("created_at").notNull(),
});

export const eventFieldSizes = pgTable("event_field_sizes", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  fieldSize: text("field_size").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertEventSchema = createInsertSchema(events, {
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Time zone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
});

export type InsertEvent = typeof events.$inferInsert;
export type SelectEvent = typeof events.$inferSelect;


export const gameTimeSlots = pgTable("game_time_slots", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  dayIndex: integer("day_index").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const tournamentGroups = pgTable("tournament_groups", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  stage: text("stage").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  groupId: integer("group_id").references(() => tournamentGroups.id),
  name: text("name").notNull(),
  coach: text("coach"),
  managerName: text("manager_name"),
  managerPhone: text("manager_phone"),
  managerEmail: text("manager_email"),
  seedRanking: integer("seed_ranking"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  groupId: integer("group_id").references(() => tournamentGroups.id),
  fieldId: integer("field_id").references(() => fields.id),
  timeSlotId: integer("time_slot_id").references(() => gameTimeSlots.id),
  homeTeamId: integer("home_team_id").references(() => teams.id),
  awayTeamId: integer("away_team_id").references(() => teams.id),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default('scheduled'),
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  duration: integer("duration").notNull(),
  breakTime: integer("break_time").notNull().default(5),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertGameTimeSlotSchema = createInsertSchema(gameTimeSlots);
export const insertTournamentGroupSchema = createInsertSchema(tournamentGroups);
export const insertTeamSchema = createInsertSchema(teams);
export const insertGameSchema = createInsertSchema(games, {
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  duration: z.number().min(20).max(120),
  breakTime: z.number().min(0).max(30),
});

export const selectGameTimeSlotSchema = createSelectSchema(gameTimeSlots);
export const selectTournamentGroupSchema = createSelectSchema(tournamentGroups);
export const selectTeamSchema = createSelectSchema(teams);
export const selectGameSchema = createSelectSchema(games);

export type InsertGameTimeSlot = typeof gameTimeSlots.$inferInsert;
export type SelectGameTimeSlot = typeof gameTimeSlots.$inferSelect;
export type InsertTournamentGroup = typeof tournamentGroups.$inferInsert;
export type SelectTournamentGroup = typeof tournamentGroups.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export type SelectTeam = typeof teams.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type SelectGame = typeof games.$inferSelect;