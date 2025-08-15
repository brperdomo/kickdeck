import { pgTable, text, serial, boolean, jsonb, timestamp, integer, bigint, date, varchar, time } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClubSchema = createInsertSchema(clubs, {
  name: z.string().min(1, "Club name is required"),
  logoUrl: z.string().optional(),
});

export const selectClubSchema = createSelectSchema(clubs);

export type InsertClub = typeof clubs.$inferInsert;
export type SelectClub = typeof clubs.$inferSelect;

export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").unique(),
  customDomain: text("custom_domain").unique(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color"),
  logoUrl: text("logo_url"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
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
  lastLogin: timestamp("last_login"), // Track last login time
  lastViewedRegistrations: timestamp("last_viewed_registrations"), // Track when admin last viewed team registrations
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
  latitude: text("latitude"),
  longitude: text("longitude"),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  timezone: text("timezone").default("America/New_York"),
  rules: text("rules"),
  directions: text("directions"),
  isOpen: boolean("is_open").default(true).notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(), // NEW: Proximity ordering (0=closest, higher=farther)
  hasLights: boolean("has_lights").default(false).notNull(),
  hasParking: boolean("has_parking").default(false).notNull(),
  hasConcessions: boolean("has_concessions").default(false).notNull(),
  concessionCapacity: integer("concession_capacity").default(0),
  concessionHours: text("concession_hours"), // JSON: {open: "07:00", close: "21:00"}
  parkingCapacity: integer("parking_capacity").default(50),
  isOpen: boolean("is_open").default(true).notNull(),
  openTime: text("open_time").default("08:00"),
  closeTime: text("close_time").default("22:00"),
  specialInstructions: text("special_instructions"),
  fieldSize: text("field_size").default("11v11"), // Size options: 7v7, 9v9, 11v11
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
  domain: z.string().optional(),
  customDomain: z.string().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
  logoUrl: z.string().url("Invalid URL format").optional(),
});

export const selectOrganizationSettingsSchema = createSelectSchema(organizationSettings);

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().nullable(),
  isAdmin: z.boolean().default(false),
  isParent: z.boolean().default(false),
  householdId: z.number().optional(),
  createdAt: z.string().optional(),
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
  latitude: z.string().optional(),
  longitude: z.string().optional(),
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
  hasConcessions: z.boolean(),
  concessionCapacity: z.number().min(0).optional(),
  concessionHours: z.string().optional(),
  parkingCapacity: z.number().min(0).optional(),
  isOpen: z.boolean(),
  openTime: z.string().min(1, "Opening time is required"),
  closeTime: z.string().min(1, "Closing time is required"),
  specialInstructions: z.string().optional(),
  fieldSize: z.enum(["7v7", "9v9", "11v11"]).default("11v11"),
  complexId: z.number(),
});

export const selectFieldSchema = createSelectSchema(fields);

// Tournament-specific field configurations
export const eventFieldConfigurations = pgTable("event_field_configurations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  fieldSize: text("field_size").notNull().default("11v11"), // Tournament-specific field size
  sortOrder: integer("sort_order").default(0).notNull(), // Tournament-specific display order
  isActive: boolean("is_active").default(true).notNull(), // Can disable fields for specific tournaments
  firstGameTime: text("first_game_time"), // When first games should start on this field (e.g., "08:00")
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertEventFieldConfigurationSchema = createInsertSchema(eventFieldConfigurations, {
  eventId: z.number().min(1, "Event ID is required"),
  fieldId: z.number().min(1, "Field ID is required"),
  fieldSize: z.enum(["3v3", "4v4", "5v5", "6v6", "7v7", "8v8", "9v9", "10v10", "11v11", "N/A"]).default("11v11"),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const selectEventFieldConfigurationSchema = createSelectSchema(eventFieldConfigurations);

export type InsertEventFieldConfiguration = typeof eventFieldConfigurations.$inferInsert;
export type SelectEventFieldConfiguration = typeof eventFieldConfigurations.$inferSelect;

// Referee Management Tables
export const referees = pgTable("referees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  certificationLevel: text("certification_level").notNull(), // Youth, Adult, Advanced, National
  certificationExpiry: timestamp("certification_expiry"),
  availability: text("availability"), // JSON schedule by day of week
  preferredComplexes: text("preferred_complexes"), // JSON array of complex IDs
  payRate: integer("pay_rate").default(0), // cents per game
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"), // Admin notes about referee
  totalGamesAssigned: integer("total_games_assigned").default(0),
  totalPaymentEarned: integer("total_payment_earned").default(0), // cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const gameAssignments = pgTable("game_assignments", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(), // References games table
  refereeId: integer("referee_id").notNull().references(() => referees.id),
  position: text("position").notNull(), // center, assistant1, assistant2, 4th_official
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by"), // User ID who made assignment
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, paid, cancelled
  paymentAmount: integer("payment_amount").default(0), // cents
  paymentDate: timestamp("payment_date"),
  confirmedByReferee: boolean("confirmed_by_referee").default(false),
  notes: text("notes") // Assignment-specific notes
});

export const insertRefereeSchema = createInsertSchema(referees, {
  name: z.string().min(1, "Referee name is required"),
  email: z.string().email("Valid email is required"),
  certificationLevel: z.enum(["Youth", "Adult", "Advanced", "National"]),
  phone: z.string().optional(),
  payRate: z.number().min(0).optional(),
  availability: z.string().optional(),
  preferredComplexes: z.string().optional(),
  notes: z.string().optional()
});

export const selectRefereeSchema = createSelectSchema(referees);

export const insertGameAssignmentSchema = createInsertSchema(gameAssignments, {
  gameId: z.number().min(1, "Game ID is required"),
  refereeId: z.number().min(1, "Referee ID is required"),
  position: z.enum(["center", "assistant1", "assistant2", "4th_official"]),
  paymentAmount: z.number().min(0).optional(),
  notes: z.string().optional()
});

export const selectGameAssignmentSchema = createSelectSchema(gameAssignments);

export const events = pgTable("events", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  timezone: text("timezone").notNull(),
  applicationDeadline: text("application_deadline").notNull(),
  details: text("details"),
  agreement: text("agreement"),
  refundPolicy: text("refund_policy"),
  logoUrl: text("logo_url"), // Tournament/event logo for branding
  isArchived: boolean("is_archived").default(false).notNull(),
  // Stripe Connect fields for per-tournament bank accounts
  stripeConnectAccountId: text("stripe_connect_account_id"), // Stripe Connect account ID
  connectAccountStatus: text("connect_account_status").default("not_connected"), // not_connected, pending, active, rejected, restricted
  connectOnboardingUrl: text("connect_onboarding_url"), // URL for completing onboarding
  connectDashboardUrl: text("connect_dashboard_url"), // URL to Stripe Express dashboard
  connectAccountType: text("connect_account_type").default("standard"), // standard, express, custom
  connectRequirementsNeeded: text("connect_requirements_needed"), // JSON array of pending requirements
  connectPayoutsEnabled: boolean("connect_payouts_enabled").default(false), // Whether payouts are enabled
  connectChargesEnabled: boolean("connect_charges_enabled").default(false), // Whether charges are enabled
  connectAccountVerified: boolean("connect_account_verified").default(false), // Full verification status
  connectLastUpdated: timestamp("connect_last_updated"), // When Connect status was last checked
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const eventAgeGroups = pgTable("event_age_groups", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  ageGroup: text("age_group").notNull(),
  birthYear: integer("birth_year").notNull(),
  gender: text("gender").notNull(),
  projectedTeams: integer("projected_teams"),
  scoringRule: text("scoring_rule"),
  fieldSize: text("field_size").notNull(),
  amountDue: integer("amount_due"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  birth_date_start: text("birth_date_start"),
  divisionCode: text("division_code"),
  isEligible: boolean("is_eligible").notNull().default(true),
  seasonalScopeId: integer("seasonal_scope_id").references(() => seasonalScopes.id),
});

export const insertEventAgeGroupSchema = createInsertSchema(eventAgeGroups, {
  ageGroup: z.string().min(1, "Age group is required"),
  birthYear: z.number().int("Birth year must be a valid year"),
  gender: z.enum(["Boys", "Girls"]).describe("Gender must be either Boys or Girls"),
  divisionCode: z.string().min(1, "Division code is required"),
  projectedTeams: z.number().int().min(0, "Projected teams must be 0 or greater").optional(),
  fieldSize: z.string().min(1, "Field size is required"),
  amountDue: z.number().int().min(0, "Amount due must be 0 or greater").optional(),
  scoringRule: z.string().optional(),
  birth_date_start: z.string().optional(),
  isEligible: z.boolean().default(true),
});

export type InsertEventAgeGroup = typeof eventAgeGroups.$inferInsert;
export type SelectEventAgeGroup = typeof eventAgeGroups.$inferSelect;

export const insertEventSchema = createInsertSchema(events, {
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Time zone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
  logoUrl: z.string().url("Invalid logo URL format").optional(),
  stripeConnectAccountId: z.string().optional(),
  connectAccountStatus: z.enum(["not_connected", "pending", "active", "rejected", "restricted"]).default("not_connected"),
  connectOnboardingUrl: z.string().optional(),
  connectDashboardUrl: z.string().optional(),
  connectAccountType: z.enum(["standard", "express", "custom"]).default("standard"),
  connectRequirementsNeeded: z.string().optional(),
  connectPayoutsEnabled: z.boolean().default(false),
  connectChargesEnabled: z.boolean().default(false),
  connectAccountVerified: z.boolean().default(false),
});

export type InsertEvent = typeof events.$inferInsert;
export type SelectEvent = typeof events.$inferSelect;

export const gameTimeSlots = pgTable("game_time_slots", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  dayIndex: integer("day_index").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Brackets for event age groups - allows teams to select their competitive level
export const eventBrackets = pgTable("event_brackets", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  name: text("name").notNull(), // e.g., "Elite", "Premier", "Select", "Classic", "Recreational"
  description: text("description"), // More info about the bracket
  level: text("level").notNull().default("middle_flight"), // Flight level: top_flight, middle_flight, bottom_flight, other
  eligibility: text("eligibility"), // Optional eligibility requirements
  sortOrder: integer("sort_order").notNull().default(0), // For ordering brackets in the UI
  // Configurable tournament format for game generation
  tournamentFormat: text("tournament_format").notNull().default("round_robin"), // round_robin, round_robin_final, single_elimination, double_elimination, pool_play, etc.
  // Tournament settings JSON for format-specific configuration
  tournamentSettings: jsonb("tournament_settings"), // {maxGamesPerTeam: 4, playoffFormat: "single_elimination", poolSize: 4}
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertEventBracketSchema = createInsertSchema(eventBrackets, {
  name: z.string().min(1, "Bracket name is required"),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
  tournamentFormat: z.enum(["round_robin", "round_robin_final", "single_elimination", "double_elimination", "pool_play", "swiss_system"]).default("round_robin"),
  tournamentSettings: z.object({
    maxGamesPerTeam: z.number().int().min(1).max(10).optional(),
    playoffFormat: z.enum(["single_elimination", "double_elimination", "none"]).optional(),
    poolSize: z.number().int().min(2).max(8).optional(),
    enableChampionship: z.boolean().optional(),
    restPeriodMinutes: z.number().int().min(0).max(120).optional(),
  }).optional(),
});

export const selectEventBracketSchema = createSelectSchema(eventBrackets);

export type InsertEventBracket = typeof eventBrackets.$inferInsert;
export type SelectEventBracket = typeof eventBrackets.$inferSelect;

export const tournamentGroups = pgTable("tournament_groups", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  stage: text("stage").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  groupId: integer("group_id").references(() => tournamentGroups.id),
  bracketId: integer("bracket_id").references(() => eventBrackets.id), // Reference to selected bracket
  clubId: integer("club_id").references(() => clubs.id), // Reference to club
  clubName: text("club_name"), // Denormalized for easier access
  name: text("name").notNull(),
  // Use a single coach JSON field to match the actual database structure
  coach: text("coach"),
  managerName: text("manager_name"),
  managerPhone: text("manager_phone"),
  managerEmail: text("manager_email"),
  // Track who submitted the registration for accountability
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  seedRanking: integer("seed_ranking"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  // Club/Organization name is already defined above
  // User ID is not in the actual database schema
  // New fields for registration status and fee tracking
  status: text("status").notNull().default("registered"), // registered, approved, rejected, etc.
  registrationFee: integer("registration_fee"), // Store amount in cents
  // New fields for multiple fee selection
  selectedFeeIds: text("selected_fee_ids"), // Comma-separated list of fee IDs
  totalAmount: integer("total_amount"), // Store total amount in cents (includes all fees)
  // Payment status and details
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded, payment_info_provided
  paymentDate: timestamp("payment_date"), // When the payment was processed
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID
  setupIntentId: text("setup_intent_id"), // Stripe setup intent ID for two-step payment flow
  paymentMethodId: text("payment_method_id"), // Stored payment method ID for two-step payment flow
  cardBrand: text("card_brand"), // Card brand (Visa, Mastercard, etc.)
  cardLast4: text("card_last_4"), // Last 4 digits of the card
  paymentMethodType: text("payment_method_type"), // Type of payment method
  paymentErrorCode: text("payment_error_code"), // Error code if payment failed
  paymentErrorMessage: text("payment_error_message"), // Error message if payment failed
  refundDate: timestamp("refund_date"), // When a refund was processed
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for the team
  // Terms acknowledgement
  termsAcknowledged: boolean("terms_acknowledged").default(false),
  termsAcknowledgedAt: timestamp("terms_acknowledged_at"),
  termsAcknowledgementRecord: text("terms_acknowledgement_record"), // Path to PDF or record ID
  // Flag for adding roster later
  addRosterLater: boolean("add_roster_later").default(false),
  // Roster tracking fields
  rosterUploadedAt: timestamp("roster_uploaded_at"),
  rosterUploadMethod: text("roster_upload_method"), // 'initial_registration', 'csv_upload', 'manual_entry'
  initialRosterComplete: boolean("initial_roster_complete").default(false),
  // Applied coupon information
  appliedCoupon: text("applied_coupon"), // JSON string storing coupon details
  // Notes field for admin comments
  notes: text("notes"),
  // Approver tracking
  approvedByUserId: integer("approved_by_user_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  // Placeholder team flag for pre-scheduling workflows
  isPlaceholder: boolean("is_placeholder").default(false)
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  groupId: integer("group_id").references(() => tournamentGroups.id),
  fieldId: integer("field_id").references(() => fields.id),
  timeSlotId: integer("time_slot_id").references(() => gameTimeSlots.id),
  homeTeamId: integer("home_team_id").references(() => teams.id),
  awayTeamId: integer("away_team_id").references(() => teams.id),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  // Card statistics for performance-based scoring
  homeYellowCards: integer("home_yellow_cards").notNull().default(0),
  awayYellowCards: integer("away_yellow_cards").notNull().default(0),
  homeRedCards: integer("home_red_cards").notNull().default(0),
  awayRedCards: integer("away_red_cards").notNull().default(0),
  status: text("status").notNull().default('scheduled'), // scheduled, in_progress, completed, overridden
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  duration: integer("duration").notNull(),
  breakTime: integer("break_time").notNull().default(5),
  scheduledDate: date("scheduled_date"), // Date for the scheduled game
  scheduledTime: time("scheduled_time"), // Time for the scheduled game
  // Score audit trail fields
  scoreEnteredBy: integer("score_entered_by").references(() => users.id), // Who entered/last modified the score
  scoreEnteredAt: timestamp("score_entered_at"), // When score was entered/last modified
  scoreNotes: text("score_notes"), // Optional notes about the score (forfeit, penalty shootout, etc.)
  isScoreLocked: boolean("is_score_locked").notNull().default(false), // Prevent further score changes
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Game Score Audit Trail - Full history of all score changes
export const gameScoreAudit = pgTable("game_score_audit", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id, { onDelete: 'cascade' }),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  homeYellowCards: integer("home_yellow_cards").notNull().default(0),
  awayYellowCards: integer("away_yellow_cards").notNull().default(0),
  homeRedCards: integer("home_red_cards").notNull().default(0),
  awayRedCards: integer("away_red_cards").notNull().default(0),
  enteredBy: integer("entered_by").notNull().references(() => users.id), // Who made this change
  enteredAt: timestamp("entered_at").notNull().defaultNow(), // When this change was made
  changeType: text("change_type").notNull(), // 'initial_entry', 'score_update', 'override', 'admin_correction'
  notes: text("notes"), // Why this change was made
  isOverride: boolean("is_override").notNull().default(false), // True if this was an override of existing score
  previousValues: jsonb("previous_values"), // JSON of what the values were before this change
  userRole: text("user_role").notNull(), // Role of person making change (ref, score_admin, tournament_admin, etc.)
  ipAddress: text("ip_address"), // For additional audit trail
  userAgent: text("user_agent"), // Browser/device information
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment transactions table for recording all payment-related activity
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id),
  eventId: bigint("event_id", { mode: "number" }).references(() => events.id),
  userId: integer("user_id").references(() => users.id),
  paymentIntentId: text("payment_intent_id"), // For payment intents
  setupIntentId: text("setup_intent_id"), // For setup intents (when just saving payment method)
  transactionType: text("transaction_type").notNull(), // payment, refund, chargeback, payment_info_collected, etc.
  amount: integer("amount").notNull(), // Amount in cents, positive for payments, negative for refunds
  stripeFee: integer("stripe_fee"), // Actual Stripe processing fee in cents
  netAmount: integer("net_amount"), // Net amount after fees (amount - stripeFee)
  status: text("status").notNull(), // succeeded, failed, pending, etc.
  cardBrand: text("card_brand"), // Visa, Mastercard, etc.
  cardLastFour: text("card_last_four"), // Last 4 digits of card
  paymentMethodType: text("payment_method_type"), // card, bank_transfer, etc.
  errorCode: text("error_code"), // Error code if transaction failed
  errorMessage: text("error_message"), // Error message if transaction failed
  settlementDate: timestamp("settlement_date"), // When funds settle to account
  payoutId: text("payout_id"), // Stripe payout ID when settled
  platformFeeAmount: integer("platform_fee_amount"), // MatchPro platform fee in cents
  matchproRevenue: integer("matchpro_revenue"), // MatchPro net revenue after Stripe fees
  applicationFeeAmount: integer("application_fee_amount"), // Application fee sent to Stripe Connect
  metadata: jsonb("metadata"), // Additional data about the transaction
  notes: text("notes"), // Admin notes about the transaction
  refundedAt: timestamp("refunded_at"), // When the transaction was refunded (null if not refunded)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Refunds table for tracking all refund transactions
export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  eventId: integer("event_id").notNull(), // Changed to integer to match events.id
  originalPaymentIntentId: text("original_payment_intent_id").notNull(),
  refundId: text("refund_id").notNull(), // Stripe refund ID
  refundAmount: integer("refund_amount").notNull(), // Amount refunded in cents
  platformFeeRefund: integer("platform_fee_refund").notNull(), // Platform fee refunded in cents
  refundReason: text("refund_reason").notNull(),
  adminNotes: text("admin_notes"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  processedByUserId: integer("processed_by_user_id").notNull().references(() => users.id),
  processedAt: timestamp("processed_at").defaultNow(),
  stripeConnectAccountId: text("stripe_connect_account_id").notNull(),
  metadata: jsonb("metadata"), // Additional refund data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Fee revenue tracking table - tracks how much revenue each fee generates
export const feeRevenue = pgTable("fee_revenue", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  feeId: integer("fee_id").notNull().references(() => eventFees.id, { onDelete: 'cascade' }),
  teamId: integer("team_id").references(() => teams.id),
  paymentTransactionId: integer("payment_transaction_id").references(() => paymentTransactions.id),
  feeAmount: integer("fee_amount").notNull(), // Amount of this specific fee in cents
  stripeFeeAllocation: integer("stripe_fee_allocation"), // Allocated portion of Stripe fee for this fee
  netFeeRevenue: integer("net_fee_revenue"), // Net revenue after allocated Stripe fees
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one, many }) => ({
  team: one(teams, {
    fields: [paymentTransactions.teamId],
    references: [teams.id]
  }),
  event: one(events, {
    fields: [paymentTransactions.eventId],
    references: [events.id]
  }),
  user: one(users, {
    fields: [paymentTransactions.userId],
    references: [users.id]
  }),
  feeRevenues: many(feeRevenue),
}));

export const feeRevenueRelations = relations(feeRevenue, ({ one }) => ({
  event: one(events, {
    fields: [feeRevenue.eventId],
    references: [events.id],
  }),
  fee: one(eventFees, {
    fields: [feeRevenue.feeId],
    references: [eventFees.id],
  }),
  team: one(teams, {
    fields: [feeRevenue.teamId],
    references: [teams.id],
  }),
  paymentTransaction: one(paymentTransactions, {
    fields: [feeRevenue.paymentTransactionId],
    references: [paymentTransactions.id],
  }),
}));

export const insertGameTimeSlotSchema = createInsertSchema(gameTimeSlots);
export const insertTournamentGroupSchema = createInsertSchema(tournamentGroups);
export const insertTeamSchema = createInsertSchema(teams);
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions, {
  transactionType: z.enum(['payment', 'refund', 'partial_refund', 'chargeback', 'credit', 'onsite_payment', 'payment_info_collected']),
  status: z.enum(['succeeded', 'failed', 'pending', 'processing', 'canceled']),
  amount: z.number().int(),
});

export const selectPaymentTransactionSchema = createSelectSchema(paymentTransactions);
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type SelectPaymentTransaction = typeof paymentTransactions.$inferSelect;

export const insertFeeRevenueSchema = createInsertSchema(feeRevenue, {
  feeAmount: z.number().int().positive("Fee amount must be positive"),
  stripeFeeAllocation: z.number().int().optional(),
  netFeeRevenue: z.number().int().optional(),
});

export const selectFeeRevenueSchema = createSelectSchema(feeRevenue);
export type InsertFeeRevenue = typeof feeRevenue.$inferInsert;
export type SelectFeeRevenue = typeof feeRevenue.$inferSelect;

// Event Game Format Rules - Configurable per tournament/event
export const eventGameFormats = pgTable("event_game_formats", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroup: text("age_group").notNull(), // U6-U8, U9-U10, etc.
  format: text("format").notNull(), // 4v4, 7v7, 9v9, 11v11
  gameLength: integer("game_length").notNull(), // Total minutes
  halves: integer("halves").notNull().default(2),
  halfLength: integer("half_length").notNull(), // Minutes per half
  halfTimeBreak: integer("half_time_break").notNull().default(5), // Half-time break minutes
  bufferTime: integer("buffer_time").notNull().default(10), // Buffer between games (minutes)
  fieldSize: text("field_size").notNull(), // Required field size: 7v7, 9v9, 11v11
  allowsLights: boolean("allows_lights").notNull().default(true), // Can use evening games
  surfacePreference: text("surface_preference").default("either"), // grass, turf, either
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Event Schedule Constraints - Tournament-specific constraints
export const eventScheduleConstraints = pgTable("event_schedule_constraints", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  // Team constraints
  maxGamesPerTeamPerDay: integer("max_games_per_team_per_day").notNull().default(3),
  maxHoursSpreadPerTeam: integer("max_hours_spread_per_team").notNull().default(8), // Max hours between first and last game
  minRestTimeBetweenGames: integer("min_rest_time_between_games").notNull().default(90), // Minutes
  allowBackToBackGames: boolean("allow_back_to_back_games").notNull().default(false),
  // Field constraints
  maxHoursPerFieldPerDay: integer("max_hours_per_field_per_day").notNull().default(12),
  enforceFieldCompatibility: boolean("enforce_field_compatibility").notNull().default(true), // 7v7 fields can't host 11v11
  // Tournament preferences
  prioritizeEvenScheduling: boolean("prioritize_even_scheduling").notNull().default(true), // No team gets all early/late games
  allowEveningGames: boolean("allow_evening_games").notNull().default(true),
  earliestGameTime: text("earliest_game_time").notNull().default("08:00"), // 24-hour format
  latestGameTime: text("latest_game_time").notNull().default("20:00"), // 24-hour format
  // Playoff constraints
  minRestBeforePlayoffs: integer("min_rest_before_playoffs").notNull().default(120), // Minutes
  allowPlayoffBackToBack: boolean("allow_playoff_back_to_back").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Add validation schemas for the new tables
export const insertEventGameFormatSchema = createInsertSchema(eventGameFormats, {
  ageGroup: z.string().min(1, "Age group is required"),
  format: z.string().min(1, "Game format is required"),
  gameLength: z.number().min(20).max(120, "Game length must be between 20-120 minutes"),
  halves: z.number().min(1).max(4, "Must have 1-4 halves"),
  halfLength: z.number().min(10).max(60, "Half length must be between 10-60 minutes"),
  halfTimeBreak: z.number().min(0).max(20, "Half-time break must be 0-20 minutes"),
  bufferTime: z.number().min(5).max(30, "Buffer time must be 5-30 minutes"),
  fieldSize: z.enum(["7v7", "9v9", "11v11"]),
  surfacePreference: z.enum(["grass", "turf", "either"]).default("either"),
});

export const insertEventScheduleConstraintsSchema = createInsertSchema(eventScheduleConstraints, {
  maxGamesPerTeamPerDay: z.number().min(1).max(10, "Must be 1-10 games per day"),
  maxHoursSpreadPerTeam: z.number().min(2).max(14, "Must be 2-14 hours spread"),
  minRestTimeBetweenGames: z.number().min(30).max(240, "Rest time must be 30-240 minutes"),
  maxHoursPerFieldPerDay: z.number().min(4).max(16, "Field hours must be 4-16 per day"),
  earliestGameTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  latestGameTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  minRestBeforePlayoffs: z.number().min(60).max(300, "Playoff rest must be 60-300 minutes"),
});

export const selectEventGameFormatSchema = createSelectSchema(eventGameFormats);
export const selectEventScheduleConstraintsSchema = createSelectSchema(eventScheduleConstraints);

export type InsertEventGameFormat = typeof eventGameFormats.$inferInsert;
export type SelectEventGameFormat = typeof eventGameFormats.$inferSelect;
export type InsertEventScheduleConstraints = typeof eventScheduleConstraints.$inferInsert;
export type SelectEventScheduleConstraints = typeof eventScheduleConstraints.$inferSelect;
export const insertGameSchema = createInsertSchema(games, {
  status: z.enum(['scheduled', 'in_progress', 'completed', 'overridden']),
  duration: z.number().min(20).max(120),
  breakTime: z.number().min(0).max(30),
  homeScore: z.number().min(0).max(20).nullable(),
  awayScore: z.number().min(0).max(20).nullable(),
});

export const insertGameScoreAuditSchema = createInsertSchema(gameScoreAudit, {
  homeScore: z.number().min(0).max(20).nullable(),
  awayScore: z.number().min(0).max(20).nullable(),
  changeType: z.enum(['initial_entry', 'score_update', 'override', 'admin_correction']),
  userRole: z.string().min(1, "User role is required"),
  notes: z.string().optional(),
});

export const selectGameScoreAuditSchema = createSelectSchema(gameScoreAudit);
export type InsertGameScoreAudit = typeof gameScoreAudit.$inferInsert;
export type SelectGameScoreAudit = typeof gameScoreAudit.$inferSelect;

export const selectGameTimeSlotSchema = createSelectSchema(gameTimeSlots);
export const selectTournamentGroupSchema = createSelectSchema(tournamentGroups);
export const selectTeamSchema = createSelectSchema(teams);
export const selectGameSchema = createSelectSchema(games);

export type InsertGameTimeSlot = typeof gameTimeSlots.$inferInsert;
export type SelectGameTimeSlot = typeof gameTimeSlots.$inferSelect;
export type InsertTournamentGroup = typeof tournamentGroups.$inferInsert;
export type SelectTournamentGroup = typeof tournamentGroups.$inferSelect;
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  jerseyNumber: integer("jersey_number"),
  dateOfBirth: text("date_of_birth").notNull(),
  position: text("position"), // Keeping for backward compatibility but no longer used
  medicalNotes: text("medical_notes"),
  // Modified emergency contact fields
  emergencyContactFirstName: text("emergency_contact_first_name").notNull(),
  emergencyContactLastName: text("emergency_contact_last_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  // Keeping parent fields for backward compatibility but no longer used
  parentGuardianName: text("parent_guardian_name"),
  parentGuardianEmail: text("parent_guardian_email"),
  parentGuardianPhone: text("parent_guardian_phone"),
  emergencyContactName: text("emergency_contact_name"), // For backward compatibility
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const teamsRelations = relations(teams, ({ many, one }) => ({
  players: many(players),
  event: one(events, {
    fields: [teams.eventId],
    references: [events.id]
  }),
  ageGroup: one(eventAgeGroups, {
    fields: [teams.ageGroupId],
    references: [eventAgeGroups.id]
  }),
  bracket: one(eventBrackets, {
    fields: [teams.bracketId],
    references: [eventBrackets.id]
  }),
  club: one(clubs, {
    fields: [teams.clubId],
    references: [clubs.id]
  }),
}));

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id]
  }),
}));

export const insertPlayerSchema = createInsertSchema(players, {
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  medicalNotes: z.string().optional(),
  emergencyContactFirstName: z.string().min(1, "Emergency contact first name is required"),
  emergencyContactLastName: z.string().min(1, "Emergency contact last name is required"),
  emergencyContactPhone: z.string().min(1, "Emergency contact phone is required"),
});

export const selectPlayerSchema = createSelectSchema(players);

export type InsertPlayer = typeof players.$inferInsert;
export type SelectPlayer = typeof players.$inferSelect;

// Game Format Templates - Reusable format configurations
export const formatTemplates = pgTable("format_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  gameLength: integer("game_length").notNull(), // minute halves: 30, 35, 40
  fieldSize: text("field_size").notNull(), // 7v7, 9v9, 11v11
  bufferTime: integer("buffer_time").notNull(), // minutes between games
  restPeriod: integer("rest_period").notNull(), // minimum rest between team games
  maxGamesPerDay: integer("max_games_per_day").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Matchup Logic Templates - Define how matches are generated for different team counts and bracket structures
export const matchupTemplates = pgTable("matchup_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "4-Team Single Bracket", "6-Team Crossover", "8-Team Dual Bracket"
  description: text("description").notNull(),
  teamCount: integer("team_count").notNull(), // Expected number of teams (4, 6, 8, etc.)
  bracketStructure: text("bracket_structure").notNull(), // "single", "crossover", "dual", "round_robin"
  matchupPattern: jsonb("matchup_pattern").notNull(), // JSON array of matchup pairs
  totalGames: integer("total_games").notNull(), // Pre-calculated total games this template generates
  hasPlayoffGame: boolean("has_playoff_game").default(false), // Whether final/playoff game is included
  playoffDescription: text("playoff_description"), // Description of playoff game logic
  includeChampionship: boolean("include_championship").default(false), // NEW: Championship/Final Game toggle
  championshipDescription: text("championship_description"), // NEW: How championship game is determined
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Game Formats - Flight-specific format configurations with matchup templates
export const gameFormats = pgTable("game_formats", {
  id: serial("id").primaryKey(),
  bracketId: integer("bracket_id").notNull().references(() => eventBrackets.id, { onDelete: 'cascade' }),
  gameLength: integer("game_length").notNull(), // minute halves: 30, 35, 40
  fieldSize: text("field_size").notNull(), // 7v7, 9v9, 11v11
  bufferTime: integer("buffer_time").notNull(), // minutes between games
  restPeriod: integer("rest_period").notNull(), // minimum rest between team games
  maxGamesPerDay: integer("max_games_per_day").notNull(),
  templateName: text("template_name"), // Reference to template used (if any)
  matchupTemplateId: integer("matchup_template_id").references(() => matchupTemplates.id), // Selected matchup logic
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertFormatTemplateSchema = createInsertSchema(formatTemplates, {
  name: z.string().min(1, "Template name is required"),
  description: z.string().min(1, "Description is required"),
  gameLength: z.number().int().min(20).max(50, "Game length must be 20-50 minutes"),
  fieldSize: z.enum(["7v7", "9v9", "11v11"]),
  bufferTime: z.number().int().min(5).max(30, "Buffer time must be 5-30 minutes"),
  restPeriod: z.number().int().min(30).max(300, "Rest period must be 30-300 minutes"),
  maxGamesPerDay: z.number().int().min(1).max(8, "Max games per day must be 1-8"),
});

export const insertMatchupTemplateSchema = createInsertSchema(matchupTemplates, {
  name: z.string().min(1, "Template name is required"),
  description: z.string().min(1, "Description is required"), 
  teamCount: z.number().int().min(3).max(16, "Team count must be 3-16"),
  bracketStructure: z.enum(["single", "crossover", "dual", "round_robin", "swiss"]),
  matchupPattern: z.array(z.array(z.string())).min(1, "At least one matchup required"),
  totalGames: z.number().int().min(1, "Total games must be at least 1"),
  hasPlayoffGame: z.boolean().default(false),
  playoffDescription: z.string().optional(),
  includeChampionship: z.boolean().default(false),
  championshipDescription: z.string().optional(),
});

export const insertGameFormatSchema = createInsertSchema(gameFormats, {
  gameLength: z.number().int().min(20).max(50, "Game length must be 20-50 minutes"),
  fieldSize: z.enum(["7v7", "9v9", "11v11"]),
  bufferTime: z.number().int().min(5).max(30, "Buffer time must be 5-30 minutes"),
  restPeriod: z.number().int().min(30).max(300, "Rest period must be 30-300 minutes"),
  maxGamesPerDay: z.number().int().min(1).max(8, "Max games per day must be 1-8"),
  templateName: z.string().optional(),
  matchupTemplateId: z.number().int().optional(),
});

export const selectFormatTemplateSchema = createSelectSchema(formatTemplates);
export const selectMatchupTemplateSchema = createSelectSchema(matchupTemplates);
export const selectGameFormatSchema = createSelectSchema(gameFormats);

export type InsertFormatTemplate = typeof formatTemplates.$inferInsert;
export type SelectFormatTemplate = typeof formatTemplates.$inferSelect;
export type InsertMatchupTemplate = typeof matchupTemplates.$inferInsert;
export type SelectMatchupTemplate = typeof matchupTemplates.$inferSelect;
export type InsertGameFormat = typeof gameFormats.$inferInsert;
export type SelectGameFormat = typeof gameFormats.$inferSelect;

// Game Format Relations
export const gameFormatsRelations = relations(gameFormats, ({ one }) => ({
  bracket: one(eventBrackets, {
    fields: [gameFormats.bracketId],
    references: [eventBrackets.id]
  }),
  matchupTemplate: one(matchupTemplates, {
    fields: [gameFormats.matchupTemplateId],
    references: [matchupTemplates.id]
  }),
}));

export const matchupTemplatesRelations = relations(matchupTemplates, ({ many }) => ({
  gameFormats: many(gameFormats),
}));

export const eventBracketsRelations = relations(eventBrackets, ({ one, many }) => ({
  ageGroup: one(eventAgeGroups, {
    fields: [eventBrackets.ageGroupId],
    references: [eventAgeGroups.id]
  }),
  event: one(events, {
    fields: [eventBrackets.eventId],
    references: [events.id]
  }),
  teams: many(teams),
  gameFormat: one(gameFormats, {
    fields: [eventBrackets.id],
    references: [gameFormats.bracketId]
  }),
}));
export type InsertTeam = typeof teams.$inferInsert;
export type SelectTeam = typeof teams.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type SelectGame = typeof games.$inferSelect;

export const eventComplexes = pgTable("event_complexes", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  complexId: integer("complex_id").notNull().references(() => complexes.id),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const eventFieldSizes = pgTable("event_field_sizes", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  fieldSize: text("field_size").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const eventScoringRules = pgTable("event_scoring_rules", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  title: text("title").notNull(),
  systemType: text("system_type").notNull().default("three_point"), // three_point, ten_point, custom
  // Basic point values
  win: integer("win").notNull(),
  loss: integer("loss").notNull(),
  tie: integer("tie").notNull(),
  // Performance-based scoring (for ten-point system)
  shutout: integer("shutout").notNull().default(0),
  goalScored: integer("goal_scored").notNull().default(0), // Points per goal scored
  goalCap: integer("goal_cap").notNull().default(3), // Maximum goals that count for points
  redCard: integer("red_card").notNull().default(0), // Penalty points per red card
  yellowCard: integer("yellow_card").notNull().default(0), // Penalty points per yellow card
  // Tiebreaker configuration
  tiebreaker1: text("tiebreaker_1").notNull().default("total_points"),
  tiebreaker2: text("tiebreaker_2").notNull().default("head_to_head"),
  tiebreaker3: text("tiebreaker_3").notNull().default("goal_differential"),
  tiebreaker4: text("tiebreaker_4").notNull().default("goals_scored"),
  tiebreaker5: text("tiebreaker_5").notNull().default("goals_allowed"),
  tiebreaker6: text("tiebreaker_6").notNull().default("shutouts"),
  tiebreaker7: text("tiebreaker_7").notNull().default("fair_play"),
  tiebreaker8: text("tiebreaker_8").notNull().default("coin_toss"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertEventScoringRuleSchema = createInsertSchema(eventScoringRules, {
  title: z.string().min(1, "Title is required"),
  systemType: z.enum(["three_point", "ten_point", "custom"]).default("three_point"),
  win: z.number().min(0, "Win points must be positive"),
  loss: z.number().min(0, "Loss points must be positive"),
  tie: z.number().min(0, "Tie points must be positive"),
  shutout: z.number().min(0, "Shutout points must be positive"),
  goalScored: z.number().min(0, "Goal scored points must be positive"),
  goalCap: z.number().min(1, "Goal cap must be at least 1"),
  redCard: z.number().min(-10, "Red card points must be greater than -10"),
  yellowCard: z.number().min(-5, "Yellow card points must be greater than -5"),
  tiebreaker1: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  tiebreaker2: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  tiebreaker3: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  tiebreaker4: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  tiebreaker5: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  tiebreaker6: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  tiebreaker7: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  tiebreaker8: z.enum(["total_points", "head_to_head", "goal_differential", "goals_scored", "goals_allowed", "shutouts", "fair_play", "coin_toss"]),
  isActive: z.boolean().default(true),
});

// Team standings table for calculated standings and points
export const teamStandings = pgTable("team_standings", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  bracketId: integer("bracket_id").references(() => eventBrackets.id),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  // Game statistics
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  // Goal statistics
  goalsScored: integer("goals_scored").notNull().default(0),
  goalsAllowed: integer("goals_allowed").notNull().default(0),
  goalDifferential: integer("goal_differential").notNull().default(0),
  shutouts: integer("shutouts").notNull().default(0),
  // Card statistics
  yellowCards: integer("yellow_cards").notNull().default(0),
  redCards: integer("red_cards").notNull().default(0),
  fairPlayPoints: integer("fair_play_points").notNull().default(0), // Calculated based on card penalties
  // Point calculations
  totalPoints: integer("total_points").notNull().default(0),
  winPoints: integer("win_points").notNull().default(0),
  tiePoints: integer("tie_points").notNull().default(0),
  goalPoints: integer("goal_points").notNull().default(0),
  shutoutPoints: integer("shutout_points").notNull().default(0),
  cardPenaltyPoints: integer("card_penalty_points").notNull().default(0),
  // Standings position
  position: integer("position"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertTeamStandingsSchema = createInsertSchema(teamStandings, {
  gamesPlayed: z.number().min(0, "Games played must be positive"),
  wins: z.number().min(0, "Wins must be positive"),
  losses: z.number().min(0, "Losses must be positive"),
  ties: z.number().min(0, "Ties must be positive"),
  goalsScored: z.number().min(0, "Goals scored must be positive"),
  goalsAllowed: z.number().min(0, "Goals allowed must be positive"),
  goalDifferential: z.number(),
  shutouts: z.number().min(0, "Shutouts must be positive"),
  yellowCards: z.number().min(0, "Yellow cards must be positive"),
  redCards: z.number().min(0, "Red cards must be positive"),
  totalPoints: z.number().min(0, "Total points must be positive"),
});

export const selectTeamStandingsSchema = createSelectSchema(teamStandings);
export type InsertTeamStandings = typeof teamStandings.$inferInsert;
export type SelectTeamStandings = typeof teamStandings.$inferSelect;

export const selectEventScoringRuleSchema = createSelectSchema(eventScoringRules);
export type InsertEventScoringRule = typeof eventScoringRules.$inferInsert;
export type SelectEventScoringRule = typeof eventScoringRules.$inferSelect;

// Dynamic Scoring Rule Templates - Completely customizable scoring rules (NO HARDCODED VALUES)
export const scoringRuleTemplates = pgTable("scoring_rule_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "3-Point System", "10-Point System", "Custom Tournament Rules"
  description: text("description").notNull(),
  scoringRules: jsonb("scoring_rules").notNull(), // Dynamic JSON: {"win": 3, "draw": 1, "loss": 0, "shutoutBonus": 1, "maxGoalsPerGame": 5}
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Dynamic Standings Criteria Templates - Completely customizable standings calculation
export const standingsCriteriaTemplates = pgTable("standings_criteria_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "FIFA Standard", "MLS Rules", "Youth Tournament Rules"
  description: text("description").notNull(),
  standingsCriteria: jsonb("standings_criteria").notNull(), // Ordered array: ["points", "goalDifferential", "goalsScored", "headToHead"]
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Event Scoring and Standings Configuration - Links events to their dynamic templates
export const eventScoringConfiguration = pgTable("event_scoring_configuration", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  scoringRuleTemplateId: integer("scoring_rule_template_id").references(() => scoringRuleTemplates.id),
  standingsCriteriaTemplateId: integer("standings_criteria_template_id").references(() => standingsCriteriaTemplates.id),
  includeChampionship: boolean("include_championship").default(false),
  championshipFormat: text("championship_format"), // e.g., "1st vs 2nd", "Bracket A Winner vs Bracket B Winner"
  customScoringRules: jsonb("custom_scoring_rules"), // Event-specific overrides
  customStandingsCriteria: jsonb("custom_standings_criteria"), // Event-specific overrides
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertScoringRuleTemplateSchema = createInsertSchema(scoringRuleTemplates, {
  name: z.string().min(1, "Template name is required"),
  description: z.string().min(1, "Description is required"),
  scoringRules: z.record(z.union([z.number(), z.string()])).refine(
    (rules) => typeof rules === 'object' && rules !== null,
    "Scoring rules must be a valid object"
  ),
});

export const insertStandingsCriteriaTemplateSchema = createInsertSchema(standingsCriteriaTemplates, {
  name: z.string().min(1, "Template name is required"),
  description: z.string().min(1, "Description is required"),
  standingsCriteria: z.array(z.string()).min(1, "At least one criteria is required"),
});

export const insertEventScoringConfigurationSchema = createInsertSchema(eventScoringConfiguration, {
  includeChampionship: z.boolean().default(false),
  championshipFormat: z.string().optional(),
  customScoringRules: z.record(z.union([z.number(), z.string()])).optional(),
  customStandingsCriteria: z.array(z.string()).optional(),
});

export const selectScoringRuleTemplateSchema = createSelectSchema(scoringRuleTemplates);
export const selectStandingsCriteriaTemplateSchema = createSelectSchema(standingsCriteriaTemplates);
export const selectEventScoringConfigurationSchema = createSelectSchema(eventScoringConfiguration);

export type InsertScoringRuleTemplate = typeof scoringRuleTemplates.$inferInsert;
export type SelectScoringRuleTemplate = typeof scoringRuleTemplates.$inferSelect;
export type InsertStandingsCriteriaTemplate = typeof standingsCriteriaTemplates.$inferInsert;
export type SelectStandingsCriteriaTemplate = typeof standingsCriteriaTemplates.$inferSelect;
export type InsertEventScoringConfiguration = typeof eventScoringConfiguration.$inferInsert;
export type SelectEventScoringConfiguration = typeof eventScoringConfiguration.$inferSelect;

export const eventAdministrators = pgTable("event_administrators", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  permissions: jsonb("permissions"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const eventSettings = pgTable("event_settings", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertEventAdministratorSchema = createInsertSchema(eventAdministrators, {
  role: z.enum(['owner', 'admin', 'moderator', 'tournament_director']),
  permissions: z.record(z.boolean()).optional(),
});

export const insertEventSettingSchema = createInsertSchema(eventSettings, {
  settingKey: z.string().min(1, "Setting key is required"),
  settingValue: z.string().min(1, "Setting value is required"),
});

export const selectEventAdministratorSchema = createSelectSchema(eventAdministrators);
export const selectEventSettingSchema = createSelectSchema(eventSettings);

export type InsertEventAdministrator = typeof eventAdministrators.$inferInsert;
export type SelectEventAdministrator = typeof eventAdministrators.$inferSelect;
export type InsertEventSetting = typeof eventSettings.$inferInsert;
export type SelectEventSetting = typeof eventSettings.$inferSelect;

export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  eventId: text("event_id").references(() => events.id),
  teamId: integer("team_id").references(() => teams.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isAdmin: boolean("is_admin").default(false).notNull(),
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default('text'),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms, {
  name: z.string().min(1, "Chat room name is required"),
  type: z.enum(['team', 'event', 'private']),
  eventId: z.number().optional(),
  teamId: z.number().optional(),
});

export const insertMessageSchema = createInsertSchema(messages, {
  content: z.string().min(1, "Message content is required"),
  type: z.enum(['text', 'image', 'system']).default('text'),
  metadata: z.record(z.unknown()).optional(),
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants, {
  isAdmin: z.boolean().default(false),
});

export const selectChatRoomSchema = createSelectSchema(chatRooms);
export const selectMessageSchema = createSelectSchema(messages);
export const selectChatParticipantSchema = createSelectSchema(chatParticipants);

export type InsertChatRoom = typeof chatRooms.$inferInsert;
export type SelectChatRoom = typeof chatRooms.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;
export type InsertChatParticipant = typeof chatParticipants.$inferInsert;
export type SelectChatParticipant = typeof chatParticipants.$inferSelect;


export const householdInvitations = pgTable("household_invitations", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id),
  email: text("email").notNull(),
  status: text("status").notNull().default('pending'),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

export const insertHouseholdInvitationSchema = createInsertSchema(householdInvitations, {
  email: z.string().email("Please enter a valid email address"),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']).default('pending'),
  token: z.string(),
  expiresAt: z.string(),
  createdBy: z.number(),
  householdId: z.number(),
});

export const selectHouseholdInvitationSchema = createSelectSchema(householdInvitations);

export type InsertHouseholdInvitation = typeof householdInvitations.$inferInsert;
export type SelectHouseholdInvitation = typeof householdInvitations.$inferSelect;

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

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  folderId: text("folder_id"),
  thumbnailUrl: text("thumbnail_url"),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  description: text("description"),
  tags: text("tags").array(),
  category: text("category"),
  isFavorite: boolean("is_favorite").default(false),
  relatedEntityId: text("related_entity_id"),
  relatedEntityType: text("related_entity_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const folders = pgTable("folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentId: text("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
  }),
  files: many(files),
  children: many(folders),
}));

export const filesRelations = relations(files, ({ one }) => ({
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
  }),
}));

export const insertFileSchema = createInsertSchema(files, {
  name: z.string().min(1, "File name is required"),
  url: z.string().min(1, "File URL is required"),
  type: z.string().min(1, "File type is required"),
  size: z.number().positive("File size must be positive"),
  folderId: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  uploadedById: z.number().optional(),
});

export const insertFolderSchema = createInsertSchema(folders, {
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().nullable().optional(),
});

export const selectFileSchema = createSelectSchema(files);
export const selectFolderSchema = createSelectSchema(folders);

export type InsertFile = typeof files.$inferInsert;
export type SelectFile = typeof files.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;
export type SelectFolder = typeof folders.$inferSelect;

export const seasonalScopes = pgTable("seasonal_scopes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createCoedGroups: boolean("create_coed_groups").notNull().default(false),
  coedOnly: boolean("coed_only").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ageGroupSettings = pgTable("age_group_settings", {
  id: serial("id").primaryKey(),
  seasonalScopeId: integer("seasonal_scope_id")
    .notNull()
    .references(() => seasonalScopes.id, { onDelete: 'cascade' }),
  ageGroup: text("age_group").notNull(),
  birthYear: integer("birth_year").notNull(),
  gender: text("gender").notNull(),
  divisionCode: text("division_code").notNull(),
  minBirthYear: integer("min_birth_year").notNull(),
  maxBirthYear: integer("max_birth_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const seasonalScopesRelations = relations(seasonalScopes, ({ many }) => ({
  ageGroups: many(ageGroupSettings),
}));

export const ageGroupSettingsRelations = relations(ageGroupSettings, ({ one }) => ({
  seasonalScope: one(seasonalScopes, {
    fields: [ageGroupSettings.seasonalScopeId],
    references: [seasonalScopes.id],
  }),
}));

export const insertSeasonalScopeSchema = createInsertSchema(seasonalScopes, {
  name: z.string().min(1, "Name is required"),
  startYear: z.number().int().min(2000).max(2100),
  endYear: z.number().int().min(2000).max(2100),
  isActive: z.boolean(),
  createCoedGroups: z.boolean().default(false),
  coedOnly: z.boolean().default(false),
});

export const insertAgeGroupSettingSchema = createInsertSchema(ageGroupSettings, {
  ageGroup: z.string().min(1, "Age group is required"),
  birthYear: z.number().int("Birth year must be a valid year"),
  gender: z.enum(["Boys", "Girls"]),
  divisionCode: z.string().min(1, "Division code is required"),
  minBirthYear: z.number().int("Min birth year must be a valid year"),
  maxBirthYear: z.number().int("Max birth year must be a valid year"),
});

export const selectSeasonalScopeSchema = createSelectSchema(seasonalScopes);
export const selectAgeGroupSettingSchema = createSelectSchema(ageGroupSettings);

export type InsertSeasonalScope = typeof seasonalScopes.$inferInsert;
export type SelectSeasonalScope = typeof seasonalScopes.$inferSelect;
export type InsertAgeGroupSetting = typeof ageGroupSettings.$inferInsert;
export type SelectAgeGroupSetting = typeof ageGroupSettings.$inferSelect;

export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => roles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles, {
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

export const selectRoleSchema = createSelectSchema(roles);

export type InsertRole = typeof roles.$inferInsert;
export type SelectRole = typeof roles.$inferSelect;
export type InsertAdminRole = typeof adminRoles.$inferInsert;
export type SelectAdminRole = typeof adminRoles.$inferSelect;

export const adminRolesRelations = relations(adminRoles, ({ one }) => ({
  user: one(users, {
    fields: [adminRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [adminRoles.roleId],
    references: [roles.id],
  }),
}));

export const insertAdminRoleSchema = createInsertSchema(adminRoles);
export const selectAdminRoleSchema = createSelectSchema(adminRoles);

export const adminFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

export type AdminFormValues = z.infer<typeof adminFormSchema>;

// Newsletter subscriptions table
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  confirmationSent: boolean("confirmation_sent").notNull().default(false),
  confirmationSentAt: timestamp("confirmation_sent_at"),
  source: text("source").default("website"), // Track where subscription came from
});

export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions, {
  email: z.string().email("Please enter a valid email address"),
  source: z.string().optional(),
});

export const selectNewsletterSubscriptionSchema = createSelectSchema(newsletterSubscriptions);

export type InsertNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;
export type SelectNewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;

export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUpdateSchema = createInsertSchema(updates, {
  content: z.string().min(1, "Update content is required"),
});

export const selectUpdateSchema = createSelectSchema(updates);

export type InsertUpdate = typeof updates.$inferInsert;
export type SelectUpdate = typeof updates.$inferSelect;

export const eventFees = pgTable("event_fees", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),  // Store amount in cents
  beginDate: timestamp("begin_date"),
  endDate: timestamp("end_date"),
  feeType: text("fee_type"),  // 'registration', 'uniform', 'equipment', etc.
  isRequired: boolean("is_required").default(false),
  applyToAll: boolean("apply_to_all").default(false).notNull(),
  accountingCodeId: integer("accounting_code_id").references(() => accountingCodes.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const eventAgeGroupFees = pgTable("event_age_group_fees", {
  id: serial("id").primaryKey(),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id, { onDelete: 'cascade' }),
  feeId: integer("fee_id").notNull().references(() => eventFees.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add relations
export const eventFeesRelations = relations(eventFees, ({ one, many }) => ({
  event: one(events, {
    fields: [eventFees.eventId],
    references: [events.id],
  }),
  ageGroupFees: many(eventAgeGroupFees),
}));

export const eventAgeGroupFeesRelations = relations(eventAgeGroupFees, ({ one }) => ({
  fee: one(eventFees, {
    fields: [eventAgeGroupFees.feeId],
    references: [eventFees.id],
  }),
  ageGroup: one(eventAgeGroups, {
    fields: [eventAgeGroupFees.ageGroupId],
    references: [eventAgeGroups.id],
  }),
}));

// Add validation schemas
export const insertEventFeeSchema = createInsertSchema(eventFees, {
  name: z.string().min(1, "Fee name is required"),
  amount: z.number().int().positive("Amount must be positive"),
  beginDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  applyToAll: z.boolean().default(false),
});

export const insertEventAgeGroupFeeSchema = createInsertSchema(eventAgeGroupFees);

export const selectEventFeeSchema = createSelectSchema(eventFees);
export const selectEventAgeGroupFeeSchema = createSelectSchema(eventAgeGroupFees);

// Add types
export type InsertEventFee = typeof eventFees.$inferInsert;
export type SelectEventFee = typeof eventFees.$inferSelect;
export type InsertEventAgeGroupFee = typeof eventAgeGroupFees.$inferInsert;
export type SelectEventAgeGroupFee = typeof eventAgeGroupFees.$inferSelect;

export const accountingCodes = pgTable("accounting_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAccountingCodeSchema = createInsertSchema(accountingCodes, {
  code: z.string().min(1,"Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const selectAccountingCodeSchema = createSelectSchema(accountingCodes);

export type InsertAccountingCode = typeof accountingCodes.$inferInsert;
export type SelectAccountingCode = typeof accountingCodes.$inferSelect;

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),  // 'fixed' or 'percentage'
  amount: integer("amount").notNull(),
  expirationDate: timestamp("expiration_date"),
  description: text("description"),
  eventId: bigint("event_id", { mode: "number" }).references(() => events.id),
  maxUses: integer("max_uses"),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons, {
  code: z.string().min(1, "Coupon code is required"),
  discountType: z.enum(['fixed', 'percentage']),
  amount: z.number().positive("Amount must be positive"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  description: z.string().optional(),
  eventId: z.string().optional(),
  maxUses: z.number().int().positive("Maximum uses must be positive").optional(),
  isActive: z.boolean().default(true),
});

export const selectCouponSchema = createSelectSchema(coupons);

export type InsertCoupon = typeof coupons.$inferInsert;
export type SelectCoupon = typeof coupons.$inferSelect;

export const eventFormTemplates = pgTable("event_form_templates", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }).references(() => events.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  isPublished: boolean("is_published").default(false).notNull(),
  version: integer("version").default(1).notNull(), // Track template versions
  isActive: boolean("is_active").default(true).notNull(), // Only one active template per event
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formFields = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => eventFormTemplates.id, { onDelete: 'cascade' }),
  fieldId: text("field_id").notNull(), // Auto-generated from label (e.g., "team_colors", "dietary_restrictions")
  label: text("label").notNull(),
  type: text("type").notNull(), // 'dropdown', 'paragraph', 'input', 'checkbox', 'radio', 'textarea'
  required: boolean("required").default(false).notNull(),
  order: integer("order").notNull(),
  placeholder: text("placeholder"),
  helpText: text("help_text"),
  validation: jsonb("validation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formFieldOptions = pgTable("form_field_options", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").notNull().references(() => formFields.id, { onDelete: 'cascade' }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const formResponses = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => eventFormTemplates.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  templateVersion: integer("template_version").notNull(), // Track which version was used
  responses: jsonb("responses").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Template change audit table
export const templateAuditLog = pgTable("template_audit_log", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => eventFormTemplates.id),
  action: text("action").notNull(), // 'created', 'updated', 'assigned', 'deactivated'
  changeDetails: jsonb("change_details"), // What specific changes were made
  affectedTeamCount: integer("affected_team_count").default(0), // How many teams had already submitted data
  performedBy: integer("performed_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Track which template version each team used
export const teamTemplateUsage = pgTable("team_template_usage", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  templateId: integer("template_id").notNull().references(() => eventFormTemplates.id),
  templateVersion: integer("template_version").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// Add Zod schemas for the new tables
export const insertEventFormTemplateSchema = createInsertSchema(eventFormTemplates, {
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const insertFormFieldSchema = createInsertSchema(formFields, {
  label: z.string().min(1, "Field label is required"),
  type: z.enum(["dropdown", "paragraph", "input"]),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z.record(z.unknown()).optional(),
});

export const insertFormFieldOptionSchema = createInsertSchema(formFieldOptions, {
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
  order: z.number().int().min(0),
});

export const insertFormResponseSchema = createInsertSchema(formResponses, {
  responses: z.record(z.unknown()).refine((data) => Object.keys(data).length > 0, "Responses cannot be empty"),
});

// Add select schemas
export const selectEventFormTemplateSchema = createSelectSchema(eventFormTemplates);
export const selectFormFieldSchema = createSelectSchema(formFields);
export const selectFormFieldOptionSchema = createSelectSchema(formFieldOptions);
export const selectFormResponseSchema = createSelectSchema(formResponses);

// Add types
export type InsertEventFormTemplate = typeof eventFormTemplates.$inferInsert;
export type SelectEventFormTemplate = typeof eventFormTemplates.$inferSelect;
export type InsertFormField = typeof formFields.$inferInsert;
export type SelectFormField = typeof formFields.$inferSelect;
export type InsertFormFieldOption = typeof formFieldOptions.$inferInsert;
export type SelectFormFieldOption = typeof formFieldOptions.$inferSelect;
export type InsertFormResponse = typeof formResponses.$inferInsert;
export type SelectFormResponse = typeof formResponses.$inferSelect;

// Add relations
export const eventFormTemplatesRelations = relations(eventFormTemplates, ({ one, many }) => ({
  event: one(events, {
    fields: [eventFormTemplates.eventId],
    references: [events.id],
  }),
  createdBy: one(users, {
    fields: [eventFormTemplates.createdBy],
    references: [users.id],
  }),
  fields: many(formFields),
  responses: many(formResponses),
  auditLogs: many(templateAuditLog),
  teamUsage: many(teamTemplateUsage),
}));

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
  template: one(eventFormTemplates, {
    fields: [formFields.templateId],
    references: [eventFormTemplates.id],
  }),
  options: many(formFieldOptions),
}));

export const formFieldOptionsRelations = relations(formFieldOptions, ({ one }) => ({
  field: one(formFields, {
    fields: [formFieldOptions.fieldId],
    references: [formFields.id],
  }),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
  template: one(eventFormTemplates, {
    fields: [formResponses.templateId],
    references: [eventFormTemplates.id],
  }),
  team: one(teams, {
    fields: [formResponses.teamId],
    references: [teams.id],
  }),
}));

export const templateAuditLogRelations = relations(templateAuditLog, ({ one }) => ({
  template: one(eventFormTemplates, {
    fields: [templateAuditLog.templateId],
    references: [eventFormTemplates.id],
  }),
  performedBy: one(users, {
    fields: [templateAuditLog.performedBy],
    references: [users.id],
  }),
}));

export const teamTemplateUsageRelations = relations(teamTemplateUsage, ({ one }) => ({
  team: one(teams, {
    fields: [teamTemplateUsage.teamId],
    references: [teams.id],
  }),
  template: one(eventFormTemplates, {
    fields: [teamTemplateUsage.templateId],
    references: [eventFormTemplates.id],
  }),
}));
// Add email provider settings schema
export const emailProviderSettings = pgTable("email_provider_settings", {
  id: serial("id").primaryKey(),
  providerType: text("provider_type").notNull(),
  providerName: text("provider_name").notNull(),
  settings: jsonb("settings").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertEmailProviderSettingsSchema = createInsertSchema(emailProviderSettings, {
  providerType: z.enum(["smtp", "sendgrid", "mailgun"]),
  providerName: z.string().min(1, "Provider name is required"),
  settings: z.record(z.unknown()),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const selectEmailProviderSettingsSchema = createSelectSchema(emailProviderSettings);

export type InsertEmailProviderSettings = typeof emailProviderSettings.$inferInsert;
export type SelectEmailProviderSettings = typeof emailProviderSettings.$inferSelect;

export const emailTemplateRouting = pgTable("email_template_routing", {
  id: serial("id").primaryKey(),
  templateType: text("template_type").notNull(),  // e.g., 'password_reset', 'registration', 'payment'
  providerId: integer("provider_id").notNull().references(() => emailProviderSettings.id),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmailTemplateRoutingSchema = createInsertSchema(emailTemplateRouting, {
  templateType: z.string().min(1, "Template type is required"),
  providerId: z.number().positive("Provider ID is required"),
  fromEmail: z.string().email("Valid email address is required"),
  fromName: z.string().min(1, "From name is required"),
  isActive: z.boolean().default(true),
});

export const selectEmailTemplateRoutingSchema = createSelectSchema(emailTemplateRouting);

export type InsertEmailTemplateRouting = typeof emailTemplateRouting.$inferInsert;
export type SelectEmailTemplateRouting = typeof emailTemplateRouting.$inferSelect;

// Add relations
export const emailTemplateRoutingRelations = relations(emailTemplateRouting, ({ one }) => ({
  provider: one(emailProviderSettings, {
    fields: [emailTemplateRouting.providerId],
    references: [emailProviderSettings.id],
  }),
}));

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  providerId: integer("provider_id").references(() => emailProviderSettings.id),
  sender_name: text("sender_name").notNull(),
  sender_email: text("sender_email").notNull(),
  is_active: boolean("is_active").default(true),
  variables: jsonb("variables").default('["firstName", "lastName"]'),
  sendgridTemplateId: text("sendgrid_template_id"), // SendGrid dynamic template ID mapping
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  provider: one(emailProviderSettings, {
    fields: [emailTemplates.providerId],
    references: [emailProviderSettings.id],
  }),
}));

// Product Updates feature for tracking application changes
export const productUpdates = pgTable("product_updates", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 20 }).notNull(),
  releaseDate: date("release_date").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  isHighlighted: boolean("is_highlighted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductUpdateSchema = createInsertSchema(productUpdates, {
  version: z.string().min(1, "Version is required"),
  releaseDate: z.date(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  isHighlighted: z.boolean().optional(),
});

export const selectProductUpdateSchema = createSelectSchema(productUpdates);

export type InsertProductUpdate = typeof productUpdates.$inferInsert;
export type SelectProductUpdate = typeof productUpdates.$inferSelect;

// Email tracking table for SendGrid webhook events
export const emailTracking = pgTable("email_tracking", {
  id: serial("id").primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  emailType: text("email_type").notNull(), // 'template', 'regular', etc.
  templateId: text("template_id"),
  sendgridMessageId: text("sendgrid_message_id"),
  status: text("status").notNull(), // 'sent', 'delivered', 'failed', 'opened', 'clicked'
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  errorMessage: text("error_message"),
  webhookData: jsonb("webhook_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmailTrackingSchema = createInsertSchema(emailTracking);
export const selectEmailTrackingSchema = createSelectSchema(emailTracking);

export type InsertEmailTracking = typeof emailTracking.$inferInsert;
export type SelectEmailTracking = typeof emailTracking.$inferSelect;

// Fee adjustment audit table for tracking registration fee changes
export const feeAdjustments = pgTable("fee_adjustments", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  originalAmount: integer("original_amount").notNull(), // Original amount in cents
  adjustedAmount: integer("adjusted_amount").notNull(), // New adjusted amount in cents
  adjustment: integer("adjustment").notNull(), // Difference (negative for reduction, positive for increase)
  reason: text("reason").notNull(), // Required reason for adjustment
  adjustedBy: integer("adjusted_by").notNull().references(() => users.id), // Admin who made the adjustment
  adjustedAt: timestamp("adjusted_at").notNull().defaultNow(),
  eventId: text("event_id").notNull(), // For context and filtering
  teamName: text("team_name").notNull(), // For easy reporting
  adminEmail: text("admin_email").notNull(), // For audit trails
});

export const feeAdjustmentsRelations = relations(feeAdjustments, ({ one }) => ({
  team: one(teams, {
    fields: [feeAdjustments.teamId],
    references: [teams.id],
  }),
  adjustedByUser: one(users, {
    fields: [feeAdjustments.adjustedBy],
    references: [users.id],
  }),
}));

export const insertFeeAdjustmentSchema = createInsertSchema(feeAdjustments, {
  teamId: z.number().positive("Team ID is required"),
  originalAmount: z.number().int("Original amount must be an integer"),
  adjustedAmount: z.number().int("Adjusted amount must be an integer"),
  adjustment: z.number().int("Adjustment must be an integer"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be under 500 characters"),
  adjustedBy: z.number().positive("Admin ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  teamName: z.string().min(1, "Team name is required"),
  adminEmail: z.string().email("Valid admin email is required"),
});

export const selectFeeAdjustmentSchema = createSelectSchema(feeAdjustments);

export type InsertFeeAdjustment = typeof feeAdjustments.$inferInsert;
export type SelectFeeAdjustment = typeof feeAdjustments.$inferSelect;

// Workflow progress tracking table for preventing data loss
export const workflowProgress = pgTable("workflow_progress", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  workflowType: text("workflow_type").notNull().default("scheduling"), // 'scheduling', 'registration', etc.
  currentStep: integer("current_step").notNull().default(0),
  steps: jsonb("steps").notNull(), // Array of step data with completion status
  autoSaveEnabled: boolean("auto_save_enabled").notNull().default(true),
  lastSaved: timestamp("last_saved").notNull().defaultNow(),
  sessionId: text("session_id").notNull(), // Track browser session
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workflowProgressRelations = relations(workflowProgress, ({ one }) => ({
  event: one(events, {
    fields: [workflowProgress.eventId],
    references: [events.id],
  }),
}));

export const insertWorkflowProgressSchema = createInsertSchema(workflowProgress, {
  eventId: z.number().positive("Event ID is required"),
  workflowType: z.string().min(1, "Workflow type is required"),
  currentStep: z.number().min(0, "Current step must be non-negative"),
  steps: z.any(), // JSON data
  sessionId: z.string().min(1, "Session ID is required"),
});

export const selectWorkflowProgressSchema = createSelectSchema(workflowProgress);

export type InsertWorkflowProgress = typeof workflowProgress.$inferInsert;
export type SelectWorkflowProgress = typeof workflowProgress.$inferSelect;

// Published schedules table for public viewing
export const publishedSchedules = pgTable("published_schedules", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  publishedBy: integer("published_by").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  scheduleData: jsonb("schedule_data").notNull(), // Contains games, standings, flights data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPublishedScheduleSchema = createInsertSchema(publishedSchedules, {
  eventId: z.number().int().positive("Event ID is required"),
  publishedBy: z.number().int().positive("Published by user ID is required"),
  scheduleData: z.object({}).passthrough(),
  isActive: z.boolean().default(true),
});

export const selectPublishedScheduleSchema = createSelectSchema(publishedSchedules);

export type InsertPublishedSchedule = typeof publishedSchedules.$inferInsert;
export type SelectPublishedSchedule = typeof publishedSchedules.$inferSelect;

// AI Conversation History table for storing chat sessions with PostgreSQL
export const aiConversationHistory = pgTable('ai_conversation_history', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant', 'system', 'tool'
  content: text('content').notNull(),
  toolCallId: varchar('tool_call_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// AI Audit Log for tracking all AI-initiated changes
export const aiAuditLog = pgTable("ai_audit_log", {
  id: text("id").primaryKey(), // UUID
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  sessionId: text("session_id").notNull(),
  actionType: text("action_type").notNull(), // move_game, swap_teams, create_game, etc.
  targetTable: text("target_table").notNull(), // games, teams, fields, etc.
  targetId: text("target_id").notNull(), // ID of the modified record
  oldValues: text("old_values"), // JSON string of previous values
  newValues: text("new_values"), // JSON string of new values
  aiReasoning: text("ai_reasoning"), // AI's explanation for the change
  userRequest: text("user_request").notNull(), // Original user request
  success: boolean("success").notNull(), // Whether action succeeded
  errorMessage: text("error_message"), // Error details if failed
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  reviewedBy: text("reviewed_by"), // Admin who reviewed this change
  reviewedAt: timestamp("reviewed_at"), // When it was reviewed
  reviewNotes: text("review_notes"), // Admin notes about the change
});

export const aiConversationHistoryRelations = relations(aiConversationHistory, ({ one }) => ({
  event: one(events, {
    fields: [aiConversationHistory.eventId],
    references: [events.id],
  }),
}));

export const insertAiConversationHistorySchema = createInsertSchema(aiConversationHistory, {
  eventId: z.number().positive("Event ID is required"),
  sessionId: z.string().min(1, "Session ID is required"),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().min(1, "Content is required"),
});

export const selectAiConversationHistorySchema = createSelectSchema(aiConversationHistory);

export type InsertAiConversationHistory = typeof aiConversationHistory.$inferInsert;
export type SelectAiConversationHistory = typeof aiConversationHistory.$inferSelect;

// Note: Clubs table already defined at the top of the file