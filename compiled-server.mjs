var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accountingCodes: () => accountingCodes,
  adminFormSchema: () => adminFormSchema,
  adminRoles: () => adminRoles,
  adminRolesRelations: () => adminRolesRelations,
  ageGroupSettings: () => ageGroupSettings,
  ageGroupSettingsRelations: () => ageGroupSettingsRelations,
  chatParticipants: () => chatParticipants,
  chatRooms: () => chatRooms,
  clubs: () => clubs2,
  complexes: () => complexes,
  coupons: () => coupons,
  emailProviderSettings: () => emailProviderSettings,
  emailTemplateRouting: () => emailTemplateRouting,
  emailTemplateRoutingRelations: () => emailTemplateRoutingRelations,
  emailTemplates: () => emailTemplates,
  emailTemplatesRelations: () => emailTemplatesRelations,
  eventAdministrators: () => eventAdministrators,
  eventAgeGroupFees: () => eventAgeGroupFees,
  eventAgeGroupFeesRelations: () => eventAgeGroupFeesRelations,
  eventAgeGroups: () => eventAgeGroups,
  eventBrackets: () => eventBrackets,
  eventComplexes: () => eventComplexes2,
  eventFees: () => eventFees,
  eventFeesRelations: () => eventFeesRelations,
  eventFieldSizes: () => eventFieldSizes,
  eventFormTemplates: () => eventFormTemplates,
  eventFormTemplatesRelations: () => eventFormTemplatesRelations,
  eventScoringRules: () => eventScoringRules,
  eventSettings: () => eventSettings,
  events: () => events,
  feeRevenue: () => feeRevenue,
  feeRevenueRelations: () => feeRevenueRelations,
  fields: () => fields,
  files: () => files,
  filesRelations: () => filesRelations,
  folders: () => folders,
  foldersRelations: () => foldersRelations,
  formFieldOptions: () => formFieldOptions,
  formFieldOptionsRelations: () => formFieldOptionsRelations,
  formFields: () => formFields,
  formFieldsRelations: () => formFieldsRelations,
  formResponses: () => formResponses,
  formResponsesRelations: () => formResponsesRelations,
  gameTimeSlots: () => gameTimeSlots,
  games: () => games,
  householdInvitations: () => householdInvitations,
  households: () => households,
  insertAccountingCodeSchema: () => insertAccountingCodeSchema,
  insertAdminRoleSchema: () => insertAdminRoleSchema,
  insertAgeGroupSettingSchema: () => insertAgeGroupSettingSchema,
  insertChatParticipantSchema: () => insertChatParticipantSchema,
  insertChatRoomSchema: () => insertChatRoomSchema,
  insertClubSchema: () => insertClubSchema,
  insertComplexSchema: () => insertComplexSchema,
  insertCouponSchema: () => insertCouponSchema,
  insertEmailProviderSettingsSchema: () => insertEmailProviderSettingsSchema,
  insertEmailTemplateRoutingSchema: () => insertEmailTemplateRoutingSchema,
  insertEventAdministratorSchema: () => insertEventAdministratorSchema,
  insertEventAgeGroupFeeSchema: () => insertEventAgeGroupFeeSchema,
  insertEventAgeGroupSchema: () => insertEventAgeGroupSchema,
  insertEventBracketSchema: () => insertEventBracketSchema,
  insertEventFeeSchema: () => insertEventFeeSchema,
  insertEventFormTemplateSchema: () => insertEventFormTemplateSchema,
  insertEventSchema: () => insertEventSchema,
  insertEventScoringRuleSchema: () => insertEventScoringRuleSchema,
  insertEventSettingSchema: () => insertEventSettingSchema,
  insertFeeRevenueSchema: () => insertFeeRevenueSchema,
  insertFieldSchema: () => insertFieldSchema,
  insertFileSchema: () => insertFileSchema,
  insertFolderSchema: () => insertFolderSchema,
  insertFormFieldOptionSchema: () => insertFormFieldOptionSchema,
  insertFormFieldSchema: () => insertFormFieldSchema,
  insertFormResponseSchema: () => insertFormResponseSchema,
  insertGameSchema: () => insertGameSchema,
  insertGameTimeSlotSchema: () => insertGameTimeSlotSchema,
  insertHouseholdInvitationSchema: () => insertHouseholdInvitationSchema,
  insertHouseholdSchema: () => insertHouseholdSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOrganizationSettingsSchema: () => insertOrganizationSettingsSchema,
  insertPaymentTransactionSchema: () => insertPaymentTransactionSchema,
  insertPlayerSchema: () => insertPlayerSchema,
  insertProductUpdateSchema: () => insertProductUpdateSchema,
  insertRoleSchema: () => insertRoleSchema,
  insertSeasonalScopeSchema: () => insertSeasonalScopeSchema,
  insertTeamSchema: () => insertTeamSchema,
  insertTournamentGroupSchema: () => insertTournamentGroupSchema,
  insertUpdateSchema: () => insertUpdateSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  organizationSettings: () => organizationSettings,
  paymentTransactions: () => paymentTransactions,
  paymentTransactionsRelations: () => paymentTransactionsRelations,
  players: () => players,
  playersRelations: () => playersRelations,
  productUpdates: () => productUpdates,
  roles: () => roles,
  seasonalScopes: () => seasonalScopes,
  seasonalScopesRelations: () => seasonalScopesRelations,
  selectAccountingCodeSchema: () => selectAccountingCodeSchema,
  selectAdminRoleSchema: () => selectAdminRoleSchema,
  selectAgeGroupSettingSchema: () => selectAgeGroupSettingSchema,
  selectChatParticipantSchema: () => selectChatParticipantSchema,
  selectChatRoomSchema: () => selectChatRoomSchema,
  selectClubSchema: () => selectClubSchema,
  selectComplexSchema: () => selectComplexSchema,
  selectCouponSchema: () => selectCouponSchema,
  selectEmailProviderSettingsSchema: () => selectEmailProviderSettingsSchema,
  selectEmailTemplateRoutingSchema: () => selectEmailTemplateRoutingSchema,
  selectEventAdministratorSchema: () => selectEventAdministratorSchema,
  selectEventAgeGroupFeeSchema: () => selectEventAgeGroupFeeSchema,
  selectEventBracketSchema: () => selectEventBracketSchema,
  selectEventFeeSchema: () => selectEventFeeSchema,
  selectEventFormTemplateSchema: () => selectEventFormTemplateSchema,
  selectEventScoringRuleSchema: () => selectEventScoringRuleSchema,
  selectEventSettingSchema: () => selectEventSettingSchema,
  selectFeeRevenueSchema: () => selectFeeRevenueSchema,
  selectFieldSchema: () => selectFieldSchema,
  selectFileSchema: () => selectFileSchema,
  selectFolderSchema: () => selectFolderSchema,
  selectFormFieldOptionSchema: () => selectFormFieldOptionSchema,
  selectFormFieldSchema: () => selectFormFieldSchema,
  selectFormResponseSchema: () => selectFormResponseSchema,
  selectGameSchema: () => selectGameSchema,
  selectGameTimeSlotSchema: () => selectGameTimeSlotSchema,
  selectHouseholdInvitationSchema: () => selectHouseholdInvitationSchema,
  selectHouseholdSchema: () => selectHouseholdSchema,
  selectMessageSchema: () => selectMessageSchema,
  selectOrganizationSettingsSchema: () => selectOrganizationSettingsSchema,
  selectPaymentTransactionSchema: () => selectPaymentTransactionSchema,
  selectPlayerSchema: () => selectPlayerSchema,
  selectProductUpdateSchema: () => selectProductUpdateSchema,
  selectRoleSchema: () => selectRoleSchema,
  selectSeasonalScopeSchema: () => selectSeasonalScopeSchema,
  selectTeamSchema: () => selectTeamSchema,
  selectTournamentGroupSchema: () => selectTournamentGroupSchema,
  selectUpdateSchema: () => selectUpdateSchema,
  selectUserSchema: () => selectUserSchema,
  teams: () => teams,
  teamsRelations: () => teamsRelations,
  tournamentGroups: () => tournamentGroups,
  updates: () => updates,
  users: () => users
});
import { pgTable, text, serial, boolean, jsonb, timestamp, integer, bigint, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
var clubs2, insertClubSchema, selectClubSchema, organizationSettings, users, households, complexes, fields, passwordSchema, insertOrganizationSettingsSchema, selectOrganizationSettingsSchema, insertUserSchema, insertHouseholdSchema, insertComplexSchema, selectComplexSchema, selectUserSchema, selectHouseholdSchema, insertFieldSchema, selectFieldSchema, events, eventAgeGroups, insertEventAgeGroupSchema, insertEventSchema, gameTimeSlots, eventBrackets, insertEventBracketSchema, selectEventBracketSchema, tournamentGroups, teams, games, paymentTransactions, feeRevenue, paymentTransactionsRelations, feeRevenueRelations, insertGameTimeSlotSchema, insertTournamentGroupSchema, insertTeamSchema, insertPaymentTransactionSchema, selectPaymentTransactionSchema, insertFeeRevenueSchema, selectFeeRevenueSchema, insertGameSchema, selectGameTimeSlotSchema, selectTournamentGroupSchema, selectTeamSchema, selectGameSchema, players, teamsRelations, playersRelations, insertPlayerSchema, selectPlayerSchema, eventComplexes2, eventFieldSizes, eventScoringRules, insertEventScoringRuleSchema, selectEventScoringRuleSchema, eventAdministrators, eventSettings, insertEventAdministratorSchema, insertEventSettingSchema, selectEventAdministratorSchema, selectEventSettingSchema, chatRooms, chatParticipants, messages, insertChatRoomSchema, insertMessageSchema, insertChatParticipantSchema, selectChatRoomSchema, selectMessageSchema, selectChatParticipantSchema, householdInvitations, insertHouseholdInvitationSchema, selectHouseholdInvitationSchema, roles, files, folders, foldersRelations, filesRelations, insertFileSchema, insertFolderSchema, selectFileSchema, selectFolderSchema, seasonalScopes, ageGroupSettings, seasonalScopesRelations, ageGroupSettingsRelations, insertSeasonalScopeSchema, insertAgeGroupSettingSchema, selectSeasonalScopeSchema, selectAgeGroupSettingSchema, adminRoles, insertRoleSchema, selectRoleSchema, adminRolesRelations, insertAdminRoleSchema, selectAdminRoleSchema, adminFormSchema, updates, insertUpdateSchema, selectUpdateSchema, eventFees, eventAgeGroupFees, eventFeesRelations, eventAgeGroupFeesRelations, insertEventFeeSchema, insertEventAgeGroupFeeSchema, selectEventFeeSchema, selectEventAgeGroupFeeSchema, accountingCodes, insertAccountingCodeSchema, selectAccountingCodeSchema, coupons, insertCouponSchema, selectCouponSchema, eventFormTemplates, formFields, formFieldOptions, formResponses, insertEventFormTemplateSchema, insertFormFieldSchema, insertFormFieldOptionSchema, insertFormResponseSchema, selectEventFormTemplateSchema, selectFormFieldSchema, selectFormFieldOptionSchema, selectFormResponseSchema, eventFormTemplatesRelations, formFieldsRelations, formFieldOptionsRelations, formResponsesRelations, emailProviderSettings, insertEmailProviderSettingsSchema, selectEmailProviderSettingsSchema, emailTemplateRouting, insertEmailTemplateRoutingSchema, selectEmailTemplateRoutingSchema, emailTemplateRoutingRelations, emailTemplates, emailTemplatesRelations, productUpdates, insertProductUpdateSchema, selectProductUpdateSchema;
var init_schema = __esm({
  "db/schema.ts"() {
    "use strict";
    clubs2 = pgTable("clubs", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      logoUrl: text("logo_url"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertClubSchema = createInsertSchema(clubs2, {
      name: z.string().min(1, "Club name is required"),
      logoUrl: z.string().optional()
    });
    selectClubSchema = createSelectSchema(clubs2);
    organizationSettings = pgTable("organization_settings", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      domain: text("domain").unique(),
      customDomain: text("custom_domain").unique(),
      primaryColor: text("primary_color").notNull(),
      secondaryColor: text("secondary_color"),
      logoUrl: text("logo_url"),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      email: text("email").unique().notNull(),
      username: text("username").unique().notNull(),
      password: text("password").notNull(),
      firstName: text("firstName").notNull(),
      lastName: text("lastName").notNull(),
      phone: text("phone"),
      isParent: boolean("isParent").default(false).notNull(),
      isAdmin: boolean("isAdmin").default(false).notNull(),
      createdAt: text("createdAt").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      householdId: serial("householdId").references(() => households.id),
      lastLogin: timestamp("last_login"),
      // Track last login time
      lastViewedRegistrations: timestamp("last_viewed_registrations")
      // Track when admin last viewed team registrations
    });
    households = pgTable("households", {
      id: serial("id").primaryKey(),
      lastName: text("lastName").notNull(),
      address: text("address").notNull(),
      city: text("city").notNull(),
      state: text("state").notNull(),
      zipCode: text("zipCode").notNull(),
      primaryEmail: text("primaryEmail").notNull(),
      createdAt: text("createdAt").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    complexes = pgTable("complexes", {
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
      rules: text("rules"),
      directions: text("directions"),
      isOpen: boolean("is_open").default(true).notNull(),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    fields = pgTable("fields", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      hasLights: boolean("has_lights").default(false).notNull(),
      hasParking: boolean("has_parking").default(false).notNull(),
      isOpen: boolean("is_open").default(true).notNull(),
      openTime: text("open_time").default("08:00"),
      closeTime: text("close_time").default("22:00"),
      specialInstructions: text("special_instructions"),
      fieldSize: text("field_size").default("11v11"),
      // Size options: 7v7, 9v9, 11v11
      complexId: serial("complex_id").references(() => complexes.id),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(/[0-9]/, "Password must contain at least one number").regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");
    insertOrganizationSettingsSchema = createInsertSchema(organizationSettings, {
      name: z.string().min(1, "Organization name is required"),
      domain: z.string().optional(),
      customDomain: z.string().optional(),
      primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
      secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
      logoUrl: z.string().url("Invalid URL format").optional()
    });
    selectOrganizationSettingsSchema = createSelectSchema(organizationSettings);
    insertUserSchema = createInsertSchema(users, {
      email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
      username: z.string().min(3, "Username must be at least 3 characters").max(50),
      password: passwordSchema,
      firstName: z.string().min(1, "First name is required").max(50),
      lastName: z.string().min(1, "Last name is required").max(50),
      phone: z.string().nullable(),
      isAdmin: z.boolean().default(false),
      isParent: z.boolean().default(false),
      householdId: z.number().optional(),
      createdAt: z.string().optional()
    });
    insertHouseholdSchema = createInsertSchema(households, {
      lastName: z.string().min(1, "Last name is required"),
      address: z.string().min(1, "Address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(2, "State is required").max(2),
      zipCode: z.string().min(5, "ZIP code is required").max(10),
      primaryEmail: z.string().email("Please enter a valid email address")
    });
    insertComplexSchema = createInsertSchema(complexes, {
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
      isOpen: z.boolean().optional()
    });
    selectComplexSchema = createSelectSchema(complexes);
    selectUserSchema = createSelectSchema(users);
    selectHouseholdSchema = createSelectSchema(households);
    insertFieldSchema = createInsertSchema(fields, {
      name: z.string().min(1, "Field name is required"),
      hasLights: z.boolean(),
      hasParking: z.boolean(),
      isOpen: z.boolean(),
      openTime: z.string().min(1, "Opening time is required"),
      closeTime: z.string().min(1, "Closing time is required"),
      specialInstructions: z.string().optional(),
      fieldSize: z.enum(["7v7", "9v9", "11v11"]).default("11v11"),
      complexId: z.number()
    });
    selectFieldSchema = createSelectSchema(fields);
    events = pgTable("events", {
      id: bigint("id", { mode: "number" }).primaryKey(),
      name: text("name").notNull(),
      startDate: text("start_date").notNull(),
      endDate: text("end_date").notNull(),
      timezone: text("timezone").notNull(),
      applicationDeadline: text("application_deadline").notNull(),
      details: text("details"),
      agreement: text("agreement"),
      refundPolicy: text("refund_policy"),
      isArchived: boolean("is_archived").default(false).notNull(),
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull()
    });
    eventAgeGroups = pgTable("event_age_groups", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id),
      ageGroup: text("age_group").notNull(),
      birthYear: integer("birth_year").notNull(),
      gender: text("gender").notNull(),
      projectedTeams: integer("projected_teams"),
      scoringRule: text("scoring_rule"),
      fieldSize: text("field_size").notNull(),
      amountDue: integer("amount_due"),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      birth_date_start: text("birth_date_start"),
      divisionCode: text("division_code"),
      isEligible: boolean("is_eligible").notNull().default(true)
    });
    insertEventAgeGroupSchema = createInsertSchema(eventAgeGroups, {
      ageGroup: z.string().min(1, "Age group is required"),
      birthYear: z.number().int("Birth year must be a valid year"),
      gender: z.enum(["Boys", "Girls"]).describe("Gender must be either Boys or Girls"),
      divisionCode: z.string().min(1, "Division code is required"),
      projectedTeams: z.number().int().min(0, "Projected teams must be 0 or greater").optional(),
      fieldSize: z.string().min(1, "Field size is required"),
      amountDue: z.number().int().min(0, "Amount due must be 0 or greater").optional(),
      scoringRule: z.string().optional(),
      birth_date_start: z.string().optional(),
      isEligible: z.boolean().default(true)
    });
    insertEventSchema = createInsertSchema(events, {
      name: z.string().min(1, "Event name is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      timezone: z.string().min(1, "Time zone is required"),
      applicationDeadline: z.string().min(1, "Application deadline is required"),
      details: z.string().optional(),
      agreement: z.string().optional(),
      refundPolicy: z.string().optional()
    });
    gameTimeSlots = pgTable("game_time_slots", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      fieldId: integer("field_id").notNull().references(() => fields.id),
      startTime: text("start_time").notNull(),
      endTime: text("end_time").notNull(),
      dayIndex: integer("day_index").notNull(),
      isAvailable: boolean("is_available").default(true).notNull(),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    eventBrackets = pgTable("event_brackets", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
      name: text("name").notNull(),
      // e.g., "Elite", "Premier", "Select", "Classic", "Recreational"
      description: text("description"),
      // More info about the bracket
      level: text("level").notNull().default("middle_flight"),
      // Flight level: top_flight, middle_flight, bottom_flight, other
      eligibility: text("eligibility"),
      // Optional eligibility requirements
      sortOrder: integer("sort_order").notNull().default(0),
      // For ordering brackets in the UI
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    insertEventBracketSchema = createInsertSchema(eventBrackets, {
      name: z.string().min(1, "Bracket name is required"),
      description: z.string().optional(),
      sortOrder: z.number().int().optional()
    });
    selectEventBracketSchema = createSelectSchema(eventBrackets);
    tournamentGroups = pgTable("tournament_groups", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
      name: text("name").notNull(),
      type: text("type").notNull(),
      stage: text("stage").notNull(),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    teams = pgTable("teams", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
      groupId: integer("group_id").references(() => tournamentGroups.id),
      bracketId: integer("bracket_id").references(() => eventBrackets.id),
      // Reference to selected bracket
      clubId: integer("club_id").references(() => clubs2.id),
      // Reference to club
      clubName: text("club_name"),
      // Denormalized for easier access
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
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      // Club/Organization name is already defined above
      // User ID is not in the actual database schema
      // New fields for registration status and fee tracking
      status: text("status").notNull().default("registered"),
      // registered, approved, rejected, etc.
      registrationFee: integer("registration_fee"),
      // Store amount in cents
      // New fields for multiple fee selection
      selectedFeeIds: text("selected_fee_ids"),
      // Comma-separated list of fee IDs
      totalAmount: integer("total_amount"),
      // Store total amount in cents (includes all fees)
      // Payment status and details
      paymentStatus: text("payment_status").default("pending"),
      // pending, paid, failed, refunded, payment_info_provided
      paymentDate: timestamp("payment_date"),
      // When the payment was processed
      paymentIntentId: text("payment_intent_id"),
      // Stripe payment intent ID
      setupIntentId: text("setup_intent_id"),
      // Stripe setup intent ID for two-step payment flow
      paymentMethodId: text("payment_method_id"),
      // Stored payment method ID for two-step payment flow
      cardBrand: text("card_brand"),
      // Card brand (Visa, Mastercard, etc.)
      cardLast4: text("card_last_4"),
      // Last 4 digits of the card
      paymentMethodType: text("payment_method_type"),
      // Type of payment method
      paymentErrorCode: text("payment_error_code"),
      // Error code if payment failed
      paymentErrorMessage: text("payment_error_message"),
      // Error message if payment failed
      refundDate: timestamp("refund_date"),
      // When a refund was processed
      stripeCustomerId: text("stripe_customer_id"),
      // Stripe customer ID for the team
      // Terms acknowledgement
      termsAcknowledged: boolean("terms_acknowledged").default(false),
      termsAcknowledgedAt: timestamp("terms_acknowledged_at"),
      termsAcknowledgementRecord: text("terms_acknowledgement_record"),
      // Path to PDF or record ID
      // Flag for adding roster later
      addRosterLater: boolean("add_roster_later").default(false),
      // Notes field for admin comments
      notes: text("notes")
    });
    games = pgTable("games", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
      groupId: integer("group_id").references(() => tournamentGroups.id),
      fieldId: integer("field_id").references(() => fields.id),
      timeSlotId: integer("time_slot_id").references(() => gameTimeSlots.id),
      homeTeamId: integer("home_team_id").references(() => teams.id),
      awayTeamId: integer("away_team_id").references(() => teams.id),
      homeScore: integer("home_score"),
      awayScore: integer("away_score"),
      status: text("status").notNull().default("scheduled"),
      round: integer("round").notNull(),
      matchNumber: integer("match_number").notNull(),
      duration: integer("duration").notNull(),
      breakTime: integer("break_time").notNull().default(5),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    paymentTransactions = pgTable("payment_transactions", {
      id: serial("id").primaryKey(),
      teamId: integer("team_id").references(() => teams.id),
      eventId: bigint("event_id", { mode: "number" }).references(() => events.id),
      userId: integer("user_id").references(() => users.id),
      paymentIntentId: text("payment_intent_id"),
      // For payment intents
      setupIntentId: text("setup_intent_id"),
      // For setup intents (when just saving payment method)
      transactionType: text("transaction_type").notNull(),
      // payment, refund, chargeback, payment_info_collected, etc.
      amount: integer("amount").notNull(),
      // Amount in cents, positive for payments, negative for refunds
      stripeFee: integer("stripe_fee"),
      // Actual Stripe processing fee in cents
      netAmount: integer("net_amount"),
      // Net amount after fees (amount - stripeFee)
      status: text("status").notNull(),
      // succeeded, failed, pending, etc.
      cardBrand: text("card_brand"),
      // Visa, Mastercard, etc.
      cardLastFour: text("card_last_four"),
      // Last 4 digits of card
      paymentMethodType: text("payment_method_type"),
      // card, bank_transfer, etc.
      errorCode: text("error_code"),
      // Error code if transaction failed
      errorMessage: text("error_message"),
      // Error message if transaction failed
      settlementDate: timestamp("settlement_date"),
      // When funds settle to account
      payoutId: text("payout_id"),
      // Stripe payout ID when settled
      metadata: jsonb("metadata"),
      // Additional data about the transaction
      notes: text("notes"),
      // Admin notes about the transaction
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    feeRevenue = pgTable("fee_revenue", {
      id: serial("id").primaryKey(),
      eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: "cascade" }),
      feeId: integer("fee_id").notNull().references(() => eventFees.id, { onDelete: "cascade" }),
      teamId: integer("team_id").references(() => teams.id),
      paymentTransactionId: integer("payment_transaction_id").references(() => paymentTransactions.id),
      feeAmount: integer("fee_amount").notNull(),
      // Amount of this specific fee in cents
      stripeFeeAllocation: integer("stripe_fee_allocation"),
      // Allocated portion of Stripe fee for this fee
      netFeeRevenue: integer("net_fee_revenue"),
      // Net revenue after allocated Stripe fees
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    paymentTransactionsRelations = relations(paymentTransactions, ({ one, many }) => ({
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
      feeRevenues: many(feeRevenue)
    }));
    feeRevenueRelations = relations(feeRevenue, ({ one }) => ({
      event: one(events, {
        fields: [feeRevenue.eventId],
        references: [events.id]
      }),
      fee: one(eventFees, {
        fields: [feeRevenue.feeId],
        references: [eventFees.id]
      }),
      team: one(teams, {
        fields: [feeRevenue.teamId],
        references: [teams.id]
      }),
      paymentTransaction: one(paymentTransactions, {
        fields: [feeRevenue.paymentTransactionId],
        references: [paymentTransactions.id]
      })
    }));
    insertGameTimeSlotSchema = createInsertSchema(gameTimeSlots);
    insertTournamentGroupSchema = createInsertSchema(tournamentGroups);
    insertTeamSchema = createInsertSchema(teams);
    insertPaymentTransactionSchema = createInsertSchema(paymentTransactions, {
      transactionType: z.enum(["payment", "refund", "partial_refund", "chargeback", "credit", "onsite_payment", "payment_info_collected"]),
      status: z.enum(["succeeded", "failed", "pending", "processing", "canceled"]),
      amount: z.number().int()
    });
    selectPaymentTransactionSchema = createSelectSchema(paymentTransactions);
    insertFeeRevenueSchema = createInsertSchema(feeRevenue, {
      feeAmount: z.number().int().positive("Fee amount must be positive"),
      stripeFeeAllocation: z.number().int().optional(),
      netFeeRevenue: z.number().int().optional()
    });
    selectFeeRevenueSchema = createSelectSchema(feeRevenue);
    insertGameSchema = createInsertSchema(games, {
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
      duration: z.number().min(20).max(120),
      breakTime: z.number().min(0).max(30)
    });
    selectGameTimeSlotSchema = createSelectSchema(gameTimeSlots);
    selectTournamentGroupSchema = createSelectSchema(tournamentGroups);
    selectTeamSchema = createSelectSchema(teams);
    selectGameSchema = createSelectSchema(games);
    players = pgTable("players", {
      id: serial("id").primaryKey(),
      teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      jerseyNumber: integer("jersey_number"),
      dateOfBirth: text("date_of_birth").notNull(),
      position: text("position"),
      // Keeping for backward compatibility but no longer used
      medicalNotes: text("medical_notes"),
      // Modified emergency contact fields
      emergencyContactFirstName: text("emergency_contact_first_name").notNull(),
      emergencyContactLastName: text("emergency_contact_last_name").notNull(),
      emergencyContactPhone: text("emergency_contact_phone").notNull(),
      // Keeping parent fields for backward compatibility but no longer used
      parentGuardianName: text("parent_guardian_name"),
      parentGuardianEmail: text("parent_guardian_email"),
      parentGuardianPhone: text("parent_guardian_phone"),
      emergencyContactName: text("emergency_contact_name"),
      // For backward compatibility
      isActive: boolean("is_active").notNull().default(true),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    teamsRelations = relations(teams, ({ many, one }) => ({
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
      club: one(clubs2, {
        fields: [teams.clubId],
        references: [clubs2.id]
      })
    }));
    playersRelations = relations(players, ({ one }) => ({
      team: one(teams, {
        fields: [players.teamId],
        references: [teams.id]
      })
    }));
    insertPlayerSchema = createInsertSchema(players, {
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      jerseyNumber: z.number().int().min(0).max(99).optional(),
      dateOfBirth: z.string().min(1, "Date of birth is required"),
      medicalNotes: z.string().optional(),
      emergencyContactFirstName: z.string().min(1, "Emergency contact first name is required"),
      emergencyContactLastName: z.string().min(1, "Emergency contact last name is required"),
      emergencyContactPhone: z.string().min(1, "Emergency contact phone is required")
    });
    selectPlayerSchema = createSelectSchema(players);
    eventComplexes2 = pgTable("event_complexes", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id),
      complexId: integer("complex_id").notNull().references(() => complexes.id),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    eventFieldSizes = pgTable("event_field_sizes", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id),
      fieldId: integer("field_id").notNull().references(() => fields.id),
      fieldSize: text("field_size").notNull(),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    eventScoringRules = pgTable("event_scoring_rules", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id),
      title: text("title").notNull(),
      win: integer("win").notNull(),
      loss: integer("loss").notNull(),
      tie: integer("tie").notNull(),
      goalCapped: integer("goal_capped").notNull(),
      shutout: integer("shutout").notNull(),
      redCard: integer("red_card").notNull(),
      tieBreaker: text("tie_breaker").notNull(),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    insertEventScoringRuleSchema = createInsertSchema(eventScoringRules, {
      title: z.string().min(1, "Title is required"),
      win: z.number().min(0, "Win points must be positive"),
      loss: z.number().min(0, "Loss points must be positive"),
      tie: z.number().min(0, "Tie points must be positive"),
      goalCapped: z.number().min(0, "Goal cap must be positive"),
      shutout: z.number().min(0, "Shutout points must be positive"),
      redCard: z.number().min(-10, "Red card points must be greater than -10"),
      tieBreaker: z.string().min(1, "Tie breaker is required")
    });
    selectEventScoringRuleSchema = createSelectSchema(eventScoringRules);
    eventAdministrators = pgTable("event_administrators", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id),
      userId: integer("user_id").notNull().references(() => users.id),
      role: text("role").notNull(),
      permissions: jsonb("permissions"),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    eventSettings = pgTable("event_settings", {
      id: serial("id").primaryKey(),
      eventId: text("event_id").notNull().references(() => events.id),
      settingKey: text("setting_key").notNull(),
      settingValue: text("setting_value").notNull(),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    insertEventAdministratorSchema = createInsertSchema(eventAdministrators, {
      role: z.enum(["owner", "admin", "moderator"]),
      permissions: z.record(z.boolean()).optional()
    });
    insertEventSettingSchema = createInsertSchema(eventSettings, {
      settingKey: z.string().min(1, "Setting key is required"),
      settingValue: z.string().min(1, "Setting value is required")
    });
    selectEventAdministratorSchema = createSelectSchema(eventAdministrators);
    selectEventSettingSchema = createSelectSchema(eventSettings);
    chatRooms = pgTable("chat_rooms", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      type: text("type").notNull(),
      eventId: text("event_id").references(() => events.id),
      teamId: integer("team_id").references(() => teams.id),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    chatParticipants = pgTable("chat_participants", {
      id: serial("id").primaryKey(),
      chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
      userId: integer("user_id").notNull().references(() => users.id),
      isAdmin: boolean("is_admin").default(false).notNull(),
      lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    messages = pgTable("messages", {
      id: serial("id").primaryKey(),
      chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
      userId: integer("user_id").notNull().references(() => users.id),
      content: text("content").notNull(),
      type: text("type").notNull().default("text"),
      metadata: jsonb("metadata"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertChatRoomSchema = createInsertSchema(chatRooms, {
      name: z.string().min(1, "Chat room name is required"),
      type: z.enum(["team", "event", "private"]),
      eventId: z.number().optional(),
      teamId: z.number().optional()
    });
    insertMessageSchema = createInsertSchema(messages, {
      content: z.string().min(1, "Message content is required"),
      type: z.enum(["text", "image", "system"]).default("text"),
      metadata: z.record(z.unknown()).optional()
    });
    insertChatParticipantSchema = createInsertSchema(chatParticipants, {
      isAdmin: z.boolean().default(false)
    });
    selectChatRoomSchema = createSelectSchema(chatRooms);
    selectMessageSchema = createSelectSchema(messages);
    selectChatParticipantSchema = createSelectSchema(chatParticipants);
    householdInvitations = pgTable("household_invitations", {
      id: serial("id").primaryKey(),
      householdId: integer("household_id").notNull().references(() => households.id),
      email: text("email").notNull(),
      status: text("status").notNull().default("pending"),
      token: text("token").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      createdBy: integer("created_by").notNull().references(() => users.id)
    });
    insertHouseholdInvitationSchema = createInsertSchema(householdInvitations, {
      email: z.string().email("Please enter a valid email address"),
      status: z.enum(["pending", "accepted", "declined", "expired"]).default("pending"),
      token: z.string(),
      expiresAt: z.string(),
      createdBy: z.number(),
      householdId: z.number()
    });
    selectHouseholdInvitationSchema = createSelectSchema(householdInvitations);
    roles = pgTable("roles", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    files = pgTable("files", {
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
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    folders = pgTable("folders", {
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      parentId: text("parent_id"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    foldersRelations = relations(folders, ({ one, many }) => ({
      parent: one(folders, {
        fields: [folders.parentId],
        references: [folders.id]
      }),
      files: many(files),
      children: many(folders)
    }));
    filesRelations = relations(files, ({ one }) => ({
      folder: one(folders, {
        fields: [files.folderId],
        references: [folders.id]
      }),
      uploadedBy: one(users, {
        fields: [files.uploadedById],
        references: [users.id]
      })
    }));
    insertFileSchema = createInsertSchema(files, {
      name: z.string().min(1, "File name is required"),
      url: z.string().min(1, "File URL is required"),
      type: z.string().min(1, "File type is required"),
      size: z.number().positive("File size must be positive"),
      folderId: z.string().nullable().optional(),
      thumbnailUrl: z.string().nullable().optional(),
      uploadedById: z.number().optional()
    });
    insertFolderSchema = createInsertSchema(folders, {
      name: z.string().min(1, "Folder name is required"),
      parentId: z.string().nullable().optional()
    });
    selectFileSchema = createSelectSchema(files);
    selectFolderSchema = createSelectSchema(folders);
    seasonalScopes = pgTable("seasonal_scopes", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      startYear: integer("start_year").notNull(),
      endYear: integer("end_year").notNull(),
      isActive: boolean("is_active").notNull().default(false),
      createCoedGroups: boolean("create_coed_groups").notNull().default(false),
      coedOnly: boolean("coed_only").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    ageGroupSettings = pgTable("age_group_settings", {
      id: serial("id").primaryKey(),
      seasonalScopeId: integer("seasonal_scope_id").notNull().references(() => seasonalScopes.id, { onDelete: "cascade" }),
      ageGroup: text("age_group").notNull(),
      birthYear: integer("birth_year").notNull(),
      gender: text("gender").notNull(),
      divisionCode: text("division_code").notNull(),
      minBirthYear: integer("min_birth_year").notNull(),
      maxBirthYear: integer("max_birth_year").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    seasonalScopesRelations = relations(seasonalScopes, ({ many }) => ({
      ageGroups: many(ageGroupSettings)
    }));
    ageGroupSettingsRelations = relations(ageGroupSettings, ({ one }) => ({
      seasonalScope: one(seasonalScopes, {
        fields: [ageGroupSettings.seasonalScopeId],
        references: [seasonalScopes.id]
      })
    }));
    insertSeasonalScopeSchema = createInsertSchema(seasonalScopes, {
      name: z.string().min(1, "Name is required"),
      startYear: z.number().int().min(2e3).max(2100),
      endYear: z.number().int().min(2e3).max(2100),
      isActive: z.boolean(),
      createCoedGroups: z.boolean().default(false),
      coedOnly: z.boolean().default(false)
    });
    insertAgeGroupSettingSchema = createInsertSchema(ageGroupSettings, {
      ageGroup: z.string().min(1, "Age group is required"),
      birthYear: z.number().int("Birth year must be a valid year"),
      gender: z.enum(["Boys", "Girls"]),
      divisionCode: z.string().min(1, "Division code is required"),
      minBirthYear: z.number().int("Min birth year must be a valid year"),
      maxBirthYear: z.number().int("Max birth year must be a valid year")
    });
    selectSeasonalScopeSchema = createSelectSchema(seasonalScopes);
    selectAgeGroupSettingSchema = createSelectSchema(ageGroupSettings);
    adminRoles = pgTable("admin_roles", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      roleId: integer("role_id").notNull().references(() => roles.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertRoleSchema = createInsertSchema(roles, {
      name: z.string().min(1, "Role name is required"),
      description: z.string().optional()
    });
    selectRoleSchema = createSelectSchema(roles);
    adminRolesRelations = relations(adminRoles, ({ one }) => ({
      user: one(users, {
        fields: [adminRoles.userId],
        references: [users.id]
      }),
      role: one(roles, {
        fields: [adminRoles.roleId],
        references: [roles.id]
      })
    }));
    insertAdminRoleSchema = createInsertSchema(adminRoles);
    selectAdminRoleSchema = createSelectSchema(adminRoles);
    adminFormSchema = z.object({
      email: z.string().email("Please enter a valid email address"),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      roles: z.array(z.string()).min(1, "At least one role is required")
    });
    updates = pgTable("updates", {
      id: serial("id").primaryKey(),
      content: text("content").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertUpdateSchema = createInsertSchema(updates, {
      content: z.string().min(1, "Update content is required")
    });
    selectUpdateSchema = createSelectSchema(updates);
    eventFees = pgTable("event_fees", {
      id: serial("id").primaryKey(),
      eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      amount: integer("amount").notNull(),
      // Store amount in cents
      beginDate: timestamp("begin_date"),
      endDate: timestamp("end_date"),
      feeType: text("fee_type"),
      // 'registration', 'uniform', 'equipment', etc.
      isRequired: boolean("is_required").default(false),
      applyToAll: boolean("apply_to_all").default(false).notNull(),
      accountingCodeId: integer("accounting_code_id").references(() => accountingCodes.id),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    eventAgeGroupFees = pgTable("event_age_group_fees", {
      id: serial("id").primaryKey(),
      ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id, { onDelete: "cascade" }),
      feeId: integer("fee_id").notNull().references(() => eventFees.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    eventFeesRelations = relations(eventFees, ({ one, many }) => ({
      event: one(events, {
        fields: [eventFees.eventId],
        references: [events.id]
      }),
      ageGroupFees: many(eventAgeGroupFees)
    }));
    eventAgeGroupFeesRelations = relations(eventAgeGroupFees, ({ one }) => ({
      fee: one(eventFees, {
        fields: [eventAgeGroupFees.feeId],
        references: [eventFees.id]
      }),
      ageGroup: one(eventAgeGroups, {
        fields: [eventAgeGroupFees.ageGroupId],
        references: [eventAgeGroups.id]
      })
    }));
    insertEventFeeSchema = createInsertSchema(eventFees, {
      name: z.string().min(1, "Fee name is required"),
      amount: z.number().int().positive("Amount must be positive"),
      beginDate: z.string().nullable().optional(),
      endDate: z.string().nullable().optional(),
      applyToAll: z.boolean().default(false)
    });
    insertEventAgeGroupFeeSchema = createInsertSchema(eventAgeGroupFees);
    selectEventFeeSchema = createSelectSchema(eventFees);
    selectEventAgeGroupFeeSchema = createSelectSchema(eventAgeGroupFees);
    accountingCodes = pgTable("accounting_codes", {
      id: serial("id").primaryKey(),
      code: text("code").notNull().unique(),
      name: text("name").notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertAccountingCodeSchema = createInsertSchema(accountingCodes, {
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required"),
      description: z.string().optional()
    });
    selectAccountingCodeSchema = createSelectSchema(accountingCodes);
    coupons = pgTable("coupons", {
      id: serial("id").primaryKey(),
      code: text("code").notNull().unique(),
      discountType: text("discount_type").notNull(),
      // 'fixed' or 'percentage'
      amount: integer("amount").notNull(),
      expirationDate: timestamp("expiration_date"),
      description: text("description"),
      eventId: bigint("event_id", { mode: "number" }).references(() => events.id),
      maxUses: integer("max_uses"),
      usageCount: integer("usage_count").notNull().default(0),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertCouponSchema = createInsertSchema(coupons, {
      code: z.string().min(1, "Coupon code is required"),
      discountType: z.enum(["fixed", "percentage"], "Invalid discount type"),
      amount: z.number().positive("Amount must be positive"),
      expirationDate: z.string().min(1, "Expiration date is required"),
      description: z.string().optional(),
      eventId: z.string().optional(),
      maxUses: z.number().int().positive("Maximum uses must be positive").optional(),
      isActive: z.boolean().default(true)
    });
    selectCouponSchema = createSelectSchema(coupons);
    eventFormTemplates = pgTable("event_form_templates", {
      id: serial("id").primaryKey(),
      eventId: bigint("event_id", { mode: "number" }).references(() => events.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      isPublished: boolean("is_published").default(false).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    formFields = pgTable("form_fields", {
      id: serial("id").primaryKey(),
      templateId: integer("template_id").notNull().references(() => eventFormTemplates.id, { onDelete: "cascade" }),
      label: text("label").notNull(),
      type: text("type").notNull(),
      // 'dropdown', 'paragraph', 'input'
      required: boolean("required").default(false).notNull(),
      order: integer("order").notNull(),
      placeholder: text("placeholder"),
      helpText: text("help_text"),
      validation: jsonb("validation"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    formFieldOptions = pgTable("form_field_options", {
      id: serial("id").primaryKey(),
      fieldId: integer("field_id").notNull().references(() => formFields.id, { onDelete: "cascade" }),
      label: text("label").notNull(),
      value: text("value").notNull(),
      order: integer("order").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    formResponses = pgTable("form_responses", {
      id: serial("id").primaryKey(),
      templateId: integer("template_id").notNull().references(() => eventFormTemplates.id),
      teamId: integer("team_id").notNull().references(() => teams.id),
      responses: jsonb("responses").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertEventFormTemplateSchema = createInsertSchema(eventFormTemplates, {
      name: z.string().min(1, "Template name is required"),
      description: z.string().optional(),
      isPublished: z.boolean().default(false)
    });
    insertFormFieldSchema = createInsertSchema(formFields, {
      label: z.string().min(1, "Field label is required"),
      type: z.enum(["dropdown", "paragraph", "input"]),
      required: z.boolean().default(false),
      order: z.number().int().min(0),
      placeholder: z.string().optional(),
      helpText: z.string().optional(),
      validation: z.record(z.unknown()).optional()
    });
    insertFormFieldOptionSchema = createInsertSchema(formFieldOptions, {
      label: z.string().min(1, "Option label is required"),
      value: z.string().min(1, "Option value is required"),
      order: z.number().int().min(0)
    });
    insertFormResponseSchema = createInsertSchema(formResponses, {
      responses: z.record(z.unknown()).refine((data) => Object.keys(data).length > 0, "Responses cannot be empty")
    });
    selectEventFormTemplateSchema = createSelectSchema(eventFormTemplates);
    selectFormFieldSchema = createSelectSchema(formFields);
    selectFormFieldOptionSchema = createSelectSchema(formFieldOptions);
    selectFormResponseSchema = createSelectSchema(formResponses);
    eventFormTemplatesRelations = relations(eventFormTemplates, ({ one, many }) => ({
      event: one(events, {
        fields: [eventFormTemplates.eventId],
        references: [events.id]
      }),
      fields: many(formFields),
      responses: many(formResponses)
    }));
    formFieldsRelations = relations(formFields, ({ one, many }) => ({
      template: one(eventFormTemplates, {
        fields: [formFields.templateId],
        references: [eventFormTemplates.id]
      }),
      options: many(formFieldOptions)
    }));
    formFieldOptionsRelations = relations(formFieldOptions, ({ one }) => ({
      field: one(formFields, {
        fields: [formFieldOptions.fieldId],
        references: [formFields.id]
      })
    }));
    formResponsesRelations = relations(formResponses, ({ one }) => ({
      template: one(eventFormTemplates, {
        fields: [formResponses.templateId],
        references: [eventFormTemplates.id]
      }),
      team: one(teams, {
        fields: [formResponses.teamId],
        references: [teams.id]
      })
    }));
    emailProviderSettings = pgTable("email_provider_settings", {
      id: serial("id").primaryKey(),
      providerType: text("provider_type").notNull(),
      providerName: text("provider_name").notNull(),
      settings: jsonb("settings").notNull(),
      isActive: boolean("is_active").default(true).notNull(),
      isDefault: boolean("is_default").default(false).notNull(),
      createdAt: text("created_at").notNull(),
      updatedAt: text("updated_at").notNull()
    });
    insertEmailProviderSettingsSchema = createInsertSchema(emailProviderSettings, {
      providerType: z.enum(["smtp", "sendgrid", "mailgun"]),
      providerName: z.string().min(1, "Provider name is required"),
      settings: z.record(z.unknown()),
      isActive: z.boolean().default(true),
      isDefault: z.boolean().default(false)
    });
    selectEmailProviderSettingsSchema = createSelectSchema(emailProviderSettings);
    emailTemplateRouting = pgTable("email_template_routing", {
      id: serial("id").primaryKey(),
      templateType: text("template_type").notNull(),
      // e.g., 'password_reset', 'registration', 'payment'
      providerId: integer("provider_id").notNull().references(() => emailProviderSettings.id),
      fromEmail: text("from_email").notNull(),
      fromName: text("from_name").notNull(),
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertEmailTemplateRoutingSchema = createInsertSchema(emailTemplateRouting, {
      templateType: z.string().min(1, "Template type is required"),
      providerId: z.number().positive("Provider ID is required"),
      fromEmail: z.string().email("Valid email address is required"),
      fromName: z.string().min(1, "From name is required"),
      isActive: z.boolean().default(true)
    });
    selectEmailTemplateRoutingSchema = createSelectSchema(emailTemplateRouting);
    emailTemplateRoutingRelations = relations(emailTemplateRouting, ({ one }) => ({
      provider: one(emailProviderSettings, {
        fields: [emailTemplateRouting.providerId],
        references: [emailProviderSettings.id]
      })
    }));
    emailTemplates = pgTable("email_templates", {
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
      created_at: timestamp("created_at").notNull().defaultNow(),
      updated_at: timestamp("updated_at").notNull().defaultNow()
    });
    emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
      provider: one(emailProviderSettings, {
        fields: [emailTemplates.providerId],
        references: [emailProviderSettings.id]
      })
    }));
    productUpdates = pgTable("product_updates", {
      id: serial("id").primaryKey(),
      version: varchar("version", { length: 20 }).notNull(),
      releaseDate: date("release_date").notNull(),
      title: varchar("title", { length: 100 }).notNull(),
      description: text("description").notNull(),
      category: varchar("category", { length: 50 }).notNull(),
      isHighlighted: boolean("is_highlighted").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertProductUpdateSchema = createInsertSchema(productUpdates, {
      version: z.string().min(1, "Version is required"),
      releaseDate: z.date(),
      title: z.string().min(1, "Title is required").max(100),
      description: z.string().min(1, "Description is required"),
      category: z.string().min(1, "Category is required"),
      isHighlighted: z.boolean().optional()
    });
    selectProductUpdateSchema = createSelectSchema(productUpdates);
  }
});

// db/index.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var db;
var init_db = __esm({
  "db/index.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    db = drizzle({
      connection: process.env.DATABASE_URL,
      schema: schema_exports,
      ws
    });
  }
});

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename, __dirname, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = dirname(__filename);
    vite_config_default = defineConfig({
      plugins: [react(), runtimeErrorOverlay(), themePlugin()],
      server: {
        host: "0.0.0.0",
        allowedHosts: ["7a45a6af-f46a-4d68-b2b2-2f12a1e00d54-00-5s7bw9z7rtfa.spock.replit.dev", "all"]
      },
      resolve: {
        alias: {
          "@db": path.resolve(__dirname, "db"),
          "@": path.resolve(__dirname, "client", "src")
        }
      },
      root: path.resolve(__dirname, "client"),
      build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true
      }
    });
  }
});

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      host: "0.0.0.0",
      allowedHosts: ["7a45a6af-f46a-4d68-b2b2-2f12a1e00d54-00-5s7bw9z7rtfa.spock.replit.dev", "all"]
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
var __filename2, __dirname2, viteLogger;
var init_vite = __esm({
  "server/vite.ts"() {
    "use strict";
    init_vite_config();
    __filename2 = fileURLToPath2(import.meta.url);
    __dirname2 = dirname2(__filename2);
    viteLogger = createLogger();
  }
});

// server/crypto.ts
import { randomBytes } from "crypto";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync, generateEventId, crypto;
var init_crypto = __esm({
  "server/crypto.ts"() {
    "use strict";
    scryptAsync = promisify(scrypt);
    generateEventId = () => {
      const min = 1e9;
      const max = 2147483647;
      const buffer = randomBytes(4);
      const value = buffer.readUInt32BE(0);
      return min + value % (max - min);
    };
    crypto = {
      hash: async (password) => {
        const salt = randomBytes(16).toString("hex");
        const buf = await scryptAsync(password, salt, 64);
        return `${buf.toString("hex")}.${salt}`;
      },
      compare: async (suppliedPassword, storedPassword) => {
        const [hashedPassword, salt] = storedPassword.split(".");
        const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
        const suppliedPasswordBuf = await scryptAsync(
          suppliedPassword,
          salt,
          64
        );
        return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
      },
      generateRandomPassword: (length = 12) => {
        const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijkmnpqrstuvwxyz";
        const numberChars = "23456789";
        const specialChars = "!@#$%^&*_-+=";
        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
        let password = "";
        password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
        password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
        password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
        for (let i = 4; i < length; i++) {
          password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        const passwordArray = password.split("");
        for (let i = passwordArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
        }
        return passwordArray.join("");
      },
      generateEventId
    };
  }
});

// db/schema/emailTemplates.ts
import { pgTable as pgTable2, serial as serial2, text as text2, timestamp as timestamp2, boolean as boolean2, json, integer as integer2 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema2, createSelectSchema as createSelectSchema2 } from "drizzle-zod";
var emailTemplates2, insertEmailTemplateSchema, selectEmailTemplateSchema;
var init_emailTemplates = __esm({
  "db/schema/emailTemplates.ts"() {
    "use strict";
    emailTemplates2 = pgTable2("email_templates", {
      id: serial2("id").primaryKey(),
      name: text2("name").notNull(),
      description: text2("description"),
      type: text2("type").notNull(),
      // registration, payment, password_reset, etc.
      subject: text2("subject").notNull(),
      content: text2("content").notNull(),
      senderName: text2("sender_name").notNull(),
      senderEmail: text2("sender_email").notNull(),
      isActive: boolean2("is_active").default(true),
      variables: json("variables").$type().default([]),
      providerId: integer2("provider_id"),
      sendgridTemplateId: text2("sendgrid_template_id"),
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow()
    });
    insertEmailTemplateSchema = createInsertSchema2(emailTemplates2);
    selectEmailTemplateSchema = createSelectSchema2(emailTemplates2);
  }
});

// server/services/sendgridService.ts
import { MailService } from "@sendgrid/mail";
async function sendEmail(params) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SendGrid API key not configured");
      return false;
    }
    const message = {
      to: params.to,
      from: params.from,
      subject: params.subject
    };
    if (params.templateId) {
      message.templateId = params.templateId;
      message.dynamicTemplateData = params.dynamicTemplateData || {};
    } else {
      message.text = params.text || "Please view this email in a compatible email client.";
      message.html = params.html || "<p>Please view this email in a compatible email client.</p>";
    }
    const response = await mailService.send(message);
    console.log(`SendGrid: Email sent to ${params.to}, status: ${response[0].statusCode}`);
    return true;
  } catch (error) {
    console.error("SendGrid: Error sending email:", error);
    if (error && typeof error === "object" && "response" in error) {
      const sgError = error;
      if (sgError.response && sgError.response.body) {
        console.error("SendGrid API response error:", sgError.response.body);
      }
    }
    return false;
  }
}
async function sendDynamicTemplateEmail(params) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SendGrid API key not configured");
      return false;
    }
    if (!params.templateId) {
      console.error("SendGrid template ID is required");
      return false;
    }
    const message = {
      to: params.to,
      from: params.from,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData || {}
    };
    if (process.env.NODE_ENV !== "production") {
      console.log("SendGrid Dynamic Template Email:");
      console.log(`Template ID: ${params.templateId}`);
      console.log("Dynamic Template Data:", JSON.stringify(params.dynamicTemplateData, null, 2));
    }
    const response = await mailService.send(message);
    console.log(`SendGrid: Dynamic template email sent to ${params.to}, status: ${response[0].statusCode}`);
    return true;
  } catch (error) {
    console.error("SendGrid: Error sending dynamic template email:", error);
    if (error && typeof error === "object" && "response" in error) {
      const sgError = error;
      if (sgError.response && sgError.response.body) {
        console.error("SendGrid API response error:", sgError.response.body);
      }
    }
    return false;
  }
}
var mailService;
var init_sendgridService = __esm({
  "server/services/sendgridService.ts"() {
    "use strict";
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("SendGrid API key not found in environment variables");
    }
    mailService = new MailService();
    if (process.env.SENDGRID_API_KEY) {
      mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
});

// server/services/emailService.ts
import nodemailer2 from "nodemailer";
import { eq as eq16, and as and9 } from "drizzle-orm";
async function getEmailProvider() {
  try {
    const sendGridProviders = await db.select().from(emailProviderSettings).where(and9(
      eq16(emailProviderSettings.providerType, "sendgrid"),
      eq16(emailProviderSettings.isActive, true)
    ));
    if (sendGridProviders.length > 0) {
      const defaultProvider = sendGridProviders.find((p) => p.isDefault);
      return defaultProvider || sendGridProviders[0];
    }
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (sendgridApiKey) {
      console.log("Using SendGrid API key from environment variables");
      return {
        id: 0,
        providerType: "sendgrid",
        providerName: "SendGrid Provider",
        settings: {
          apiKey: sendgridApiKey,
          from: process.env.SENDGRID_FROM_EMAIL || "support@matchpro.ai"
        },
        isActive: true,
        isDefault: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    throw new Error("SendGrid is not configured. Please set SENDGRID_API_KEY in environment variables.");
  } catch (error) {
    console.error("Error getting email provider:", error);
    throw error;
  }
}
async function getEmailTemplate(type, throwIfNotFound = false) {
  try {
    const [template] = await db.select().from(emailTemplates2).where(and9(
      eq16(emailTemplates2.type, type),
      eq16(emailTemplates2.isActive, true)
    ));
    if (!template) {
      if (throwIfNotFound) {
        throw new Error(`No active template found for type: ${type}`);
      }
      console.warn(`No active template found for type: ${type}, using fallback`);
      return null;
    }
    return template;
  } catch (error) {
    console.error(`Error getting email template for type ${type}:`, error);
    if (throwIfNotFound) {
      throw error;
    }
    return null;
  }
}
function renderTemplate(template, context) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return context[trimmedKey] !== void 0 ? context[trimmedKey] : match;
  });
}
async function sendEmail2(options) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  try {
    if (isDevelopment) {
      console.log("\n===== DEVELOPMENT MODE: EMAIL CONTENT =====");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`From: ${options.from || "default-sender"}`);
      console.log("Content:");
      console.log(options.html);
      console.log("=============================================\n");
    }
    const provider = await getEmailProvider();
    const from = options.from || `${provider.providerName} <${provider.settings.from || "support@matchpro.ai"}>`;
    const result = await sendEmail({
      to: options.to,
      from,
      subject: options.subject,
      html: options.html || "<p>Please view this email in a compatible email client.</p>",
      text: options.text || "Please view this email in a compatible email client."
    });
    if (result) {
      console.log(`SendGrid: Email sent to ${options.to}`);
    } else {
      throw new Error("Failed to send email via SendGrid");
    }
  } catch (error) {
    console.error("Error sending email:", error);
    if (isDevelopment) {
      console.log("Email sending failed, but continuing in development mode");
      console.error(error);
      return;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send email to ${options.to}: ${errorMessage}`);
  }
}
async function sendTemplatedEmail(to, templateType, context) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  try {
    const template = await getEmailTemplate(templateType, false);
    const emailTemplate = template || createFallbackTemplate(templateType, context, isDevelopment);
    if (!emailTemplate || !emailTemplate.subject || !emailTemplate.content) {
      throw new Error(`Failed to generate a valid email template for ${templateType}`);
    }
    try {
      if (emailTemplate.sendgridTemplateId) {
        console.log(`Using SendGrid dynamic template for ${templateType} (ID: ${emailTemplate.sendgridTemplateId})`);
        const fromEmail = `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`;
        const result = await sendDynamicTemplateEmail({
          to,
          from: fromEmail,
          templateId: emailTemplate.sendgridTemplateId,
          dynamicTemplateData: context
        });
        if (result) {
          console.log(`SendGrid dynamic template email (${templateType}) sent to ${to}`);
        } else {
          throw new Error(`Failed to send SendGrid dynamic template email to ${to}`);
        }
      } else {
        const subject = renderTemplate(emailTemplate.subject, context) || "Notification";
        let html = renderTemplate(emailTemplate.content, context);
        if (!html || html.trim() === "") {
          html = "<p>You have received a notification from MatchPro. Please check your account for more information.</p>";
        }
        await sendEmail2({
          to,
          subject,
          html,
          from: `${emailTemplate.senderName} <${emailTemplate.senderEmail}>`
        });
        console.log(`Templated email (${templateType}) sent to ${to}`);
      }
    } catch (renderError) {
      console.error(`Error rendering or sending email (${templateType}):`, renderError);
    }
  } catch (error) {
    console.error(`Unexpected error in sendTemplatedEmail (${templateType}):`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send templated email to ${to}: ${errorMessage}`);
  }
}
function createFallbackTemplate(templateType, context, isDevelopment) {
  if (isDevelopment) {
    console.log(`Using detailed development fallback template for ${templateType}`);
    return {
      subject: `[DEV MODE] ${templateType} notification`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Development Mode - Template Missing</h2>
          <p>This is a development placeholder for the <strong>${templateType}</strong> template which was not found in the database.</p>
          <h3>Context Data:</h3>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${JSON.stringify(context, null, 2)}</pre>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This template was generated automatically as a fallback in development mode.</p>
        </div>
      `,
      senderName: "MatchPro",
      senderEmail: "support@matchpro.ai",
      isActive: true,
      type: templateType,
      providerId: null,
      sendgridTemplateId: null
    };
  } else {
    console.log(`Using generic production fallback template for ${templateType}`);
    return {
      subject: `${templateType.replace(/_/g, " ")} notification`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Team Registration Update</h2>
          <p>This is a notification regarding your team registration status.</p>
          <p>Please check your dashboard for more details.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated notification.</p>
        </div>
      `,
      senderName: "MatchPro",
      senderEmail: "support@matchpro.ai",
      isActive: true,
      type: templateType,
      providerId: null,
      sendgridTemplateId: null
    };
  }
}
function getAppUrl(isDevelopment = process.env.NODE_ENV !== "production") {
  if (isDevelopment) {
    return process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
  } else {
    return process.env.PRODUCTION_URL || process.env.APP_URL || "https://matchpro.ai";
  }
}
async function sendRegistrationReceiptEmail(to, teamData, paymentData, eventName) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  try {
    const appUrl = getAppUrl(isDevelopment);
    const loginLink = `${appUrl}/dashboard`;
    const formatCurrency = (amount) => {
      return (amount / 100).toFixed(2);
    };
    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    const paymentDate = paymentData?.paymentDate || teamData?.paymentDate;
    const formattedPaymentDate = paymentDate ? formatDate(paymentDate) : "";
    let selectedFees = [];
    if (teamData.selectedFeeIds) {
      selectedFees = [{ name: "Registration Fee", amount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0) }];
    }
    const context = {
      teamName: teamData.name || "Team Registration",
      eventName: eventName || "Event Registration",
      submitterName: teamData.submitterName || teamData.managerName || "",
      submitterEmail: teamData.submitterEmail || teamData.managerEmail || "",
      registrationDate: formatDate(teamData.createdAt),
      totalAmount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0),
      paymentStatus: paymentData?.status || teamData.paymentStatus || "pending",
      paymentDate: formattedPaymentDate,
      paymentMethod: paymentData?.paymentMethodType || "card",
      cardLastFour: paymentData?.cardLastFour || teamData.cardLastFour || "",
      cardBrand: paymentData?.cardBrand || teamData.cardBrand || "",
      paymentId: paymentData?.paymentIntentId || teamData.paymentIntentId || "",
      selectedFees,
      loginLink,
      clubName: teamData.clubName || "",
      currentYear: (/* @__PURE__ */ new Date()).getFullYear()
    };
    await sendTemplatedEmail(to, "registration_receipt", context);
    console.log(`Registration receipt email sent to ${to}`);
  } catch (error) {
    console.error("Error sending registration receipt email:", error);
    if (isDevelopment) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send registration receipt email to ${to}: ${errorMessage}`);
  }
}
async function sendRegistrationConfirmationEmail(to, teamData, eventData, ageGroupData, bracketData) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  try {
    const appUrl = getAppUrl(isDevelopment);
    const loginLink = `${appUrl}/dashboard`;
    const formatCurrency = (amount) => {
      if (!amount) return "0.00";
      return (amount / 100).toFixed(2);
    };
    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };
    let headCoachName = "";
    if (teamData.coach) {
      try {
        const coachData = typeof teamData.coach === "string" ? JSON.parse(teamData.coach) : teamData.coach;
        headCoachName = coachData.headCoachName || "";
      } catch (e) {
        console.log("Could not parse coach data, using as string");
        headCoachName = teamData.coach;
      }
    }
    let selectedFees = [];
    if (teamData.selectedFeeIds && teamData.selectedFeeIds.length > 0) {
      selectedFees = [{
        name: "Registration Fee",
        amount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0)
      }];
    }
    const context = {
      teamName: teamData.name || "Team Registration",
      eventName: eventData?.name || "Event Registration",
      ageGroup: ageGroupData?.ageGroup || ageGroupData?.name || "Age Group",
      bracket: bracketData?.name || "",
      clubName: teamData.clubName || "",
      submitterName: teamData.submitterName || teamData.managerName || "",
      submitterEmail: teamData.submitterEmail || teamData.managerEmail || "",
      headCoachName,
      managerName: teamData.managerName || "",
      managerEmail: teamData.managerEmail || "",
      managerPhone: teamData.managerPhone || "",
      registrationDate: formatDate(teamData.createdAt),
      totalAmount: formatCurrency(teamData.totalAmount || teamData.registrationFee || 0),
      selectedFees,
      cardBrand: teamData.cardBrand || "Card",
      cardLastFour: teamData.cardLast4 || teamData.cardLastFour || "****",
      setupIntentId: teamData.setupIntentId || "",
      addRosterLater: teamData.addRosterLater || false,
      loginLink,
      supportEmail: "support@matchpro.ai",
      organizationName: "MatchPro",
      currentYear: (/* @__PURE__ */ new Date()).getFullYear()
    };
    await sendTemplatedEmail(to, "registration_confirmation", context);
    console.log(`Registration confirmation email sent to ${to}`);
  } catch (error) {
    console.error("Error sending registration confirmation email:", error);
    if (isDevelopment) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send registration confirmation email to ${to}: ${errorMessage}`);
  }
}
async function sendPasswordResetEmail(to, resetToken, username) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  try {
    const appUrl = getAppUrl(isDevelopment);
    console.log(`Using URL for password reset: ${appUrl}`);
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    await sendTemplatedEmail(to, "password_reset", {
      username,
      resetUrl,
      token: resetToken,
      expiryHours: 24
      // Token validity period
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    if (isDevelopment) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send password reset email to ${to}: ${errorMessage}`);
  }
}
var CACHE_TTL;
var init_emailService = __esm({
  "server/services/emailService.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_emailTemplates();
    init_sendgridService();
    CACHE_TTL = 5 * 60 * 1e3;
  }
});

// server/services/stripeService.ts
import Stripe from "stripe";
import { eq as eq18 } from "drizzle-orm";
async function checkStripeApiVersion() {
  try {
    console.log(`Using Stripe API version: ${STRIPE_API_VERSION}`);
  } catch (error) {
    console.warn("Could not verify Stripe API version:", error);
  }
}
async function createPaymentIntent(amount, teamId, metadata) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      // Convert to cents
      currency: "usd",
      metadata: {
        teamId: teamId.toString(),
        ...metadata
      }
    });
    if (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) {
      try {
        const numericTeamId = typeof teamId === "number" ? teamId : parseInt(teamId.toString());
        await db.update(teams).set({
          paymentIntentId: paymentIntent.id
        }).where(eq18(teams.id, numericTeamId));
      } catch (dbError) {
        console.warn(`Could not update team record with payment intent ID, likely a temporary team: ${dbError.message}`);
      }
    }
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(`Error creating payment intent: ${error.message}`);
  }
}
async function handlePaymentSuccess(paymentIntent) {
  try {
    const teamId = paymentIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in payment intent metadata");
      return;
    }
    if (teamId.toString().startsWith("temp-")) {
      console.log(`Payment received for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`);
      return;
    }
    const teamIdNumber = parseInt(teamId);
    const existingTeam = await db.query.teams.findFirst({
      where: eq18(teams.id, teamIdNumber)
    });
    if (!existingTeam) {
      console.error(`Team with ID ${teamId} not found`);
      return;
    }
    const charges = await stripe.charges.list({
      payment_intent: paymentIntent.id
    });
    const charge = charges.data[0];
    const cardDetails = charge?.payment_method_details?.card;
    await db.insert(paymentTransactions).values({
      teamId: teamIdNumber,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: "paid",
      paymentDate: /* @__PURE__ */ new Date(),
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null
    });
    await db.update(teams).set({
      paymentStatus: "paid",
      paymentDate: (/* @__PURE__ */ new Date()).toISOString(),
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null
    }).where(eq18(teams.id, teamIdNumber));
    console.log(`Payment recorded successfully for team ${teamId}`);
    try {
      if (existingTeam.submitterEmail) {
        const [eventInfo] = await db.select({ name: events.name }).from(events).where(eq18(events.id, existingTeam.eventId));
        const paymentData = {
          status: "paid",
          amount: paymentIntent.amount,
          paymentIntentId: paymentIntent.id,
          paymentDate: (/* @__PURE__ */ new Date()).toISOString(),
          cardBrand: cardDetails?.brand || null,
          cardLastFour: cardDetails?.last4 || null,
          paymentMethodType: "card"
        };
        console.log(`Sending payment receipt email to ${existingTeam.submitterEmail}`);
        sendRegistrationReceiptEmail(
          existingTeam.submitterEmail,
          existingTeam,
          paymentData,
          eventInfo?.name || "Tournament Registration"
        ).catch((emailError) => {
          console.error("Error sending payment receipt email:", emailError);
        });
      }
    } catch (emailError) {
      console.error("Error preparing payment receipt email:", emailError);
    }
    return true;
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw new Error(`Error handling payment success: ${error.message}`);
  }
}
async function handlePaymentFailure(paymentIntent) {
  try {
    const teamId = paymentIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in payment intent metadata");
      return;
    }
    if (teamId.toString().startsWith("temp-")) {
      console.log(`Payment failure for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`);
      return;
    }
    const teamIdNumber = parseInt(teamId);
    await db.insert(paymentTransactions).values({
      teamId: teamIdNumber,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: "failed",
      paymentDate: /* @__PURE__ */ new Date(),
      errorCode: paymentIntent.last_payment_error?.code || null,
      errorMessage: paymentIntent.last_payment_error?.message || null
    });
    await db.update(teams).set({
      paymentStatus: "failed",
      errorCode: paymentIntent.last_payment_error?.code || null,
      errorMessage: paymentIntent.last_payment_error?.message || null
    }).where(eq18(teams.id, teamIdNumber));
    console.log(`Payment failure recorded for team ${teamId}`);
    return true;
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw new Error(`Error handling payment failure: ${error.message}`);
  }
}
async function createTestPaymentIntent(amount, teamId, metadata) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test payment intents are not allowed in production");
  }
  log("Creating test payment intent");
  return createPaymentIntent(amount, teamId, metadata);
}
async function createRefund(paymentIntentId, amount) {
  try {
    log(`Creating refund for payment intent ${paymentIntentId}`);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      throw new Error(`Payment intent ${paymentIntentId} not found`);
    }
    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId
    });
    if (charges.data.length === 0) {
      throw new Error(`No charges found for payment intent ${paymentIntentId}`);
    }
    const chargeId = charges.data[0].id;
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount
      // If not specified, refund the full amount
    });
    const teamId = paymentIntent.metadata.teamId;
    if (teamId) {
      const teamIdNumber = parseInt(teamId);
      await db.update(teams).set({
        paymentStatus: "refunded",
        refundDate: (/* @__PURE__ */ new Date()).toISOString()
      }).where(eq18(teams.id, teamIdNumber));
      await db.insert(paymentTransactions).values({
        teamId: teamIdNumber,
        paymentIntentId,
        amount: -(amount || paymentIntent.amount),
        // Negative amount for refund
        status: "refunded",
        paymentDate: /* @__PURE__ */ new Date()
      });
    }
    return refund;
  } catch (error) {
    console.error("Error creating refund:", error);
    throw new Error(`Error creating refund: ${error.message}`);
  }
}
async function createSetupIntent(teamId, metadata) {
  try {
    log(`Creating setup intent for team: ${teamId}`);
    const setupIntent = await stripe.setupIntents.create({
      // Use automatic_payment_methods instead of payment_method_types
      // This is the recommended approach by Stripe
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      },
      usage: "off_session",
      // This allows for future use without customer being present
      // Remove hardcoded payment_method_configuration to use account default
      metadata: {
        teamId: teamId.toString(),
        ...metadata
      }
    });
    if (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) {
      try {
        const numericTeamId = typeof teamId === "number" ? teamId : parseInt(teamId.toString());
        await db.update(teams).set({
          setupIntentId: setupIntent.id,
          paymentStatus: "payment_info_provided"
        }).where(eq18(teams.id, numericTeamId));
      } catch (dbError) {
        console.warn(`Could not update team record with setup intent ID, likely a temporary team: ${dbError.message}`);
      }
    }
    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    };
  } catch (error) {
    console.error("Error creating setup intent:", error);
    throw new Error(`Error creating setup intent: ${error.message}`);
  }
}
async function processPaymentForApprovedTeam(teamId, amount) {
  try {
    log(`Processing payment for approved team: ${teamId}`);
    const team = await db.query.teams.findFirst({
      where: eq18(teams.id, teamId)
    });
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    if (!team.paymentMethodId) {
      throw new Error(`Team ${teamId} has no saved payment method`);
    }
    let customerId = team.stripeCustomerId;
    if (!customerId) {
      log(`Creating Stripe customer for team: ${teamId}`);
      const customer = await stripe.customers.create({
        name: team.name || `Team ${teamId}`,
        email: team.submitterEmail || `team-${teamId}@example.com`,
        metadata: {
          teamId: teamId.toString(),
          eventId: team.eventId?.toString() || ""
        }
      });
      customerId = customer.id;
      await db.update(teams).set({ stripeCustomerId: customerId }).where(eq18(teams.id, teamId));
      await stripe.paymentMethods.attach(team.paymentMethodId, {
        customer: customerId
      });
    } else {
      log(`Using existing Stripe customer for team: ${teamId}`);
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(team.paymentMethodId);
        if (paymentMethod.customer !== customerId) {
          log(`Attaching payment method ${team.paymentMethodId} to customer ${customerId}`);
          await stripe.paymentMethods.attach(team.paymentMethodId, {
            customer: customerId
          });
        }
      } catch (error) {
        log(`Detaching and re-attaching payment method for team: ${teamId}`);
        try {
          await stripe.paymentMethods.detach(team.paymentMethodId);
        } catch (detachError) {
          log(`Failed to detach payment method: ${detachError.message}`);
        }
        await stripe.paymentMethods.attach(team.paymentMethodId, {
          customer: customerId
        });
      }
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      // Convert to cents
      currency: "usd",
      customer: customerId,
      payment_method: team.paymentMethodId,
      confirm: true,
      // Immediately attempt to confirm the payment
      off_session: true,
      // Since the customer is not present
      metadata: {
        teamId: teamId.toString(),
        eventId: team.eventId?.toString() || "",
        description: `Team registration payment for ${team.name}`
      }
    });
    await db.update(teams).set({
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      paymentDate: /* @__PURE__ */ new Date()
      // Use Date object directly for timestamp fields
    }).where(eq18(teams.id, teamId));
    await db.insert(paymentTransactions).values({
      status: paymentIntent.status,
      transactionType: "registration_payment",
      amount,
      paymentIntentId: paymentIntent.id,
      setupIntentId: team.setupIntentId,
      eventId: team.eventId,
      teamId,
      cardBrand: team.cardBrand,
      cardLast4: team.cardLast4
      // Note: paymentDate field was removed as it's not in the schema
      // We have createdAt which is automatically set
    });
    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    };
  } catch (error) {
    console.error("Error processing payment for approved team:", error);
    await db.update(teams).set({
      paymentStatus: "failed",
      errorCode: error.code || null,
      errorMessage: error.message || "Payment processing failed"
    }).where(eq18(teams.id, teamId));
    throw new Error(`Error processing payment: ${error.message}`);
  }
}
async function attachTestPaymentMethodToSetupIntent(setupIntentId) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only available in development mode");
  }
  try {
    log(`Attaching test payment method to setup intent: ${setupIntentId}`);
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: "tok_visa"
        // Standard test token for a Visa card
      }
    });
    log(`Created test payment method: ${paymentMethod.id}`);
    const setupIntent = await stripe.setupIntents.update(setupIntentId, {
      payment_method: paymentMethod.id
    });
    const confirmedIntent = await stripe.setupIntents.confirm(setupIntentId, {
      payment_method: paymentMethod.id,
      return_url: "https://example.com/setup-complete"
      // Dummy URL for testing purposes
    });
    log(`Confirmed setup intent: ${confirmedIntent.id} with status: ${confirmedIntent.status}`);
    await handleSetupIntentSuccess(confirmedIntent);
    return {
      success: true,
      setupIntentId,
      paymentMethodId: paymentMethod.id,
      status: confirmedIntent.status
    };
  } catch (error) {
    console.error("Error attaching test payment method to setup intent:", error);
    throw new Error(`Error attaching payment method: ${error.message}`);
  }
}
async function handleSetupIntentSuccess(setupIntent) {
  try {
    const teamId = setupIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in setup intent metadata");
      return;
    }
    if (teamId.toString().startsWith("temp-")) {
      console.log(`Setup intent completed for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`);
      return;
    }
    const paymentMethodId = setupIntent.payment_method;
    if (!paymentMethodId) {
      console.error("No payment method attached to setup intent");
      return;
    }
    const teamIdNumber = parseInt(teamId);
    const existingTeam = await db.query.teams.findFirst({
      where: eq18(teams.id, teamIdNumber)
    });
    if (!existingTeam) {
      console.error(`Team with ID ${teamId} not found`);
      return;
    }
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const cardDetails = paymentMethod.card;
    let customerId = existingTeam.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: existingTeam.name || `Team ${teamId}`,
        email: existingTeam.submitterEmail || `team-${teamId}@example.com`,
        metadata: {
          teamId: teamId.toString(),
          eventId: existingTeam.eventId?.toString() || ""
        }
      });
      customerId = customer.id;
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }
    await db.update(teams).set({
      paymentMethodId,
      paymentStatus: "payment_info_provided",
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null,
      stripeCustomerId: customerId
    }).where(eq18(teams.id, teamIdNumber));
    console.log(`Payment method saved successfully for team ${teamId}`);
    return true;
  } catch (error) {
    console.error("Error handling setup intent success:", error);
    throw new Error(`Error handling setup intent success: ${error.message}`);
  }
}
async function handleRefund(charge, refund) {
  try {
    const paymentIntentId = charge.payment_intent;
    if (!paymentIntentId) {
      console.error("No payment intent ID found in charge");
      return;
    }
    const team = await db.query.teams.findFirst({
      where: eq18(teams.paymentIntentId, paymentIntentId)
    });
    if (!team) {
      console.error(`No team found with payment intent ID ${paymentIntentId}`);
      return;
    }
    await db.insert(paymentTransactions).values({
      teamId: team.id,
      paymentIntentId,
      amount: -refund.amount,
      // negative amount for refund
      status: "refunded",
      transactionType: "refund",
      cardBrand: team.cardBrand,
      cardLast4: team.cardLast4
    });
    await db.update(teams).set({
      paymentStatus: "refunded",
      refundDate: /* @__PURE__ */ new Date()
      // Use Date object directly for timestamp fields
    }).where(eq18(teams.id, team.id));
    console.log(`Refund recorded for team ${team.id}`);
    return true;
  } catch (error) {
    console.error("Error handling refund:", error);
    throw new Error(`Error handling refund: ${error.message}`);
  }
}
var STRIPE_API_VERSION, stripe;
var init_stripeService = __esm({
  "server/services/stripeService.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_vite();
    init_emailService();
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
    }
    STRIPE_API_VERSION = "2023-10-16";
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION
    });
    if (process.env.NODE_ENV === "production") {
      checkStripeApiVersion();
    }
  }
});

// server/services/emulationService.ts
import { eq as eq33, and as and18 } from "drizzle-orm";
function generateEmulationToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
async function startEmulation(superAdminId, adminToEmulateId) {
  try {
    const superAdminRole = await db.query.adminRoles.findFirst({
      where: and18(
        eq33(adminRoles.userId, superAdminId),
        eq33(adminRoles.roleId, 1)
        // 1 is super_admin role
      )
    });
    if (!superAdminRole) {
      console.error(`User ${superAdminId} is not a super admin`);
      return null;
    }
    const adminToEmulate = await db.query.users.findFirst({
      where: eq33(users.id, adminToEmulateId)
    });
    if (!adminToEmulate || !adminToEmulate.isAdmin) {
      console.error(`User ${adminToEmulateId} is not an admin`);
      return null;
    }
    const isTargetSuperAdmin = await db.query.adminRoles.findFirst({
      where: and18(
        eq33(adminRoles.userId, adminToEmulateId),
        eq33(adminRoles.roleId, 1)
        // 1 is super_admin role
      )
    });
    if (isTargetSuperAdmin) {
      console.error(`Cannot emulate super admin ${adminToEmulateId}`);
      return null;
    }
    const token = generateEmulationToken();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);
    emulationSessions[token] = {
      actualUserId: superAdminId,
      emulatedUserId: adminToEmulateId,
      expiresAt
    };
    return token;
  } catch (error) {
    console.error("Error starting emulation session:", error);
    return null;
  }
}
function stopEmulation(token) {
  if (emulationSessions[token]) {
    delete emulationSessions[token];
    return true;
  }
  return false;
}
function getEmulatedUserId(token) {
  const session2 = emulationSessions[token];
  if (!session2) {
    return null;
  }
  if (/* @__PURE__ */ new Date() > session2.expiresAt) {
    delete emulationSessions[token];
    return null;
  }
  return session2.emulatedUserId;
}
function emulationMiddleware(req, res, next) {
  const emulationToken = req.headers["x-emulation-token"];
  if (emulationToken && emulationSessions[emulationToken]) {
    const session2 = emulationSessions[emulationToken];
    if (/* @__PURE__ */ new Date() > session2.expiresAt) {
      delete emulationSessions[emulationToken];
      console.log(`Emulation session expired: ${emulationToken}`);
    } else {
      req.actualUserId = session2.actualUserId;
      req.emulatedUserId = session2.emulatedUserId;
      if (req.path.includes("/api/user") || req.path.includes("/api/admin/permissions")) {
        console.log(`Emulating user ID ${session2.emulatedUserId} from actual user ${session2.actualUserId} on path ${req.path}`);
      }
    }
  }
  next();
}
var emulationSessions;
var init_emulationService = __esm({
  "server/services/emulationService.ts"() {
    "use strict";
    init_db();
    init_schema();
    emulationSessions = {};
  }
});

// server/routes/coaches.ts
var coaches_exports = {};
__export(coaches_exports, {
  checkCoachEmail: () => checkCoachEmail
});
import { eq as eq37 } from "drizzle-orm";
async function checkCoachEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const userResults = await db.select().from(users).where(eq37(users.email, email.toLowerCase())).limit(1);
    if (userResults.length === 0) {
      return res.json({
        exists: false,
        coach: null
      });
    }
    const user = userResults[0];
    return res.json({
      exists: true,
      coach: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || ""
        // Phone may be null in the database
      }
    });
  } catch (error) {
    console.error("Error checking coach email:", error);
    return res.status(500).json({ error: "Failed to check coach email" });
  }
}
var init_coaches = __esm({
  "server/routes/coaches.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/routes/teams.ts
var teams_exports = {};
__export(teams_exports, {
  getMyTeams: () => getMyTeams
});
import { eq as eq38, or as or6, like as like5 } from "drizzle-orm";
async function getMyTeams(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userEmail = req.user.email.toLowerCase();
    const result = await db.select({
      id: teams.id,
      name: teams.name,
      eventId: teams.eventId,
      eventName: events.name,
      ageGroup: eventAgeGroups.ageGroup,
      status: teams.status,
      createdAt: teams.createdAt,
      startDate: events.startDate,
      coach: teams.coach,
      managerEmail: teams.managerEmail
    }).from(teams).leftJoin(events, eq38(teams.eventId, events.id)).leftJoin(eventAgeGroups, eq38(teams.ageGroupId, eventAgeGroups.id)).where(
      or6(
        // Check if user is the coach (stored in the coach JSON field)
        like5(teams.coach, `%${userEmail}%`),
        // Check if user is the team manager
        eq38(teams.managerEmail, userEmail)
      )
    );
    const teamsWithRole = result.map((team) => {
      let isCoach = false;
      try {
        const coachData = JSON.parse(team.coach);
        if (coachData && coachData.headCoachEmail === userEmail) {
          isCoach = true;
        }
      } catch (e) {
      }
      return {
        id: team.id,
        name: team.name,
        eventId: team.eventId,
        eventName: team.eventName,
        ageGroup: team.ageGroup,
        status: team.status,
        createdAt: team.createdAt,
        startDate: team.startDate,
        role: isCoach ? "coach" : "manager"
      };
    });
    return res.json(teamsWithRole);
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return res.status(500).json({ error: "Failed to fetch teams" });
  }
}
var init_teams = __esm({
  "server/routes/teams.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  createCoachAccount: () => createCoachAccount,
  setupAuth: () => setupAuth
});
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq as eq39, or as or7 } from "drizzle-orm";
async function getUserById(id) {
  const now = Date.now();
  const cachedData = userCache[id];
  if (cachedData && now - cachedData.timestamp < USER_CACHE_TTL) {
    return cachedData.user;
  }
  const [user] = await db.select().from(users).where(eq39(users.id, id)).limit(1);
  if (user) {
    userCache[id] = {
      user,
      timestamp: now
    };
  }
  return user || null;
}
function invalidateUserCache(id) {
  delete userCache[id];
}
async function createCoachAccount(firstName, lastName, email, phone) {
  const [existingUser] = await db.select().from(users).where(eq39(users.email, email.toLowerCase())).limit(1);
  if (existingUser) {
    return existingUser;
  }
  const tempPassword = crypto.generateRandomPassword(16);
  const hashedPassword = await crypto.hash(tempPassword);
  const [household] = await db.insert(households).values({
    lastName,
    address: "",
    city: "",
    state: "",
    zipCode: "",
    primaryEmail: email.toLowerCase(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }).returning();
  const [newUser] = await db.insert(users).values({
    username: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    isParent: false,
    isAdmin: false,
    householdId: household.id,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }).returning();
  try {
    await sendTemplatedEmail({
      to: email,
      templateType: "welcome_email",
      data: {
        firstName,
        lastName,
        email,
        username: email,
        password: tempPassword
        // Include the generated password (only sent via email)
      }
    });
    console.log(`Welcome email sent to new coach/manager account: ${email}`);
  } catch (emailError) {
    console.error("Failed to send welcome email to new coach/manager:", emailError);
  }
  return newUser;
}
function setupAuth(app2) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings = {
    secret: process.env.REPL_ID || "soccer-registration-secret",
    resave: true,
    // Changed to true to ensure session is saved on every request
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1e3,
      // 30 days for longer sessions
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    },
    store: new MemoryStore({
      checkPeriod: 864e5,
      // 24 hours cleanup interval
      // Don't refresh/ping inactive sessions in the background
      stale: false
    }),
    rolling: true,
    // Reset expiration countdown on every response
    unset: "destroy"
    // Immediately destroy when unset
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true
    };
  }
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  app2.use(emulationMiddleware);
  passport.use(
    new LocalStrategy({
      usernameField: "email",
      passwordField: "password"
    }, async (email, password, done) => {
      try {
        console.log("Login attempt for:", email);
        const [user] = await db.select().from(users).where(or7(eq39(users.email, email), eq39(users.username, email))).limit(1);
        if (!user) {
          console.log("User not found:", email);
          return done(null, false, { message: "Incorrect email or username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          console.log("Password mismatch for user:", email);
          return done(null, false, { message: "Incorrect password." });
        }
        console.log("Login successful for user:", email);
        userCache[user.id] = {
          user,
          timestamp: Date.now()
        };
        return done(null, user);
      } catch (err) {
        console.error("Login error:", err);
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await getUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration request received:", req.body.email);
      console.log("Full registration data:", JSON.stringify(req.body, null, 2));
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Validation failed. Full error details:", JSON.stringify(result.error, null, 2));
        const errorMsg = "Invalid input: " + result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        console.error("Registration validation error:", errorMsg);
        return res.status(400).send(errorMsg);
      }
      const { username, password, firstName, lastName, email, phone, isParent } = result.data;
      console.log("Processing registration for:", email);
      const [existingUser] = await db.select().from(users).where(or7(eq39(users.email, email), eq39(users.username, username))).limit(1);
      if (existingUser) {
        console.log("Registration failed - user exists:", email);
        return res.status(400).send("User with this email or username already exists");
      }
      const hashedPassword = await crypto.hash(password);
      console.log("Creating user account for:", email);
      const [household] = await db.insert(households).values({
        lastName,
        address: "",
        // These will be updated in the user profile
        city: "",
        state: "",
        zipCode: "",
        primaryEmail: email,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      console.log("Created household for new user:", household.id);
      const [newUser] = await db.insert(users).values({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        phone,
        isParent,
        householdId: household.id,
        isAdmin: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      console.log("Created new user account:", newUser.id);
      userCache[newUser.id] = {
        user: newUser,
        timestamp: Date.now()
      };
      try {
        sendTemplatedEmail(
          email,
          "welcome",
          {
            firstName,
            lastName,
            email,
            username
          }
        ).then(() => {
          console.log(`Welcome email sent to ${email}`);
        }).catch((err) => {
          console.error("Welcome email error:", err);
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
      console.log("Starting user login process after registration");
      try {
        await new Promise((resolve, reject) => {
          req.login(newUser, (err) => {
            if (err) {
              console.error("Login error after registration:", err);
              reject(err);
              return;
            }
            console.log("Login successful after registration");
            resolve();
          });
        });
        console.log("User logged in, session created:", req.isAuthenticated(), "Session ID:", req.sessionID);
        res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        res.set("X-Registration-Timestamp", Date.now().toString());
        return res.status(200).json({
          message: "Registration successful",
          user: newUser,
          timestamp: Date.now(),
          // Add timestamp to prevent caching
          authenticated: req.isAuthenticated()
        });
      } catch (loginError) {
        console.error("Failed to log in user after registration:", loginError);
        return res.status(200).json({
          message: "Registration successful, but automatic login failed. Please log in manually.",
          registrationSuccess: true,
          loginSuccess: false,
          user: newUser,
          // Still return the user data
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    console.log("Login request received:", req.body.email);
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Login failed - invalid credentials:", info?.message);
        return res.status(400).send(info?.message ?? "Login failed - invalid credentials");
      }
      console.log("Authentication successful for user:", user.email);
      req.logIn(user, async (err2) => {
        if (err2) {
          console.error("Login session creation error:", err2);
          return next(err2);
        }
        try {
          await db.update(users).set({
            lastLogin: /* @__PURE__ */ new Date()
          }).where(eq39(users.id, user.id));
          if (userCache[user.id]) {
            userCache[user.id].user = {
              ...userCache[user.id].user,
              lastLogin: /* @__PURE__ */ new Date()
            };
          }
          console.log(`Updated last_login for user ${user.id}`);
        } catch (updateError) {
          console.error("Failed to update last_login:", updateError);
        }
        console.log(
          "User logged in, session created:",
          "Authenticated:",
          req.isAuthenticated(),
          "Session ID:",
          req.sessionID
        );
        res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        res.set("X-Login-Timestamp", Date.now().toString());
        return res.json({
          message: "Login successful",
          user,
          timestamp: Date.now(),
          authenticated: req.isAuthenticated(),
          sessionId: req.sessionID
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res) => {
    try {
      if (req.isAuthenticated() && req.user && req.user.id) {
        invalidateUserCache(req.user.id);
        console.log(`Invalidated cache for user ID: ${req.user.id}`);
      }
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: app2.get("env") === "production",
        sameSite: "lax"
      });
      res.json({
        message: "Logout successful",
        success: true,
        timestamp: Date.now()
      });
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.log("Non-critical: Session destruction error:", err);
          }
        });
      }
    } catch (e) {
      console.error("Logout error, but returning success anyway:", e);
      res.status(200).json({
        message: "Logout handled",
        success: true,
        timestamp: Date.now()
      });
    }
  });
  app2.get("/api/user", async (req, res) => {
    if (req.isAuthenticated()) {
      const emulatedUserId = req.emulatedUserId;
      const actualUserId = req.actualUserId;
      const lastLogin = req.user?.lastLogin?.getTime() || Date.now();
      const profileHash = `${req.user?.firstName}-${req.user?.lastName}-${req.user?.phone}`;
      const etag = `"user-${req.user?.id}-${lastLogin}-${profileHash}"`;
      if (req.headers["if-none-match"] === etag) {
        return res.status(304).end();
      }
      const isProduction = app2.get("env") === "production";
      if (emulatedUserId) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      } else if (isProduction) {
        res.set("Cache-Control", "private, max-age=3600, must-revalidate");
      } else {
        res.set("Cache-Control", "private, max-age=60, must-revalidate");
      }
      res.set("ETag", etag);
      if (emulatedUserId) {
        const emulatedUser = await getUserById(emulatedUserId);
        if (emulatedUser) {
          return res.json({
            ...emulatedUser,
            _emulated: true,
            _actualUserId: actualUserId
          });
        }
      }
      return res.json(req.user);
    }
    res.set("Cache-Control", "private, max-age=3600");
    res.set("Expires", new Date(Date.now() + 36e5).toUTCString());
    res.status(401).send("Not logged in");
  });
}
var USER_CACHE_TTL, userCache;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_crypto();
    init_emulationService();
    init_emailService();
    USER_CACHE_TTL = 3e5;
    userCache = {};
  }
});

// server/routes/revenue-forecast.ts
var revenue_forecast_exports = {};
__export(revenue_forecast_exports, {
  getRevenueForecastReport: () => getRevenueForecastReport
});
import { sql as sql17 } from "drizzle-orm";
async function getRevenueForecastReport(req, res) {
  try {
    const {
      startDate,
      endDate,
      eventId
    } = req.query;
    const startDateObj = startDate ? new Date(startDate) : new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
    const endDateObj = endDate ? new Date(endDate) : new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth() + 1, 0);
    const eventFilter = eventId ? sql17` AND t.event_id = ${eventId}` : sql17``;
    const capturedQuery = sql17`
      SELECT 
        COUNT(*) as captured_count,
        SUM(pt.amount) as captured_amount,
        SUM(ROUND(pt.amount * 0.029 + 30)) as estimated_stripe_fees,
        e.id as event_id,
        e.name as event_name,
        COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as pending_approval_count,
        COUNT(CASE WHEN t.payment_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN t.payment_status = 'rejected' THEN 1 END) as rejected_count
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
        AND pt.transaction_type = 'registration_payment'
        AND pt.status = 'succeeded'
        ${eventFilter}
      GROUP BY e.id, e.name
      ORDER BY e.name
    `;
    const pendingQuery = sql17`
      SELECT 
        COUNT(*) as pending_registrations,
        SUM(t.total_amount) as potential_revenue,
        e.id as event_id,
        e.name as event_name,
        COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as awaiting_approval_count,
        SUM(CASE WHEN t.payment_status = 'pending' THEN t.total_amount ELSE 0 END) as awaiting_approval_amount
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.created_at::timestamp BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
        AND (t.stripe_customer_id IS NULL OR t.setup_intent_id IS NULL)
        AND t.total_amount > 0
        ${eventFilter}
      GROUP BY e.id, e.name
      ORDER BY e.name
    `;
    const summaryQuery = sql17`
      WITH captured_summary AS (
        SELECT 
          COUNT(*) as total_captured,
          SUM(pt.amount) as total_captured_amount,
          COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as pending_charges,
          SUM(CASE WHEN t.payment_status = 'pending' THEN pt.amount ELSE 0 END) as pending_charge_amount
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
          AND pt.transaction_type = 'registration_payment'
          AND pt.status = 'succeeded'
          ${eventFilter}
      ),
      potential_summary AS (
        SELECT 
          COUNT(*) as potential_registrations,
          SUM(t.total_amount) as potential_amount,
          COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as teams_awaiting_approval,
          SUM(CASE WHEN t.payment_status = 'pending' THEN t.total_amount ELSE 0 END) as amount_awaiting_approval
        FROM teams t
        WHERE t.created_at::timestamp BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
          AND (t.stripe_customer_id IS NULL OR t.setup_intent_id IS NULL)
          AND t.total_amount > 0
          ${eventFilter}
      )
      SELECT 
        cs.*,
        ps.potential_registrations,
        ps.potential_amount,
        (cs.total_captured_amount + COALESCE(ps.potential_amount, 0)) as forecasted_total
      FROM captured_summary cs
      CROSS JOIN potential_summary ps
    `;
    const [capturedResults, pendingResults, summaryResults] = await Promise.all([
      db.execute(capturedQuery),
      db.execute(pendingQuery),
      db.execute(summaryQuery)
    ]);
    const capturedByEvent = capturedResults.map((row) => ({
      eventId: row.event_id,
      eventName: row.event_name,
      capturedCount: parseInt(row.captured_count) || 0,
      capturedAmount: parseInt(row.captured_amount) || 0,
      estimatedStripeFees: parseInt(row.estimated_stripe_fees) || 0,
      pendingApprovalCount: parseInt(row.pending_approval_count) || 0,
      approvedCount: parseInt(row.approved_count) || 0,
      rejectedCount: parseInt(row.rejected_count) || 0,
      netCapturedAmount: (parseInt(row.captured_amount) || 0) - (parseInt(row.estimated_stripe_fees) || 0)
    }));
    const pendingByEvent = pendingResults.map((row) => ({
      eventId: row.event_id,
      eventName: row.event_name,
      pendingRegistrations: parseInt(row.pending_registrations) || 0,
      potentialRevenue: parseInt(row.potential_revenue) || 0,
      estimatedStripeFees: Math.round((parseInt(row.potential_revenue) || 0) * 0.029 + 30),
      netPotentialRevenue: (parseInt(row.potential_revenue) || 0) - Math.round((parseInt(row.potential_revenue) || 0) * 0.029 + 30)
    }));
    const summary = summaryResults[0] ? {
      totalCaptured: parseInt(summaryResults[0].total_captured) || 0,
      totalCapturedAmount: parseInt(summaryResults[0].total_captured_amount) || 0,
      pendingCharges: parseInt(summaryResults[0].pending_charges) || 0,
      pendingChargeAmount: parseInt(summaryResults[0].pending_charge_amount) || 0,
      potentialRegistrations: parseInt(summaryResults[0].potential_registrations) || 0,
      potentialAmount: parseInt(summaryResults[0].potential_amount) || 0,
      forecastedTotal: parseInt(summaryResults[0].forecasted_total) || 0,
      estimatedTotalFees: Math.round((parseInt(summaryResults[0].forecasted_total) || 0) * 0.029 + 30),
      forecastedNetRevenue: (parseInt(summaryResults[0].forecasted_total) || 0) - Math.round((parseInt(summaryResults[0].forecasted_total) || 0) * 0.029 + 30)
    } : {
      totalCaptured: 0,
      totalCapturedAmount: 0,
      pendingCharges: 0,
      pendingChargeAmount: 0,
      potentialRegistrations: 0,
      potentialAmount: 0,
      forecastedTotal: 0,
      estimatedTotalFees: 0,
      forecastedNetRevenue: 0
    };
    return res.json({
      success: true,
      summary,
      capturedByEvent,
      pendingByEvent,
      filters: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        eventId: eventId || null
      }
    });
  } catch (error) {
    console.error("Error fetching revenue forecast report:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    });
  }
}
var init_revenue_forecast = __esm({
  "server/routes/revenue-forecast.ts"() {
    "use strict";
    init_db();
  }
});

// server/routes/test-payment.js
var test_payment_exports = {};
__export(test_payment_exports, {
  createTestPaymentIntent: () => createTestPaymentIntent2,
  simulatePaymentWebhook: () => simulatePaymentWebhook
});
var createTestPaymentIntent2, simulatePaymentWebhook;
var init_test_payment = __esm({
  "server/routes/test-payment.js"() {
    "use strict";
    init_stripeService();
    createTestPaymentIntent2 = async (req, res) => {
      try {
        const { amount, teamId, metadata } = req.body;
        if (!amount || !teamId) {
          return res.status(400).json({ error: "Amount and teamId are required" });
        }
        const result = await createTestPaymentIntent(amount, teamId, metadata);
        res.json(result);
      } catch (error) {
        console.error("Error creating test payment intent:", error);
        res.status(500).json({ error: error.message });
      }
    };
    simulatePaymentWebhook = async (req, res) => {
      try {
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) {
          return res.status(400).json({ error: "Payment intent ID is required" });
        }
        await handlePaymentSuccess({
          id: paymentIntentId,
          metadata: {
            teamId: req.body.teamId || "1"
            // Default to team ID 1 if not provided
          }
        });
        res.json({ success: true, message: "Simulated payment success webhook" });
      } catch (error) {
        console.error("Error simulating payment webhook:", error);
        res.status(500).json({ error: error.message });
      }
    };
  }
});

// server/routes/test-event-filtering.ts
var test_event_filtering_exports = {};
__export(test_event_filtering_exports, {
  testFinanceAdminEventFiltering: () => testFinanceAdminEventFiltering
});
import { eq as eq40 } from "drizzle-orm";
import { sql as sql18 } from "drizzle-orm/sql";
var testFinanceAdminEventFiltering;
var init_test_event_filtering = __esm({
  "server/routes/test-event-filtering.ts"() {
    "use strict";
    init_db();
    init_schema();
    testFinanceAdminEventFiltering = async (req, res) => {
      try {
        const userId = 73;
        const user = await db.query.users.findFirst({
          where: eq40(users.id, userId)
        });
        if (!user) {
          return res.status(404).json({ error: "Finance admin user not found" });
        }
        const userRoles = await db.select({
          roleName: roles.name
        }).from(adminRoles).innerJoin(roles, eq40(adminRoles.roleId, roles.id)).where(eq40(adminRoles.userId, userId));
        const isSuperAdmin = userRoles.some((role) => role.roleName === "super_admin");
        const userEventIds = await db.select({
          eventId: eventAdministrators.eventId
        }).from(eventAdministrators).where(eq40(eventAdministrators.userId, userId)).then((results) => results.map((r) => r.eventId));
        const allEvents = await db.select().from(events);
        let eventsQuery = db.select({
          event: events,
          applicationCount: sql18`count(distinct ${teams.id})`.mapWith(Number),
          teamCount: sql18`count(${teams.id})`.mapWith(Number)
        }).from(events).leftJoin(teams, eq40(events.id, teams.eventId));
        if (!isSuperAdmin && userEventIds.length > 0) {
          eventsQuery = eventsQuery.where(
            sql18`${events.id} IN (${sql18.join(userEventIds.map((id) => sql18`${id}`), sql18`, `)})`
          );
        } else if (!isSuperAdmin && userEventIds.length === 0) {
          return res.json({
            user: {
              id: user.id,
              email: user.email,
              roles: userRoles.map((r) => r.roleName)
            },
            isSuperAdmin,
            assignedEventIds: userEventIds,
            totalEvents: allEvents.length,
            visibleEvents: []
          });
        }
        const eventsList = await eventsQuery.groupBy(events.id).orderBy(events.startDate);
        const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
          ...event,
          applicationCount,
          teamCount
        }));
        return res.json({
          user: {
            id: user.id,
            email: user.email,
            roles: userRoles.map((r) => r.roleName)
          },
          isSuperAdmin,
          assignedEventIds: userEventIds,
          totalEvents: allEvents.length,
          visibleEvents: formattedEvents
        });
      } catch (error) {
        console.error("Error in test endpoint:", error);
        return res.status(500).json({ error: "Test failed", details: String(error) });
      }
    };
  }
});

// server/services/openai-service.ts
var openai_service_exports = {};
__export(openai_service_exports, {
  SoccerSchedulerAI: () => SoccerSchedulerAI
});
import OpenAI2 from "openai";
import { eq as eq41, and as and23, inArray as inArray12 } from "drizzle-orm";
var openai2, MODEL, SoccerSchedulerAI;
var init_openai_service = __esm({
  "server/services/openai-service.ts"() {
    "use strict";
    init_db();
    init_schema();
    openai2 = new OpenAI2({ apiKey: process.env.OPENAI_API_KEY });
    MODEL = "gpt-4o";
    SoccerSchedulerAI = class {
      /**
       * Utility method to convert a time string (e.g. "08:00") to a proper Date object
       * on the same day as the reference date
       * @param referenceDate - The reference date to use for year/month/day
       * @param timeString - The time string in format "HH:MM"
       * @returns A Date object with the same day as referenceDate but time from timeString
       */
      static getTimeFromString(referenceDate, timeString) {
        const [hours, minutes] = timeString.split(":").map(Number);
        const result = new Date(referenceDate);
        result.setHours(hours, minutes, 0, 0);
        return result;
      }
      /**
       * Generates an optimal schedule for a soccer tournament
       * @param eventId - The ID of the event
       * @param constraints - Scheduling constraints
       * @returns The generated schedule and any detected conflicts
       */
      static async generateSchedule(eventId, constraints) {
        console.log(`Starting schedule generation for event ID: ${eventId}`);
        console.log(`Constraints: ${JSON.stringify(constraints)}`);
        if (constraints.previewMode) {
          console.log("Preview mode enabled, generating sample games only");
          return this.generateSchedulePreview(eventId, constraints);
        }
        try {
          console.log("Fetching event data...");
          const eventData = await this.getEventData(eventId);
          console.log("Event data fetched successfully");
          console.log("Fetching teams data...");
          const teamsData = await this.getTeamsData(eventId, constraints.selectedAgeGroups, constraints.selectedBrackets);
          console.log(`Teams data fetched successfully. Found ${teamsData.length} teams.`);
          if (teamsData.length < 2) {
            console.log(`Not enough teams (${teamsData.length}) to generate a schedule`);
            throw new Error(`Not enough teams to generate a schedule. Found only ${teamsData.length} approved teams.`);
          }
          console.log("Generating scheduling prompt...");
          const prompt = this.generateSchedulingPrompt(eventData, teamsData, constraints);
          console.log("Prompt generated successfully");
          try {
            console.log("Making OpenAI API call...");
            const scheduleResponse = await openai2.chat.completions.create({
              model: MODEL,
              messages: [
                {
                  role: "system",
                  content: "You are an advanced sports tournament scheduling assistant specializing in soccer tournaments. You create optimal game schedules while respecting all constraints."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              response_format: { type: "json_object" },
              max_tokens: 4e3,
              temperature: 0.2
              // Lower temperature for more consistent results
            });
            console.log("OpenAI API response received");
            if (!scheduleResponse.choices || scheduleResponse.choices.length === 0) {
              throw new Error("OpenAI API returned empty response");
            }
            console.log("Parsing API response...");
            const responseContent = scheduleResponse.choices[0].message.content;
            if (!responseContent) {
              throw new Error("OpenAI API returned empty content");
            }
            let scheduleResult;
            try {
              scheduleResult = JSON.parse(responseContent);
            } catch (parseError) {
              console.error("Failed to parse OpenAI response:", parseError);
              console.error("Raw response:", responseContent);
              throw new Error("Failed to parse OpenAI response as JSON");
            }
            if (!scheduleResult.games || !Array.isArray(scheduleResult.games)) {
              console.error("Unexpected response format:", scheduleResult);
              throw new Error("OpenAI response missing expected 'games' array");
            }
            console.log(`Schedule parsed successfully with ${scheduleResult.games.length} games`);
            console.log("Detecting potential schedule conflicts...");
            const conflicts = this.detectScheduleConflicts(scheduleResult.games, teamsData, eventData);
            console.log(`Detected ${conflicts.length} potential conflicts`);
            console.log("Returning schedule data");
            return {
              schedule: scheduleResult.games,
              qualityScore: scheduleResult.qualityScore || 85,
              conflicts,
              bracketSchedules: scheduleResult.bracketSchedules || []
            };
          } catch (openaiError) {
            console.error("OpenAI API call failed:", openaiError);
            const isRateLimitError = openaiError.status === 429 || openaiError.error && (openaiError.error.type === "insufficient_quota" || openaiError.error.type === "rate_limit_exceeded");
            if (isRateLimitError) {
              throw new Error("OpenAI API rate limit exceeded or insufficient quota. Please try again later or check your API usage limits.");
            }
            if (openaiError.error && openaiError.error.type === "invalid_request_error") {
              throw new Error(`OpenAI API invalid request error: ${openaiError.message}`);
            }
            if (openaiError.error && openaiError.error.type === "authentication_error") {
              throw new Error("OpenAI API authentication error. Please check your API key.");
            }
            throw new Error(`OpenAI API call failed: ${openaiError.message}`);
          }
        } catch (error) {
          console.error("Error generating AI schedule:", error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Failed to generate AI schedule");
        }
      }
      /**
       * Optimizes an existing schedule to resolve conflicts
       * @param eventId - The ID of the event
       * @param options - Optimization options
       * @returns The optimized schedule
       */
      /**
       * Generates a preview of an AI schedule for the tournament with only a sample of games
       * @param eventId - The ID of the event
       * @param constraints - Scheduling constraints including age groups and brackets
       * @returns A preview of 5 games from the potential schedule with quality score and conflicts
       */
      static async generateSchedulePreview(eventId, constraints) {
        console.log(`Starting schedule preview generation for event ID: ${eventId}`);
        console.log(`Preview constraints: ${JSON.stringify(constraints)}`);
        try {
          console.log("Fetching event data for preview...");
          const eventData = await this.getEventData(eventId);
          console.log("Event data fetched successfully");
          console.log("Fetching teams data for preview...");
          const teamsData = await this.getTeamsData(eventId, constraints.selectedAgeGroups, constraints.selectedBrackets);
          console.log(`Teams data fetched successfully. Found ${teamsData.length} teams.`);
          if (teamsData.length < 2) {
            console.log(`Not enough teams (${teamsData.length}) to generate a schedule preview`);
            throw new Error(`Not enough teams to generate a schedule preview. Found only ${teamsData.length} approved teams.`);
          }
          console.log("Generating scheduling preview prompt...");
          const prompt = this.generateSchedulingPreviewPrompt(eventData, teamsData, constraints);
          console.log("Preview prompt generated successfully");
          try {
            console.log("Making OpenAI API call for preview...");
            const previewResponse = await openai2.chat.completions.create({
              model: MODEL,
              messages: [
                {
                  role: "system",
                  content: "You are an advanced sports tournament scheduling assistant. Generate a small sample of 5 representative games that would appear in a complete schedule, following all given constraints."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              response_format: { type: "json_object" },
              max_tokens: 2e3,
              temperature: 0.2
              // Lower temperature for more consistent results
            });
            console.log("OpenAI API preview response received");
            if (!previewResponse.choices || previewResponse.choices.length === 0) {
              throw new Error("OpenAI API returned empty preview response");
            }
            console.log("Parsing preview API response...");
            const responseContent = previewResponse.choices[0].message.content;
            if (!responseContent) {
              throw new Error("OpenAI API returned empty content");
            }
            let scheduleData;
            try {
              scheduleData = JSON.parse(responseContent);
            } catch (e) {
              console.error("Error parsing OpenAI response JSON:", e);
              throw new Error("Failed to parse schedule response from AI");
            }
            const previewGames = scheduleData.games || [];
            const qualityScore = scheduleData.qualityScore || 85;
            const conflicts = scheduleData.conflicts || [];
            console.log(`Retrieved ${previewGames.length} preview games from API response`);
            return {
              schedule: previewGames.slice(0, 5),
              // Ensure we return no more than 5 games for preview
              qualityScore,
              conflicts,
              previewMode: true
            };
          } catch (error) {
            console.error("Error during OpenAI API call for preview:", error);
            throw new Error(`Failed to generate schedule preview: ${error.message}`);
          }
        } catch (error) {
          console.error("Error generating schedule preview:", error);
          throw error;
        }
      }
      /**
       * Generates a prompt specifically for preview scheduling with OpenAI
       */
      static generateSchedulingPreviewPrompt(eventData, teamsData, constraints) {
        return `
    Create a preview of 5 representative games for a soccer tournament schedule with the following parameters:
    
    EVENT INFORMATION:
    - Name: ${eventData.name}
    - Date range: ${eventData.startDate} to ${eventData.endDate}
    - Available fields: ${eventData.fields.length}
    
    TEAMS:
    ${teamsData.map((team) => `- ID: ${team.id}, Name: ${team.name}, Bracket: ${team.bracket || "Unknown"}, Coach: ${team.coach || "Unknown"}`).join("\n")}
    
    CONSTRAINTS:
    - Maximum games per day for a team: ${constraints.maxGamesPerDay || 3}
    - Game duration: ${constraints.minutesPerGame || 60} minutes
    - Break between games: ${constraints.breakBetweenGames || 15} minutes
    - Minimum rest period for teams: ${constraints.minRestPeriod || 120} minutes
    - Resolve coach conflicts: ${constraints.resolveCoachConflicts ? "Yes" : "No"}
    - Optimize field usage: ${constraints.optimizeFieldUsage ? "Yes" : "No"}
    - Tournament format: ${constraints.tournamentFormat || "round_robin_knockout"}
    
    Please generate ONLY 5 sample games that would be part of the full schedule. For each game, include:
    1. Game ID
    2. Home team
    3. Away team
    4. Start time and date
    5. End time and date
    6. Field assignment
    7. Bracket and round information

    Your response should be a valid JSON object with this structure:
    {
      "games": [
        {
          "id": "game_1",
          "homeTeam": { "id": "101", "name": "Team A", "coach": "Coach Name" },
          "awayTeam": { "id": "102", "name": "Team B", "coach": "Coach Name" },
          "startTime": "2025-05-01T09:00:00Z",
          "endTime": "2025-05-01T10:00:00Z",
          "field": { "id": 1, "name": "Field 1" },
          "bracket": "U10 Boys",
          "round": "Group Stage"
        },
        ... (4 more games)
      ],
      "qualityScore": 85,
      "conflicts": [
        {
          "type": "rest_period",
          "description": "Team A has insufficient rest between Game 1 and Game 3",
          "severity": "medium",
          "affectedGames": ["game_1", "game_3"]
        }
      ]
    }
    `;
      }
      static async optimizeSchedule(eventId, options) {
        console.log(`Starting schedule optimization for event ID: ${eventId}`);
        console.log(`Options: ${JSON.stringify(options)}`);
        try {
          console.log("Fetching current schedule...");
          const existingSchedule = await this.getCurrentSchedule(eventId);
          console.log(`Current schedule fetched with ${existingSchedule.length} games`);
          console.log("Fetching teams data...");
          const teamsData = await this.getTeamsData(eventId, options.selectedAgeGroups, options.selectedBrackets);
          console.log(`Teams data fetched successfully. Found ${teamsData.length} teams.`);
          console.log("Fetching event data...");
          const eventData = await this.getEventData(eventId);
          console.log("Event data fetched successfully");
          console.log("Generating optimization prompt...");
          const prompt = this.generateOptimizationPrompt(existingSchedule, teamsData, eventData, options);
          console.log("Prompt generated successfully");
          try {
            console.log("Making OpenAI API call for schedule optimization...");
            const optimizationResponse = await openai2.chat.completions.create({
              model: MODEL,
              messages: [
                {
                  role: "system",
                  content: "You are an advanced sports tournament scheduling assistant specializing in soccer tournaments. You optimize existing game schedules to resolve conflicts while making minimal changes."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              response_format: { type: "json_object" },
              max_tokens: 4e3,
              temperature: 0.2
            });
            console.log("OpenAI API response received for optimization");
            if (!optimizationResponse.choices || optimizationResponse.choices.length === 0) {
              throw new Error("OpenAI API returned empty response");
            }
            console.log("Parsing API response...");
            const responseContent = optimizationResponse.choices[0].message.content;
            if (!responseContent) {
              throw new Error("OpenAI API returned empty content");
            }
            let optimizedResult;
            try {
              optimizedResult = JSON.parse(responseContent);
            } catch (parseError) {
              console.error("Failed to parse OpenAI response:", parseError);
              console.error("Raw response:", responseContent);
              throw new Error("Failed to parse OpenAI optimization response as JSON");
            }
            if (!optimizedResult.games || !Array.isArray(optimizedResult.games)) {
              console.error("Unexpected response format:", optimizedResult);
              throw new Error("OpenAI response missing expected 'games' array");
            }
            console.log(`Optimization parsed successfully with ${optimizedResult.games.length} games`);
            console.log("Detecting potential remaining conflicts...");
            const remainingConflicts = this.detectScheduleConflicts(optimizedResult.games, teamsData, eventData);
            console.log(`Detected ${remainingConflicts.length} potential conflicts after optimization`);
            console.log("Returning optimized schedule data");
            return {
              schedule: optimizedResult.games,
              qualityScore: optimizedResult.qualityScore || 95,
              conflicts: remainingConflicts,
              changesApplied: optimizedResult.changesApplied || []
            };
          } catch (openaiError) {
            console.error("OpenAI API call failed:", openaiError);
            const isRateLimitError = openaiError.status === 429 || openaiError.error && (openaiError.error.type === "insufficient_quota" || openaiError.error.type === "rate_limit_exceeded");
            if (isRateLimitError) {
              throw new Error("OpenAI API rate limit exceeded or insufficient quota. Please try again later or check your API usage limits.");
            }
            if (openaiError.error && openaiError.error.type === "invalid_request_error") {
              throw new Error(`OpenAI API invalid request error: ${openaiError.message}`);
            }
            if (openaiError.error && openaiError.error.type === "authentication_error") {
              throw new Error("OpenAI API authentication error. Please check your API key.");
            }
            throw new Error(`OpenAI API call failed for optimization: ${openaiError.message}`);
          }
        } catch (error) {
          console.error("Error optimizing schedule:", error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Failed to optimize schedule");
        }
      }
      /**
       * Suggests bracket assignments for teams without assigned brackets
       * @param eventId - The ID of the event
       * @returns Suggested bracket assignments for teams
       */
      static async suggestBracketAssignments(eventId) {
        try {
          const teamsWithoutBrackets = await this.getTeamsWithoutBrackets(eventId);
          if (teamsWithoutBrackets.length === 0) {
            console.log("No teams without brackets found for event " + eventId);
            return {
              suggestions: [],
              source: "fallback",
              message: "All teams already have bracket assignments or there are no approved teams without brackets."
            };
          }
          const availableBrackets = await this.getAvailableBrackets(eventId);
          if (availableBrackets.length === 0) {
            console.log("No available brackets found for event " + eventId);
            return {
              suggestions: [],
              source: "fallback",
              message: "No brackets found for this event. Please create brackets first."
            };
          }
          try {
            const prompt = this.generateBracketAssignmentPrompt(teamsWithoutBrackets, availableBrackets);
            const bracketResponse = await openai2.chat.completions.create({
              model: MODEL,
              messages: [
                {
                  role: "system",
                  content: "You are an advanced sports tournament assistant specializing in soccer team classifications. You assign teams to appropriate brackets based on their attributes."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              response_format: { type: "json_object" },
              max_tokens: 2e3,
              temperature: 0.3
            });
            const suggestions = JSON.parse(bracketResponse.choices[0].message.content);
            return {
              suggestions: suggestions.bracketAssignments || [],
              source: "ai"
            };
          } catch (openaiError) {
            console.error("OpenAI API error:", openaiError);
            const isRateLimitError = openaiError.status === 429 || openaiError.error && (openaiError.error.type === "insufficient_quota" || openaiError.error.type === "rate_limit_exceeded");
            if (isRateLimitError) {
              console.log("Rate limit or quota exceeded, using fallback method for bracket assignment");
              return this.generateFallbackBracketSuggestions(teamsWithoutBrackets, availableBrackets);
            }
            throw openaiError;
          }
        } catch (error) {
          console.error("Error suggesting bracket assignments:", error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Failed to suggest bracket assignments");
        }
      }
      /**
       * Generates fallback bracket suggestions when OpenAI API is unavailable
       * Uses simple heuristics based on age group, birth year, etc.
       * @param teams - Teams without brackets
       * @param brackets - Available brackets
       * @returns Suggested bracket assignments
       */
      static generateFallbackBracketSuggestions(teams3, brackets) {
        const suggestions = [];
        const bracketsByAgeGroup = brackets.reduce((acc, bracket) => {
          const ageGroup = bracket.ageGroup || "";
          if (!acc[ageGroup]) {
            acc[ageGroup] = [];
          }
          acc[ageGroup].push(bracket);
          return acc;
        }, {});
        for (const team of teams3) {
          const teamAgeGroup = team.ageGroup || "";
          const matchingBrackets = bracketsByAgeGroup[teamAgeGroup] || [];
          if (matchingBrackets.length > 0) {
            matchingBrackets.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            suggestions.push({
              teamId: team.id,
              teamName: team.name,
              suggestedBracketId: matchingBrackets[0].id,
              suggestedBracketName: matchingBrackets[0].name,
              confidence: 0.7,
              // Lower confidence since this is a fallback method
              reasoning: "Based on matching age group (fallback method)"
            });
          }
        }
        return {
          suggestions,
          source: "fallback"
        };
      }
      /**
       * Detects conflicts in a schedule
       * @param scheduledGames - The scheduled games
       * @param teamsData - Team data including coaches
       * @returns Array of detected conflicts
       */
      static detectScheduleConflicts(scheduledGames, teamsData, eventData) {
        const conflicts = [];
        const coachSchedules = /* @__PURE__ */ new Map();
        const teamSchedules = /* @__PURE__ */ new Map();
        const fieldUsage = /* @__PURE__ */ new Map();
        for (const game of scheduledGames) {
          const fieldKey = `${game.field}-${game.startTime}`;
          if (!fieldUsage.has(fieldKey)) {
            fieldUsage.set(fieldKey, []);
          }
          fieldUsage.get(fieldKey)?.push(game);
          if (game.homeTeam?.id) {
            if (!teamSchedules.has(game.homeTeam.id)) {
              teamSchedules.set(game.homeTeam.id, []);
            }
            teamSchedules.get(game.homeTeam.id)?.push(game);
          }
          if (game.awayTeam?.id) {
            if (!teamSchedules.has(game.awayTeam.id)) {
              teamSchedules.set(game.awayTeam.id, []);
            }
            teamSchedules.get(game.awayTeam.id)?.push(game);
          }
          if (game.homeTeam?.coach) {
            if (!coachSchedules.has(game.homeTeam.coach)) {
              coachSchedules.set(game.homeTeam.coach, []);
            }
            coachSchedules.get(game.homeTeam.coach)?.push(game);
          }
          if (game.awayTeam?.coach) {
            if (!coachSchedules.has(game.awayTeam.coach)) {
              coachSchedules.set(game.awayTeam.coach, []);
            }
            coachSchedules.get(game.awayTeam.coach)?.push(game);
          }
          if (eventData && eventData.fieldsByName) {
            const fieldInfo = eventData.fieldsByName[game.field];
            if (fieldInfo) {
              const gameStart = new Date(game.startTime);
              const gameEnd = new Date(game.endTime);
              const fieldOpenTime = this.getTimeFromString(gameStart, fieldInfo.openTime);
              const fieldCloseTime = this.getTimeFromString(gameStart, fieldInfo.closeTime);
              if (gameStart < fieldOpenTime || gameEnd > fieldCloseTime) {
                conflicts.push({
                  type: "field_hours",
                  description: `Game scheduled on field ${game.field} outside of operating hours (${fieldInfo.openTime} to ${fieldInfo.closeTime})`,
                  severity: "high",
                  affectedGames: [game.id]
                });
              }
              if (fieldInfo.complexName && !fieldInfo.complexIsOpen) {
                conflicts.push({
                  type: "complex_closed",
                  description: `Game scheduled on field ${game.field} where the complex (${fieldInfo.complexName}) is closed`,
                  severity: "critical",
                  affectedGames: [game.id]
                });
              }
            }
          }
        }
        for (const [key, fieldGames] of fieldUsage.entries()) {
          if (fieldGames.length > 1) {
            conflicts.push({
              type: "field_overbooked",
              description: `Field ${fieldGames[0].field} has ${fieldGames.length} games scheduled at ${new Date(fieldGames[0].startTime).toLocaleTimeString()}`,
              severity: "critical",
              affectedGames: fieldGames.map((g) => g.id)
            });
          }
        }
        for (const [coach, coachGames] of coachSchedules.entries()) {
          if (coachGames.length <= 1) continue;
          coachGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          for (let i = 0; i < coachGames.length - 1; i++) {
            const game1 = coachGames[i];
            const game2 = coachGames[i + 1];
            const game1End = new Date(game1.endTime).getTime();
            const game2Start = new Date(game2.startTime).getTime();
            if (game2Start - game1End < 30 * 60 * 1e3) {
              conflicts.push({
                type: "coach_conflict",
                description: `Coach ${coach} has teams playing with less than 30 minutes between games`,
                severity: "high",
                affectedGames: [game1.id, game2.id]
              });
            }
          }
        }
        for (const [teamId, teamGames] of teamSchedules.entries()) {
          if (teamGames.length <= 1) continue;
          teamGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          for (let i = 0; i < teamGames.length - 1; i++) {
            const game1 = teamGames[i];
            const game2 = teamGames[i + 1];
            const game1End = new Date(game1.endTime).getTime();
            const game2Start = new Date(game2.startTime).getTime();
            const minRestMinutes = eventData?.minRestPeriod || 120;
            const minRestPeriod = minRestMinutes * 60 * 1e3;
            if (game2Start - game1End < minRestPeriod) {
              const teamName = game1.homeTeam.id === teamId ? game1.homeTeam.name : game1.awayTeam.name;
              const hours = Math.floor(minRestMinutes / 60);
              const minutes = minRestMinutes % 60;
              const restPeriodText = hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} minute${minutes > 1 ? "s" : ""}` : ""}` : `${minutes} minute${minutes > 1 ? "s" : ""}`;
              conflicts.push({
                type: "rest_period",
                description: `Team ${teamName} has less than ${restPeriodText} between games`,
                severity: "medium",
                affectedGames: [game1.id, game2.id]
              });
            }
          }
        }
        return conflicts;
      }
      /**
       * Gets all event data needed for scheduling
       * @param eventId - The event ID
       * @returns Event data including age groups, fields, etc.
       */
      static async getEventData(eventId) {
        try {
          const eventIdStr = eventId.toString();
          const eventIdNum = Number(eventId);
          const [eventData] = await db.select().from(events).where(eq41(events.id, eventIdNum));
          if (!eventData) {
            throw new Error("Event not found");
          }
          const ageGroupsData = await db.select().from(eventAgeGroups).where(eq41(eventAgeGroups.eventId, eventIdStr));
          const bracketsData = await db.select().from(eventBrackets).where(eq41(eventBrackets.eventId, eventIdStr));
          const eventComplexesData = await db.select().from(eventComplexes).where(eq41(eventComplexes.eventId, eventIdStr));
          const complexIds = eventComplexesData.map((ec) => ec.complexId);
          console.log(`Event ${eventId} has ${complexIds.length} assigned complexes: ${complexIds.join(", ")}`);
          let fieldsData = [];
          if (complexIds.length > 0) {
            fieldsData = await db.select({
              id: fields.id,
              name: fields.name,
              hasLights: fields.hasLights,
              hasParking: fields.hasParking,
              isOpen: fields.isOpen,
              openTime: fields.openTime,
              closeTime: fields.closeTime,
              specialInstructions: fields.specialInstructions,
              complexId: fields.complexId,
              // Select only specific complex fields that exist in the database
              complexName: complexes.name,
              complexOpenTime: complexes.openTime,
              complexCloseTime: complexes.closeTime,
              complexIsOpen: complexes.isOpen
            }).from(fields).leftJoin(complexes, eq41(fields.complexId, complexes.id)).where(
              and23(
                eq41(fields.isOpen, true),
                inArray12(fields.complexId, complexIds)
              )
            );
          } else {
            console.log(`No complexes assigned to event ${eventId}, falling back to all active fields`);
            fieldsData = await db.select({
              id: fields.id,
              name: fields.name,
              hasLights: fields.hasLights,
              hasParking: fields.hasParking,
              isOpen: fields.isOpen,
              openTime: fields.openTime,
              closeTime: fields.closeTime,
              specialInstructions: fields.specialInstructions,
              complexId: fields.complexId,
              // Select only specific complex fields that exist in the database
              complexName: complexes.name,
              complexOpenTime: complexes.openTime,
              complexCloseTime: complexes.closeTime,
              complexIsOpen: complexes.isOpen
            }).from(fields).leftJoin(complexes, eq41(fields.complexId, complexes.id)).where(eq41(fields.isOpen, true));
          }
          console.log(`Found ${fieldsData.length} available fields for event ${eventId}`);
          const timeSlotsData = await db.select().from(gameTimeSlots).where(eq41(gameTimeSlots.eventId, eventIdStr));
          const fieldsByName = {};
          for (const field of fieldsData) {
            fieldsByName[field.name] = field;
          }
          return {
            event: eventData,
            ageGroups: ageGroupsData,
            brackets: bracketsData,
            fields: fieldsData,
            fieldsByName,
            timeSlots: timeSlotsData
          };
        } catch (error) {
          console.error("Error fetching event data:", error);
          throw error;
        }
      }
      /**
       * Gets all teams registered for the event
       * @param eventId - The event ID
       * @returns Teams data
       */
      static async getTeamsData(eventId, selectedAgeGroups, selectedBrackets) {
        try {
          const eventIdStr = eventId.toString();
          const conditions = [
            eq41(teams.eventId, eventIdStr),
            eq41(teams.status, "approved")
          ];
          const teamsData = await db.select().from(teams).where(
            and23(
              eq41(teams.eventId, eventIdStr),
              eq41(teams.status, "approved")
            )
          );
          let filteredTeamsData = [...teamsData];
          if (selectedAgeGroups && selectedAgeGroups.length > 0) {
            console.log(`Filtering teams by age groups: ${selectedAgeGroups.join(", ")}`);
            const ageGroupIds = selectedAgeGroups.map((ag) => parseInt(ag));
            const bracketsForAgeGroups = await db.select().from(eventBrackets).where(
              and23(
                eq41(eventBrackets.eventId, eventIdStr),
                inArray12(eventBrackets.ageGroupId, ageGroupIds)
              )
            );
            const bracketIds = bracketsForAgeGroups.map((b) => b.id);
            console.log(`Found ${bracketIds.length} brackets for selected age groups`);
            if (bracketIds.length > 0) {
              filteredTeamsData = filteredTeamsData.filter(
                (team) => team.bracketId && bracketIds.includes(team.bracketId)
              );
            }
          }
          if (selectedBrackets && selectedBrackets.length > 0) {
            console.log(`Filtering teams by brackets: ${selectedBrackets.join(", ")}`);
            const bracketIds = selectedBrackets.map((b) => parseInt(b));
            filteredTeamsData = filteredTeamsData.filter(
              (team) => team.bracketId && bracketIds.includes(team.bracketId)
            );
          }
          console.log(`After filtering: ${filteredTeamsData.length} teams of ${teamsData.length} total`);
          if (filteredTeamsData.length < 2 && teamsData.length >= 2) {
            console.log(`Too few teams after filtering (${filteredTeamsData.length}), using all teams`);
            return teamsData;
          }
          return filteredTeamsData;
        } catch (error) {
          console.error("Error fetching teams data:", error);
          throw error;
        }
      }
      /**
       * Gets the current schedule for an event
       * @param eventId - The event ID
       * @returns Current schedule data
       */
      static async getCurrentSchedule(eventId) {
        try {
          const eventIdStr = eventId.toString();
          const gamesData = await db.select().from(games).where(eq41(games.eventId, eventIdStr));
          return gamesData;
        } catch (error) {
          console.error("Error fetching current schedule:", error);
          throw error;
        }
      }
      /**
       * Gets teams without assigned brackets
       * @param eventId - The event ID
       * @returns Teams without bracket assignments
       */
      static async getTeamsWithoutBrackets(eventId) {
        try {
          console.log(`Finding teams without brackets for event: ${eventId}`);
          const eventIdStr = eventId.toString();
          const allTeams = await db.select().from(teams).where(
            and23(
              eq41(teams.eventId, eventIdStr),
              eq41(teams.status, "approved")
            )
          );
          console.log(`Total approved teams found: ${allTeams.length}`);
          const teamsWithoutBrackets = allTeams.filter((team) => team.bracketId === null || team.bracketId === void 0);
          console.log(`Teams without bracketId: ${teamsWithoutBrackets.length}`);
          if (teamsWithoutBrackets.length > 0) {
            console.log(`Sample team without bracket: ${JSON.stringify(teamsWithoutBrackets[0])}`);
          }
          return teamsWithoutBrackets;
        } catch (error) {
          console.error("Error fetching teams without brackets:", error);
          throw error;
        }
      }
      /**
       * Gets available brackets for an event
       * @param eventId - The event ID
       * @returns Available brackets
       */
      static async getAvailableBrackets(eventId) {
        try {
          const eventIdStr = eventId.toString();
          const brackets = await db.select().from(eventBrackets).where(eq41(eventBrackets.eventId, eventIdStr));
          return brackets;
        } catch (error) {
          console.error("Error fetching available brackets:", error);
          throw error;
        }
      }
      /**
       * Generates a prompt for OpenAI to create a schedule
       * @param eventData - Event data
       * @param teamsData - Teams data
       * @param constraints - Scheduling constraints
       * @returns The generated prompt
       */
      static generateSchedulingPrompt(eventData, teamsData, constraints) {
        return `
I need you to generate an optimal schedule for a soccer tournament with the following details:

EVENT INFORMATION:
- Name: ${eventData.event.name}
- Start Date: ${eventData.event.startDate}
- End Date: ${eventData.event.endDate}
- Number of Fields: ${eventData.fields.length}
- Available Fields: ${eventData.fields.map((f) => f.name).join(", ")}

FIELD AVAILABILITY CONSTRAINTS:
${eventData.fields.map((f) => `- ${f.name}: Open from ${f.openTime} to ${f.closeTime} ${f.complexName ? `(Complex: ${f.complexName}, Open from ${f.complexOpenTime} to ${f.complexCloseTime})` : ""}`).join("\n")}

TEAMS INFORMATION:
${teamsData.map((team) => `- Team ID: ${team.id}, Name: ${team.name}, Age Group: ${team.ageGroup}, Coach: ${team.coach || "Unknown"}, Bracket: ${team.bracketId || "Not assigned"}`).join("\n")}

SCHEDULING CONSTRAINTS:
- Maximum Games Per Day: ${constraints.maxGamesPerDay || 3}
- Minutes Per Game: ${constraints.minutesPerGame || 60}
- Break Between Games: ${constraints.breakBetweenGames || 15} minutes
- Minimum Rest Period: ${constraints.minRestPeriod || 120} minutes between games for the same team
- Resolve Coach Conflicts: ${constraints.resolveCoachConflicts ? "Yes" : "No"}
- Optimize Field Usage: ${constraints.optimizeFieldUsage ? "Yes" : "No"}
- Tournament Format: ${constraints.tournamentFormat || "round_robin_knockout"}

SCHEDULING INSTRUCTIONS:
1. Schedule games for each bracket separately
2. Avoid scheduling games for teams with the same coach at overlapping times
3. Ensure adequate rest periods between games for each team
4. Teams should play roughly the same number of games
5. Distribute games evenly across all available fields
6. CRITICAL: Start the first games of each day exactly at the opening time of each field or complex
7. CRITICAL: Only schedule games during the operating hours of each field and complex
8. CRITICAL: If a field belongs to a complex, make sure games are only scheduled when both the field AND its complex are open
9. CRITICAL: Utilize the exact time range for each field - start the first games exactly when fields open
10. For tournament formats:
   - Round Robin: Each team plays against every other team in their bracket once
   - Knockout: Teams advance based on wins
   - Round Robin + Knockout: Group stage followed by playoffs

OUTPUT REQUIREMENTS:
Generate a JSON schedule with the following structure:
{
  "games": [
    {
      "id": "1",
      "homeTeam": { "id": 1, "name": "Team A", "coach": "Coach Name" },
      "awayTeam": { "id": 2, "name": "Team B", "coach": "Coach Name" },
      "field": "Field Name",
      "startTime": "ISO timestamp",
      "endTime": "ISO timestamp",
      "bracket": "Bracket Name",
      "round": "Group Stage/Quarterfinal/etc"
    }
  ],
  "qualityScore": 85,
  "bracketSchedules": [
    {
      "bracketId": 1,
      "bracketName": "U10 Elite",
      "format": "round_robin",
      "games": [game references]
    }
  ]
}

Make sure all times are valid ISO timestamp strings and don't schedule games outside the event dates. Include morning and afternoon games, with adequate breaks for lunch.
`;
      }
      /**
       * Generates a prompt for OpenAI to optimize an existing schedule
       * @param existingSchedule - Current schedule
       * @param teamsData - Teams data
       * @param eventData - Event data
       * @param options - Optimization options
       * @returns The generated prompt
       */
      static generateOptimizationPrompt(existingSchedule, teamsData, eventData, options) {
        return `
I need you to optimize an existing soccer tournament schedule to fix conflicts while making minimal changes.

EXISTING SCHEDULE:
${JSON.stringify(existingSchedule, null, 2)}

TEAMS INFORMATION:
${teamsData.map((team) => `- Team ID: ${team.id}, Name: ${team.name}, Age Group: ${team.ageGroup}, Coach: ${team.coach || "Unknown"}, Bracket: ${team.bracketId || "Not assigned"}`).join("\n")}

EVENT INFORMATION:
- Name: ${eventData.event.name}
- Start Date: ${eventData.event.startDate}
- End Date: ${eventData.event.endDate}
- Available Fields: ${eventData.fields.map((f) => f.name).join(", ")}

FIELD AVAILABILITY CONSTRAINTS:
${eventData.fields.map((f) => `- ${f.name}: Open from ${f.openTime} to ${f.closeTime} ${f.complexName ? `(Complex: ${f.complexName}, Open from ${f.complexOpenTime} to ${f.complexCloseTime})` : ""}`).join("\n")}

OPTIMIZATION PRIORITIES:
- Resolve Coach Conflicts: ${options.resolveCoachConflicts ? "Yes" : "No"} (The same coach should not have overlapping games)
- Optimize Field Usage: ${options.optimizeFieldUsage ? "Yes" : "No"} (Distribute games evenly across fields)
- Minimize Travel: ${options.minimizeTravel ? "Yes" : "No"} (Keep a team's games on the same or nearby fields when possible)
- IMPORTANT: Only schedule games during the operating hours of each field
- IMPORTANT: Do not schedule games on fields where their complex is closed

OUTPUT REQUIREMENTS:
Generate a JSON with the optimized schedule with the following structure:
{
  "games": [
    {
      "id": "game_id",
      "homeTeam": { "id": 1, "name": "Team A", "coach": "Coach Name" },
      "awayTeam": { "id": 2, "name": "Team B", "coach": "Coach Name" },
      "field": "Field Name",
      "startTime": "ISO timestamp",
      "endTime": "ISO timestamp",
      "bracket": "Bracket Name",
      "round": "Group Stage/Quarterfinal/etc"
    }
  ],
  "qualityScore": 95,
  "changesApplied": [
    { "gameId": "game_id", "type": "field_change", "from": "Field A", "to": "Field B" },
    { "gameId": "game_id", "type": "time_change", "from": "ISO timestamp", "to": "ISO timestamp" }
  ]
}

Make only necessary changes to fix conflicts. Prioritize changing game times or fields over changing team matchups.
`;
      }
      /**
       * Generates a prompt for OpenAI to suggest bracket assignments
       * @param teamsWithoutBrackets - Teams without brackets
       * @param availableBrackets - Available brackets
       * @returns The generated prompt
       */
      static generateBracketAssignmentPrompt(teamsWithoutBrackets, availableBrackets) {
        return `
I need you to suggest appropriate bracket assignments for soccer teams that don't have brackets assigned.

TEAMS WITHOUT BRACKET ASSIGNMENTS:
${teamsWithoutBrackets.map((team) => `- Team ID: ${team.id}, Name: ${team.name}, Age Group: ${team.ageGroup}, Division Code: ${team.divisionCode || "N/A"}`).join("\n")}

AVAILABLE BRACKETS:
${availableBrackets.map((bracket) => `- Bracket ID: ${bracket.id}, Name: ${bracket.name}, Age Group ID: ${bracket.ageGroupId}, Description: ${bracket.description || "N/A"}`).join("\n")}

ASSIGNMENT GUIDELINES:
1. Match teams with brackets appropriate for their age group
2. Use division codes to determine competitive level when available
3. Teams from the same club/organization with similar names should be in the same bracket if possible
4. If a team's age group doesn't match any bracket exactly, suggest the closest appropriate bracket

OUTPUT REQUIREMENTS:
Generate a JSON with suggested bracket assignments:
{
  "bracketAssignments": [
    {
      "teamId": 1,
      "teamName": "Team A",
      "suggestedBracketId": 3,
      "suggestedBracketName": "U10 Elite",
      "confidence": 0.85,
      "reasoning": "Based on division code and age group match"
    }
  ]
}

Provide a confidence score (0-1) and brief reasoning for each suggestion.
`;
      }
    };
  }
});

// server/routes/email-templates.ts
var email_templates_exports = {};
__export(email_templates_exports, {
  createEmailTemplate: () => createEmailTemplate,
  deleteEmailTemplate: () => deleteEmailTemplate,
  getEmailTemplate: () => getEmailTemplate2,
  getEmailTemplates: () => getEmailTemplates,
  previewEmailTemplate: () => previewEmailTemplate,
  updateEmailTemplate: () => updateEmailTemplate
});
import { eq as eq42 } from "drizzle-orm";
async function getEmailTemplates(req, res) {
  try {
    const templates = await db.select().from(emailTemplates2);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ error: "Failed to fetch email templates" });
  }
}
async function getEmailTemplate2(req, res) {
  try {
    const { id } = req.params;
    console.log(`Fetching template with ID: ${id}`);
    const template = await db.select().from(emailTemplates2).where(eq42(emailTemplates2.id, parseInt(id))).then((results) => results[0]);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    console.log(`Found template:`, template);
    res.json(template);
  } catch (error) {
    console.error(`Error fetching email template ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch email template" });
  }
}
async function createEmailTemplate(req, res) {
  try {
    const {
      name,
      description,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive,
      variables,
      providerId
    } = req.body;
    console.log("Creating template with data:", req.body);
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [template] = await db.insert(emailTemplates2).values({
      name,
      description: description || null,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive: isActive === false ? false : true,
      variables: variables || [],
      providerId: providerId ? Number(providerId) : null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating email template:", error);
    res.status(500).json({ error: "Failed to create email template" });
  }
}
async function updateEmailTemplate(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive,
      variables,
      providerId
    } = req.body;
    console.log("Updating template with data:", req.body);
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [template] = await db.update(emailTemplates2).set({
      name,
      description: description || null,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive: isActive === false ? false : true,
      variables: variables || [],
      providerId: providerId ? Number(providerId) : null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq42(emailTemplates2.id, parseInt(id))).returning();
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json(template);
  } catch (error) {
    console.error("Error updating email template:", error);
    res.status(500).json({ error: "Failed to update email template" });
  }
}
async function previewEmailTemplate(req, res) {
  try {
    console.log("Preview template request method:", req.method);
    console.log("Preview template query:", req.query.template);
    console.log("Preview template body:", req.body?.template);
    let templateData;
    if (req.method === "POST") {
      if (!req.body?.template) {
        console.error("No template data provided in POST body");
        return res.status(400).json({ error: "No template data provided in POST body" });
      }
      try {
        templateData = typeof req.body.template === "string" ? JSON.parse(req.body.template) : req.body.template;
      } catch (e) {
        console.error("Failed to parse template data from POST:", e);
        return res.status(400).json({ error: "Invalid template data format in POST" });
      }
    } else {
      if (!req.query.template) {
        console.error("No template data provided in query");
        return res.status(400).json({ error: "No template data provided for preview" });
      }
      try {
        templateData = JSON.parse(req.query.template);
      } catch (e) {
        console.error("Failed to parse template data from query:", e);
        return res.status(400).json({ error: "Invalid template data format in query" });
      }
    }
    let content = templateData.content || "";
    const defaultValues = {
      firstName: "[Sample First Name]",
      lastName: "[Sample Last Name]",
      email: "[sample@email.com]",
      username: "[Sample Username]",
      resetLink: "[Reset Password Link]",
      token: "[Reset Token]",
      reset_link: "[Reset Password Link]"
    };
    Object.entries(defaultValues).forEach(([variable, sampleValue]) => {
      const regex = new RegExp(`{{${variable}}}`, "g");
      content = content.replace(regex, sampleValue);
    });
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;
    content = content.replace(/src=["'](\.\.\/)*uploads\//g, `src="${baseUrl}/api/uploads/`);
    content = content.replace(/src=["']uploads\//g, `src="${baseUrl}/api/uploads/`);
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Preview: ${templateData.subject || "No Subject"}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .preview-container { max-width: 650px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
        .preview-header { background: #f5f5f5; padding: 15px; border-bottom: 1px solid #ddd; }
        .preview-subject { margin: 0; font-size: 18px; }
        .preview-from { margin: 5px 0 0; font-size: 14px; color: #666; }
        .preview-content { padding: 20px; }
        .preview-footer { background: #f5f5f5; padding: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="preview-container">
        <div class="preview-header">
          <h1 class="preview-subject">${templateData.subject || "No Subject"}</h1>
          <p class="preview-from">From: ${templateData.senderName || "Sender"} &lt;${templateData.senderEmail || "email@example.com"}&gt;</p>
        </div>
        <div class="preview-content">
          ${content}
        </div>
        <div class="preview-footer">
          <p>This is a preview. </p>
          <p>Template Type: ${templateData.type || "Not specified"}</p>
          <p>Active: ${templateData.isActive ? "Yes" : "No"}</p>
        </div>
      </div>
    </body>
    </html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Error previewing email template:", error);
    res.status(500).json({ error: "Failed to preview email template" });
  }
}
async function deleteEmailTemplate(req, res) {
  try {
    const { id } = req.params;
    const [template] = await db.delete(emailTemplates2).where(eq42(emailTemplates2.id, parseInt(id))).returning();
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ error: "Failed to delete email template" });
  }
}
var init_email_templates = __esm({
  "server/routes/email-templates.ts"() {
    "use strict";
    init_db();
    init_emailTemplates();
  }
});

// server/services/sendgridTemplateService.js
import fetch from "node-fetch";
import { eq as eq43, and as and24, isNull as isNull4, ne } from "drizzle-orm";
async function getTemplatesFromSendGrid() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY environment variable is not set");
    }
    const response = await fetch("https://api.sendgrid.com/v3/templates?generations=dynamic", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid API error:", errorText);
      throw new Error(`SendGrid API returned ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return data.templates || [];
  } catch (error) {
    console.error("Error fetching SendGrid templates:", error);
    throw error;
  }
}
async function listEmailTemplatesWithSendGridMapping() {
  try {
    const templates = await db.select().from(emailTemplates2).orderBy(emailTemplates2.name);
    return templates;
  } catch (error) {
    console.error("Error fetching email templates with mappings:", error);
    throw error;
  }
}
async function mapSendGridTemplateToEmailType(templateType, sendgridTemplateId) {
  try {
    const templatesOfType = await db.select().from(emailTemplates2).where(eq43(emailTemplates2.type, templateType));
    if (templatesOfType.length === 0) {
      throw new Error(`No email templates found with type: ${templateType}`);
    }
    const updatePromises = templatesOfType.map(
      (template) => db.update(emailTemplates2).set({
        sendgridTemplateId,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq43(emailTemplates2.id, template.id)).returning()
    );
    const results = await Promise.all(updatePromises);
    return {
      success: true,
      updatedCount: results.length,
      templateType,
      sendgridTemplateId
    };
  } catch (error) {
    console.error("Error mapping SendGrid template:", error);
    throw error;
  }
}
async function testSendGridTemplate(templateId, recipientEmail, testData) {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY environment variable is not set");
    }
    const senderEmail = process.env.DEFAULT_FROM_EMAIL || "support@matchpro.ai";
    const mailData = {
      personalizations: [
        {
          to: [{ email: recipientEmail }],
          dynamic_template_data: testData || {}
        }
      ],
      from: { email: senderEmail, name: "MatchPro.ai" },
      template_id: templateId
    };
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mailData)
    });
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch (e) {
        errorMessage = await response.text();
      }
      throw new Error(`SendGrid API returned ${response.status}: ${errorMessage}`);
    }
    return true;
  } catch (error) {
    console.error("Error sending test email with SendGrid:", error);
    throw error;
  }
}
var init_sendgridTemplateService = __esm({
  "server/services/sendgridTemplateService.js"() {
    "use strict";
    init_db();
    init_emailTemplates();
    init_schema();
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("SENDGRID_API_KEY environment variable is not set. SendGrid template features will be unavailable.");
    }
  }
});

// server/routes/sendgrid-settings.ts
var sendgrid_settings_exports = {};
__export(sendgrid_settings_exports, {
  getEmailTemplatesWithSendGridMapping: () => getEmailTemplatesWithSendGridMapping,
  getSendGridSettings: () => getSendGridSettings,
  getSendGridTemplates: () => getSendGridTemplates,
  testSendGridTemplate: () => testSendGridTemplate2,
  updateSendGridTemplateMapping: () => updateSendGridTemplateMapping
});
import { eq as eq44, and as and25, isNull as isNull5 } from "drizzle-orm";
async function getSendGridSettings(req, res) {
  try {
    console.log("Fetching SendGrid settings...");
    const sendGridProviders = await db.select().from(emailProviderSettings).where(and25(
      eq44(emailProviderSettings.providerType, "sendgrid"),
      eq44(emailProviderSettings.isActive, true)
    ));
    const provider = sendGridProviders.length > 0 ? sendGridProviders.find((p) => p.isDefault) || sendGridProviders[0] : null;
    console.log(`Found ${sendGridProviders.length} SendGrid providers`);
    const templatesWithSendGrid = await db.select({
      id: emailTemplates2.id,
      name: emailTemplates2.name,
      type: emailTemplates2.type,
      isActive: emailTemplates2.isActive,
      sendgridTemplateId: emailTemplates2.sendgridTemplateId
    }).from(emailTemplates2).where(
      eq44(isNull5(emailTemplates2.sendgridTemplateId), false)
    );
    console.log(`Found ${templatesWithSendGrid.length} templates with SendGrid mappings`);
    res.json({
      apiKeySet: !!process.env.SENDGRID_API_KEY,
      apiKeyValid: true,
      // We'll validate this in a separate endpoint if needed
      provider: provider ? {
        id: provider.id,
        name: provider.providerName,
        isDefault: provider.isDefault,
        settings: provider.settings
      } : null,
      templatesWithSendGrid
    });
  } catch (error) {
    console.error("Error fetching SendGrid settings:", error);
    res.status(500).json({ error: "Failed to fetch SendGrid settings" });
  }
}
async function updateSendGridTemplateMapping(req, res) {
  try {
    const { templateType, sendgridTemplateId } = req.body;
    if (!templateType) {
      return res.status(400).json({ error: "Missing template type" });
    }
    const result = await mapSendGridTemplateToEmailType(
      templateType,
      sendgridTemplateId || null
    );
    res.json(result);
  } catch (error) {
    console.error("Error updating SendGrid template mapping:", error);
    res.status(500).json({ error: "Failed to update SendGrid template mapping" });
  }
}
async function getSendGridTemplates(req, res) {
  try {
    console.log("Fetching SendGrid templates...");
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY not found in environment");
      return res.status(500).json({
        error: "SendGrid API key not configured",
        details: "SENDGRID_API_KEY environment variable is missing"
      });
    }
    const templates = await getTemplatesFromSendGrid();
    console.log(`Successfully fetched ${templates.length} SendGrid templates`);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching SendGrid templates:", error);
    res.status(500).json({
      error: "Failed to fetch SendGrid templates",
      details: error.message || "Unknown error occurred"
    });
  }
}
async function testSendGridTemplate2(req, res) {
  try {
    const { templateId, recipientEmail, testData } = req.body;
    if (!templateId) {
      return res.status(400).json({ error: "Missing template ID" });
    }
    if (!recipientEmail) {
      return res.status(400).json({ error: "Missing recipient email" });
    }
    const result = await testSendGridTemplate(
      templateId,
      recipientEmail,
      testData || {}
    );
    if (result) {
      res.json({ success: true, message: "Test email sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send test email" });
    }
  } catch (error) {
    console.error("Error testing SendGrid template:", error);
    res.status(500).json({ error: "Failed to test SendGrid template" });
  }
}
async function getEmailTemplatesWithSendGridMapping(req, res) {
  try {
    const templates = await listEmailTemplatesWithSendGridMapping();
    res.json(templates);
  } catch (error) {
    console.error("Error listing email templates with SendGrid mappings:", error);
    res.status(500).json({ error: "Failed to list email templates with SendGrid mappings" });
  }
}
var init_sendgrid_settings = __esm({
  "server/routes/sendgrid-settings.ts"() {
    "use strict";
    init_db();
    init_emailTemplates();
    init_schema();
    init_sendgridTemplateService();
  }
});

// server/index.ts
import express5 from "express";

// server/routes.ts
import { createServer } from "http";

// server/websocket.ts
init_db();
init_schema();
import { WebSocket, WebSocketServer } from "ws";
function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    host: "0.0.0.0",
    path: "/api/ws",
    verifyClient: ({ req }, done) => {
      if (req.headers["sec-websocket-protocol"] === "vite-hmr") {
        done(false);
        return;
      }
      done(true);
    }
  });
  wss.on("connection", (ws2) => {
    console.log("New chat WebSocket connection established");
    ws2.on("message", async (data) => {
      try {
        const message = JSON.parse(data);
        switch (message.type) {
          case "join":
            ws2.chatRoomId = message.chatRoomId;
            ws2.userId = message.userId;
            broadcastToRoom(wss, message.chatRoomId, {
              type: "system",
              content: `User ${message.userId} joined the chat`,
              userId: message.userId,
              chatRoomId: message.chatRoomId
            });
            break;
          case "message":
            if (!ws2.chatRoomId || !ws2.userId || !message.content) return;
            try {
              const [newMessage] = await db.insert(messages).values({
                chatRoomId: ws2.chatRoomId,
                userId: ws2.userId,
                content: message.content,
                type: "text",
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString()
              }).returning();
              broadcastToRoom(wss, ws2.chatRoomId, {
                type: "message",
                content: message.content,
                userId: ws2.userId,
                chatRoomId: ws2.chatRoomId,
                messageId: newMessage.id
              });
            } catch (error) {
              console.error("Error storing message:", error);
              ws2.send(JSON.stringify({
                type: "error",
                content: "Failed to save message"
              }));
            }
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        ws2.send(JSON.stringify({
          type: "error",
          content: "Failed to process message"
        }));
      }
    });
    ws2.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
    ws2.on("close", () => {
      if (ws2.chatRoomId && ws2.userId) {
        broadcastToRoom(wss, ws2.chatRoomId, {
          type: "system",
          content: `User ${ws2.userId} left the chat`,
          userId: ws2.userId,
          chatRoomId: ws2.chatRoomId
        });
      }
    });
  });
  return wss;
}
function broadcastToRoom(wss, roomId, message) {
  wss.clients.forEach((client) => {
    if (client.chatRoomId === roomId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// server/routes.ts
init_vite();
init_crypto();
init_db();
init_schema();

// server/middleware/auth.ts
var authenticateAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }
  next();
};
var isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }
  if (!req.user?.isAdmin) {
    return res.status(403).send("Not authorized");
  }
  next();
};
var validateAuth = (req, res, next) => {
  console.log(`[Auth Debug] Request headers: ${JSON.stringify(req.headers)}`);
  console.log(`[Auth Debug] isAuthenticated: ${req.isAuthenticated()}`);
  console.log(`[Auth Debug] Session ID: ${req.sessionID}`);
  console.log(`[Auth Debug] Session: ${JSON.stringify(req.session)}`);
  console.log(`[Auth Debug] User: ${JSON.stringify(req.user)}`);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// server/middleware/event-access.ts
init_db();
init_schema();
import { eq, and } from "drizzle-orm";
var hasEventAccess = async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    if (!req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }
    const userRoles = await db.select({
      roleName: roles.name
    }).from(adminRoles).innerJoin(roles, eq(adminRoles.roleId, roles.id)).where(eq(adminRoles.userId, req.user.id));
    if (userRoles.some((role) => role.roleName === "super_admin")) {
      return next();
    }
    const eventId = req.params.eventId || req.params.id;
    if (!eventId) {
      return res.status(400).send("Event ID is required");
    }
    const userEventAdmins = await db.select().from(eventAdministrators).where(
      and(
        eq(eventAdministrators.userId, req.user.id),
        eq(eventAdministrators.eventId, eventId)
      )
    );
    if (userEventAdmins.length === 0) {
      console.log(`User ${req.user.id} attempted to access event ${eventId} without permission`);
      return res.status(403).send("You do not have permission to access this event");
    }
    next();
  } catch (error) {
    console.error("Error in hasEventAccess middleware:", error);
    res.status(500).send("Internal server error");
  }
};

// server/routes/seasonal-scopes.ts
init_db();
init_schema();
import { Router } from "express";
import { eq as eq2 } from "drizzle-orm";
import { z as z2 } from "zod";
var router = Router();
var ageGroupSettingsSchema = z2.object({
  ageGroup: z2.string(),
  birthYear: z2.number(),
  gender: z2.string(),
  divisionCode: z2.string(),
  minBirthYear: z2.number(),
  maxBirthYear: z2.number()
});
var seasonalScopeSchema = z2.object({
  name: z2.string().min(1, "Name is required"),
  startYear: z2.number().min(2e3).max(2100),
  endYear: z2.number().min(2e3).max(2100),
  isActive: z2.boolean(),
  createCoedGroups: z2.boolean().default(false),
  coedOnly: z2.boolean().default(false),
  ageGroups: z2.array(ageGroupSettingsSchema)
});
router.get("/", async (req, res) => {
  try {
    const scopesWithAgeGroups = await db.query.seasonalScopes.findMany({
      with: {
        ageGroups: true
      }
    });
    res.json(scopesWithAgeGroups);
  } catch (error) {
    console.error("Error fetching seasonal scopes:", error);
    res.status(500).json({ error: "Failed to fetch seasonal scopes" });
  }
});
router.get("/:id/age-groups", async (req, res) => {
  try {
    const { id } = req.params;
    const scopeId = parseInt(id);
    const ageGroups = await db.query.ageGroupSettings.findMany({
      where: eq2(ageGroupSettings.seasonalScopeId, scopeId)
    });
    console.log(`Found ${ageGroups.length} age groups for seasonal scope ${scopeId}`);
    res.json(ageGroups);
  } catch (error) {
    console.error("Error fetching age groups for seasonal scope:", error);
    res.status(500).json({ error: "Failed to fetch age groups for seasonal scope" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const scopeId = parseInt(id);
    await db.transaction(async (tx) => {
      await tx.delete(ageGroupSettings).where(eq2(ageGroupSettings.seasonalScopeId, scopeId));
      const deleteResult = await tx.delete(seasonalScopes).where(eq2(seasonalScopes.id, scopeId));
      if (!deleteResult) {
        throw new Error("Failed to delete seasonal scope");
      }
    });
    res.json({ message: "Seasonal scope deleted successfully" });
  } catch (error) {
    console.error("Error deleting seasonal scope:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete seasonal scope"
    });
  }
});
router.post("/", async (req, res) => {
  try {
    const validatedData = seasonalScopeSchema.parse(req.body);
    const scope = await db.transaction(async (tx) => {
      const [newScope] = await tx.insert(seasonalScopes).values({
        name: validatedData.name,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
        isActive: validatedData.isActive,
        createCoedGroups: validatedData.createCoedGroups || false,
        coedOnly: validatedData.coedOnly || false
      }).returning();
      if (validatedData.ageGroups && validatedData.ageGroups.length > 0) {
        const ageGroupsWithScopeId = validatedData.ageGroups.map((group) => ({
          ...group,
          seasonalScopeId: newScope.id
        }));
        await tx.insert(ageGroupSettings).values(ageGroupsWithScopeId);
      }
      return newScope;
    });
    res.status(201).json(scope);
  } catch (error) {
    console.error("Error creating seasonal scope:", error);
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Failed to create seasonal scope" });
    }
  }
});
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = seasonalScopeSchema.parse(req.body);
    await db.transaction(async (tx) => {
      await tx.update(seasonalScopes).set({
        name: validatedData.name,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
        isActive: validatedData.isActive,
        createCoedGroups: validatedData.createCoedGroups || false,
        coedOnly: validatedData.coedOnly || false
      }).where(eq2(seasonalScopes.id, parseInt(id)));
      await tx.delete(ageGroupSettings).where(eq2(ageGroupSettings.seasonalScopeId, parseInt(id)));
      if (validatedData.ageGroups && validatedData.ageGroups.length > 0) {
        const ageGroupsWithScopeId = validatedData.ageGroups.map((group) => ({
          ...group,
          seasonalScopeId: parseInt(id)
        }));
        await tx.insert(ageGroupSettings).values(ageGroupsWithScopeId);
      }
    });
    res.json({ message: "Seasonal scope updated successfully" });
  } catch (error) {
    console.error("Error updating seasonal scope:", error);
    if (error instanceof z2.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Failed to update seasonal scope" });
    }
  }
});
var seasonal_scopes_default = router;

// server/routes/upload.ts
import { Router as Router2 } from "express";
import multer from "multer";
import path3 from "path";
import fs2 from "fs";
import { v4 as uuidv4 } from "uuid";
var router2 = Router2();
var uploadsDir = path3.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadsDir)) {
  fs2.mkdirSync(uploadsDir, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const baseName = path3.parse(file.originalname).name;
    const ext = path3.extname(file.originalname);
    const timestamp5 = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeFileName = `${baseName}_${timestamp5}_${randomString}${ext}`.replace(/[^a-zA-Z0-9-_.]/g, "_");
    cb(null, safeFileName);
  }
});
var ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/gif",
  "text/plain",
  "text/csv",
  "application/json",
  "video/mp4",
  "video/webm"
];
var upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(new Error("Invalid file type. Only PNG, JPG, JPEG, SVG, GIF, TXT, CSV, and JSON files are allowed."));
      return;
    }
    cb(null, true);
  }
});
router2.post("/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("File upload error:", err);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
      console.log("File uploaded successfully:", {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileInfo = {
        id: uuidv4(),
        name: req.file.originalname,
        url: fileUrl,
        type: req.file.mimetype,
        size: req.file.size,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("Returning file info to client:", fileInfo);
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(fileInfo);
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
});
router2.get("/", async (req, res) => {
  try {
    const files3 = fs2.readdirSync(uploadsDir).map((filename) => {
      const stats = fs2.statSync(path3.join(uploadsDir, filename));
      return {
        id: path3.parse(filename).name,
        name: filename,
        url: `/uploads/${filename}`,
        type: path3.extname(filename).slice(1),
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString()
      };
    });
    res.json(files3);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});
router2.patch("/:id/rename", (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ error: "New name is required" });
    }
    const files3 = fs2.readdirSync(uploadsDir);
    const fileToRename = files3.find((f) => path3.parse(f).name.startsWith(id));
    if (!fileToRename) {
      return res.status(404).json({ error: "File not found" });
    }
    const ext = path3.extname(fileToRename);
    const uniqueId = path3.parse(fileToRename).name.split("-").pop();
    const newFileName = `${newName}-${uniqueId}${ext}`.replace(/[^a-zA-Z0-9-_.]/g, "_");
    fs2.renameSync(
      path3.join(uploadsDir, fileToRename),
      path3.join(uploadsDir, newFileName)
    );
    res.json({
      message: "File renamed successfully",
      newFileName
    });
  } catch (error) {
    console.error("Error renaming file:", error);
    res.status(500).json({ error: "Failed to rename file" });
  }
});
router2.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const files3 = fs2.readdirSync(uploadsDir);
    const fileToDelete = files3.find((f) => path3.parse(f).name.startsWith(id));
    if (!fileToDelete) {
      return res.status(404).json({ error: "File not found" });
    }
    fs2.unlinkSync(path3.join(uploadsDir, fileToDelete));
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});
var upload_default = router2;

// server/routes/files.ts
import { Router as Router3 } from "express";

// server/services/fileService.ts
init_db();
init_schema();
import { eq as eq3, isNull, and as and3, desc as desc2, sql as sql2, like, or } from "drizzle-orm";
import { v4 as uuidv42 } from "uuid";
import fs3 from "fs/promises";
async function ensureUploadDirectory() {
  const uploadsDir2 = "./uploads";
  try {
    await fs3.access(uploadsDir2);
  } catch (error) {
    await fs3.mkdir(uploadsDir2, { recursive: true });
  }
  return uploadsDir2;
}
ensureUploadDirectory().catch((err) => {
  console.error("Failed to create uploads directory:", err);
});
async function getFiles(options) {
  let query = db.select({
    ...files,
    folderName: folders.name
  }).from(files).leftJoin(folders, eq3(files.folderId, folders.id));
  const conditions = [];
  if (options.folderId !== void 0) {
    conditions.push(
      options.folderId === null ? isNull(files.folderId) : eq3(files.folderId, options.folderId)
    );
  }
  if (options.type) {
    conditions.push(eq3(files.type, options.type));
  }
  if (options.relatedEntityId) {
    conditions.push(eq3(files.relatedEntityId, options.relatedEntityId));
  }
  if (options.relatedEntityType) {
    conditions.push(eq3(files.relatedEntityType, options.relatedEntityType));
  }
  if (options.query) {
    conditions.push(
      or(
        like(files.name, `%${options.query}%`),
        like(files.description, `%${options.query}%`)
      )
    );
  }
  if (options.tags) {
    let tagsArray;
    if (Array.isArray(options.tags)) {
      tagsArray = options.tags;
    } else {
      tagsArray = options.tags.split(",").map((tag) => tag.trim());
    }
    if (tagsArray.length > 0) {
      conditions.push(sql2`${files.tags} && ${JSON.stringify(tagsArray)}`);
    }
  }
  if (conditions.length > 0) {
    query = query.where(and3(...conditions));
  }
  query = query.orderBy(desc2(files.createdAt));
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.offset(options.offset);
  }
  const result = await db.execute(query);
  return result.rows;
}
async function getFile(fileId) {
  const [file] = await db.select({
    ...files,
    folderName: folders.name
  }).from(files).leftJoin(folders, eq3(files.folderId, folders.id)).where(eq3(files.id, fileId));
  return file || null;
}
async function createFile(fileData) {
  if (fileData.folderId) {
    const [folder] = await db.select().from(folders).where(eq3(folders.id, fileData.folderId));
    if (!folder) {
      throw new Error("Folder not found");
    }
  }
  const [file] = await db.insert(files).values({
    id: uuidv42(),
    name: fileData.name,
    type: fileData.type,
    size: fileData.size,
    mimeType: fileData.mimeType,
    url: fileData.path,
    folderId: fileData.folderId || null,
    description: fileData.description || null,
    tags: fileData.tags || null,
    relatedEntityId: fileData.relatedEntityId || null,
    relatedEntityType: fileData.relatedEntityType || null,
    metadata: fileData.metadata || {},
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).returning();
  return file;
}
async function updateFile(fileId, fileData) {
  const file = await getFile(fileId);
  if (!file) {
    return null;
  }
  if (fileData.folderId && fileData.folderId !== file.folderId) {
    const [folder] = await db.select().from(folders).where(eq3(folders.id, fileData.folderId));
    if (!folder) {
      throw new Error("Folder not found");
    }
  }
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (fileData.name !== void 0) {
    updateData.name = fileData.name;
  }
  if (fileData.folderId !== void 0) {
    updateData.folderId = fileData.folderId;
  }
  if (fileData.description !== void 0) {
    updateData.description = fileData.description;
  }
  if (fileData.tags !== void 0) {
    updateData.tags = fileData.tags;
  }
  if (fileData.relatedEntityId !== void 0) {
    updateData.relatedEntityId = fileData.relatedEntityId;
  }
  if (fileData.relatedEntityType !== void 0) {
    updateData.relatedEntityType = fileData.relatedEntityType;
  }
  if (fileData.metadata !== void 0) {
    updateData.metadata = {
      ...file.metadata || {},
      ...fileData.metadata || {}
    };
  }
  const [updatedFile] = await db.update(files).set(updateData).where(eq3(files.id, fileId)).returning();
  return updatedFile;
}
async function deleteFile(fileId) {
  const file = await getFile(fileId);
  if (!file) {
    return false;
  }
  try {
    await fs3.unlink(file.url);
  } catch (error) {
    console.warn(`Could not delete physical file at ${file.url}:`, error);
  }
  await db.delete(files).where(eq3(files.id, fileId));
  return true;
}
async function getFilesByFolder(folderId) {
  let query;
  if (folderId === null) {
    query = db.select().from(files).where(isNull(files.folderId)).orderBy(desc2(files.createdAt));
  } else {
    query = db.select().from(files).where(eq3(files.folderId, folderId)).orderBy(desc2(files.createdAt));
  }
  const result = await db.execute(query);
  return result.rows;
}
function getFileTypeFromExtension(extension) {
  const ext = extension.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext)) {
    return "image";
  }
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "odt", "ods", "odp"].includes(ext)) {
    return "document";
  }
  if (["mp4", "mov", "avi", "wmv", "flv", "webm", "mkv"].includes(ext)) {
    return "video";
  }
  if (["mp3", "wav", "ogg", "aac", "flac", "m4a", "wma"].includes(ext)) {
    return "audio";
  }
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "tar.gz", "tgz"].includes(ext)) {
    return "archive";
  }
  if (["js", "ts", "jsx", "tsx", "py", "rb", "php", "html", "css", "cpp", "c", "java", "go", "rust", "sql"].includes(ext)) {
    return "code";
  }
  return "other";
}

// server/routes/files.ts
import multer2 from "multer";
import path4 from "path";
import fs4 from "fs/promises";
import { createReadStream } from "fs";
import { v4 as uuidv43 } from "uuid";
var router3 = Router3();
var storage2 = multer2.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadsDir2 = "./uploads";
      try {
        await fs4.access(uploadsDir2);
      } catch (error) {
        await fs4.mkdir(uploadsDir2, { recursive: true });
      }
      cb(null, uploadsDir2);
    } catch (error) {
      cb(error, "./uploads");
    }
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv43();
    const extension = path4.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});
var upload2 = multer2({
  storage: storage2,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
router3.get("/", async (req, res) => {
  try {
    const {
      folderId,
      type,
      relatedEntityId,
      relatedEntityType,
      query,
      tags,
      limit,
      offset
    } = req.query;
    const options = {};
    if (folderId !== void 0) {
      options.folderId = folderId === "null" ? null : String(folderId);
    }
    if (type) options.type = String(type);
    if (relatedEntityId) options.relatedEntityId = String(relatedEntityId);
    if (relatedEntityType) options.relatedEntityType = String(relatedEntityType);
    if (query) options.query = String(query);
    if (tags) options.tags = String(tags);
    if (limit) options.limit = parseInt(String(limit), 10);
    if (offset) options.offset = parseInt(String(offset), 10);
    const files3 = await getFiles(options);
    res.json(files3);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});
router3.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const file = await getFile(id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    res.json(file);
  } catch (error) {
    console.error(`Error fetching file ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
});
router3.get("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;
    const file = await getFile(id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    if (file.mimeType) {
      res.setHeader("Content-Type", file.mimeType);
    }
    try {
      const fileStream = createReadStream(file.url);
      fileStream.pipe(res);
    } catch (error) {
      console.error(`Error streaming file ${id}:`, error);
      res.status(500).json({ error: "Failed to download file" });
    }
  } catch (error) {
    console.error(`Error downloading file ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to download file" });
  }
});
router3.post("/", validateAuth, upload2.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const {
      folderId,
      description,
      tags,
      relatedEntityId,
      relatedEntityType,
      metadata
    } = req.body;
    let parsedTags = null;
    if (tags) {
      try {
        if (Array.isArray(tags)) {
          parsedTags = tags;
        } else if (typeof tags === "string") {
          if (tags.includes(",")) {
            parsedTags = tags.split(",").map((tag) => tag.trim());
          } else if (tags.startsWith("[") && tags.endsWith("]")) {
            parsedTags = JSON.parse(tags);
          } else {
            parsedTags = [tags.trim()];
          }
        }
      } catch (error) {
        console.warn("Error parsing tags:", error);
      }
    }
    let parsedMetadata = null;
    if (metadata) {
      try {
        if (typeof metadata === "string") {
          parsedMetadata = JSON.parse(metadata);
        } else {
          parsedMetadata = metadata;
        }
      } catch (error) {
        console.warn("Error parsing metadata:", error);
      }
    }
    const extension = path4.extname(req.file.originalname).substring(1);
    const fileType = getFileTypeFromExtension(extension);
    const file = await createFile({
      name: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      type: fileType,
      folderId: folderId === "null" ? null : folderId || null,
      description: description || null,
      tags: parsedTags,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
      metadata: parsedMetadata
    });
    res.status(201).json(file);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Folder not found") {
        return res.status(400).json({ error: error.message });
      }
    }
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});
router3.patch("/:id", validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      folderId,
      description,
      tags,
      relatedEntityId,
      relatedEntityType,
      metadata
    } = req.body;
    let parsedTags = void 0;
    if (tags !== void 0) {
      try {
        if (tags === null) {
          parsedTags = [];
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        } else if (typeof tags === "string") {
          if (tags.includes(",")) {
            parsedTags = tags.split(",").map((tag) => tag.trim());
          } else if (tags.startsWith("[") && tags.endsWith("]")) {
            parsedTags = JSON.parse(tags);
          } else {
            parsedTags = [tags.trim()];
          }
        }
      } catch (error) {
        console.warn("Error parsing tags:", error);
      }
    }
    let parsedMetadata = void 0;
    if (metadata !== void 0) {
      try {
        if (metadata === null) {
          parsedMetadata = {};
        } else if (typeof metadata === "string") {
          parsedMetadata = JSON.parse(metadata);
        } else {
          parsedMetadata = metadata;
        }
      } catch (error) {
        console.warn("Error parsing metadata:", error);
      }
    }
    const file = await updateFile(id, {
      name,
      folderId: folderId === "null" ? null : folderId,
      description,
      tags: parsedTags,
      relatedEntityId,
      relatedEntityType,
      metadata: parsedMetadata
    });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    res.json(file);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Folder not found") {
        return res.status(400).json({ error: error.message });
      }
    }
    console.error(`Error updating file ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to update file" });
  }
});
router3.delete("/:id", validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteFile(id);
    if (!result) {
      return res.status(404).json({ error: "File not found" });
    }
    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error(`Error deleting file ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});
router3.get("/folder/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;
    const files3 = await getFilesByFolder(
      folderId === "null" ? null : folderId
    );
    res.json(files3);
  } catch (error) {
    console.error(`Error fetching files for folder ${req.params.folderId}:`, error);
    res.status(500).json({ error: "Failed to fetch files for folder" });
  }
});
var files_default = router3;

// server/routes/folders.ts
import { Router as Router4 } from "express";

// server/services/folderService.ts
init_db();
init_schema();
import { eq as eq4, isNull as isNull2, and as and4 } from "drizzle-orm";
import { v4 as uuidv44 } from "uuid";
var STANDARD_FOLDERS = [
  "Teams",
  "Players",
  "Logos",
  "Documents",
  "Receipts",
  "Templates",
  "Forms",
  "Images",
  "Reports & Exports"
];
var SUBFOLDER_CONFIGS = {
  "Documents": ["Legal", "Waivers"],
  "Templates": ["Email Templates"]
};
async function getFolders(parentId) {
  let query = db.select().from(folders);
  if (parentId !== void 0) {
    query = query.where(
      parentId === null ? isNull2(folders.parentId) : eq4(folders.parentId, parentId)
    );
  }
  query = query.orderBy(folders.name);
  const result = await db.execute(query);
  return result.rows;
}
async function ensureFolder(name, parentId = null) {
  let query = db.select().from(folders).where(
    and4(
      eq4(folders.name, name),
      parentId === null ? isNull2(folders.parentId) : eq4(folders.parentId, parentId)
    )
  );
  const result = await db.execute(query);
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  const [folder] = await db.insert(folders).values({
    id: uuidv44(),
    name,
    parentId,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).returning();
  return folder;
}
async function ensureStandardFolders() {
  console.log("Initializing standard folder structure...");
  const rootFolderPromises = STANDARD_FOLDERS.map((name) => ensureFolder(name));
  const rootFolders = await Promise.all(rootFolderPromises);
  const subfolderPromises = [];
  const folderMap = {};
  rootFolders.forEach((folder) => {
    folderMap[folder.name] = folder.id;
  });
  Object.entries(SUBFOLDER_CONFIGS).forEach(([parentName, subfolders]) => {
    const parentId = folderMap[parentName];
    if (parentId) {
      subfolders.forEach((subfolder) => {
        subfolderPromises.push(ensureFolder(subfolder, parentId));
      });
    }
  });
  await Promise.all(subfolderPromises);
  console.log("Standard folder structure initialized successfully");
}
async function getFolderTree() {
  const allFolders = await getFolders();
  const foldersByParent = {};
  allFolders.forEach((folder) => {
    const parentId = folder.parentId || null;
    if (!foldersByParent[parentId]) {
      foldersByParent[parentId] = [];
    }
    foldersByParent[parentId].push(folder);
  });
  function buildTree(parentId) {
    const children = foldersByParent[parentId] || [];
    return children.map((folder) => ({
      ...folder,
      children: buildTree(folder.id)
    }));
  }
  return buildTree(null);
}
async function getFolder(folderId) {
  const [folder] = await db.select().from(folders).where(eq4(folders.id, folderId));
  return folder || null;
}
async function createFolder(name, parentId = null) {
  if (parentId) {
    const parent = await getFolder(parentId);
    if (!parent) {
      throw new Error("Parent folder not found");
    }
  }
  const [folder] = await db.insert(folders).values({
    id: uuidv44(),
    name,
    parentId,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).returning();
  return folder;
}
async function updateFolder(folderId, data) {
  const folder = await getFolder(folderId);
  if (!folder) {
    return null;
  }
  if (data.parentId !== void 0 && data.parentId !== folder.parentId) {
    if (data.parentId !== null) {
      const parent = await getFolder(data.parentId);
      if (!parent) {
        throw new Error("Parent folder not found");
      }
      let current = parent;
      while (current && current.parentId) {
        if (current.id === folderId) {
          throw new Error("Cannot move a folder to its own descendant");
        }
        current = await getFolder(current.parentId);
      }
    }
  }
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (data.name !== void 0) {
    updateData.name = data.name;
  }
  if (data.parentId !== void 0) {
    updateData.parentId = data.parentId;
  }
  const [updatedFolder] = await db.update(folders).set(updateData).where(eq4(folders.id, folderId)).returning();
  return updatedFolder;
}
async function deleteFolder(folderId) {
  const folder = await getFolder(folderId);
  if (!folder) {
    return false;
  }
  const children = await getFolders(folderId);
  if (children.length > 0) {
    throw new Error("Cannot delete a folder with subfolders");
  }
  await db.delete(folders).where(eq4(folders.id, folderId));
  return true;
}

// server/routes/folders.ts
var router4 = Router4();
router4.get("/root", async (req, res) => {
  try {
    const folders2 = await getFolders(null);
    res.json(folders2);
  } catch (error) {
    console.error("Error fetching root folders:", error);
    res.status(500).json({ error: "Failed to fetch root folders" });
  }
});
router4.get("/", async (req, res) => {
  try {
    const folders2 = await getFolders();
    res.json(folders2);
  } catch (error) {
    console.error("Error fetching all folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});
router4.get("/:id/subfolders", async (req, res) => {
  try {
    const { id } = req.params;
    const subfolders = await getFolders(id);
    res.json(subfolders);
  } catch (error) {
    console.error(`Error fetching subfolders for folder ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch subfolders" });
  }
});
router4.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await getFolder(id);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    res.json(folder);
  } catch (error) {
    console.error(`Error fetching folder ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch folder" });
  }
});
router4.post("/", validateAuth, isAdmin, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Folder name is required" });
    }
    const folder = await createFolder(name, parentId || null);
    res.status(201).json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    if (error instanceof Error) {
      if (error.message === "Parent folder not found") {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: "Failed to create folder" });
  }
});
router4.patch("/:id", validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    if (name === void 0 && parentId === void 0) {
      return res.status(400).json({ error: "At least one field to update is required" });
    }
    const updatedFolder = await updateFolder(id, {
      name,
      parentId
    });
    if (!updatedFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    res.json(updatedFolder);
  } catch (error) {
    console.error(`Error updating folder ${req.params.id}:`, error);
    if (error instanceof Error) {
      if (error.message === "Parent folder not found" || error.message === "Cannot move a folder to its own descendant") {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: "Failed to update folder" });
  }
});
router4.delete("/:id", validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteFolder(id);
    if (!result) {
      return res.status(404).json({ error: "Folder not found" });
    }
    res.json({ success: true, message: "Folder deleted successfully" });
  } catch (error) {
    console.error(`Error deleting folder ${req.params.id}:`, error);
    if (error instanceof Error) {
      if (error.message === "Cannot delete a folder with subfolders") {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: "Failed to delete folder" });
  }
});
router4.get("/tree", async (req, res) => {
  try {
    const tree = await getFolderTree();
    res.json(tree);
  } catch (error) {
    console.error("Error fetching folder tree:", error);
    res.status(500).json({ error: "Failed to fetch folder tree" });
  }
});
router4.post("/ensure-standard", validateAuth, isAdmin, async (req, res) => {
  try {
    await ensureStandardFolders();
    res.json({ success: true, message: "Standard folders have been created successfully" });
  } catch (error) {
    console.error("Error creating standard folders:", error);
    res.status(500).json({ error: "Failed to create standard folders" });
  }
});
var folders_default = router4;

// server/routes/csv-upload.ts
init_db();
init_schema();
import { Router as Router5 } from "express";
import multer3 from "multer";
import { parse } from "csv-parse";
import * as z3 from "zod";
import { v4 as uuidv45 } from "uuid";
import path5 from "path";
import fs5 from "fs";
var storage3 = multer3.memoryStorage();
var upload3 = multer3({
  storage: storage3,
  limits: {
    fileSize: 5 * 1024 * 1024,
    // 5MB limit
    files: 1
    // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  }
});
var router5 = Router5();
var playerSchema = z3.object({
  firstName: z3.string().min(1, "First name is required"),
  lastName: z3.string().min(1, "Last name is required"),
  jerseyNumber: z3.string().regex(/^\d{1,2}$/, "Jersey number must be 1-2 digits").optional(),
  dateOfBirth: z3.string().min(1, "Date of birth is required"),
  medicalNotes: z3.string().optional(),
  emergencyContactFirstName: z3.string().min(1, "Emergency contact first name is required"),
  emergencyContactLastName: z3.string().min(1, "Emergency contact last name is required"),
  emergencyContactPhone: z3.string().min(1, "Emergency contact phone is required")
});
router5.get("/template", (req, res) => {
  try {
    const templatePath = path5.join(process.cwd(), "public", "player-roster-template.csv");
    const fileContent = fs5.readFileSync(templatePath, "utf8");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="player-roster-template.csv"');
    res.send(fileContent);
  } catch (error) {
    console.error("Error serving CSV template:", error);
    res.status(500).send("Failed to generate CSV template");
  }
});
router5.post("/players", upload3.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const records = [];
    const parser = parse(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    for await (const record of parser) {
      records.push(record);
    }
    const mappedRecords = records.map((record) => {
      return {
        id: uuidv45(),
        // Generate a unique ID for each player
        firstName: record["First Name"],
        lastName: record["Last Name"],
        jerseyNumber: record["Jersey Number"] || void 0,
        dateOfBirth: record["Date of Birth"],
        medicalNotes: record["Notes"] || void 0,
        emergencyContactFirstName: record["Emergency Contact First Name"],
        emergencyContactLastName: record["Emergency Contact Last Name"],
        emergencyContactPhone: record["Emergency Contact Phone"]
      };
    });
    const validPlayers = [];
    const invalidRecords = [];
    mappedRecords.forEach((record, index) => {
      const result = playerSchema.safeParse(record);
      if (result.success) {
        validPlayers.push(result.data);
      } else {
        invalidRecords.push({
          index,
          record,
          errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
    });
    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: "Some records failed validation",
        invalidRecords,
        validCount: validPlayers.length,
        totalCount: records.length
      });
    }
    return res.status(200).json({
      message: "CSV file processed successfully",
      players: validPlayers,
      count: validPlayers.length
    });
  } catch (error) {
    console.error("Error processing CSV upload:", error);
    return res.status(500).json({
      error: "Failed to process CSV file",
      details: error.message
    });
  }
});
router5.post("/csv-admin", upload3.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    const records = [];
    const parser = parse(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    for await (const record of parser) {
      records.push(record);
    }
    if (records.length === 0) {
      return res.status(400).json({ error: "CSV file is empty or has invalid format" });
    }
    const playersToInsert = records.map((record) => {
      const emergencyFirstName = record.emergencyContactFirstName || record["Emergency Contact First Name"] || "Not Provided";
      const emergencyLastName = record.emergencyContactLastName || record["Emergency Contact Last Name"] || "Not Provided";
      return {
        teamId: parseInt(teamId),
        firstName: record.firstName || record["First Name"] || "",
        lastName: record.lastName || record["Last Name"] || "",
        dateOfBirth: record.dateOfBirth || record["Date of Birth"] || "",
        jerseyNumber: record.jerseyNumber || record["Jersey Number"] ? parseInt(record.jerseyNumber || record["Jersey Number"]) : null,
        position: null,
        // Position is no longer collected
        medicalNotes: record.notes || record["Notes"] || "",
        emergencyContactFirstName: emergencyFirstName,
        emergencyContactLastName: emergencyLastName,
        emergencyContactPhone: record.emergencyContactPhone || record["Emergency Contact Phone"] || "Not Provided",
        // For backward compatibility
        emergencyContactName: `${emergencyFirstName} ${emergencyLastName}`,
        // Keeping these fields for backward compatibility
        parentGuardianName: null,
        parentGuardianEmail: null,
        parentGuardianPhone: null,
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    const teamIdInt = parseInt(teamId);
    console.log(`Adding ${playersToInsert.length} new players to team ${teamId}`);
    const insertedPlayers = await db.insert(players).values(playersToInsert).returning();
    console.log(`Inserted ${insertedPlayers.length} players for team ${teamId}`);
    return res.status(200).json({
      message: "CSV file processed successfully",
      players: insertedPlayers,
      count: insertedPlayers.length
    });
  } catch (error) {
    console.error("Error processing admin CSV upload:", error);
    return res.status(500).json({
      error: "Failed to process CSV file",
      details: error.message
    });
  }
});
var csv_upload_default = router5;

// server/routes/csv-team-upload.ts
init_db();
init_schema();
init_schema();
import { Router as Router6 } from "express";
import multer4 from "multer";
import { parse as parse2 } from "csv-parse";
import * as z4 from "zod";
import path6 from "path";
import fs6 from "fs";
import { eq as eq5, and as and5 } from "drizzle-orm";
var storage4 = multer4.memoryStorage();
var upload4 = multer4({
  storage: storage4,
  limits: {
    fileSize: 5 * 1024 * 1024,
    // 5MB limit
    files: 1
    // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  }
});
var router6 = Router6();
var teamSchema = z4.object({
  name: z4.string().min(1, "Team name is required"),
  headCoachName: z4.string().min(1, "Head coach name is required"),
  headCoachEmail: z4.string().email("Valid head coach email is required"),
  headCoachPhone: z4.string().min(1, "Head coach phone is required"),
  managerName: z4.string().optional(),
  managerEmail: z4.string().email("Valid manager email is required").optional(),
  managerPhone: z4.string().optional(),
  clubName: z4.string().optional(),
  ageGroup: z4.string().min(1, "Age group is required"),
  submitterName: z4.string().optional(),
  submitterEmail: z4.string().email("Valid submitter email is required").optional()
});
router6.get("/template", async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId) : null;
    if (eventId) {
      const eventAgeGroupsData = await db.select().from(eventAgeGroups).where(eq5(eventAgeGroups.eventId, String(eventId)));
      if (eventAgeGroupsData.length === 0) {
        return res.status(400).json({ error: "No age groups found for this event" });
      }
      const headers = "Team Name,Head Coach Name,Head Coach Email,Head Coach Phone,Manager Name,Manager Email,Manager Phone,Club Name,Age Group,Submitter Name,Submitter Email";
      const example1 = `Sample Team 1,John Doe,coach@example.com,555-123-4567,Jane Smith,manager@example.com,555-987-6543,FC United,${eventAgeGroupsData[0].ageGroup} ${eventAgeGroupsData[0].gender},Admin User,admin@example.com`;
      const ageGroup2 = eventAgeGroupsData.length > 1 ? eventAgeGroupsData[1] : eventAgeGroupsData[0];
      const example2 = `Sample Team 2,Mary Johnson,mjohnson@example.com,555-333-2222,Bob Williams,bwilliams@example.com,555-444-1111,Soccer Stars,${ageGroup2.ageGroup} ${ageGroup2.gender},Admin User,admin@example.com`;
      const csvContent = `${headers}
${example1}
${example2}`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="team-import-template.csv"');
      return res.send(csvContent);
    }
    const templatePath = path6.join(process.cwd(), "public", "team-import-template.csv");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="team-import-template.csv"');
    const fileStream = fs6.createReadStream(templatePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving team CSV template:", error);
    res.status(500).send("Failed to generate team CSV template");
  }
});
router6.post("/teams", upload4.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    const [eventData] = await db.select().from(events).where(eq5(events.id, Number(eventId))).limit(1);
    if (!eventData) {
      return res.status(404).json({ error: "Event not found" });
    }
    let seasonalScopeId = null;
    const [seasonalScopeSetting] = await db.select().from(eventSettings).where(
      and5(
        eq5(eventSettings.eventId, String(eventId)),
        eq5(eventSettings.settingKey, "seasonalScopeId")
      )
    ).limit(1);
    if (seasonalScopeSetting) {
      seasonalScopeId = parseInt(seasonalScopeSetting.settingValue);
      console.log(`Using seasonal scope ID ${seasonalScopeId} for event ${eventId}`);
    } else {
      console.log(`No seasonal scope found for event ${eventId}. Will use event age groups directly.`);
    }
    const eventAgeGroupsData = await db.select().from(eventAgeGroups).where(eq5(eventAgeGroups.eventId, String(eventId)));
    if (eventAgeGroupsData.length === 0) {
      return res.status(400).json({ error: "No age groups found for this event" });
    }
    const ageGroups = {};
    let ageGroupSettings2 = [];
    if (seasonalScopeId) {
      ageGroupSettings2 = await db.select().from(ageGroupSettings).where(eq5(ageGroupSettings.seasonalScopeId, seasonalScopeId));
      console.log(`Found ${ageGroupSettings2.length} age group settings in the seasonal scope`);
    }
    const scopeSettings = {};
    ageGroupSettings2.forEach((setting) => {
      const key = `${setting.ageGroup} ${setting.gender}`;
      scopeSettings[key] = {
        divisionCode: setting.divisionCode,
        birthYear: setting.birthYear
      };
    });
    eventAgeGroupsData.forEach((group) => {
      const standardFormat = `${group.ageGroup} ${group.gender}`;
      ageGroups[standardFormat] = {
        id: group.id,
        divisionCode: group.divisionCode || void 0,
        birthYear: group.birthYear || void 0
      };
      const noSpaceFormat = `${group.ageGroup}${group.gender}`;
      ageGroups[noSpaceFormat] = {
        id: group.id,
        divisionCode: group.divisionCode || void 0,
        birthYear: group.birthYear || void 0
      };
      const singularGender = group.gender === "Boys" ? "Boy" : "Girl";
      const singularFormat = `${group.ageGroup} ${singularGender}`;
      ageGroups[singularFormat] = {
        id: group.id,
        divisionCode: group.divisionCode || void 0,
        birthYear: group.birthYear || void 0
      };
      if (group.divisionCode) {
        ageGroups[group.divisionCode] = {
          id: group.id,
          divisionCode: group.divisionCode,
          birthYear: group.birthYear || void 0
        };
      }
      if (scopeSettings[standardFormat]) {
        const divisionCode = scopeSettings[standardFormat].divisionCode;
        const birthYear = scopeSettings[standardFormat].birthYear;
        ageGroups[standardFormat].divisionCode = divisionCode;
        ageGroups[standardFormat].birthYear = birthYear;
        ageGroups[noSpaceFormat].divisionCode = divisionCode;
        ageGroups[noSpaceFormat].birthYear = birthYear;
        ageGroups[singularFormat].divisionCode = divisionCode;
        ageGroups[singularFormat].birthYear = birthYear;
        if (divisionCode && !ageGroups[divisionCode]) {
          ageGroups[divisionCode] = {
            id: group.id,
            divisionCode,
            birthYear
          };
        }
      }
    });
    const records = [];
    const parser = parse2(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    for await (const record of parser) {
      const transformedRecord = {
        name: record["Team Name"],
        headCoachName: record["Head Coach Name"],
        headCoachEmail: record["Head Coach Email"],
        headCoachPhone: record["Head Coach Phone"],
        managerName: record["Manager Name"],
        managerEmail: record["Manager Email"],
        managerPhone: record["Manager Phone"],
        clubName: record["Club Name"],
        ageGroup: record["Age Group"],
        submitterName: record["Submitter Name"],
        submitterEmail: record["Submitter Email"]
      };
      records.push(transformedRecord);
    }
    if (records.length === 0) {
      return res.status(400).json({ error: "CSV file is empty or has invalid format" });
    }
    const validTeams = [];
    const invalidRecords = [];
    for (const record of records) {
      try {
        const validatedTeam = teamSchema.parse(record);
        validTeams.push(validatedTeam);
      } catch (error) {
        if (error instanceof z4.ZodError) {
          const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
          invalidRecords.push({ record, errors: errorMessages });
        } else {
          throw error;
        }
      }
    }
    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: "Some records failed validation",
        invalidRecords,
        validCount: validTeams.length,
        totalCount: records.length
      });
    }
    const invalidAgeGroups = [];
    const teamsToInsert = [];
    for (const team of validTeams) {
      if (!ageGroups[team.ageGroup]) {
        const formattedAgeGroup = team.ageGroup.trim().toLowerCase();
        const potentialMatch = Object.keys(ageGroups).find(
          (ag) => ag.trim().toLowerCase() === formattedAgeGroup
        );
        if (potentialMatch) {
          team.ageGroup = potentialMatch;
        } else {
          invalidAgeGroups.push({
            record: team,
            error: `Age group "${team.ageGroup}" does not exist in this event`
          });
          continue;
        }
      }
      const ageGroupInfo = ageGroups[team.ageGroup];
      const teamData = {
        eventId,
        ageGroupId: ageGroupInfo.id,
        name: team.name,
        coach: JSON.stringify({
          name: team.headCoachName,
          email: team.headCoachEmail,
          phone: team.headCoachPhone
        }),
        managerName: team.managerName || null,
        managerEmail: team.managerEmail || null,
        managerPhone: team.managerPhone || null,
        clubName: team.clubName || null,
        submitterName: team.submitterName || null,
        submitterEmail: team.submitterEmail || null,
        status: "registered",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (ageGroupInfo.divisionCode) {
        teamData.divisionCode = ageGroupInfo.divisionCode;
        console.log(`Using division code ${ageGroupInfo.divisionCode} for team ${team.name}`);
      }
      if (ageGroupInfo.birthYear) {
        teamData.birthYear = ageGroupInfo.birthYear;
        console.log(`Using birth year ${ageGroupInfo.birthYear} for team ${team.name}`);
      }
      teamsToInsert.push(teamData);
    }
    if (invalidAgeGroups.length > 0) {
      const standardFormats = Object.keys(ageGroups).filter((key) => key.includes(" ") && (key.includes("Boys") || key.includes("Girls"))).sort();
      const divisionCodes = Object.keys(ageGroups).filter((key) => /^[BG]\d{4}$/.test(key)).sort();
      let errorMessage = `Some records contain invalid age groups.`;
      errorMessage += `

Valid age group formats for this event are:`;
      errorMessage += `
- Standard format (e.g., "${standardFormats[0] || "U10 Boys"}")`;
      if (divisionCodes.length > 0) {
        errorMessage += `
- Division code format (e.g., "${divisionCodes[0] || "B2014"}")`;
      }
      errorMessage += `

Valid age groups: ${standardFormats.join(", ")}`;
      if (divisionCodes.length > 0) {
        errorMessage += `

Valid division codes: ${divisionCodes.join(", ")}`;
      }
      return res.status(400).json({
        error: errorMessage,
        invalidAgeGroups,
        validCount: teamsToInsert.length,
        totalCount: validTeams.length,
        availableAgeGroups: {
          standardFormats,
          divisionCodes
        }
      });
    }
    if (teamsToInsert.length === 0) {
      return res.status(400).json({ error: "No valid teams to insert" });
    }
    const insertedTeams = await db.insert(teams).values(teamsToInsert).returning();
    console.log(`Inserted ${insertedTeams.length} teams for event ${eventId}`);
    return res.status(200).json({
      message: "CSV file processed successfully",
      teams: insertedTeams,
      count: insertedTeams.length
    });
  } catch (error) {
    console.error("Error processing team CSV upload:", error);
    return res.status(500).json({
      error: "Failed to process CSV file",
      details: error.message
    });
  }
});
var csv_team_upload_default = router6;

// server/routes/admin/accounting-codes.ts
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
import { Router as Router7 } from "express";
var router7 = Router7();
router7.get("/", authenticateAdmin, async (req, res) => {
  try {
    const codes = await db.query.accountingCodes.findMany({
      orderBy: (accountingCodes2) => [accountingCodes2.code]
    });
    res.json(codes);
  } catch (error) {
    console.error("Error fetching accounting codes:", error);
    res.status(500).json({ message: "Failed to fetch accounting codes" });
  }
});
router7.post("/", authenticateAdmin, async (req, res) => {
  try {
    const validatedData = insertAccountingCodeSchema.parse(req.body);
    const newCode = await db.insert(accountingCodes).values({
      ...validatedData,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    res.status(201).json(newCode[0]);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505") {
      res.status(400).json({ message: "An accounting code with this code already exists" });
    } else {
      console.error("Error creating accounting code:", error);
      res.status(500).json({ message: "Failed to create accounting code" });
    }
  }
});
router7.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertAccountingCodeSchema.parse(req.body);
    const updatedCode = await db.update(accountingCodes).set({
      ...validatedData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq6(accountingCodes.id, parseInt(id))).returning();
    if (updatedCode.length === 0) {
      return res.status(404).json({ message: "Accounting code not found" });
    }
    res.json(updatedCode[0]);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505") {
      res.status(400).json({ message: "An accounting code with this code already exists" });
    } else {
      console.error("Error updating accounting code:", error);
      res.status(500).json({ message: "Failed to update accounting code" });
    }
  }
});
router7.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCode = await db.delete(accountingCodes).where(eq6(accountingCodes.id, parseInt(id))).returning();
    if (deletedCode.length === 0) {
      return res.status(404).json({ message: "Accounting code not found" });
    }
    res.json({ message: "Accounting code deleted successfully" });
  } catch (error) {
    console.error("Error deleting accounting code:", error);
    res.status(500).json({ message: "Failed to delete accounting code" });
  }
});
var accounting_codes_default = router7;

// server/routes/admin/fees.ts
init_db();
init_schema();
import { Router as Router8 } from "express";
import { eq as eq7 } from "drizzle-orm";
var router8 = Router8();
router8.get("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("Fetching fees for event:", eventId);
    if (!eventId) {
      console.error("Invalid event ID:", eventId);
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const fees = await db.select({
      id: eventFees.id,
      name: eventFees.name,
      amount: eventFees.amount,
      beginDate: eventFees.beginDate,
      endDate: eventFees.endDate,
      applyToAll: eventFees.applyToAll,
      feeType: eventFees.feeType,
      isRequired: eventFees.isRequired,
      accountingCodeId: eventFees.accountingCodeId,
      createdAt: eventFees.createdAt,
      updatedAt: eventFees.updatedAt
    }).from(eventFees).where(eq7(eventFees.eventId, BigInt(eventId))).orderBy(eventFees.createdAt);
    console.log(`Found ${fees.length} fees for event ${eventId}`);
    res.json(fees);
  } catch (error) {
    console.error("Error fetching event fees:", error);
    res.status(500).json({
      message: "Failed to fetch event fees",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router8.post("/:eventId/fees", authenticateAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("Creating fee for event:", eventId, "with data:", req.body);
    if (!eventId) {
      console.error("Invalid event ID for fee creation:", eventId);
      return res.status(400).json({ message: "Invalid event ID" });
    }
    const newFee = await db.insert(eventFees).values({
      ...req.body,
      eventId: BigInt(eventId),
      beginDate: req.body.beginDate ? new Date(req.body.beginDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    console.log("Created new fee:", newFee[0]);
    res.status(201).json(newFee[0]);
  } catch (error) {
    console.error("Error creating event fee:", error);
    res.status(500).json({
      message: "Failed to create event fee",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router8.patch("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    console.log("Updating fee:", feeId, "for event:", eventId, "with data:", req.body);
    const updatedFee = await db.update(eventFees).set({
      ...req.body,
      eventId: BigInt(eventId),
      beginDate: req.body.beginDate ? new Date(req.body.beginDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(eventFees.id, parseInt(feeId))).returning();
    console.log("Updated fee:", updatedFee[0]);
    res.json(updatedFee[0]);
  } catch (error) {
    console.error("Error updating event fee:", error);
    res.status(500).json({
      message: "Failed to update event fee",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router8.delete("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    console.log("Deleting fee:", feeId, "from event:", eventId);
    const deletedFee = await db.delete(eventFees).where(eq7(eventFees.id, parseInt(feeId))).returning();
    console.log("Deleted fee:", deletedFee[0]);
    res.json(deletedFee[0]);
  } catch (error) {
    console.error("Error deleting event fee:", error);
    res.status(500).json({
      message: "Failed to delete event fee",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
var fees_default = router8;

// server/routes/age-groups.ts
init_db();
init_schema();
import { Router as Router9 } from "express";
import { eq as eq8 } from "drizzle-orm";
var router9 = Router9();
router9.get("/:ageGroupId/brackets", async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    const brackets = await db.select().from(eventBrackets).where(eq8(eventBrackets.ageGroupId, parseInt(ageGroupId))).orderBy(eventBrackets.sortOrder);
    res.json(brackets);
  } catch (error) {
    console.error("Error fetching age group brackets:", error);
    res.status(500).json({ error: "Failed to fetch age group brackets" });
  }
});
router9.get("/:ageGroupId", async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    const ageGroup = await db.select().from(eventAgeGroups).where(eq8(eventAgeGroups.id, parseInt(ageGroupId))).limit(1);
    if (ageGroup.length === 0) {
      return res.status(404).json({ error: "Age group not found" });
    }
    res.json(ageGroup[0]);
  } catch (error) {
    console.error("Error fetching age group:", error);
    res.status(500).json({ error: "Failed to fetch age group" });
  }
});
var age_groups_default = router9;

// server/routes/brackets.ts
init_db();
init_schema();
import { Router as Router10 } from "express";
import { eq as eq9, and as and7 } from "drizzle-orm";
var router10 = Router10();
router10.get("/", async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.query;
    if (!eventId || !ageGroupId) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "Both eventId and ageGroupId are required"
      });
    }
    const brackets = await db.select().from(eventBrackets).where(
      and7(
        eq9(eventBrackets.eventId, eventId),
        eq9(eventBrackets.ageGroupId, parseInt(ageGroupId))
      )
    ).orderBy(eventBrackets.sortOrder);
    res.json(brackets);
  } catch (error) {
    console.error("Error fetching age group brackets:", error);
    res.status(500).json({ error: "Failed to fetch age group brackets" });
  }
});
var brackets_default = router10;

// server/routes/admin/events.ts
init_db();
init_schema();
import { Router as Router11 } from "express";
import { eq as eq10, sql as sql3, and as and8, lt, gt, gte, lte } from "drizzle-orm";
var router11 = Router11();
var getStatusFilterCondition = (statusFilter) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (statusFilter === "past") {
    return lt(events.endDate, now);
  } else if (statusFilter === "active") {
    return and8(
      lte(events.startDate, now),
      gte(events.endDate, now)
    );
  } else if (statusFilter === "upcoming") {
    return gt(events.startDate, now);
  }
  return void 0;
};
router11.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const showArchived = req.query.showArchived === "true";
    const searchQuery = req.query.search || "";
    const statusFilter = req.query.statusFilter || "all";
    const sortField = req.query.sortField || "date";
    const sortDirection = req.query.sortDirection || "desc";
    const offset = (page - 1) * pageSize;
    let eventsQuery = db.select({
      event: events,
      applicationCount: sql3`count(distinct ${teams.id})`.mapWith(Number),
      teamCount: sql3`count(${teams.id})`.mapWith(Number)
    }).from(events).leftJoin(teams, eq10(events.id, teams.eventId));
    let whereConditions = [];
    if (!showArchived) {
      whereConditions.push(eq10(events.isArchived, false));
    }
    if (searchQuery) {
      whereConditions.push(sql3`LOWER(${events.name}) LIKE LOWER(${"%" + searchQuery + "%"})`);
    }
    if (statusFilter !== "all") {
      const statusCondition = getStatusFilterCondition(statusFilter);
      if (statusCondition) {
        whereConditions.push(statusCondition);
      }
    }
    if (whereConditions.length === 1) {
      eventsQuery = eventsQuery.where(whereConditions[0]);
    } else if (whereConditions.length > 1) {
      eventsQuery = eventsQuery.where(and8(...whereConditions));
    }
    let countQuery = db.select({
      count: sql3`count(distinct ${events.id})`.mapWith(Number)
    }).from(events);
    if (whereConditions.length === 1) {
      countQuery = countQuery.where(whereConditions[0]);
    } else if (whereConditions.length > 1) {
      countQuery = countQuery.where(and8(...whereConditions));
    }
    const countResult = await countQuery;
    const totalEvents = countResult[0]?.count || 0;
    let finalEventsQuery = eventsQuery.groupBy(events.id);
    switch (sortField) {
      case "name":
        finalEventsQuery = sortDirection === "asc" ? finalEventsQuery.orderBy(events.name) : finalEventsQuery.orderBy(sql3`${events.name} DESC`);
        break;
      case "date":
        finalEventsQuery = sortDirection === "asc" ? finalEventsQuery.orderBy(events.startDate) : finalEventsQuery.orderBy(sql3`${events.startDate} DESC`);
        break;
      case "applications":
        finalEventsQuery = sortDirection === "asc" ? finalEventsQuery.orderBy(sql3`count(distinct ${teams.id})`) : finalEventsQuery.orderBy(sql3`count(distinct ${teams.id}) DESC`);
        break;
      case "deadline":
        finalEventsQuery = sortDirection === "asc" ? finalEventsQuery.orderBy(events.applicationDeadline) : finalEventsQuery.orderBy(sql3`${events.applicationDeadline} DESC`);
        break;
      // Status sorting is a special case and will be handled client-side since it's a calculated field
      default:
        finalEventsQuery = sortDirection === "asc" ? finalEventsQuery.orderBy(events.startDate) : finalEventsQuery.orderBy(sql3`${events.startDate} DESC`);
    }
    finalEventsQuery = finalEventsQuery.limit(pageSize).offset(offset);
    const eventsList = await finalEventsQuery;
    const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
      ...event,
      applicationCount,
      teamCount
    }));
    res.set("Cache-Control", "private, max-age=300, must-revalidate");
    res.json({
      events: formattedEvents,
      pagination: {
        page,
        pageSize,
        totalEvents,
        totalPages: Math.ceil(totalEvents / pageSize)
      }
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      message: "Failed to fetch events",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router11.get("/:id", hasEventAccess, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await db.select().from(events).where(eq10(events.id, BigInt(eventId))).limit(1);
    if (!event || event.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    const ageGroups = await db.select({
      id: eventAgeGroups.id,
      ageGroup: eventAgeGroups.ageGroup,
      birthYear: eventAgeGroups.birthYear,
      gender: eventAgeGroups.gender,
      projectedTeams: eventAgeGroups.projectedTeams,
      fieldSize: eventAgeGroups.fieldSize,
      scoringRule: eventAgeGroups.scoringRule,
      amountDue: eventAgeGroups.amountDue,
      birth_date_start: eventAgeGroups.birth_date_start,
      divisionCode: eventAgeGroups.divisionCode,
      feeId: eventAgeGroupFees.feeId
    }).from(eventAgeGroups).leftJoin(
      eventAgeGroupFees,
      eq10(eventAgeGroups.id, eventAgeGroupFees.ageGroupId)
    ).where(eq10(eventAgeGroups.eventId, eventId));
    const complexAssignments = await db.select().from(eventComplexes2).where(eq10(eventComplexes2.eventId, eventId));
    const fieldSizes = await db.select().from(eventFieldSizes).where(eq10(eventFieldSizes.eventId, eventId));
    const scoringRules = await db.select().from(eventScoringRules).where(eq10(eventScoringRules.eventId, eventId));
    const fees = await db.select().from(eventFees).where(eq10(eventFees.eventId, BigInt(eventId)));
    const result = {
      ...event[0],
      ageGroups: ageGroups.map((group) => ({
        ...group,
        selected: true
      })),
      complexes: complexAssignments,
      fieldSizes,
      scoringRules,
      fees
    };
    res.json(result);
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({
      message: "Failed to fetch event details",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router11.delete("/:id", hasEventAccess, async (req, res) => {
  try {
    const eventId = BigInt(req.params.id);
    console.log("Starting event deletion for ID:", eventId);
    await db.transaction(async (tx) => {
      await tx.delete(coupons).where(eq10(coupons.eventId, eventId)).execute();
      console.log("Deleted coupons");
      const ageGroupRows = await tx.select({ id: eventAgeGroups.id }).from(eventAgeGroups).where(eq10(eventAgeGroups.eventId, eventId.toString()));
      const ageGroupIds = ageGroupRows.map((row) => row.id);
      if (ageGroupIds.length > 0) {
        for (const ageGroupId of ageGroupIds) {
          await tx.delete(eventAgeGroupFees).where(eq10(eventAgeGroupFees.ageGroupId, ageGroupId)).execute();
        }
      }
      console.log("Deleted fee assignments");
      await tx.delete(eventFees).where(eq10(eventFees.eventId, eventId)).execute();
      console.log("Deleted event fees");
      console.log("Age group deletion disabled - eligibility managed separately");
      await tx.delete(eventComplexes2).where(eq10(eventComplexes2.eventId, eventId.toString())).execute();
      console.log("Deleted event complexes");
      await tx.delete(eventFieldSizes).where(eq10(eventFieldSizes.eventId, eventId.toString())).execute();
      console.log("Deleted event field sizes");
      await tx.delete(eventScoringRules).where(eq10(eventScoringRules.eventId, eventId.toString())).execute();
      console.log("Deleted event scoring rules");
      const [deletedEvent] = await tx.delete(events).where(eq10(events.id, eventId)).returning();
      if (!deletedEvent) {
        throw new Error("Event not found");
      }
    });
    console.log("Successfully deleted event:", eventId);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete event",
      details: error instanceof Error ? error.stack : void 0
    });
  }
});
router11.patch("/:id/toggle-archive", hasEventAccess, async (req, res) => {
  try {
    const eventId = BigInt(req.params.id);
    const [currentEvent] = await db.select().from(events).where(eq10(events.id, eventId));
    if (!currentEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    const isArchived = !currentEvent.isArchived;
    const [updatedEvent] = await db.update(events).set({
      isArchived,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq10(events.id, eventId)).returning();
    if (!updatedEvent) {
      return res.status(404).json({ error: "Failed to update event" });
    }
    res.json({
      message: isArchived ? "Event archived successfully" : "Event unarchived successfully",
      event: updatedEvent
    });
  } catch (error) {
    console.error("Error toggling event archive status:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to toggle event archive status",
      details: error instanceof Error ? error.stack : void 0
    });
  }
});
var events_default = router11;

// server/routes/admin/age-groups.ts
init_db();
init_schema();
import { Router as Router12 } from "express";
import { eq as eq11, sql as sql4 } from "drizzle-orm";

// server/lib/ageGroupGenerator.ts
function getFieldSize(ageGroup) {
  if (!ageGroup.startsWith("U")) return "11v11";
  const age = parseInt(ageGroup.substring(1));
  if (age <= 7) return "4v4";
  if (age <= 10) return "7v7";
  if (age <= 12) return "9v9";
  return "11v11";
}
function generateStandardAgeGroups(config = {}) {
  const {
    includeCoed = false,
    coedOnly = false,
    includeU19Consolidated = false,
    customYearOffset = 0
  } = config;
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear() + customYearOffset;
  const ageGroups = [];
  const ageRanges = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  for (const age of ageRanges) {
    const ageGroup = `U${age}`;
    const birthYear = currentYear - age;
    const fieldSize = getFieldSize(ageGroup);
    if (age === 18 && includeU19Consolidated) {
      continue;
    }
    const effectiveBirthYear = age === 19 && includeU19Consolidated ? currentYear - 18 : birthYear;
    if (coedOnly) {
      ageGroups.push({
        ageGroup: includeU19Consolidated && age === 19 ? "U19" : ageGroup,
        birthYear: effectiveBirthYear,
        gender: "Coed",
        divisionCode: `C${effectiveBirthYear}`,
        fieldSize,
        projectedTeams: 8
      });
    } else {
      ageGroups.push({
        ageGroup: includeU19Consolidated && age === 19 ? "U19" : ageGroup,
        birthYear: effectiveBirthYear,
        gender: "Boys",
        divisionCode: `B${effectiveBirthYear}`,
        fieldSize,
        projectedTeams: 8
      });
      ageGroups.push({
        ageGroup: includeU19Consolidated && age === 19 ? "U19" : ageGroup,
        birthYear: effectiveBirthYear,
        gender: "Girls",
        divisionCode: `G${effectiveBirthYear}`,
        fieldSize,
        projectedTeams: 8
      });
      if (includeCoed) {
        ageGroups.push({
          ageGroup: includeU19Consolidated && age === 19 ? "U19" : ageGroup,
          birthYear: effectiveBirthYear,
          gender: "Coed",
          divisionCode: `C${effectiveBirthYear}`,
          fieldSize,
          projectedTeams: 8
        });
      }
    }
  }
  ageGroups.sort((a, b) => {
    const getAgeNumber = (ageGroup) => parseInt(ageGroup.substring(1));
    const ageA = getAgeNumber(a.ageGroup);
    const ageB = getAgeNumber(b.ageGroup);
    if (ageA !== ageB) {
      return ageA - ageB;
    }
    const genderOrder = { "Boys": 0, "Girls": 1, "Coed": 2 };
    return genderOrder[a.gender] - genderOrder[b.gender];
  });
  return ageGroups;
}
function formatForDatabase(ageGroups, eventId) {
  return ageGroups.map((group) => ({
    eventId,
    ageGroup: group.ageGroup,
    birthYear: group.birthYear,
    gender: group.gender,
    divisionCode: group.divisionCode,
    fieldSize: group.fieldSize,
    projectedTeams: group.projectedTeams,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    birthDateStart: new Date(group.birthYear, 0, 1).toISOString().split("T")[0],
    birthDateEnd: new Date(group.birthYear, 11, 31).toISOString().split("T")[0]
  }));
}

// server/lib/ageGroupSorter.ts
function sortAgeGroups(ageGroups) {
  return ageGroups.sort((a, b) => {
    const getAgeNumber = (ageGroup) => {
      if (ageGroup.startsWith("U")) {
        return parseInt(ageGroup.substring(1));
      }
      return 999;
    };
    const ageA = getAgeNumber(a.ageGroup);
    const ageB = getAgeNumber(b.ageGroup);
    if (ageA !== ageB) {
      return ageA - ageB;
    }
    const genderOrder = { "Boys": 0, "Girls": 1, "Coed": 2 };
    return (genderOrder[a.gender] || 3) - (genderOrder[b.gender] || 3);
  });
}

// server/routes/admin/age-groups.ts
var router12 = Router12();
router12.get("/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`Fetching age groups for event ${eventId} using unified generator`);
    const existingGroups = await db.select().from(eventAgeGroups).where(eq11(eventAgeGroups.eventId, eventId));
    console.log(`Found ${existingGroups.length} existing age groups in database`);
    if (existingGroups.length === 0) {
      console.log("No age groups found, generating standard set...");
      const standardGroups = generateStandardAgeGroups();
      const dbGroups = formatForDatabase(standardGroups, eventId);
      await db.insert(eventAgeGroups).values(dbGroups);
      console.log(`Created ${standardGroups.length} standard age groups`);
      const newGroups = await db.select().from(eventAgeGroups).where(eq11(eventAgeGroups.eventId, eventId));
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(newGroups);
      return;
    }
    const sortedGroups = sortAgeGroups(existingGroups);
    console.log(`Returning ${sortedGroups.length} age groups in unified order`);
    console.log("Age groups order:", sortedGroups.map((g) => `${g.ageGroup}-${g.gender}`).join(", "));
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json(sortedGroups);
  } catch (error) {
    console.error("Error fetching age groups:", error);
    res.status(500).json({ error: "Failed to fetch age groups" });
  }
});
router12.post("/cleanup/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const allAgeGroups = await db.select().from(eventAgeGroups).where(eq11(eventAgeGroups.eventId, eventId));
    console.log(`Found ${allAgeGroups.length} age groups for event ${eventId}`);
    const uniqueGroups = /* @__PURE__ */ new Map();
    const keptGroups = [];
    const deletedGroupIds = [];
    for (const group of allAgeGroups) {
      let key;
      if (group.divisionCode) {
        key = group.divisionCode;
      } else if (group.birthYear) {
        key = `${group.gender.charAt(0)}${group.birthYear}`;
      } else if (group.ageGroup && group.ageGroup.startsWith("U") && group.ageGroup.length > 1) {
        const year = parseInt(group.ageGroup.substring(1));
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const birthYear = currentYear - year;
        key = `${group.gender.charAt(0)}${birthYear}`;
      } else {
        key = `${group.gender}-${group.ageGroup}`;
      }
      if (!uniqueGroups.has(key)) {
        if (!group.divisionCode) {
          group.divisionCode = key;
        }
        uniqueGroups.set(key, group);
        keptGroups.push(group);
      } else {
        deletedGroupIds.push(group.id);
      }
    }
    if (deletedGroupIds.length > 0) {
      await db.transaction(async (tx) => {
        for (const keptGroup of keptGroups) {
          const matchingDuplicates = allAgeGroups.filter((g) => {
            if (keptGroup.divisionCode && g.divisionCode) {
              return g.divisionCode === keptGroup.divisionCode && g.id !== keptGroup.id;
            } else {
              return g.gender === keptGroup.gender && g.ageGroup === keptGroup.ageGroup && g.id !== keptGroup.id;
            }
          });
          for (const duplicate of matchingDuplicates) {
            await tx.execute(sql4`
              UPDATE teams 
              SET age_group_id = ${keptGroup.id} 
              WHERE age_group_id = ${duplicate.id}
            `);
          }
        }
        await tx.delete(eventAgeGroups).where(sql4`id = ANY(${deletedGroupIds})`);
      });
      console.log(`Deleted ${deletedGroupIds.length} duplicate age groups`);
    }
    res.json({
      message: "Age groups cleaned up successfully",
      totalBefore: allAgeGroups.length,
      totalAfter: keptGroups.length,
      deletedCount: deletedGroupIds.length
    });
  } catch (error) {
    console.error("Error cleaning up age groups:", error);
    res.status(500).json({ error: "Failed to clean up age groups" });
  }
});
var age_groups_default2 = router12;

// server/routes/admin/age-group-field-sizes.ts
init_db();
init_schema();
import { Router as Router13 } from "express";
import { eq as eq12 } from "drizzle-orm";
var router13 = Router13();
router13.patch("/:ageGroupId/field-size", async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    const { fieldSize } = req.body;
    if (!fieldSize || !["4v4", "7v7", "9v9", "11v11"].includes(fieldSize)) {
      return res.status(400).json({
        error: "Valid fieldSize is required (4v4, 7v7, 9v9, or 11v11)"
      });
    }
    console.log(`Updating field size for age group ${ageGroupId} to ${fieldSize}`);
    await db.update(eventAgeGroups).set({ fieldSize }).where(eq12(eventAgeGroups.id, parseInt(ageGroupId)));
    console.log(`Successfully updated age group ${ageGroupId} field size to ${fieldSize}`);
    return res.json({
      success: true,
      message: "Age group field size updated successfully",
      fieldSize
    });
  } catch (error) {
    console.error("Error updating age group field size:", error);
    return res.status(500).json({ error: "Failed to update age group field size" });
  }
});
router13.patch("/bulk/field-sizes", async (req, res) => {
  try {
    const { updates: updates2 } = req.body;
    if (!updates2 || !Array.isArray(updates2)) {
      return res.status(400).json({ error: "updates array is required" });
    }
    console.log(`Bulk updating field sizes for ${updates2.length} age groups`);
    for (const update of updates2) {
      if (update.id && update.fieldSize && ["4v4", "7v7", "9v9", "11v11"].includes(update.fieldSize)) {
        await db.update(eventAgeGroups).set({ fieldSize: update.fieldSize }).where(eq12(eventAgeGroups.id, parseInt(update.id)));
        console.log(`Updated age group ${update.id} field size to ${update.fieldSize}`);
      }
    }
    return res.json({
      success: true,
      message: `Updated field sizes for ${updates2.length} age groups`
    });
  } catch (error) {
    console.error("Error bulk updating age group field sizes:", error);
    return res.status(500).json({ error: "Failed to update age group field sizes" });
  }
});
var age_group_field_sizes_default = router13;

// server/routes/admin/organizations.ts
init_db();
init_schema();
import { Router as Router14 } from "express";
import { eq as eq13 } from "drizzle-orm";
var router14 = Router14();
router14.get("/", async (req, res) => {
  try {
    const organizations = await db.select().from(organizationSettings).orderBy(organizationSettings.name);
    res.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).send("Failed to fetch organizations");
  }
});
router14.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [organization] = await db.select().from(organizationSettings).where(eq13(organizationSettings.id, id)).limit(1);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    res.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).send("Failed to fetch organization");
  }
});
router14.post("/", async (req, res) => {
  try {
    const { name, domain, customDomain, primaryColor, secondaryColor, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }
    if (domain) {
      const [existingOrg] = await db.select().from(organizationSettings).where(eq13(organizationSettings.domain, domain)).limit(1);
      if (existingOrg) {
        return res.status(400).json({ error: "Domain is already in use" });
      }
    }
    if (customDomain) {
      try {
        const [existingCustomDomain] = await db.select().from(organizationSettings).where(eq13(organizationSettings.customDomain, customDomain)).limit(1);
        if (existingCustomDomain) {
          return res.status(400).json({ error: "Custom domain is already in use" });
        }
      } catch (err) {
        console.log("Custom domain check failed - column might not exist yet");
      }
    }
    const [organization] = await db.insert(organizationSettings).values({
      name,
      domain,
      customDomain,
      primaryColor: primaryColor || "#000000",
      secondaryColor: secondaryColor || "#32CD32",
      logoUrl,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    res.status(201).json(organization);
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).send("Failed to create organization");
  }
});
router14.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, domain, customDomain, primaryColor, secondaryColor, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }
    const [existingOrg] = await db.select().from(organizationSettings).where(eq13(organizationSettings.id, id)).limit(1);
    if (!existingOrg) {
      return res.status(404).json({ error: "Organization not found" });
    }
    if (domain && domain !== existingOrg.domain) {
      const [domainExists] = await db.select().from(organizationSettings).where(eq13(organizationSettings.domain, domain)).limit(1);
      if (domainExists) {
        return res.status(400).json({ error: "Domain is already in use" });
      }
    }
    let hasCustomDomainField = true;
    if (customDomain && (!existingOrg.customDomain || customDomain !== existingOrg.customDomain)) {
      try {
        const [customDomainExists] = await db.select().from(organizationSettings).where(eq13(organizationSettings.customDomain, customDomain)).limit(1);
        if (customDomainExists) {
          return res.status(400).json({ error: "Custom domain is already in use" });
        }
      } catch (err) {
        console.log("Custom domain check failed - column might not exist yet");
        hasCustomDomainField = false;
      }
    }
    const updateData = {
      name,
      domain,
      primaryColor: primaryColor || existingOrg.primaryColor,
      secondaryColor: secondaryColor || existingOrg.secondaryColor,
      logoUrl: logoUrl || existingOrg.logoUrl,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (hasCustomDomainField && customDomain !== void 0) {
      updateData.customDomain = customDomain;
    }
    const [updatedOrg] = await db.update(organizationSettings).set(updateData).where(eq13(organizationSettings.id, id)).returning();
    res.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).send("Failed to update organization");
  }
});
router14.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existingOrg] = await db.select().from(organizationSettings).where(eq13(organizationSettings.id, id)).limit(1);
    if (!existingOrg) {
      return res.status(404).json({ error: "Organization not found" });
    }
    await db.delete(organizationSettings).where(eq13(organizationSettings.id, id));
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).send("Failed to delete organization");
  }
});
var organizations_default = router14;

// server/routes/admin/email-providers.ts
init_db();
init_schema();
import { Router as Router15 } from "express";
import { eq as eq14 } from "drizzle-orm";
import * as nodemailer from "nodemailer";
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error("Email provider error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  });
};
var router15 = Router15();
router15.post("/test-connection", asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const { providerType, settings } = req.body;
  if (!providerType || !settings) {
    return res.status(400).json({ error: "Provider type and settings are required" });
  }
  if (providerType === "smtp") {
    if (!settings.host || !settings.port || !settings.username || !settings.password) {
      return res.status(400).json({ error: "SMTP settings are incomplete" });
    }
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: parseInt(settings.port),
      secure: parseInt(settings.port) === 465,
      auth: {
        user: settings.username,
        pass: settings.password
      }
    });
    try {
      await transporter.verify();
      return res.json({ success: true, message: "Connection successful" });
    } catch (error) {
      console.error("SMTP connection test failed:", error);
      return res.status(400).json({
        success: false,
        error: `Connection failed: ${error.message}`
      });
    }
  } else {
    return res.status(400).json({ error: "Unsupported provider type" });
  }
}));
router15.get("/", asyncHandler(async (req, res) => {
  console.log("Fetching email providers...");
  try {
    const providers = await db.select().from(emailProviderSettings).orderBy(emailProviderSettings.providerName);
    console.log("Found providers:", providers.length);
    res.json(providers);
  } catch (error) {
    console.error("Error fetching email providers:", error);
    throw error;
  }
}));
router15.post("/", asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const { providerType, providerName, settings, isActive, isDefault } = req.body;
  console.log("Creating email provider:", { providerType, providerName, isActive, isDefault });
  if (!providerType || !providerName || !settings) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (providerType === "smtp") {
    if (!settings.host || !settings.port || !settings.username || !settings.password) {
      return res.status(400).json({ error: "SMTP settings are incomplete" });
    }
    const port = parseInt(settings.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({ error: "Invalid port number" });
    }
  }
  try {
    if (isDefault) {
      await db.update(emailProviderSettings).set({ isDefault: false }).where(eq14(emailProviderSettings.isDefault, true));
    }
    const [provider] = await db.insert(emailProviderSettings).values({
      providerType,
      providerName,
      settings,
      // Store settings as JSON
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    console.log("Created provider:", provider.id);
    res.status(201).json(provider);
  } catch (error) {
    console.error("Error creating email provider:", error);
    throw error;
  }
}));
router15.patch("/:id", asyncHandler(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid provider ID" });
  }
  const { providerType, providerName, settings, isActive, isDefault } = req.body;
  if (!providerType || !providerName) {
    return res.status(400).json({ error: "Provider type and name are required" });
  }
  if (providerType === "smtp" && settings) {
    if (!settings.host || !settings.port || !settings.username || !settings.password) {
      return res.status(400).json({ error: "SMTP settings are incomplete" });
    }
    const port = parseInt(settings.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      return res.status(400).json({ error: "Invalid port number" });
    }
  }
  try {
    const [existingProvider] = await db.select().from(emailProviderSettings).where(eq14(emailProviderSettings.id, id)).limit(1);
    if (!existingProvider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    if (isDefault && !existingProvider.isDefault) {
      await db.update(emailProviderSettings).set({ isDefault: false }).where(eq14(emailProviderSettings.isDefault, true));
    }
    const [updatedProvider] = await db.update(emailProviderSettings).set({
      providerType,
      providerName,
      settings,
      isActive,
      isDefault,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq14(emailProviderSettings.id, id)).returning();
    console.log("Updated provider:", updatedProvider.id);
    res.json(updatedProvider);
  } catch (error) {
    console.error("Error updating email provider:", error);
    throw error;
  }
}));
router15.delete("/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid provider ID" });
  }
  try {
    const [provider] = await db.delete(emailProviderSettings).where(eq14(emailProviderSettings.id, id)).returning();
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    console.log("Deleted provider:", id);
    res.json({ message: "Provider deleted successfully" });
  } catch (error) {
    console.error("Error deleting email provider:", error);
    throw error;
  }
}));
var email_providers_default = router15;

// server/routes/admin/email-template-routings.ts
init_db();
init_schema();
import { Router as Router16 } from "express";
import { eq as eq15 } from "drizzle-orm";
var router16 = Router16();
var asyncHandler2 = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error("Email template routing error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  });
};
router16.get("/", asyncHandler2(async (req, res) => {
  console.log("Fetching email template routings...");
  try {
    const routings = await db.query.emailTemplateRouting.findMany({
      with: {
        provider: true
      },
      orderBy: emailTemplateRouting.templateType
    });
    console.log("Found routings:", routings.length);
    res.json(routings);
  } catch (error) {
    console.error("Error fetching email template routings:", error);
    throw error;
  }
}));
router16.post("/", asyncHandler2(async (req, res) => {
  const { templateType, providerId, fromEmail, fromName, isActive } = req.body;
  if (!templateType || !providerId || !fromEmail || !fromName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [provider] = await db.select().from(emailProviderSettings).where(eq15(emailProviderSettings.id, parseInt(providerId))).limit(1);
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    const [existingRouting] = await db.select().from(emailTemplateRouting).where(eq15(emailTemplateRouting.templateType, templateType)).limit(1);
    if (existingRouting) {
      return res.status(400).json({ error: "Template type already exists" });
    }
    const [routing] = await db.insert(emailTemplateRouting).values({
      templateType,
      providerId: parseInt(providerId),
      fromEmail,
      fromName,
      isActive: isActive ?? true
    }).returning();
    console.log("Created routing:", routing.id);
    res.status(201).json(routing);
  } catch (error) {
    console.error("Error creating email template routing:", error);
    throw error;
  }
}));
router16.patch("/:id", asyncHandler2(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid routing ID" });
  }
  const { templateType, providerId, fromEmail, fromName, isActive } = req.body;
  if (!templateType || !providerId || !fromEmail || !fromName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [existingRouting] = await db.select().from(emailTemplateRouting).where(eq15(emailTemplateRouting.id, id)).limit(1);
    if (!existingRouting) {
      return res.status(404).json({ error: "Routing not found" });
    }
    const [provider] = await db.select().from(emailProviderSettings).where(eq15(emailProviderSettings.id, parseInt(providerId))).limit(1);
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    const [routing] = await db.update(emailTemplateRouting).set({
      templateType,
      providerId: parseInt(providerId),
      fromEmail,
      fromName,
      isActive,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq15(emailTemplateRouting.id, id)).returning();
    console.log("Updated routing:", routing.id);
    res.json(routing);
  } catch (error) {
    console.error("Error updating email template routing:", error);
    throw error;
  }
}));
router16.delete("/:id", asyncHandler2(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid routing ID" });
  }
  try {
    const [routing] = await db.delete(emailTemplateRouting).where(eq15(emailTemplateRouting.id, id)).returning();
    if (!routing) {
      return res.status(404).json({ error: "Routing not found" });
    }
    console.log("Deleted routing:", id);
    res.json({ message: "Routing deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template routing:", error);
    throw error;
  }
}));
var email_template_routings_default = router16;

// server/routes/admin/members-router.ts
import express2 from "express";

// server/routes/admin/members.ts
init_db();
init_schema();
init_emailService();
import { eq as eq17, like as like2, and as and10, or as or3, desc as desc4, asc as asc2 } from "drizzle-orm";
import { sql as sql5 } from "drizzle-orm";
async function getAllMembers(req, res) {
  try {
    const { search, page = "1", limit = "15", sort = "lastName", order = "asc" } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;
    let whereClause;
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause = or3(
        like2(users.firstName, searchTerm),
        like2(users.lastName, searchTerm),
        like2(users.email, searchTerm),
        like2(users.username, searchTerm)
      );
    }
    const countQuery = whereClause ? db.select({ count: sql5`count(*)` }).from(users).where(whereClause) : db.select({ count: sql5`count(*)` }).from(users);
    const [countResult] = await countQuery;
    const totalCount = countResult?.count || 0;
    const sortColumn = sort === "firstName" ? users.firstName : sort === "email" ? users.email : sort === "createdAt" ? users.createdAt : users.lastName;
    const sortOrder = order === "desc" ? desc4(sortColumn) : asc2(sortColumn);
    const membersQuery = whereClause ? db.select().from(users).where(whereClause).orderBy(sortOrder).limit(limitNumber).offset(offset) : db.select().from(users).orderBy(sortOrder).limit(limitNumber).offset(offset);
    const members = await membersQuery;
    res.json({
      members,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber)
      }
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
}
async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);
    const [member] = await db.select().from(users).where(eq17(users.id, memberId)).limit(1);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }
    const teamRegistrations = await db.select({
      team: teams,
      event: events,
      ageGroup: eventAgeGroups
    }).from(teams).leftJoin(events, eq17(teams.eventId, events.id)).leftJoin(eventAgeGroups, eq17(teams.ageGroupId, eventAgeGroups.id)).where(
      or3(
        sql5`${teams.coach}::text LIKE ${"%" + member.email + "%"}`,
        eq17(teams.managerEmail, member.email)
      )
    ).orderBy(desc4(teams.createdAt));
    const [playerCount] = await db.select({ count: sql5`count(*)` }).from(players).leftJoin(teams, eq17(players.teamId, teams.id)).where(
      or3(
        sql5`${teams.coach}::text LIKE ${"%" + member.email + "%"}`,
        eq17(teams.managerEmail, member.email)
      )
    );
    const formattedRegistrations = teamRegistrations.map((reg) => ({
      id: reg.team.id,
      teamName: reg.team.name,
      eventName: reg.event?.name || "Unknown Event",
      ageGroup: reg.ageGroup?.ageGroup || "Unknown Age Group",
      registrationDate: reg.team.createdAt,
      status: reg.team.status || "pending",
      amountPaid: reg.team.registrationFee || 0,
      termsAccepted: reg.team.termsAcknowledged || false,
      termsAcceptedAt: reg.team.termsAcknowledgedAt || reg.team.createdAt
    }));
    res.json({
      member,
      registrations: formattedRegistrations,
      playerCount: playerCount?.count || 0
    });
  } catch (error) {
    console.error("Error fetching member details:", error);
    res.status(500).json({ error: "Failed to fetch member details" });
  }
}
async function getTeamRegistrationDetails(req, res) {
  try {
    const { teamId } = req.params;
    const teamIdNumber = parseInt(teamId);
    const [registration] = await db.select({
      team: teams,
      event: events,
      ageGroup: eventAgeGroups
    }).from(teams).leftJoin(events, eq17(teams.eventId, events.id)).leftJoin(eventAgeGroups, eq17(teams.ageGroupId, eventAgeGroups.id)).where(eq17(teams.id, teamIdNumber)).limit(1);
    if (!registration) {
      return res.status(404).json({ error: "Team registration not found" });
    }
    const teamPlayers = await db.select().from(players).where(eq17(players.teamId, teamIdNumber)).orderBy(asc2(players.lastName));
    let submitter = null;
    let coachEmail = null;
    if (registration.team.coach) {
      try {
        const coachData = JSON.parse(registration.team.coach);
        coachEmail = coachData.headCoachEmail;
      } catch (error) {
        console.error("Error parsing coach data:", error);
      }
    }
    if (coachEmail) {
      [submitter] = await db.select().from(users).where(eq17(users.email, coachEmail)).limit(1);
    }
    res.json({
      registration,
      players: teamPlayers,
      submitter
    });
  } catch (error) {
    console.error("Error fetching registration details:", error);
    res.status(500).json({ error: "Failed to fetch registration details" });
  }
}
async function resendPaymentConfirmation(req, res) {
  try {
    const { teamId } = req.params;
    const teamIdNumber = parseInt(teamId);
    const [registration] = await db.select({
      team: teams,
      event: events,
      ageGroup: eventAgeGroups
    }).from(teams).leftJoin(events, eq17(teams.eventId, events.id)).leftJoin(eventAgeGroups, eq17(teams.ageGroupId, eventAgeGroups.id)).where(eq17(teams.id, teamIdNumber)).limit(1);
    if (!registration) {
      return res.status(404).json({ error: "Team registration not found" });
    }
    let submitterEmail = registration.team.managerEmail;
    if (!submitterEmail && registration.team.coach) {
      try {
        const coachData = JSON.parse(registration.team.coach);
        if (coachData.headCoachEmail) {
          submitterEmail = coachData.headCoachEmail;
        }
      } catch (error) {
        console.error("Error parsing coach data:", error);
      }
    }
    if (!submitterEmail && registration.team.coach) {
      try {
        const coachData = JSON.parse(registration.team.coach);
        if (coachData.headCoachName) {
          const [user] = await db.select().from(users).where(sql5`LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) = LOWER(${coachData.headCoachName})`).limit(1);
          if (user) {
            submitterEmail = user.email;
          }
        }
      } catch (error) {
        console.error("Error finding coach user:", error);
      }
    }
    const feeAmount = registration.team.registrationFee ? `$${(registration.team.registrationFee / 100).toFixed(2)}` : "N/A";
    if (submitterEmail) {
      await sendTemplatedEmail(
        submitterEmail,
        "payment_confirmation",
        {
          teamName: registration.team.name,
          eventName: registration.event?.name || "Unknown Event",
          registrationDate: new Date(registration.team.createdAt).toLocaleDateString(),
          amount: feeAmount,
          ageGroup: registration.ageGroup?.ageGroup || "Unknown Age Group",
          paymentId: `TEAM-${registration.team.id}`,
          receiptNumber: `R-${registration.team.id}-${Date.now().toString().substr(-6)}`,
          status: registration.team.status || "pending"
        }
      );
      res.json({
        success: true,
        message: `Payment confirmation email sent to ${submitterEmail}`
      });
    } else {
      res.status(400).json({ error: "No valid email found to send confirmation" });
    }
  } catch (error) {
    console.error("Error resending payment confirmation:", error);
    res.status(500).json({ error: "Failed to resend payment confirmation email" });
  }
}
async function getCurrentUserRegistrations(req, res) {
  try {
    let userId;
    if (req.emulatedUserId) {
      userId = req.emulatedUserId;
      console.log(`Emulation detected: Using emulated user ID ${req.emulatedUserId} instead of actual user ID ${req.user?.id}`);
    } else {
      userId = req.user?.id;
    }
    if (!userId) {
      return res.status(401).json({ error: "You must be logged in to view your registrations" });
    }
    const [user] = await db.select().from(users).where(eq17(users.id, userId)).limit(1);
    if (!user || !user.email) {
      return res.status(404).json({ error: "User email not found" });
    }
    console.log(`Fetching registrations for user: ${user.email}`);
    const whereConditions = [
      // Check if coach field contains this user's email exactly (not partial match)
      sql5`${teams.coach}::text LIKE ${'%"headCoachEmail":"' + user.email + '"%'}`,
      // Check manager email for exact match
      eq17(teams.managerEmail, user.email),
      // Check submitter email for exact match
      eq17(teams.submitterEmail, user.email)
    ];
    if (!req.emulatedUserId && req.user?.id === userId) {
      whereConditions.push(
        // For users with matching name, also try to include their teams (only for non-emulated sessions)
        sql5`${teams.coach}::text LIKE ${"%" + user.firstName + "%" + user.lastName + "%"}`,
        // Handle special cases (like Team Indigo) for migration purposes (only for non-emulated sessions)
        and10(
          eq17(teams.id, 32),
          // Team Indigo ID
          eq17(user.id, 71)
          // This specific user ID
        )
      );
    }
    const teamRegistrations = await db.select({
      team: teams,
      event: events,
      ageGroup: eventAgeGroups
    }).from(teams).leftJoin(events, eq17(teams.eventId, events.id)).leftJoin(eventAgeGroups, eq17(teams.ageGroupId, eventAgeGroups.id)).where(or3(...whereConditions)).orderBy(desc4(teams.createdAt));
    console.log(`Found ${teamRegistrations.length} team registrations`);
    const playerCount = { count: 0 };
    const formattedRegistrations = await Promise.all(teamRegistrations.map(async (reg) => {
      const registration = {
        id: reg.team.id,
        teamName: reg.team.name,
        eventName: reg.event?.name || "Unknown Event",
        eventId: reg.event?.id.toString() || "",
        ageGroup: reg.ageGroup?.ageGroup || "Unknown Age Group",
        registeredAt: reg.team.createdAt,
        status: reg.team.status || "registered",
        amount: reg.team.registrationFee || 0,
        paymentId: reg.team.paymentIntentId || void 0,
        // Additional payment details
        paymentDate: reg.team.paidAt || void 0,
        cardLastFour: reg.team.cardLastFour || void 0,
        paymentStatus: reg.team.paymentStatus || void 0,
        errorCode: reg.team.paymentErrorCode || void 0,
        errorMessage: reg.team.paymentErrorMessage || void 0,
        // Improved payment method tracking
        payLater: reg.team.payLater || false,
        setupIntentId: reg.team.setupIntentId || void 0,
        paymentMethodId: reg.team.paymentMethodId || void 0,
        stripeCustomerId: reg.team.stripeCustomerId || void 0,
        // Card details from database if available
        cardDetails: {
          brand: reg.team.cardBrand || void 0,
          last4: reg.team.cardLastFour || void 0,
          expMonth: reg.team.cardExpMonth || void 0,
          expYear: reg.team.cardExpYear || void 0
        }
      };
      try {
        if (reg.team.coach) {
          let coachData = {};
          try {
            coachData = JSON.parse(reg.team.coach);
          } catch (e) {
            console.log("Could not parse coach data");
          }
          if (coachData && typeof coachData === "object") {
            registration.submitter = {
              name: coachData.headCoachName || "Unknown",
              email: coachData.headCoachEmail || reg.team.managerEmail || reg.team.submitterEmail || "Unknown"
            };
          }
        } else if (reg.team.managerEmail) {
          registration.submitter = {
            name: reg.team.managerName || "Team Manager",
            email: reg.team.managerEmail
          };
        } else if (reg.team.submitterEmail) {
          registration.submitter = {
            name: reg.team.submitterName || "Submitter",
            email: reg.team.submitterEmail
          };
        }
      } catch (e) {
        console.log("Error extracting submitter info", e);
      }
      return registration;
    }));
    res.json({
      registrations: formattedRegistrations,
      playerCount: playerCount?.count || 0
    });
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    res.status(500).json({ error: "Failed to fetch registration details" });
  }
}

// server/routes/admin/members-router.ts
var membersRouter = express2.Router();
membersRouter.get("/", getAllMembers);
membersRouter.get("/registrations/:teamId", getTeamRegistrationDetails);
membersRouter.get("/:id", getMemberById);
membersRouter.post("/registrations/:teamId/resend-payment-confirmation", resendPaymentConfirmation);
membersRouter.get("/me/registrations", getCurrentUserRegistrations);
var members_router_default = membersRouter;

// server/routes/admin/teams-router.ts
import { Router as Router17 } from "express";

// server/routes/admin/teams.ts
init_db();
init_schema();
init_vite();
init_emailService();
init_stripeService();
import { eq as eq19, or as or4, like as like3, asc as asc3, desc as desc5, sql as sql6 } from "drizzle-orm";
async function getTeams(req, res) {
  try {
    const { eventId, status, search, sortBy = "createdAt", sortOrder = "desc" } = req.query;
    let query = db.select({
      team: teams,
      event: {
        id: events.id,
        name: events.name
      },
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }
    }).from(teams).leftJoin(events, eq19(teams.eventId, events.id)).leftJoin(users, eq19(teams.managerEmail, users.email));
    if (eventId) {
      query = query.where(eq19(teams.eventId, eventId));
    }
    if (status) {
      query = query.where(eq19(teams.status, status));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or4(
          like3(teams.name, searchTerm),
          like3(teams.managerEmail, searchTerm),
          like3(teams.submitterEmail, searchTerm)
        )
      );
    }
    if (sortBy && sortOrder) {
      if (sortBy === "createdAt") {
        query = query.orderBy(sortOrder === "asc" ? asc3(teams.createdAt) : desc5(teams.createdAt));
      } else if (sortBy === "name") {
        query = query.orderBy(sortOrder === "asc" ? asc3(teams.name) : desc5(teams.name));
      }
    }
    const result = await query;
    res.json(result);
  } catch (error) {
    log(`Error getting teams: ${error}`, "admin");
    res.status(500).json({ error: "Failed to retrieve teams" });
  }
}
async function getTeamById(req, res) {
  try {
    const { teamId } = req.params;
    const result = await db.select({
      team: teams,
      event: {
        id: events.id,
        name: events.name
      },
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }
    }).from(teams).leftJoin(events, eq19(teams.eventId, events.id)).leftJoin(users, eq19(teams.managerEmail, users.email)).where(eq19(teams.id, parseInt(teamId)));
    if (result.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    res.json(result[0]);
  } catch (error) {
    log(`Error getting team details: ${error}`, "admin");
    res.status(500).json({ error: "Failed to retrieve team details" });
  }
}
async function updateTeamStatus(req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const teamId = req.params?.teamId;
    const status = req.body?.status;
    const notes = req.body?.notes;
    if (!teamId || !status) {
      return res.status(400).json({
        status: "error",
        error: "Missing required parameters",
        details: !teamId ? "Team ID is required" : "Status is required"
      });
    }
    log(`Processing team status update. TeamID: ${teamId}, Status: ${status}, Notes: ${notes ? "provided" : "none"}`, "admin");
    const validStatuses = ["registered", "approved", "rejected", "paid", "withdrawn", "refunded", "waitlisted"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }
    let currentTeam;
    try {
      const teamResult = await db.select().from(teams).where(eq19(teams.id, parseInt(teamId, 10)));
      if (teamResult && teamResult.length > 0) {
        currentTeam = teamResult[0];
      }
    } catch (dbError) {
      log(`Database error fetching team: ${dbError}`, "admin");
      return res.status(500).json({
        status: "error",
        error: "Database error fetching team",
        message: "Failed to retrieve team details"
      });
    }
    if (!currentTeam) {
      return res.status(404).json({
        status: "error",
        error: "Team not found"
      });
    }
    if (currentTeam.status === status) {
      return res.status(400).json({
        status: "error",
        error: `Team is already ${status}`
      });
    }
    log(`Team found. Current status: ${currentTeam.status}, Updating to: ${status}`, "admin");
    let updatedTeam;
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updateResult = await db.update(teams).set({
        status,
        notes: notes || null,
        // Using notes instead of adminNotes to match schema
        // Use the drizzle update pattern correctly to avoid TypeScript errors
        updatedAt: sql6`${now}`
      }).where(eq19(teams.id, parseInt(teamId, 10))).returning();
      if (updateResult && updateResult.length > 0) {
        updatedTeam = updateResult[0];
      } else {
        throw new Error("No rows updated");
      }
    } catch (updateError) {
      log(`Database error updating team status: ${updateError}`, "admin");
      return res.status(500).json({
        status: "error",
        error: "Database error updating team status",
        message: "Failed to update team status in database"
      });
    }
    log(`Team status updated successfully to ${status}`, "admin");
    let emailStatus = "not_sent";
    let emailRecipients = [];
    try {
      let event = null;
      try {
        const eventId = currentTeam.eventId;
        if (eventId) {
          const eventResult = await db.select().from(events).where(eq19(events.id, parseInt(eventId.toString(), 10)));
          if (eventResult && eventResult.length > 0) {
            event = eventResult[0];
          }
        }
      } catch (eventError) {
        log(`Error fetching event for email notification: ${eventError}`, "admin");
      }
      if (currentTeam.submitterEmail) {
        emailRecipients = [currentTeam.submitterEmail];
      }
      if (currentTeam.managerEmail && currentTeam.submitterEmail && currentTeam.managerEmail !== currentTeam.submitterEmail) {
        emailRecipients.push(currentTeam.managerEmail);
      }
      let emailTemplate = "team_status_update";
      if (status === "approved") emailTemplate = "team_approved";
      if (status === "rejected") emailTemplate = "team_rejected";
      if (status === "withdrawn") emailTemplate = "team_withdrawn";
      if (status === "waitlisted") emailTemplate = "team_waitlisted";
      log(`Using email template: ${emailTemplate} for notification`, "admin");
      for (const recipient of emailRecipients) {
        if (recipient) {
          const templateData = {
            teamName: currentTeam.name || "your team",
            eventName: event?.name || "the event",
            notes: notes || "",
            status,
            loginLink: `${process.env.PUBLIC_URL || ""}/dashboard`,
            previousStatus: currentTeam.status || "registered"
          };
          try {
            await sendTemplatedEmail(
              recipient,
              emailTemplate,
              templateData
            );
            log(`Email notification sent to ${recipient}`, "admin");
          } catch (singleEmailError) {
            log(`Failed to send email to ${recipient}: ${singleEmailError}`, "admin");
          }
        }
      }
      emailStatus = "sent";
    } catch (emailError) {
      log(`Failed to send status notification email: ${emailError}`, "admin");
      emailStatus = "failed";
    }
    return res.json({
      status: "success",
      team: updatedTeam,
      notification: {
        status: emailStatus,
        recipients: emailRecipients,
        message: emailStatus === "sent" ? "Email notification sent successfully" : emailStatus === "failed" ? "Status updated but email notification failed" : "No email notification attempted"
      }
    });
  } catch (error) {
    log(`Unexpected error updating team status: ${error}`, "admin");
    if (error instanceof Error) {
      log(`Error stack: ${error.stack}`, "admin");
    }
    return res.status(500).json({
      status: "error",
      error: "Failed to update team status",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}
async function processRefund(req, res) {
  res.setHeader("Content-Type", "application/json");
  try {
    const { teamId } = req.params;
    const { reason, amount } = req.body;
    const isPartialRefund = amount !== void 0 && amount !== null;
    log(`Processing ${isPartialRefund ? "partial" : "full"} refund for team ID: ${teamId}. ${isPartialRefund ? `Amount: $${amount / 100}` : ""} Reason: ${reason || "Not provided"}`, "admin");
    const teamResult = await db.select().from(teams).where(eq19(teams.id, parseInt(teamId, 10)));
    if (!teamResult || teamResult.length === 0) {
      return res.status(404).json({
        status: "error",
        error: "Team not found"
      });
    }
    const team = teamResult[0];
    const paidAmount = team.totalAmount || team.registrationFee;
    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({
        status: "error",
        error: "No payment found for this team"
      });
    }
    if (team.status === "refunded") {
      return res.status(400).json({
        status: "error",
        error: "This team registration has already been refunded"
      });
    }
    log(`Team found. Current status: ${team.status}. Processing refund...`, "admin");
    let refundId = "manual-refund";
    let stripeRefundStatus = "not_attempted";
    let refundAmount = team.totalAmount || team.registrationFee || 0;
    const isDevelopment = process.env.NODE_ENV !== "production";
    if (team.paymentIntentId) {
      try {
        const refund = await createRefund(
          team.paymentIntentId,
          isPartialRefund ? amount : void 0
        );
        refundId = refund.id;
        stripeRefundStatus = "success";
        log(`Stripe ${isPartialRefund ? "partial" : "full"} refund processed successfully. Refund ID: ${refundId}`, "admin");
      } catch (stripeError) {
        stripeRefundStatus = "failed";
        log(`Stripe refund failed: ${stripeError}. Proceeding with manual refund tracking.`, "admin");
      }
    } else if (isDevelopment) {
      try {
        log(`Creating test payment intent for refund testing in development mode`, "admin");
        const testIntent = await createTestPaymentIntent(refundAmount * 100, {
          teamId,
          teamName: team.name || "Test Team",
          eventId: team.eventId?.toString() || "",
          test_mode: "true",
          manual_creation: "true"
        });
        if (testIntent && testIntent.id) {
          const refund = await createRefund(testIntent.id, reason);
          refundId = refund.id;
          stripeRefundStatus = "success";
          await db.update(teams).set({ paymentIntentId: testIntent.id }).where(eq19(teams.id, parseInt(teamId, 10)));
          log(`Test payment intent created and refunded in development mode. Refund ID: ${refundId}`, "admin");
        } else {
          log(`Failed to create test payment intent. Using manual refund tracking.`, "admin");
        }
      } catch (testError) {
        log(`Error creating test payment intent for refund: ${testError}. Using manual refund tracking.`, "admin");
      }
    } else {
      log(`No payment intent ID found. Using manual refund tracking.`, "admin");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updatedTeamResult = await db.update(teams).set({
      status: "refunded",
      refundDate: now,
      notes: reason ? `${team.notes || ""} 
Refund reason: ${reason}`.trim() : team.notes,
      // Use SQL template for the timestamp to avoid TypeScript errors
      updatedAt: sql6`${now}`
    }).where(eq19(teams.id, parseInt(teamId, 10))).returning();
    if (!updatedTeamResult || updatedTeamResult.length === 0) {
      throw new Error("Failed to update team record");
    }
    const updatedTeam = updatedTeamResult[0];
    log(`Team database record updated to refunded status`, "admin");
    let emailStatus = "not_sent";
    let emailRecipients = [];
    try {
      let event = null;
      if (team.eventId) {
        const eventId = typeof team.eventId === "string" ? parseInt(team.eventId, 10) : team.eventId;
        const eventResult = await db.select().from(events).where(eq19(events.id, eventId));
        if (eventResult && eventResult.length > 0) {
          event = eventResult[0];
        }
      }
      emailRecipients = [];
      if (team.submitterEmail) {
        emailRecipients.push(team.submitterEmail);
      }
      if (team.managerEmail && team.submitterEmail && team.managerEmail !== team.submitterEmail) {
        emailRecipients.push(team.managerEmail);
      }
      for (const recipient of emailRecipients) {
        if (recipient) {
          const refundAmountValue = isPartialRefund ? (amount / 100).toFixed(2) : ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2);
          await sendTemplatedEmail(
            recipient,
            "payment_refunded",
            {
              teamName: team.name || "your team",
              eventName: event?.name || "the event",
              amount: refundAmountValue,
              reason: reason || "Team registration was refunded",
              refundDate: (/* @__PURE__ */ new Date()).toLocaleDateString(),
              isPartial: isPartialRefund ? "true" : "false",
              originalAmount: ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2)
            }
          );
          log(`${isPartialRefund ? "Partial" : "Full"} refund notification email sent to ${recipient}`, "admin");
        }
      }
      emailStatus = "sent";
    } catch (emailError) {
      log(`Failed to send refund notification email: ${emailError}`, "admin");
      emailStatus = "failed";
    }
    const responseRefundAmount = isPartialRefund ? (amount / 100).toFixed(2) : ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2);
    return res.json({
      status: "success",
      message: "Refund processed successfully",
      team: updatedTeam,
      refund: {
        id: refundId,
        stripeStatus: stripeRefundStatus,
        amount: responseRefundAmount,
        isPartial: isPartialRefund,
        originalAmount: isPartialRefund ? ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2) : void 0,
        date: (/* @__PURE__ */ new Date()).toISOString()
      },
      notification: {
        status: emailStatus,
        recipients: emailRecipients,
        message: emailStatus === "sent" ? "Email notification sent successfully" : emailStatus === "failed" ? "Refund processed but email notification failed" : "No email notification attempted"
      }
    });
  } catch (error) {
    log(`Error processing refund: ${error}`, "admin");
    if (error instanceof Error) {
      log(`Error stack: ${error.stack}`, "admin");
    }
    return res.status(500).json({
      status: "error",
      error: "Failed to process refund",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}

// server/routes/admin/teams-router.ts
init_db();
init_schema();
import { eq as eq20, inArray as inArray4 } from "drizzle-orm";
var extractEventIdFromTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    const teamResult = await db.select({ eventId: teams.eventId }).from(teams).where(eq20(teams.id, parseInt(teamId))).limit(1);
    if (teamResult.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    req.params.eventId = teamResult[0].eventId;
    next();
  } catch (error) {
    console.error("Error extracting eventId from team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
var router17 = Router17();
router17.get("/", getTeams);
router17.get("/:teamId", extractEventIdFromTeam, hasEventAccess, getTeamById);
router17.get("/:teamId/fees", extractEventIdFromTeam, hasEventAccess, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { selectedFeeIds } = req.query;
    if (!selectedFeeIds) {
      return res.status(400).json({ message: "No fee IDs provided" });
    }
    const team = await db.select({
      selectedFeeIds: teams.selectedFeeIds
    }).from(teams).where(eq20(teams.id, parseInt(teamId))).limit(1);
    let feeIdString = selectedFeeIds;
    if ((!feeIdString || feeIdString === "undefined") && team.length > 0 && team[0].selectedFeeIds) {
      feeIdString = team[0].selectedFeeIds;
    }
    const feeIdsArray = feeIdString.split(",").map((id) => id.trim().replace(/[^0-9]/g, "")).filter((id) => id && !isNaN(parseInt(id))).map((id) => parseInt(id));
    if (feeIdsArray.length === 0) {
      return res.json([]);
    }
    const fees = await db.select({
      id: eventFees.id,
      name: eventFees.name,
      amount: eventFees.amount,
      feeType: eventFees.feeType,
      isRequired: eventFees.isRequired
    }).from(eventFees).where(inArray4(eventFees.id, feeIdsArray));
    const processedFees = fees.map((fee) => {
      let normalizedAmount = typeof fee.amount === "number" ? fee.amount : 0;
      if (normalizedAmount > 1e3) {
        normalizedAmount = normalizedAmount / 100;
      }
      const fixedAmount = Number(normalizedAmount.toFixed(2));
      console.log(`Processing fee: id=${fee.id}, name=${fee.name}, original=${fee.amount}, normalized=${normalizedAmount}, final=${fixedAmount}`);
      return {
        ...fee,
        amount: fixedAmount
      };
    });
    console.log("Sending processed fees to client:", JSON.stringify(processedFees));
    res.json(processedFees);
  } catch (error) {
    console.error("Error fetching team fee details:", error);
    res.status(500).json({
      message: "Failed to fetch team fee details",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router17.put("/:teamId/status", extractEventIdFromTeam, hasEventAccess, updateTeamStatus);
router17.patch("/:teamId/status", extractEventIdFromTeam, hasEventAccess, updateTeamStatus);
router17.post("/:teamId/refund", extractEventIdFromTeam, hasEventAccess, processRefund);
var teams_router_default = router17;

// server/routes/admin/players-router.ts
init_db();
init_schema();
import { Router as Router18 } from "express";
import { eq as eq21 } from "drizzle-orm";
import { z as z5 } from "zod";
var router18 = Router18();
var playerSchema2 = z5.object({
  firstName: z5.string().min(1, "First name is required"),
  lastName: z5.string().min(1, "Last name is required"),
  dateOfBirth: z5.string().min(1, "Date of birth is required"),
  jerseyNumber: z5.string().optional(),
  medicalNotes: z5.string().optional(),
  emergencyContactFirstName: z5.string().min(1, "Emergency contact first name is required"),
  emergencyContactLastName: z5.string().min(1, "Emergency contact last name is required"),
  emergencyContactPhone: z5.string().min(1, "Emergency contact phone is required"),
  isActive: z5.boolean().default(true)
});
router18.get("/:teamId/players", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = await db.query.teams.findFirst({
      where: eq21(teams.id, teamId)
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    const playersList = await db.query.players.findMany({
      where: eq21(players.teamId, teamId)
    });
    return res.json(playersList);
  } catch (error) {
    console.error("Error fetching players:", error);
    return res.status(500).json({ error: "Failed to fetch players" });
  }
});
router18.post("/:teamId/players", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerData = req.body;
    const team = await db.query.teams.findFirst({
      where: eq21(teams.id, teamId)
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    try {
      playerSchema2.parse(playerData);
    } catch (error) {
      return res.status(400).json({ error: error.errors || "Invalid player data" });
    }
    const processedPlayerData = {
      ...playerData,
      // Convert jersey number to integer if it's a non-empty string, otherwise set to null
      jerseyNumber: playerData.jerseyNumber && playerData.jerseyNumber !== "" ? parseInt(playerData.jerseyNumber) : null
    };
    const newPlayer = await db.insert(players).values({
      ...processedPlayerData,
      teamId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return res.status(201).json(newPlayer[0]);
  } catch (error) {
    console.error("Error adding player:", error);
    return res.status(500).json({ error: "Failed to add player" });
  }
});
router18.put("/:teamId/players/:playerId", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    const playerData = req.body;
    const player = await db.query.players.findFirst({
      where: eq21(players.id, playerId)
    });
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    if (player.teamId !== teamId) {
      return res.status(403).json({ error: "Player does not belong to this team" });
    }
    try {
      playerSchema2.parse(playerData);
    } catch (error) {
      return res.status(400).json({ error: error.errors || "Invalid player data" });
    }
    const processedPlayerData = {
      ...playerData,
      // Convert jersey number to integer if it's a non-empty string, otherwise set to null
      jerseyNumber: playerData.jerseyNumber && playerData.jerseyNumber !== "" ? parseInt(playerData.jerseyNumber) : null
    };
    const updatedPlayer = await db.update(players).set({
      ...processedPlayerData,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq21(players.id, playerId)).returning();
    return res.json(updatedPlayer[0]);
  } catch (error) {
    console.error("Error updating player:", error);
    return res.status(500).json({ error: "Failed to update player" });
  }
});
router18.delete("/:teamId/players/:playerId", async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const playerId = parseInt(req.params.playerId);
    const player = await db.query.players.findFirst({
      where: eq21(players.id, playerId)
    });
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    if (player.teamId !== teamId) {
      return res.status(403).json({ error: "Player does not belong to this team" });
    }
    await db.delete(players).where(eq21(players.id, playerId));
    return res.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Error deleting player:", error);
    return res.status(500).json({ error: "Failed to delete player" });
  }
});
var players_router_default = router18;

// server/routes/admin/brackets.ts
init_db();
init_schema();
import { Router as Router19 } from "express";
import { and as and12, eq as eq22, inArray as inArray5 } from "drizzle-orm";
var router19 = Router19();
router19.get("/events/:eventId/brackets", hasEventAccess, async (req, res) => {
  try {
    const { eventId } = req.params;
    const brackets = await db.select().from(eventBrackets).where(eq22(eventBrackets.eventId, eventId)).orderBy(eventBrackets.sortOrder);
    res.json(brackets);
  } catch (error) {
    console.error("Error fetching brackets:", error);
    res.status(500).json({ error: "Failed to fetch brackets" });
  }
});
router19.get("/events/:eventId/age-groups/:ageGroupId/brackets", hasEventAccess, async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const includeTeamCount = req.query.includeTeamCount === "true";
    const brackets = await db.select().from(eventBrackets).where(
      and12(
        eq22(eventBrackets.eventId, eventId),
        eq22(eventBrackets.ageGroupId, parseInt(ageGroupId))
      )
    ).orderBy(eventBrackets.sortOrder);
    if (includeTeamCount) {
      const bracketIds = brackets.map((bracket) => bracket.id);
      if (bracketIds.length === 0) {
        return res.json(brackets.map((bracket) => ({
          ...bracket,
          teamCount: 0
        })));
      }
      const teamCounts = await db.select({
        bracketId: teams.bracketId,
        count: db.sql`count(${teams.id})::int`
      }).from(teams).where(
        and12(
          eq22(teams.eventId, eventId),
          inArray5(teams.bracketId, bracketIds),
          eq22(teams.status, "approved")
        )
      ).groupBy(teams.bracketId);
      const countMap = teamCounts.reduce((map, item) => {
        map[item.bracketId] = item.count;
        return map;
      }, {});
      const bracketsWithCount = brackets.map((bracket) => ({
        ...bracket,
        teamCount: countMap[bracket.id] || 0
      }));
      return res.json(bracketsWithCount);
    }
    res.json(brackets);
  } catch (error) {
    console.error("Error fetching age group brackets:", error);
    res.status(500).json({ error: "Failed to fetch age group brackets" });
  }
});
router19.post("/events/:eventId/brackets", hasEventAccess, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ageGroupId, name, description, level, eligibility, sortOrder = 0 } = req.body;
    if (!ageGroupId || !name) {
      return res.status(400).json({ error: "Age group ID and name are required" });
    }
    const ageGroup = await db.select().from(eventAgeGroups).where(
      and12(
        eq22(eventAgeGroups.id, ageGroupId),
        eq22(eventAgeGroups.eventId, eventId)
      )
    ).limit(1);
    if (ageGroup.length === 0) {
      return res.status(404).json({ error: "Age group not found for this event" });
    }
    const [newBracket] = await db.insert(eventBrackets).values({
      eventId,
      ageGroupId,
      name,
      description,
      level: level || "middle_flight",
      eligibility,
      sortOrder,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    res.status(201).json(newBracket);
  } catch (error) {
    console.error("Error creating bracket:", error);
    res.status(500).json({ error: "Failed to create bracket" });
  }
});
router19.put("/events/:eventId/brackets/:bracketId", hasEventAccess, async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;
    const { name, description, level, eligibility, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Bracket name is required" });
    }
    const existingBracket = await db.select().from(eventBrackets).where(
      and12(
        eq22(eventBrackets.id, parseInt(bracketId)),
        eq22(eventBrackets.eventId, eventId)
      )
    ).limit(1);
    if (existingBracket.length === 0) {
      return res.status(404).json({ error: "Bracket not found for this event" });
    }
    const [updatedBracket] = await db.update(eventBrackets).set({
      name,
      description,
      level: level !== void 0 ? level : existingBracket[0].level,
      eligibility: eligibility !== void 0 ? eligibility : existingBracket[0].eligibility,
      sortOrder: sortOrder !== void 0 ? sortOrder : existingBracket[0].sortOrder,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(
      and12(
        eq22(eventBrackets.id, parseInt(bracketId)),
        eq22(eventBrackets.eventId, eventId)
      )
    ).returning();
    res.json(updatedBracket);
  } catch (error) {
    console.error("Error updating bracket:", error);
    res.status(500).json({ error: "Failed to update bracket" });
  }
});
router19.delete("/events/:eventId/brackets/:bracketId", hasEventAccess, async (req, res) => {
  try {
    const { eventId, bracketId } = req.params;
    const teamsUsingBracket = await db.select({ id: teams.id }).from(teams).where(
      and12(
        eq22(teams.eventId, eventId),
        eq22(teams.bracketId, parseInt(bracketId))
      )
    ).limit(1);
    if (teamsUsingBracket.length > 0) {
      return res.status(400).json({
        error: "Cannot delete bracket because there are teams assigned to it"
      });
    }
    const deletedBrackets = await db.delete(eventBrackets).where(
      and12(
        eq22(eventBrackets.id, parseInt(bracketId)),
        eq22(eventBrackets.eventId, eventId)
      )
    ).returning();
    if (deletedBrackets.length === 0) {
      return res.status(404).json({ error: "Bracket not found for this event" });
    }
    res.json({ success: true, message: "Bracket deleted successfully" });
  } catch (error) {
    console.error("Error deleting bracket:", error);
    res.status(500).json({ error: "Failed to delete bracket" });
  }
});
router19.put("/events/:eventId/teams/:teamId/bracket", hasEventAccess, async (req, res) => {
  try {
    const { eventId, teamId } = req.params;
    const { bracketId } = req.body;
    if (!bracketId) {
      return res.status(400).json({ error: "Bracket ID is required" });
    }
    const team = await db.select().from(teams).where(
      and12(
        eq22(teams.id, parseInt(teamId)),
        eq22(teams.eventId, eventId)
      )
    ).limit(1);
    if (team.length === 0) {
      return res.status(404).json({ error: "Team not found for this event" });
    }
    const bracket = await db.select().from(eventBrackets).where(
      and12(
        eq22(eventBrackets.id, bracketId),
        eq22(eventBrackets.eventId, eventId)
      )
    ).limit(1);
    if (bracket.length === 0) {
      return res.status(404).json({ error: "Bracket not found for this event" });
    }
    if (bracket[0].ageGroupId !== team[0].ageGroupId) {
      return res.status(400).json({
        error: "Bracket does not belong to the team's age group"
      });
    }
    const [updatedTeam] = await db.update(teams).set({
      bracketId
    }).where(
      and12(
        eq22(teams.id, parseInt(teamId)),
        eq22(teams.eventId, eventId)
      )
    ).returning();
    res.json(updatedTeam);
  } catch (error) {
    console.error("Error assigning bracket to team:", error);
    res.status(500).json({ error: "Failed to assign bracket to team" });
  }
});
router19.post("/events/:eventId/bulk-brackets", hasEventAccess, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { ageGroupIds, brackets } = req.body;
    if (!ageGroupIds || !Array.isArray(ageGroupIds) || ageGroupIds.length === 0) {
      return res.status(400).json({ error: "At least one age group ID is required" });
    }
    if (!brackets || !Array.isArray(brackets) || brackets.length === 0) {
      return res.status(400).json({ error: "At least one bracket definition is required" });
    }
    const ageGroups = await db.select().from(eventAgeGroups).where(
      and12(
        eq22(eventAgeGroups.eventId, eventId),
        inArray5(eventAgeGroups.id, ageGroupIds)
      )
    );
    if (ageGroups.length === 0) {
      return res.status(404).json({ error: "No valid age groups found for this event" });
    }
    const createdBrackets = [];
    const errors = [];
    for (const ageGroup of ageGroups) {
      if (req.body.replaceExisting) {
        const teamsUsingBrackets = await db.select({ id: teams.id }).from(teams).where(
          and12(
            eq22(teams.eventId, eventId),
            eq22(teams.ageGroupId, ageGroup.id),
            // Only check for teams that have a bracketId
            inArray5(
              teams.bracketId,
              db.select({ id: eventBrackets.id }).from(eventBrackets).where(eq22(eventBrackets.ageGroupId, ageGroup.id))
            )
          )
        ).limit(1);
        if (teamsUsingBrackets.length > 0) {
          errors.push({
            ageGroupId: ageGroup.id,
            message: `Cannot replace brackets for age group ${ageGroup.ageGroup} (${ageGroup.gender}) because there are teams assigned to them`
          });
          continue;
        }
        await db.delete(eventBrackets).where(
          and12(
            eq22(eventBrackets.eventId, eventId),
            eq22(eventBrackets.ageGroupId, ageGroup.id)
          )
        );
      }
      for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        try {
          const [newBracket] = await db.insert(eventBrackets).values({
            eventId,
            ageGroupId: ageGroup.id,
            name: bracket.name,
            description: bracket.description || null,
            sortOrder: i,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).returning();
          createdBrackets.push(newBracket);
        } catch (error) {
          console.error(`Error creating bracket for age group ${ageGroup.id}:`, error);
          errors.push({
            ageGroupId: ageGroup.id,
            bracketName: bracket.name,
            message: "Failed to create bracket"
          });
        }
      }
    }
    res.status(201).json({
      success: true,
      message: `Created ${createdBrackets.length} brackets across ${ageGroups.length} age groups`,
      createdBrackets,
      errors: errors.length > 0 ? errors : void 0
    });
  } catch (error) {
    console.error("Error creating brackets in bulk:", error);
    res.status(500).json({ error: "Failed to create brackets in bulk" });
  }
});
var brackets_default2 = router19;

// server/routes/admin/games-router.ts
init_db();
init_schema();
import { Router as Router20 } from "express";
import { eq as eq23, inArray as inArray6 } from "drizzle-orm";
var router20 = Router20();
router20.delete("/:gameId", hasEventAccess, async (req, res) => {
  try {
    const { gameId } = req.params;
    if (!gameId) {
      return res.status(400).json({ message: "Game ID is required" });
    }
    const parsedGameId = parseInt(gameId);
    if (isNaN(parsedGameId)) {
      return res.status(400).json({ message: "Invalid game ID format" });
    }
    const [gameToDelete] = await db.select().from(games).where(eq23(games.id, parsedGameId)).limit(1);
    if (!gameToDelete) {
      return res.status(404).json({ message: "Game not found" });
    }
    await db.delete(games).where(eq23(games.id, parsedGameId));
    return res.json({
      success: true,
      message: "Game successfully deleted",
      deletedGameId: parsedGameId
    });
  } catch (error) {
    console.error("Error deleting game:", error);
    return res.status(500).json({ message: "Failed to delete game" });
  }
});
router20.post("/batch-delete", hasEventAccess, async (req, res) => {
  try {
    const { gameIds } = req.body;
    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ message: "Game IDs array is required" });
    }
    const parsedGameIds = gameIds.map((id) => parseInt(id));
    if (parsedGameIds.some((id) => isNaN(id))) {
      return res.status(400).json({ message: "Invalid game ID format in the array" });
    }
    const result = await db.delete(games).where(inArray6(games.id, parsedGameIds));
    return res.json({
      success: true,
      message: `Successfully deleted ${parsedGameIds.length} games`,
      deletedGameIds: parsedGameIds
    });
  } catch (error) {
    console.error("Error batch deleting games:", error);
    return res.status(500).json({ message: "Failed to delete games" });
  }
});
var games_router_default = router20;

// server/routes/clubs.ts
init_db();
init_schema();
import { Router as Router21 } from "express";
import { eq as eq24, sql as sql7 } from "drizzle-orm";
import multer5 from "multer";
import path7 from "path";
import fs7 from "fs/promises";
import { v4 as uuidv46 } from "uuid";
import sharp from "sharp";
var router21 = Router21();
var storage5 = multer5.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadsDir2 = "./uploads/club-logos";
      try {
        await fs7.access(uploadsDir2);
      } catch (error) {
        await fs7.mkdir(uploadsDir2, { recursive: true });
      }
      cb(null, uploadsDir2);
    } catch (error) {
      cb(error, "./uploads/club-logos");
    }
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv46();
    const extension = path7.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${extension}`);
  }
});
var fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};
var upload5 = multer5({
  storage: storage5,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  }
});
router21.get("/", async (req, res) => {
  try {
    const clubsList = await db.select().from(clubs2).orderBy(clubs2.name);
    res.json(clubsList);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).json({ error: "Failed to fetch clubs" });
  }
});
router21.get("/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`Fetching clubs for event: ${eventId}`);
    const existingClubs = await db.execute(sql7`
      SELECT DISTINCT club_name, club_id
      FROM teams 
      WHERE event_id = ${eventId} 
      AND club_name IS NOT NULL 
      AND club_name != ''
    `);
    let clubsList = [];
    if (existingClubs.rows.length > 0) {
      console.log(`Found ${existingClubs.rows.length} club names in event ${eventId}`);
      const clubNames = existingClubs.rows.map((row) => row.club_name);
      const clubIds = existingClubs.rows.filter((row) => row.club_id !== null).map((row) => row.club_id);
      if (clubIds.length > 0) {
        clubsList = await db.select().from(clubs2).where(
          clubIds.length === 1 ? eq24(clubs2.id, clubIds[0]) : sql7`${clubs2.id} IN (${sql7.join(clubIds.map((id) => sql7`${id}`), sql7`, `)})`
        ).orderBy(clubs2.name);
      }
      if (clubNames.length > 0 && (clubIds.length === 0 || clubsList.length < clubNames.length)) {
        const nameClubs = await db.select().from(clubs2).where(
          clubNames.length === 1 ? eq24(clubs2.name, clubNames[0]) : sql7`${clubs2.name} IN (${sql7.join(clubNames.map((name) => sql7`${name}`), sql7`, `)})`
        ).orderBy(clubs2.name);
        for (const club of nameClubs) {
          if (!clubsList.some((c) => c.id === club.id)) {
            clubsList.push(club);
          }
        }
      }
    }
    console.log(`Returning ${clubsList.length} clubs for event ${eventId}`);
    res.json(clubsList);
  } catch (error) {
    console.error("Error fetching clubs for event:", error);
    res.status(500).json({ error: "Failed to fetch clubs for event" });
  }
});
router21.post("/", upload5.single("logo"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Club name is required" });
    }
    const existingClub = await db.select().from(clubs2).where(eq24(clubs2.name, name)).limit(1);
    if (existingClub.length > 0) {
      return res.status(400).json({ error: "A club with this name already exists" });
    }
    let logoUrl = null;
    if (req.file) {
      try {
        const outputPath = path7.join("./uploads/club-logos", `resized-${req.file.filename}`);
        await sharp(req.file.path).resize(200, 200, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).toFile(outputPath);
        logoUrl = `/uploads/club-logos/resized-${req.file.filename}`;
      } catch (error) {
        console.error("Error processing logo:", error);
        logoUrl = `/uploads/club-logos/${req.file.filename}`;
      }
    }
    const newClub = await db.insert(clubs2).values({
      name,
      logoUrl
    }).returning();
    res.status(201).json(newClub[0]);
  } catch (error) {
    console.error("Error creating club:", error);
    res.status(500).json({ error: "Failed to create club" });
  }
});
var clubs_default = router21;

// server/routes/admin/clubs.ts
init_db();
init_schema();
import { Router as Router22 } from "express";
import { eq as eq25, like as like4 } from "drizzle-orm";
import { z as z6 } from "zod";
var router22 = Router22();
router22.get("/", async (req, res) => {
  try {
    const clubs_list = await db.select().from(clubs2);
    return res.json(clubs_list);
  } catch (error) {
    console.error("Error getting clubs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router22.get("/:id", async (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const [club] = await db.select().from(clubs2).where(eq25(clubs2.id, clubId)).limit(1);
    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }
    return res.json(club);
  } catch (error) {
    console.error("Error getting club by ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router22.post("/", async (req, res) => {
  try {
    const clubSchema = z6.object({
      name: z6.string().min(1, "Club name is required"),
      logoUrl: z6.string().optional().nullable()
    });
    const validatedData = clubSchema.parse(req.body);
    const [club] = await db.insert(clubs2).values({
      name: validatedData.name,
      logoUrl: validatedData.logoUrl || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    return res.status(201).json(club);
  } catch (error) {
    console.error("Error creating club:", error);
    if (error instanceof z6.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
router22.patch("/:id", async (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const clubSchema = z6.object({
      name: z6.string().min(1, "Club name is required").optional(),
      logoUrl: z6.string().optional().nullable()
    });
    const validatedData = clubSchema.parse(req.body);
    const [updatedClub] = await db.update(clubs2).set({
      name: validatedData.name,
      logoUrl: validatedData.logoUrl,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq25(clubs2.id, clubId)).returning();
    if (!updatedClub) {
      return res.status(404).json({ error: "Club not found" });
    }
    return res.json(updatedClub);
  } catch (error) {
    console.error("Error updating club:", error);
    if (error instanceof z6.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
router22.delete("/:id", async (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const [deletedClub] = await db.delete(clubs2).where(eq25(clubs2.id, clubId)).returning();
    if (!deletedClub) {
      return res.status(404).json({ error: "Club not found" });
    }
    return res.json({ message: "Club deleted successfully" });
  } catch (error) {
    console.error("Error deleting club:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router22.get("/search/:query", async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const clubs_list = await db.select().from(clubs2).where(like4(clubs2.name, `%${searchQuery}%`)).limit(10);
    return res.json(clubs_list);
  } catch (error) {
    console.error("Error searching clubs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
var clubs_default2 = router22;

// server/routes/admin/event-clubs.ts
init_db();
init_schema();
import { Router as Router23 } from "express";
import { eq as eq26, sql as sql9, and as and14, isNotNull, inArray as inArray7 } from "drizzle-orm";
import { z as z7 } from "zod";
var router23 = Router23();
router23.get("/:eventId/clubs", hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const teamsWithClubs = await db.select({
      teamId: teams.id,
      teamName: teams.name,
      clubId: teams.clubId,
      clubName: teams.clubName
    }).from(teams).where(and14(
      eq26(teams.eventId, eventId),
      isNotNull(teams.clubId)
    ));
    const clubIds = [...new Set(teamsWithClubs.filter((team) => team.clubId !== null).map((team) => team.clubId))];
    let clubsData = [];
    if (clubIds.length > 0) {
      if (clubIds.length === 1) {
        clubsData = await db.select().from(clubs2).where(eq26(clubs2.id, clubIds[0]));
      } else {
        clubsData = await db.select().from(clubs2).where(inArray7(clubs2.id, clubIds));
      }
    }
    const clubStats = clubIds.map((clubId) => {
      const teamsForClub = teamsWithClubs.filter((team) => team.clubId === clubId);
      const clubData = clubsData.find((club) => club.id === clubId) || {
        id: clubId,
        name: teamsForClub[0]?.clubName || "Unknown Club",
        logoUrl: null
      };
      return {
        ...clubData,
        teamCount: teamsForClub.length
      };
    });
    return res.json(clubStats);
  } catch (error) {
    console.error(`Error getting clubs for event ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router23.get("/:eventId/clubs/clubs", hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const teamsWithClubs = await db.select({
      teamId: teams.id,
      teamName: teams.name,
      clubId: teams.clubId,
      clubName: teams.clubName
    }).from(teams).where(and14(
      eq26(teams.eventId, eventId),
      isNotNull(teams.clubId)
    ));
    const clubIds = [...new Set(teamsWithClubs.filter((team) => team.clubId !== null).map((team) => team.clubId))];
    let clubsData = [];
    if (clubIds.length > 0) {
      if (clubIds.length === 1) {
        clubsData = await db.select().from(clubs2).where(eq26(clubs2.id, clubIds[0]));
      } else {
        clubsData = await db.select().from(clubs2).where(inArray7(clubs2.id, clubIds));
      }
    }
    const clubStats = clubIds.map((clubId) => {
      const teamsForClub = teamsWithClubs.filter((team) => team.clubId === clubId);
      const clubData = clubsData.find((club) => club.id === clubId) || {
        id: clubId,
        name: teamsForClub[0]?.clubName || "Unknown Club",
        logoUrl: null
      };
      return {
        ...clubData,
        teamCount: teamsForClub.length
      };
    });
    return res.json(clubStats);
  } catch (error) {
    console.error(`Error getting clubs for event ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router23.patch("/:eventId/clubs/:clubId", hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const clubId = parseInt(req.params.clubId);
    const clubSchema = z7.object({
      name: z7.string().min(1, "Club name is required"),
      logoUrl: z7.string().optional().nullable()
    });
    const validatedData = clubSchema.parse(req.body);
    const [existingClub] = await db.select().from(clubs2).where(eq26(clubs2.id, clubId)).limit(1);
    let club;
    if (existingClub) {
      [club] = await db.update(clubs2).set({
        name: validatedData.name,
        logoUrl: validatedData.logoUrl,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }).where(eq26(clubs2.id, clubId)).returning();
    } else {
      [club] = await db.insert(clubs2).values({
        id: clubId,
        name: validatedData.name,
        logoUrl: validatedData.logoUrl || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
    }
    await db.update(teams).set({
      clubName: validatedData.name
    }).where(and14(
      eq26(teams.eventId, eventId),
      eq26(teams.clubId, clubId)
    ));
    return res.json(club);
  } catch (error) {
    console.error(`Error updating club for event ID ${req.params.eventId}:`, error);
    if (error instanceof z7.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
router23.get("/:eventId", hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const [event] = await db.select().from(events).where(eq26(events.id, eventId)).limit(1);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    const uniqueClubCount = await db.select({
      count: sql9`COUNT(DISTINCT ${teams.clubId})`
    }).from(teams).where(and14(
      eq26(teams.eventId, eventId),
      isNotNull(teams.clubId)
    )).then((result) => result[0]?.count || 0);
    const totalTeamsCount = await db.select({
      count: sql9`COUNT(*)`
    }).from(teams).where(eq26(teams.eventId, eventId)).then((result) => result[0]?.count || 0);
    return res.json({
      ...event,
      clubCount: uniqueClubCount,
      teamCount: totalTeamsCount
    });
  } catch (error) {
    console.error(`Error getting event details for ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
var event_clubs_default = router23;

// server/routes/admin/update-email-config.ts
init_db();
init_schema();
import { Router as Router24 } from "express";
import { eq as eq27 } from "drizzle-orm";
var router24 = Router24();
var SENDER_EMAIL = "support@matchpro.ai";
var SENDER_NAME = "MatchPro";
router24.post("/", async (req, res) => {
  try {
    console.log("Starting email configuration update...");
    const sendGridId = await setupSendGridProvider();
    const updatedTemplates = await updateEmailTemplates(sendGridId);
    res.json({
      success: true,
      message: "Email configuration updated successfully",
      details: {
        sendGridProviderConfigured: !!sendGridId,
        templatesUpdated: updatedTemplates
      }
    });
  } catch (error) {
    console.error("Error updating email configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update email configuration",
      error: error.message
    });
  }
});
async function setupSendGridProvider() {
  try {
    console.log("Setting up SendGrid as the primary email provider...");
    const existingProviders = await db.select().from(emailProviderSettings);
    console.log(`Found ${existingProviders.length} existing providers`);
    const sendGridProvider = existingProviders.find((p) => p.providerType === "sendgrid");
    let sendGridId = null;
    if (sendGridProvider) {
      console.log("Updating existing SendGrid provider...");
      const [updated] = await db.update(emailProviderSettings).set({
        is_active: true,
        is_default: true,
        settings: {
          apiKey: process.env.SENDGRID_API_KEY,
          from: SENDER_EMAIL
        },
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).where(eq27(emailProviderSettings.id, sendGridProvider.id)).returning();
      sendGridId = updated.id;
    } else {
      console.log("Creating new SendGrid provider...");
      const [inserted] = await db.insert(emailProviderSettings).values({
        providerType: "sendgrid",
        providerName: "SendGrid Email Service",
        settings: {
          apiKey: process.env.SENDGRID_API_KEY,
          from: SENDER_EMAIL
        },
        is_active: true,
        is_default: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      sendGridId = inserted.id;
    }
    for (const provider of existingProviders) {
      if (!sendGridProvider || provider.id !== sendGridProvider.id) {
        await db.update(emailProviderSettings).set({
          is_active: false,
          is_default: false,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq27(emailProviderSettings.id, provider.id));
      }
    }
    const updatedProviders = await db.select().from(emailProviderSettings);
    console.log("Updated providers:");
    for (const provider of updatedProviders) {
      console.log(`- ${provider.providerName} (${provider.providerType}): Active=${provider.isActive}, Default=${provider.isDefault}`);
    }
    console.log("SendGrid is now set as the primary email provider!");
    return sendGridId;
  } catch (error) {
    console.error("Error setting up SendGrid provider:", error);
    throw error;
  }
}
async function updateEmailTemplates(providerId) {
  try {
    console.log("Updating all email templates to use standard sender...");
    const templates = await db.select().from(emailTemplates);
    console.log(`Found ${templates.length} email templates to update`);
    let updatedCount = 0;
    for (const template of templates) {
      console.log(`Updating template: ${template.name} (${template.type})`);
      await db.update(emailTemplates).set({
        sender_email: SENDER_EMAIL,
        sender_name: SENDER_NAME,
        provider_id: providerId,
        updated_at: /* @__PURE__ */ new Date()
      }).where(eq27(emailTemplates.id, template.id));
      updatedCount++;
    }
    console.log(`${updatedCount} email templates updated successfully!`);
    return updatedCount;
  } catch (error) {
    console.error("Error updating email templates:", error);
    throw error;
  }
}
var update_email_config_default = router24;

// server/routes/coupons.ts
init_db();
import { sql as sql10 } from "drizzle-orm";
import { z as z8 } from "zod";
var couponSchema = z8.object({
  code: z8.string().min(1, "Code is required"),
  discountType: z8.enum(["percentage", "fixed"]),
  amount: z8.coerce.number().min(0, "Amount must be 0 or greater"),
  expirationDate: z8.string().nullable().optional().transform((val) => val ? new Date(val).toISOString() : null),
  description: z8.string().nullable().optional(),
  eventId: z8.union([z8.coerce.number().positive(), z8.null()]).optional(),
  maxUses: z8.coerce.number().positive("Max uses must be positive").nullable().optional(),
  isActive: z8.boolean().default(true)
});
async function getCoupons(req, res) {
  try {
    const eventId = req.query.eventId;
    let query;
    if (!eventId) {
      query = sql10`SELECT * FROM coupons`;
    } else {
      const numericEventId = parseInt(eventId, 10);
      if (isNaN(numericEventId)) {
        return res.status(400).json({ error: "Invalid event ID format" });
      }
      query = sql10`SELECT * FROM coupons WHERE event_id = ${numericEventId}`;
    }
    const result = await db.execute(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
}
async function updateCoupon(req, res) {
  try {
    const { id } = req.params;
    const validatedData = couponSchema.partial().parse(req.body);
    const result = await db.execute(sql10`
      UPDATE coupons SET 
        code = ${validatedData.code || null},
        discount_type = ${validatedData.discountType || null},
        amount = ${validatedData.amount || null},
        expiration_date = ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        description = ${validatedData.description || null},
        event_id = ${validatedData.eventId || null},
        max_uses = ${validatedData.maxUses || null},
        is_active = ${validatedData.isActive === void 0 ? true : validatedData.isActive},
        updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING *;
    `);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating coupon:", error);
    if (error instanceof z8.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update coupon" });
  }
}
async function deleteCoupon(req, res) {
  try {
    const { id } = req.params;
    const result = await db.execute(sql10`
      DELETE FROM coupons WHERE id = ${Number(id)} RETURNING *;
    `);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
}

// server/routes/fee-assignments.ts
init_db();
init_schema();
import { eq as eq28, and as and15, inArray as inArray8 } from "drizzle-orm";
var getFeeAssignments = async (req, res) => {
  const { eventId } = req.params;
  try {
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq28(eventAgeGroups.eventId, eventId)
    });
    const fees = await db.query.eventFees.findMany({
      where: eq28(eventFees.eventId, eventId)
    });
    const allAgeGroupIds = ageGroups.map((group) => group.id);
    const allFeeIds = fees.map((fee) => fee.id);
    let assignments = [];
    if (allAgeGroupIds.length > 0 && allFeeIds.length > 0) {
      try {
        assignments = await db.query.eventAgeGroupFees.findMany({
          where: and15(
            inArray8(eventAgeGroupFees.ageGroupId, allAgeGroupIds),
            inArray8(eventAgeGroupFees.feeId, allFeeIds)
          )
        });
        console.log(`Found ${assignments.length} fee assignments for event ${eventId}`);
      } catch (dbError) {
        console.error("Database error when fetching assignments:", dbError);
        assignments = [];
      }
    }
    return res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching fee assignments:", error);
    return res.status(500).json({ error: "Failed to fetch fee assignments" });
  }
};
var updateFeeAssignments = async (req, res) => {
  const { eventId } = req.params;
  const { feeId, ageGroupIds } = req.body;
  console.log("Updating fee assignments:", { eventId, feeId, ageGroupIds });
  if (!feeId || !Array.isArray(ageGroupIds)) {
    return res.status(400).json({ error: "Invalid request data" });
  }
  try {
    const ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq28(eventAgeGroups.eventId, eventId)
    });
    const allAgeGroupIds = ageGroups.map((group) => group.id);
    console.log("Valid age group IDs for this event:", allAgeGroupIds);
    const fee = await db.query.eventFees.findFirst({
      where: and15(
        eq28(eventFees.id, feeId),
        eq28(eventFees.eventId, eventId)
      )
    });
    if (!fee) {
      console.error("Fee not found or does not belong to this event");
      return res.status(404).json({ error: "Fee not found for this event" });
    }
    const validAgeGroupIds = ageGroupIds.filter((id) => allAgeGroupIds.includes(id));
    console.log("Valid age group IDs to assign:", validAgeGroupIds);
    await db.transaction(async (tx) => {
      await tx.delete(eventAgeGroupFees).where(eq28(eventAgeGroupFees.feeId, feeId));
      if (validAgeGroupIds.length > 0) {
        for (const ageGroupId of validAgeGroupIds) {
          await tx.insert(eventAgeGroupFees).values({
            ageGroupId,
            feeId
          });
        }
        console.log(`Created ${validAgeGroupIds.length} new fee assignments`);
      } else {
        console.log("No valid age groups to assign");
      }
    });
    const updatedAssignments = await db.query.eventAgeGroupFees.findMany({
      where: eq28(eventAgeGroupFees.feeId, feeId)
    });
    return res.status(200).json(updatedAssignments);
  } catch (error) {
    console.error("Error updating fee assignments:", error);
    return res.status(500).json({
      error: "Failed to update fee assignments",
      message: error.message
    });
  }
};

// server/routes/payments.ts
init_stripeService();
import express3 from "express";
import Stripe2 from "stripe";
import bodyParser from "body-parser";
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
var stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});
var router25 = express3.Router();
var stripeWebhookMiddleware = bodyParser.raw({ type: "application/json" });
router25.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY
  });
});
router25.post("/create-intent", async (req, res) => {
  try {
    const { amount, teamId, metadata } = req.body;
    if (!amount || !teamId) {
      return res.status(400).json({ error: "Amount and teamId are required" });
    }
    const result = await createPaymentIntent(amount, teamId, metadata);
    res.json(result);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: error.message });
  }
});
router25.get("/status/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe2.paymentIntents.retrieve(paymentIntentId);
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    res.status(500).json({ error: error.message });
  }
});
router25.post("/create-setup-intent", async (req, res) => {
  try {
    const { teamId, metadata } = req.body;
    if (!teamId) {
      return res.status(400).json({ error: "TeamId is required" });
    }
    const result = await createSetupIntent(teamId, metadata);
    res.json(result);
  } catch (error) {
    console.error("Error creating setup intent:", error);
    res.status(500).json({ error: error.message });
  }
});
router25.post("/process-approved-payment", async (req, res) => {
  try {
    const { teamId, amount } = req.body;
    if (!teamId || !amount) {
      return res.status(400).json({ error: "TeamId and amount are required" });
    }
    const result = await processPaymentForApprovedTeam(Number(teamId), Number(amount));
    res.json(result);
  } catch (error) {
    console.error("Error processing payment for approved team:", error);
    res.status(500).json({ error: error.message });
  }
});
router25.get("/setup-status/:setupIntentId", async (req, res) => {
  try {
    const { setupIntentId } = req.params;
    const setupIntent = await stripe2.setupIntents.retrieve(setupIntentId);
    res.json({
      status: setupIntent.status,
      paymentMethod: setupIntent.payment_method,
      metadata: setupIntent.metadata
    });
  } catch (error) {
    console.error("Error retrieving setup intent:", error);
    res.status(500).json({ error: error.message });
  }
});
router25.get("/payment-method/:paymentMethodId", async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const paymentMethod = await stripe2.paymentMethods.retrieve(paymentMethodId);
    res.json({
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year
      } : null,
      created: paymentMethod.created
    });
  } catch (error) {
    console.error("Error retrieving payment method:", error);
    res.status(500).json({ error: error.message });
  }
});
router25.post("/webhook", stripeWebhookMiddleware, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: "Missing Stripe signature or webhook secret" });
  }
  let event;
  try {
    event = stripe2.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;
      case "setup_intent.succeeded":
        await handleSetupIntentSuccess(event.data.object);
        break;
      case "charge.refunded":
        const charge = event.data.object;
        if (charge.refunds && charge.refunds.data && charge.refunds.data.length > 0) {
          await handleRefund(charge, charge.refunds.data[0]);
        } else {
          console.error("Refund data is missing in the charge object");
        }
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook event: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});
router25.post("/simulate-webhook", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "This endpoint is only available in development" });
  }
  try {
    const { paymentIntentId, setupIntentId } = req.body;
    if (paymentIntentId) {
      const paymentIntent = await stripe2.paymentIntents.retrieve(paymentIntentId);
      await handlePaymentSuccess(paymentIntent);
      res.json({ success: true, message: "Successfully simulated payment success webhook" });
    } else if (setupIntentId) {
      const setupIntent = await stripe2.setupIntents.retrieve(setupIntentId);
      await handleSetupIntentSuccess(setupIntent);
      res.json({ success: true, message: "Successfully simulated setup intent success webhook" });
    } else {
      return res.status(400).json({ error: "Either paymentIntentId or setupIntentId is required" });
    }
  } catch (error) {
    console.error("Error simulating webhook:", error);
    res.status(500).json({ error: error.message });
  }
});
router25.post("/test-attach-payment-method", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "This endpoint is only available in development" });
  }
  try {
    const { setupIntentId } = req.body;
    if (!setupIntentId) {
      return res.status(400).json({ error: "Setup intent ID is required" });
    }
    const result = await attachTestPaymentMethodToSetupIntent(setupIntentId);
    res.json(result);
  } catch (error) {
    console.error("Error attaching test payment method:", error);
    res.status(500).json({ error: error.message });
  }
});
var payments_default = router25;

// server/routes/reports.ts
init_db();
import { Router as Router25 } from "express";
import { sql as sql11 } from "drizzle-orm";
import OpenAI from "openai";
var router26 = Router25();
var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function getRegistrationOrdersReport(req, res) {
  try {
    const query = sql11`
      SELECT 
        pt.id, 
        pt.amount, 
        pt.payment_method, 
        pt.status, 
        pt.created_at,
        pt.payment_intent_id,
        pt.stripe_receipt_url,
        pt.accounting_code,
        pt.payment_method_details,
        pt.refunded_at, 
        teams.name as team_name,
        teams.manager_name,
        teams.manager_email,
        teams.manager_phone,
        teams.club_name,
        events.id as event_id,
        events.name as event_name,
        event_age_groups.name as age_group
      FROM payment_transactions pt
      LEFT JOIN teams ON pt.team_id = teams.id
      LEFT JOIN events ON teams.event_id = events.id
      LEFT JOIN event_age_groups ON teams.age_group_id = event_age_groups.id
      ORDER BY pt.created_at DESC
    `;
    const transactions = await db.execute(query);
    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error("Error fetching registration orders report:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    });
  }
}
async function getFinancialOverviewReport(req, res) {
  try {
    const { period = "30d", includeAI = "true" } = req.query;
    let startDate = /* @__PURE__ */ new Date();
    const endDate = /* @__PURE__ */ new Date();
    const includeAIInsights = includeAI === "true";
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "all":
        startDate = /* @__PURE__ */ new Date(0);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    const revenueQuery = sql11`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(id) as transaction_count
      FROM payment_transactions 
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND status = 'succeeded'
    `;
    const revenueResult = await db.execute(revenueQuery);
    const refundsQuery = sql11`
      SELECT 
        COUNT(id) as total_refunds,
        SUM(amount) as total_refund_amount
      FROM payment_transactions 
      WHERE refunded_at IS NOT NULL
      AND created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
    `;
    const refundsResult = await db.execute(refundsQuery);
    const monthlyRevenueQuery = sql11`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as total_revenue,
        COUNT(id) as transaction_count
      FROM payment_transactions
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND status = 'succeeded'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;
    const monthlyRevenueTrend = await db.execute(monthlyRevenueQuery);
    const paymentMethodsQuery = sql11`
      SELECT 
        payment_method as "paymentMethod",
        COUNT(id) as count,
        SUM(amount) as "totalAmount",
        AVG(amount) as "avgAmount"
      FROM payment_transactions
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND status = 'succeeded'
      GROUP BY payment_method
      ORDER BY "totalAmount" DESC
    `;
    const paymentMethods = await db.execute(paymentMethodsQuery);
    const topEventsQuery = sql11`
      WITH event_transactions AS (
        -- Regular transactions with team_id
        SELECT 
          e.id as event_id,
          e.name as event_name,
          pt.id as transaction_id,
          pt.amount as transaction_amount
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE pt.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
        AND pt.status = 'succeeded'
        
        UNION ALL
        
        -- Test transactions (null team_id) - distribute evenly across events
        SELECT 
          e.id as event_id,
          e.name as event_name,
          pt.id as transaction_id,
          pt.amount as transaction_amount
        FROM payment_transactions pt
        CROSS JOIN (
          SELECT id, name FROM events
          LIMIT 3 -- Limit test transactions to top 3 events
        ) e
        WHERE pt.team_id IS NULL
        AND pt.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
        AND pt.status = 'succeeded'
      )
      
      SELECT 
        event_id as "eventId",
        event_name as "eventName",
        SUM(transaction_amount) as revenue,
        COUNT(transaction_id) as "transactionCount"
      FROM event_transactions
      GROUP BY event_id, event_name
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const topEvents = await db.execute(topEventsQuery);
    const totalRevenue = revenueResult[0]?.total_revenue || 0;
    const transactionCount = revenueResult[0]?.transaction_count || 0;
    const avgTransactionValue = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;
    const data = {
      revenue: {
        totalRevenue,
        transactionCount,
        avgTransactionValue
      },
      refunds: {
        totalRefunds: refundsResult[0]?.total_refunds || 0,
        totalRefundAmount: refundsResult[0]?.total_refund_amount || 0
      },
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        period
      },
      monthlyRevenueTrend,
      paymentMethods,
      topEvents
    };
    let aiInsights = null;
    if (includeAIInsights && process.env.OPENAI_API_KEY) {
      try {
        const analysisData = JSON.stringify({
          period,
          revenue: data.revenue,
          refunds: data.refunds,
          monthlyRevenueTrend,
          paymentMethods,
          topEvents
        });
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a financial analyst for a sports tournament management platform. Analyze the financial data and provide insights and recommendations.`
            },
            {
              role: "user",
              content: `Analyze this financial data and provide key insights, patterns, and recommendations. Focus on revenue trends, payment methods, and top performing events: ${analysisData}`
            }
          ],
          response_format: { type: "json_object" }
        });
        const aiResponse = JSON.parse(response.choices[0].message.content);
        aiInsights = {
          keyInsights: aiResponse.keyInsights || [],
          recommendations: aiResponse.recommendations || [],
          topRevenueEvents: aiResponse.topRevenueEvents || [],
          growthOpportunities: aiResponse.growthOpportunities || []
        };
      } catch (error) {
        console.error("Error generating AI insights:", error);
      }
    }
    return res.json({
      success: true,
      data,
      aiInsights
    });
  } catch (error) {
    console.error("Error fetching financial overview report:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    });
  }
}
async function getEventFinancialReport(req, res) {
  try {
    const { eventId } = req.params;
    const { includeAI = "true" } = req.query;
    const includeAIInsights = includeAI === "true";
    if (!eventId) {
      return res.status(400).json({ success: false, error: "Event ID is required" });
    }
    const eventQuery = sql11`
      SELECT id, name, start_date, end_date, application_deadline, is_archived
      FROM events
      WHERE id = ${eventId}
    `;
    const eventResult = await db.execute(eventQuery);
    if (!eventResult || eventResult.length === 0) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }
    const event = eventResult[0];
    const financialsQuery = sql11`
      WITH event_transactions AS (
        -- Regular transactions with team_id
        SELECT 
          pt.id,
          pt.amount,
          pt.status
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        WHERE t.event_id = ${eventId}
        AND pt.status = 'succeeded'
        
        UNION ALL
        
        -- Include test transactions for this event (distributed evenly)
        SELECT 
          pt.id,
          ROUND(pt.amount / 
            (SELECT COUNT(*) FROM events WHERE is_archived = false)) as amount,
          pt.status
        FROM payment_transactions pt
        WHERE pt.team_id IS NULL
        AND pt.status = 'succeeded'
        AND EXISTS (SELECT 1 FROM events WHERE id = ${eventId})
        -- Only include test transactions for active events
      )
      
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(id) as transaction_count,
        AVG(amount) as avg_transaction_amount
      FROM event_transactions
    `;
    const financialsResult = await db.execute(financialsQuery);
    const financials = {
      totalRevenue: financialsResult[0]?.total_revenue || 0,
      transactionCount: financialsResult[0]?.transaction_count || 0,
      avgTransactionAmount: financialsResult[0]?.avg_transaction_amount || 0
    };
    const refundsQuery = sql11`
      WITH event_refunds AS (
        -- Regular refunds with team_id
        SELECT 
          pt.id,
          pt.amount
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        WHERE t.event_id = ${eventId}
        AND (pt.refunded_at IS NOT NULL OR pt.status = 'refunded' OR pt.transaction_type = 'refund')
        
        UNION ALL
        
        -- Include test refunds for this event (distributed evenly)
        SELECT 
          pt.id,
          ROUND(pt.amount / 
            (SELECT COUNT(*) FROM events WHERE is_archived = false)) as amount
        FROM payment_transactions pt
        WHERE pt.team_id IS NULL
        AND (pt.refunded_at IS NOT NULL OR pt.status = 'refunded' OR pt.transaction_type = 'refund')
        AND EXISTS (SELECT 1 FROM events WHERE id = ${eventId})
      )
      
      SELECT 
        COUNT(id) as total_refunds,
        SUM(amount) as total_refund_amount
      FROM event_refunds
    `;
    const refundsResult = await db.execute(refundsQuery);
    const refunds = {
      totalRefunds: refundsResult[0]?.total_refunds || 0,
      totalRefundAmount: refundsResult[0]?.total_refund_amount || 0
    };
    const registrationsQuery = sql11`
      SELECT 
        COUNT(id) as total_teams,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_teams,
        SUM(CASE WHEN payment_status != 'paid' THEN 1 ELSE 0 END) as pending_teams
      FROM teams
      WHERE event_id = ${eventId}
    `;
    const registrationsResult = await db.execute(registrationsQuery);
    const registrations = {
      totalTeams: registrationsResult[0]?.total_teams || 0,
      paidTeams: registrationsResult[0]?.paid_teams || 0,
      pendingTeams: registrationsResult[0]?.pending_teams || 0
    };
    const ageGroupRevenueQuery = sql11`
      WITH age_group_transactions AS (
        -- Regular transactions with team_id
        SELECT 
          eag.id as age_group_id,
          eag.name as age_group,
          eag.gender,
          pt.amount,
          t.id as team_id
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        JOIN event_age_groups eag ON t.age_group_id = eag.id
        WHERE t.event_id = ${eventId}
        AND pt.status = 'succeeded'
        
        UNION ALL
        
        -- Include test transactions distributed across age groups
        SELECT 
          eag.id as age_group_id,
          eag.name as age_group,
          eag.gender,
          (pt.amount / (SELECT COUNT(*) FROM event_age_groups WHERE event_id = ${eventId})) as amount,
          NULL as team_id
        FROM payment_transactions pt
        CROSS JOIN event_age_groups eag
        WHERE pt.team_id IS NULL
        AND pt.status = 'succeeded'
        AND eag.event_id = ${eventId}
        AND EXISTS (SELECT 1 FROM events WHERE id = ${eventId})
      )
      
      SELECT 
        age_group,
        gender,
        SUM(amount) as total_revenue,
        COUNT(DISTINCT team_id) as team_count
      FROM age_group_transactions
      GROUP BY age_group_id, age_group, gender
      ORDER BY total_revenue DESC
    `;
    const ageGroupRevenue = await db.execute(ageGroupRevenueQuery);
    const dailyRevenueQuery = sql11`
      WITH daily_event_transactions AS (
        -- Regular transactions with team_id
        SELECT 
          DATE_TRUNC('day', pt.created_at) as day,
          pt.amount,
          t.id as team_id
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        WHERE t.event_id = ${eventId}
        AND pt.status = 'succeeded'
        
        UNION ALL
        
        -- Include test transactions for this event (distributed evenly)
        SELECT 
          DATE_TRUNC('day', pt.created_at) as day,
          ROUND(pt.amount / 
            (SELECT COUNT(*) FROM events WHERE is_archived = false)) as amount,
          NULL as team_id
        FROM payment_transactions pt
        WHERE pt.team_id IS NULL
        AND pt.status = 'succeeded'
        AND EXISTS (SELECT 1 FROM events WHERE id = ${eventId})
      )
      
      SELECT 
        day,
        SUM(amount) as daily_revenue,
        COUNT(DISTINCT team_id) as daily_registrations
      FROM daily_event_transactions
      GROUP BY day
      ORDER BY day ASC
    `;
    const dailyRevenue = await db.execute(dailyRevenueQuery);
    const data = {
      event,
      financials,
      refunds,
      registrations,
      ageGroupRevenue,
      dailyRevenue
    };
    let aiInsights = null;
    if (includeAIInsights && process.env.OPENAI_API_KEY) {
      try {
        const analysisData = JSON.stringify({
          event,
          financials,
          refunds,
          registrations,
          ageGroupRevenue,
          dailyRevenue
        });
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a financial analyst for a sports tournament management platform. Analyze the event financial data and provide insights and recommendations.`
            },
            {
              role: "user",
              content: `Analyze this event financial data and provide key insights, patterns, and recommendations. Focus on revenue distribution by age group, registration timeline, and areas for improvement: ${analysisData}`
            }
          ],
          response_format: { type: "json_object" }
        });
        const aiResponse = JSON.parse(response.choices[0].message.content);
        aiInsights = {
          keyInsights: aiResponse.keyInsights || [],
          recommendations: aiResponse.recommendations || [],
          visualizationCaptions: aiResponse.visualizationCaptions || {},
          growthOpportunities: aiResponse.growthOpportunities || []
        };
      } catch (error) {
        console.error("Error generating AI insights for event report:", error);
      }
    }
    return res.json({
      success: true,
      data,
      aiInsights
    });
  } catch (error) {
    console.error("Error fetching event financial report:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    });
  }
}
async function getFeesAnalysisReport(req, res) {
  try {
    const { includeAI = "true" } = req.query;
    const includeAIInsights = includeAI === "true";
    const feeStatisticsQuery = sql11`
      SELECT 
        COUNT(id) as total_fees,
        COUNT(DISTINCT event_id) as total_events,
        AVG(amount) as avg_fee_amount
      FROM event_fees
    `;
    const feeStatisticsResult = await db.execute(feeStatisticsQuery);
    const feeStatistics = {
      totalFees: feeStatisticsResult[0]?.total_fees || 0,
      totalEvents: feeStatisticsResult[0]?.total_events || 0,
      avgFeeAmount: feeStatisticsResult[0]?.avg_fee_amount || 0
    };
    const feeTypeDistributionQuery = sql11`
      SELECT 
        fee_type as "feeType",
        COUNT(id) as count,
        AVG(amount) as "avgAmount"
      FROM event_fees
      GROUP BY fee_type
      ORDER BY count DESC
    `;
    const feeTypeDistribution = await db.execute(feeTypeDistributionQuery);
    const requiredVsOptionalQuery = sql11`
      SELECT 
        is_required,
        COUNT(id) as fee_count,
        AVG(amount) as avg_amount,
        SUM(amount) as total_potential_value
      FROM event_fees
      GROUP BY is_required
    `;
    const requiredVsOptional = await db.execute(requiredVsOptionalQuery);
    const topPerformingFeesQuery = sql11`
      WITH fee_transactions AS (
        -- Get real transactions linked to teams and their fees
        SELECT 
          ef.id AS fee_id,
          ef.name AS fee_name,
          ef.fee_type,
          ef.amount AS fee_amount,
          e.name AS event_name,
          pt.id AS transaction_id,
          pt.amount AS transaction_amount
        FROM event_fees ef
        JOIN events e ON ef.event_id = e.id
        LEFT JOIN teams t ON t.event_id = e.id
        LEFT JOIN payment_transactions pt ON pt.team_id = t.id
        WHERE pt.id IS NOT NULL
        
        UNION ALL
        
        -- Include test transactions (with null team_id)
        SELECT 
          ef.id AS fee_id,
          ef.name AS fee_name,
          ef.fee_type,
          ef.amount AS fee_amount,
          e.name AS event_name,
          pt.id AS transaction_id,
          pt.amount AS transaction_amount
        FROM payment_transactions pt
        CROSS JOIN event_fees ef
        JOIN events e ON ef.event_id = e.id
        WHERE pt.team_id IS NULL AND pt.status = 'succeeded'
      )
      
      SELECT 
        fee_id AS id,
        fee_name AS name,
        fee_type,
        fee_amount AS amount,
        event_name,
        COUNT(transaction_id) AS transactions,
        SUM(transaction_amount) AS total_revenue
      FROM fee_transactions
      GROUP BY fee_id, fee_name, fee_type, fee_amount, event_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const topPerformingFees = await db.execute(topPerformingFeesQuery);
    const data = {
      feeStatistics,
      feeTypeDistribution,
      requiredVsOptional,
      topPerformingFees
    };
    let aiInsights = null;
    if (includeAIInsights && process.env.OPENAI_API_KEY) {
      try {
        const analysisData = JSON.stringify(data);
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a financial analyst for a sports tournament management platform. Analyze the fee structure data and provide insights and recommendations.`
            },
            {
              role: "user",
              content: `Analyze this fee structure data and provide key insights, patterns, and recommendations. Focus on fee types, required vs optional fees, and top performing fees: ${analysisData}`
            }
          ],
          response_format: { type: "json_object" }
        });
        const aiResponse = JSON.parse(response.choices[0].message.content);
        aiInsights = {
          keyInsights: aiResponse.keyInsights || [],
          recommendations: aiResponse.recommendations || [],
          paymentMethodTrends: aiResponse.paymentMethodTrends || [],
          seasonalPatterns: aiResponse.seasonalPatterns || []
        };
      } catch (error) {
        console.error("Error generating AI insights for fees analysis:", error);
      }
    }
    return res.json({
      success: true,
      data,
      aiInsights
    });
  } catch (error) {
    console.error("Error fetching fees analysis report:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    });
  }
}
async function getBookkeepingReport(req, res) {
  try {
    const {
      startDate,
      endDate,
      reportType = "all-transactions",
      settledOnly = "false"
    } = req.query;
    let startDateObj = startDate ? new Date(startDate) : /* @__PURE__ */ new Date(0);
    let endDateObj = endDate ? new Date(endDate) : /* @__PURE__ */ new Date();
    endDateObj.setHours(23, 59, 59, 999);
    let baseQuery = sql11`
      WITH transaction_details AS (
        SELECT 
          pt.id, 
          pt.team_id,
          pt.amount, 
          pt.payment_method_type as payment_method, 
          pt.status, 
          pt.created_at,
          pt.payment_intent_id,
          pt.transaction_type,
          -- Estimate Stripe fee (2.9% + 30 cents for standard pricing)
          CASE
            WHEN pt.status = 'succeeded' AND pt.transaction_type = 'payment' THEN 
              ROUND(pt.amount * 0.029 + 30)
            ELSE 0
          END as stripe_fee,
          pt.metadata,
          teams.name as team_name,
          teams.manager_name,
          teams.manager_email,
          teams.manager_phone,
          teams.club_name,
          teams.registration_fee as amount_due,
          events.id as event_id,
          events.name as event_name,
          event_age_groups.age_group as age_group,
          -- For chargebacks and refunds
          CASE 
            WHEN pt.transaction_type IN ('refund', 'partial_refund', 'chargeback') AND pt.metadata->>'original_payment_id' IS NOT NULL THEN 
              pt.metadata->>'original_payment_id'
            ELSE NULL 
          END as original_payment_id,
          -- For refunds
          CASE
            WHEN pt.transaction_type = 'partial_refund' THEN true
            ELSE false
          END as is_partial,
          CASE
            WHEN pt.metadata->>'refund_reason' IS NOT NULL THEN
              pt.metadata->>'refund_reason'
            ELSE NULL
          END as refund_reason,
          CASE
            WHEN pt.metadata->>'original_amount' IS NOT NULL THEN
              (pt.metadata->>'original_amount')::integer
            ELSE NULL
          END as original_amount,
          -- For chargebacks
          CASE
            WHEN pt.metadata->>'dispute_status' IS NOT NULL THEN
              pt.metadata->>'dispute_status'
            ELSE NULL
          END as dispute_status,
          CASE
            WHEN pt.metadata->>'dispute_reason' IS NOT NULL THEN
              pt.metadata->>'dispute_reason'
            ELSE NULL
          END as dispute_reason,
          -- Settlement date (estimated as 2 business days after payment)
          CASE
            WHEN pt.status = 'succeeded' AND pt.transaction_type = 'payment' THEN
              (pt.created_at + INTERVAL '2 days')::timestamp
            ELSE NULL
          END as settled_date
        FROM payment_transactions pt
        LEFT JOIN teams ON pt.team_id = teams.id
        LEFT JOIN events ON teams.event_id = events.id
        LEFT JOIN event_age_groups ON teams.age_group_id = event_age_groups.id
        WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
    `;
    let filterQuery = "";
    if (reportType === "refunds") {
      filterQuery = ` AND pt.transaction_type IN ('refund', 'partial_refund')`;
    } else if (reportType === "chargebacks") {
      filterQuery = ` AND pt.transaction_type = 'chargeback'`;
    } else if (reportType === "pending-payments") {
      return getPendingPaymentsReport(req, res, startDateObj, endDateObj);
    } else if (reportType === "all-transactions") {
      filterQuery = ` AND pt.transaction_type IN ('payment', 'registration_payment', 'refund', 'partial_refund', 'chargeback')`;
    }
    if (settledOnly === "true") {
      filterQuery += ` AND pt.status = 'succeeded' AND pt.created_at < (NOW() - INTERVAL '2 days')`;
    }
    const query = sql11`
      ${baseQuery} ${sql11.raw(filterQuery)}
      )
      SELECT * FROM transaction_details
      ORDER BY created_at DESC
    `;
    const transactions = await db.execute(query);
    const summaryQuery = sql11`
      WITH transaction_details AS (
        SELECT 
          pt.id, 
          pt.amount, 
          CASE
            WHEN pt.status = 'succeeded' AND pt.transaction_type IN ('payment', 'registration_payment') THEN 
              ROUND(pt.amount * 0.029 + 30)
            ELSE 0
          END as stripe_fee
        FROM payment_transactions pt
        WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
        ${sql11.raw(filterQuery)}
        ${sql11.raw(settledOnly === "true" ? ` AND pt.status = 'succeeded' AND pt.created_at < (NOW() - INTERVAL '2 days')` : "")}
      )
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        SUM(stripe_fee) as total_stripe_fees,
        (SUM(amount) - SUM(stripe_fee)) as net_amount
      FROM transaction_details
    `;
    const summaryResult = await db.execute(summaryQuery);
    const summary = {
      totalTransactions: summaryResult[0]?.total_transactions || 0,
      totalAmount: summaryResult[0]?.total_amount || 0,
      stripeFees: summaryResult[0]?.total_stripe_fees || 0,
      netAmount: summaryResult[0]?.net_amount || 0
    };
    return res.json({
      success: true,
      transactions,
      summary,
      filters: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        reportType,
        settledOnly: settledOnly === "true"
      }
    });
  } catch (error) {
    console.error("Error fetching bookkeeping report:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    });
  }
}
async function getPendingPaymentsReport(req, res, startDate, endDate) {
  try {
    const pendingQuery = sql11`
      SELECT 
        teams.id,
        teams.name as team_name,
        teams.manager_name,
        teams.manager_email,
        teams.manager_phone,
        teams.created_at,
        teams.registration_fee as amount_due,
        teams.payment_status as status,
        events.id as event_id,
        events.name as event_name,
        event_age_groups.age_group as age_group
      FROM teams
      LEFT JOIN events ON teams.event_id = events.id
      LEFT JOIN event_age_groups ON teams.age_group_id = event_age_groups.id
      WHERE teams.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND teams.payment_status = 'pending'
      ORDER BY teams.created_at DESC
    `;
    const transactions = await db.execute(pendingQuery);
    const summaryQuery = sql11`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(registration_fee) as total_amount,
        0 as total_stripe_fees,
        SUM(registration_fee) as net_amount
      FROM teams
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND payment_status = 'pending'
    `;
    const summaryResult = await db.execute(summaryQuery);
    const summary = {
      totalTransactions: summaryResult[0]?.total_transactions || 0,
      totalAmount: summaryResult[0]?.total_amount || 0,
      stripeFees: 0,
      // No fees for pending payments
      netAmount: summaryResult[0]?.net_amount || 0
    };
    return res.json({
      success: true,
      transactions,
      summary,
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reportType: "pending-payments",
        settledOnly: false
      }
    });
  } catch (error) {
    console.error("Error fetching pending payments report:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    });
  }
}
router26.get("/registration-orders", getRegistrationOrdersReport);
router26.get("/financial-overview", getFinancialOverviewReport);
router26.get("/event/:eventId/financial", getEventFinancialReport);
router26.get("/fees-analysis", getFeesAnalysisReport);
router26.get("/bookkeeping", getBookkeepingReport);
var reports_default = router26;

// server/routes/enhanced-financial-reports.ts
init_db();
import { sql as sql12 } from "drizzle-orm";
async function getEnhancedEventFinancialReport(req, res) {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;
    console.log(`Generating enhanced financial report for event ${eventId}`);
    const overallRevenueQuery = sql12`
      SELECT 
        COUNT(pt.id) as total_transactions,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as total_stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        AVG(pt.amount) as avg_transaction_amount,
        COUNT(DISTINCT pt.team_id) as unique_teams_paid
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
      ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
    `;
    const overallRevenue = await db.execute(overallRevenueQuery);
    const feeTypeRevenueQuery = sql12`
      WITH fee_payments AS (
        SELECT 
          ef.fee_type,
          ef.name as fee_name,
          ef.amount as fee_amount,
          COUNT(pt.id) as payment_count,
          SUM(pt.amount) as gross_revenue,
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
          SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        JOIN event_age_group_fees eagf ON t.age_group_id = eagf.age_group_id
        JOIN event_fees ef ON eagf.fee_id = ef.id
        WHERE t.event_id = ${eventId}
        AND pt.status = 'succeeded'
        AND pt.transaction_type = 'payment'
        ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
        ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
        GROUP BY ef.fee_type, ef.name, ef.amount
      )
      SELECT 
        fee_type,
        SUM(payment_count) as total_payments,
        SUM(gross_revenue) as total_gross_revenue,
        SUM(stripe_fees) as total_stripe_fees,
        SUM(net_revenue) as total_net_revenue,
        AVG(fee_amount) as avg_fee_amount,
        COUNT(DISTINCT fee_name) as unique_fees
      FROM fee_payments
      GROUP BY fee_type
      ORDER BY total_gross_revenue DESC
    `;
    const feeTypeRevenue = await db.execute(feeTypeRevenueQuery);
    const individualFeeQuery = sql12`
      SELECT 
        ef.id,
        ef.name,
        ef.fee_type,
        ef.amount as fee_amount,
        ef.is_required,
        COUNT(DISTINCT eagf.age_group_id) as assigned_age_groups,
        COUNT(pt.id) as payment_count,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        ROUND(AVG(pt.amount), 2) as avg_payment_amount
      FROM event_fees ef
      LEFT JOIN event_age_group_fees eagf ON ef.id = eagf.fee_id
      LEFT JOIN teams t ON eagf.age_group_id = t.age_group_id AND t.event_id = ${eventId}
      LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
        AND pt.status = 'succeeded' 
        AND pt.transaction_type = 'payment'
        ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
        ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
      WHERE ef.event_id = ${eventId}
      GROUP BY ef.id, ef.name, ef.fee_type, ef.amount, ef.is_required
      ORDER BY gross_revenue DESC NULLS LAST
    `;
    const individualFees = await db.execute(individualFeeQuery);
    const paymentMethodAnalysisQuery = sql12`
      SELECT 
        pt.card_brand,
        pt.payment_method_type,
        COUNT(pt.id) as transaction_count,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
        AVG(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as avg_stripe_fee,
        ROUND(
          (SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) * 100.0 / NULLIF(SUM(pt.amount), 0)), 
          2
        ) as stripe_fee_percentage
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
      ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
      GROUP BY pt.card_brand, pt.payment_method_type
      ORDER BY gross_revenue DESC
    `;
    const paymentMethodAnalysis = await db.execute(paymentMethodAnalysisQuery);
    const dailyTrendQuery = sql12`
      SELECT 
        DATE(pt.created_at) as date,
        COUNT(pt.id) as daily_transactions,
        SUM(pt.amount) as daily_gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as daily_stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as daily_net_revenue
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
      ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
      GROUP BY DATE(pt.created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    const dailyTrend = await db.execute(dailyTrendQuery);
    const revenue = overallRevenue[0];
    const stripeFeePercentage = revenue?.total_stripe_fees && revenue?.gross_revenue ? (revenue.total_stripe_fees / revenue.gross_revenue * 100).toFixed(2) : "0.00";
    const profitMargin = revenue?.net_revenue && revenue?.gross_revenue ? (revenue.net_revenue / revenue.gross_revenue * 100).toFixed(2) : "0.00";
    const response = {
      eventId: parseInt(eventId),
      dateRange: { startDate, endDate },
      overview: {
        totalTransactions: revenue?.total_transactions || 0,
        grossRevenue: revenue?.gross_revenue || 0,
        totalStripeFees: revenue?.total_stripe_fees || 0,
        netRevenue: revenue?.net_revenue || 0,
        avgTransactionAmount: revenue?.avg_transaction_amount || 0,
        uniqueTeamsPaid: revenue?.unique_teams_paid || 0,
        stripeFeePercentage: parseFloat(stripeFeePercentage),
        profitMargin: parseFloat(profitMargin)
      },
      feeTypeBreakdown: feeTypeRevenue,
      individualFeePerformance: individualFees,
      paymentMethodAnalysis,
      dailyRevenueTrend: dailyTrend,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log(`Enhanced financial report generated for event ${eventId}`);
    res.json(response);
  } catch (error) {
    console.error("Error generating enhanced financial report:", error);
    res.status(500).json({
      error: "Failed to generate enhanced financial report",
      details: error.message
    });
  }
}
async function getOrganizationFinancialSummary(req, res) {
  try {
    const { startDate, endDate, includeEventBreakdown = "true" } = req.query;
    console.log("Generating organization-wide financial summary");
    const orgSummaryQuery = sql12`
      SELECT 
        COUNT(pt.id) as total_transactions,
        COUNT(DISTINCT pt.event_id) as active_events,
        COUNT(DISTINCT pt.team_id) as unique_teams,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as total_stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        AVG(pt.amount) as avg_transaction_amount
      FROM payment_transactions pt
      WHERE pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
      ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
    `;
    const orgSummary = await db.execute(orgSummaryQuery);
    const globalFeeTypeQuery = sql12`
      SELECT 
        ef.fee_type,
        COUNT(DISTINCT ef.event_id) as events_using_fee_type,
        COUNT(pt.id) as total_payments,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        AVG(ef.amount) as avg_fee_amount
      FROM event_fees ef
      LEFT JOIN event_age_group_fees eagf ON ef.id = eagf.fee_id
      LEFT JOIN teams t ON eagf.age_group_id = t.age_group_id
      LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
        AND pt.status = 'succeeded' 
        AND pt.transaction_type = 'payment'
        ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
        ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
      GROUP BY ef.fee_type
      ORDER BY gross_revenue DESC NULLS LAST
    `;
    const globalFeeTypes = await db.execute(globalFeeTypeQuery);
    let eventBreakdown = [];
    if (includeEventBreakdown === "true") {
      const eventBreakdownQuery = sql12`
        SELECT 
          e.id as event_id,
          e.name as event_name,
          COUNT(pt.id) as transactions,
          SUM(pt.amount) as gross_revenue,
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
          SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
          COUNT(DISTINCT pt.team_id) as teams_paid
        FROM events e
        LEFT JOIN teams t ON e.id = t.event_id
        LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
          AND pt.status = 'succeeded' 
          AND pt.transaction_type = 'payment'
          ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
          ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
        GROUP BY e.id, e.name
        HAVING SUM(pt.amount) > 0
        ORDER BY gross_revenue DESC
      `;
      eventBreakdown = await db.execute(eventBreakdownQuery);
    }
    const summary = orgSummary[0];
    const stripeFeePercentage = summary?.total_stripe_fees && summary?.gross_revenue ? (summary.total_stripe_fees / summary.gross_revenue * 100).toFixed(2) : "0.00";
    const response = {
      dateRange: { startDate, endDate },
      organizationSummary: {
        totalTransactions: summary?.total_transactions || 0,
        activeEvents: summary?.active_events || 0,
        uniqueTeams: summary?.unique_teams || 0,
        grossRevenue: summary?.gross_revenue || 0,
        totalStripeFees: summary?.total_stripe_fees || 0,
        netRevenue: summary?.net_revenue || 0,
        avgTransactionAmount: summary?.avg_transaction_amount || 0,
        stripeFeePercentage: parseFloat(stripeFeePercentage)
      },
      globalFeeTypePerformance: globalFeeTypes,
      eventBreakdown,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("Organization financial summary generated");
    res.json(response);
  } catch (error) {
    console.error("Error generating organization financial summary:", error);
    res.status(500).json({
      error: "Failed to generate organization financial summary",
      details: error.message
    });
  }
}
async function getStripeFeeOptimizationReport(req, res) {
  try {
    const { startDate, endDate } = req.query;
    console.log("Generating Stripe fee optimization report");
    const feeOptimizationQuery = sql12`
      WITH fee_analysis AS (
        SELECT 
          ef.id,
          ef.name,
          ef.amount as fee_amount,
          ef.fee_type,
          COUNT(pt.id) as payment_count,
          SUM(pt.amount) as gross_revenue,
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
          -- Calculate what fees would be with optimized amounts
          SUM(ROUND((ef.amount + 35) * 0.029 + 30)) as estimated_optimized_fees,
          -- Calculate potential savings
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) - 
          SUM(ROUND((ef.amount + 35) * 0.029 + 30)) as potential_savings
        FROM event_fees ef
        LEFT JOIN event_age_group_fees eagf ON ef.id = eagf.fee_id
        LEFT JOIN teams t ON eagf.age_group_id = t.age_group_id
        LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
          AND pt.status = 'succeeded' 
          AND pt.transaction_type = 'payment'
          ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
          ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
        GROUP BY ef.id, ef.name, ef.amount, ef.fee_type
        HAVING COUNT(pt.id) > 0
      )
      SELECT 
        *,
        ROUND((stripe_fees * 100.0 / NULLIF(gross_revenue, 0)), 2) as stripe_fee_percentage,
        ROUND((potential_savings * 100.0 / NULLIF(stripe_fees, 0)), 2) as potential_savings_percentage
      FROM fee_analysis
      ORDER BY potential_savings DESC
    `;
    const feeOptimization = await db.execute(feeOptimizationQuery);
    const paymentMethodCostQuery = sql12`
      SELECT 
        pt.card_brand,
        pt.payment_method_type,
        COUNT(pt.id) as transaction_count,
        AVG(pt.amount) as avg_transaction_amount,
        AVG(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as avg_stripe_fee,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as total_stripe_fees,
        ROUND(
          (AVG(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) * 100.0 / NULLIF(AVG(pt.amount), 0)), 
          2
        ) as avg_fee_percentage
      FROM payment_transactions pt
      WHERE pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql12`AND pt.created_at >= ${startDate}` : sql12``}
      ${endDate ? sql12`AND pt.created_at <= ${endDate}` : sql12``}
      GROUP BY pt.card_brand, pt.payment_method_type
      ORDER BY avg_fee_percentage DESC
    `;
    const paymentMethodCosts = await db.execute(paymentMethodCostQuery);
    const response = {
      dateRange: { startDate, endDate },
      feeOptimizationOpportunities: feeOptimization,
      paymentMethodCostAnalysis: paymentMethodCosts,
      recommendations: [
        {
          type: "fee_structure",
          title: "Consider consolidating small fees",
          description: "Multiple small fees result in higher Stripe fee percentages. Consider bundling fees where possible."
        },
        {
          type: "payment_timing",
          title: "Optimize payment timing",
          description: "Collecting larger amounts less frequently can reduce the impact of Stripe's fixed $0.30 fee."
        },
        {
          type: "payment_methods",
          title: "Encourage lower-cost payment methods",
          description: "Some card types have lower processing fees. Consider incentivizing these methods."
        }
      ],
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("Stripe fee optimization report generated");
    res.json(response);
  } catch (error) {
    console.error("Error generating Stripe fee optimization report:", error);
    res.status(500).json({
      error: "Failed to generate Stripe fee optimization report",
      details: error.message
    });
  }
}

// server/services/configService.ts
init_vite();
async function getTinyMCEConfig(req, res) {
  try {
    const apiKey = process.env.TINYMCE_API_KEY;
    if (!apiKey) {
      log("TinyMCE API key not found in environment variables", "config");
      return res.status(500).json({ error: "TinyMCE configuration is missing" });
    }
    return res.json({
      apiKey
    });
  } catch (error) {
    log(`Error retrieving TinyMCE config: ${error instanceof Error ? error.message : String(error)}`, "config");
    return res.status(500).json({
      error: "Failed to retrieve TinyMCE configuration",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// server/services/passwordResetService.ts
init_db();
init_schema();
import { randomBytes as randomBytes2 } from "crypto";

// db/schema/passwordReset.ts
init_schema();
import { pgTable as pgTable3, serial as serial3, text as text3, timestamp as timestamp3 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema3, createSelectSchema as createSelectSchema3 } from "drizzle-zod";
var passwordResetTokens = pgTable3("password_reset_tokens", {
  id: serial3("id").primaryKey(),
  userId: serial3("user_id").references(() => users.id).notNull(),
  token: text3("token").notNull().unique(),
  expiresAt: timestamp3("expires_at").notNull(),
  createdAt: timestamp3("created_at").defaultNow(),
  usedAt: timestamp3("used_at")
});
var insertPasswordResetTokenSchema = createInsertSchema3(passwordResetTokens);
var selectPasswordResetTokenSchema = createSelectSchema3(passwordResetTokens);

// server/services/passwordResetService.ts
init_emailService();
init_crypto();
import { eq as eq30 } from "drizzle-orm";
var TOKEN_EXPIRY_HOURS = 24;
function generateToken() {
  return randomBytes2(32).toString("hex");
}
async function createPasswordResetToken(userId) {
  try {
    const token = generateToken();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      createdAt: /* @__PURE__ */ new Date()
    });
    return token;
  } catch (error) {
    console.error("Error creating password reset token:", error);
    throw error;
  }
}
async function verifyPasswordResetToken(token) {
  try {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq30(passwordResetTokens.token, token));
    if (resetToken && /* @__PURE__ */ new Date() < resetToken.expiresAt && resetToken.usedAt === null) {
      return resetToken.userId;
    }
    return null;
  } catch (error) {
    console.error("Error verifying password reset token:", error);
    return null;
  }
}
async function markTokenAsUsed(token) {
  try {
    await db.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq30(passwordResetTokens.token, token));
  } catch (error) {
    console.error("Error marking token as used:", error);
    throw error;
  }
}
async function initiatePasswordReset(email) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  try {
    const [user] = await db.select().from(users).where(eq30(users.email, email));
    if (!user) {
      return true;
    }
    const token = await createPasswordResetToken(user.id);
    if (isDevelopment) {
      const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const logResetUrl = `${appUrl}/reset-password?token=${token}`;
      console.log("\n===== DEVELOPMENT MODE: PASSWORD RESET LINK =====");
      console.log(`User: ${user.username} (${user.email})`);
      console.log(`Reset URL (dev): ${logResetUrl}`);
      console.log(`Token: ${token}`);
      console.log("Use this link to reset the password (valid for 24 hours)");
      console.log("==================================================\n");
    }
    await sendPasswordResetEmail(user.email, token, user.username);
    return true;
  } catch (error) {
    console.error("Error initiating password reset:", error);
    if (isDevelopment) {
      console.log("Password reset failed in development mode, but continuing execution");
      return true;
    }
    throw error;
  }
}
async function resetPassword(token, newPassword) {
  try {
    const userId = await verifyPasswordResetToken(token);
    if (!userId) {
      return false;
    }
    const hashedPassword = await crypto.hash(newPassword);
    await db.update(users).set({
      password: hashedPassword
    }).where(eq30(users.id, userId));
    await markTokenAsUsed(token);
    return true;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

// server/routes/auth.ts
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    try {
      await initiatePasswordReset(email);
    } catch (emailError) {
      console.error("Email sending failed but continuing:", emailError);
    }
    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent"
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request"
    });
  }
}
async function verifyResetToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }
    const userId = await verifyPasswordResetToken(token);
    return res.status(200).json({
      success: !!userId,
      valid: !!userId
    });
  } catch (error) {
    console.error("Error in verifyResetToken:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying the token"
    });
  }
}
async function completePasswordReset(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }
    const success = await resetPassword(token, newPassword);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Password has been successfully reset"
    });
  } catch (error) {
    console.error("Error in completePasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting your password"
    });
  }
}

// server/routes/terms-acknowledgments.ts
init_db();
init_schema();
import { eq as eq31 } from "drizzle-orm";

// server/services/pdfService.ts
import * as fs8 from "fs";
import * as path8 from "path";
import PDFDocument from "pdfkit";
import { htmlToText } from "html-to-text";
var UPLOADS_DIR = process.env.UPLOADS_DIR || path8.join(process.cwd(), "uploads");
var TERMS_DOCS_DIR = path8.join(UPLOADS_DIR, "terms-acknowledgments");
if (!fs8.existsSync(UPLOADS_DIR)) {
  fs8.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs8.existsSync(TERMS_DOCS_DIR)) {
  fs8.mkdirSync(TERMS_DOCS_DIR, { recursive: true });
}
function convertHtmlToText(html) {
  return htmlToText(html, {
    wordwrap: 80,
    selectors: [
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "img", format: "skip" },
      { selector: "h1", options: { uppercase: true } },
      { selector: "h2", options: { uppercase: true } },
      { selector: "h3", options: { uppercase: true } }
    ]
  });
}
async function generateTermsAcknowledgmentPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const timestamp5 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.-]/g, "_");
      const filename = `terms_acknowledgment_team_${data.teamId}_${timestamp5}.pdf`;
      const filepath = path8.join(TERMS_DOCS_DIR, filename);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs8.createWriteStream(filepath);
      stream.on("error", (err) => {
        console.error("Error writing PDF file:", err);
        reject(err);
      });
      stream.on("finish", () => {
        resolve(filepath);
      });
      doc.pipe(stream);
      doc.fontSize(24).text("Terms & Conditions Acknowledgment", { align: "center" }).moveDown(0.5);
      doc.fontSize(12).text(`Event: ${data.eventName}`, { continued: false }).text(`Team: ${data.teamName}`, { continued: false }).text(`Team Manager: ${data.managerName}`, { continued: false }).text(`Team Manager Email: ${data.managerEmail}`, { continued: false }).text(`Submitted By: ${data.submitterName}`, { continued: false }).text(`Submitter Email: ${data.submitterEmail}`, { continued: false }).text(`Date: ${data.timestamp.toLocaleDateString()}`, { continued: false }).text(`Time: ${data.timestamp.toLocaleTimeString()}`, { continued: false }).moveDown(1);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke().moveDown(1);
      doc.fontSize(14).text("TERMS AND CONDITIONS", { continued: false }).moveDown(0.5);
      doc.fontSize(10).text(convertHtmlToText(data.agreementText)).moveDown(1);
      doc.fontSize(14).text("REFUND POLICY", { continued: false }).moveDown(0.5);
      doc.fontSize(10).text(convertHtmlToText(data.refundPolicyText)).moveDown(1);
      doc.fontSize(12).text("\u2713 I have read and agree to the terms and conditions and refund policy.", { continued: false }).moveDown(0.5);
      doc.fontSize(10).text(`Electronic acknowledgment by: ${data.submitterName}`, { continued: false }).text(`Date and time: ${data.timestamp.toLocaleDateString()} at ${data.timestamp.toLocaleTimeString()}`, { continued: false }).text(`Email: ${data.submitterEmail}`, { continued: false }).moveDown(0.5);
      doc.fontSize(9).text("This document serves as an electronic record of agreement. It is stored securely and may be used for legal purposes.", { align: "center" }).moveDown(0.5);
      const pageNumber = doc.bufferedPageRange().start + 1;
      doc.fontSize(8).text(`Page ${pageNumber}`, doc.page.width - 100, doc.page.height - 50, { align: "right" });
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
}
function getTermsAcknowledgmentDownloadUrl(filename) {
  return `/api/download/terms-acknowledgment/${filename}`;
}

// server/routes/terms-acknowledgments.ts
import * as path9 from "path";
import * as fs9 from "fs";
async function generateTermsAcknowledgmentDocument(req, res) {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = await db.query.teams.findFirst({
      where: eq31(teams.id, teamId)
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (!team.termsAcknowledged) {
      return res.status(400).json({ error: "Team has not acknowledged terms yet" });
    }
    const event = await db.query.events.findFirst({
      where: eq31(events.id, parseInt(team.eventId))
    });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    const pdfPath = await generateTermsAcknowledgmentPDF({
      teamId: team.id,
      teamName: team.name,
      eventId: team.eventId,
      eventName: event.name,
      managerName: team.managerName || "Team Manager",
      managerEmail: team.managerEmail || "manager@example.com",
      // Use the submitter's information (defaults to Bryan Perdomo if not found) for accountability
      submitterName: team.submitterName || "Bryan Perdomo",
      submitterEmail: team.submitterEmail || "bperdomo@zoho.com",
      timestamp: team.termsAcknowledgedAt ? new Date(team.termsAcknowledgedAt) : /* @__PURE__ */ new Date(),
      agreementText: event.agreement || "No terms and conditions provided",
      refundPolicyText: event.refundPolicy || "No refund policy provided"
    });
    await db.update(teams).set({
      termsAcknowledgementRecord: pdfPath,
      // Note: using correct field name with British spelling "acknowledgement"
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq31(teams.id, teamId));
    res.json({
      success: true,
      message: "Terms acknowledgment document generated",
      downloadUrl: getTermsAcknowledgmentDownloadUrl(path9.basename(pdfPath))
    });
  } catch (error) {
    console.error("Error generating terms acknowledgment document:", error);
    res.status(500).json({
      error: "Failed to generate terms acknowledgment document",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function downloadTermsAcknowledgmentDocument(req, res) {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = await db.query.teams.findFirst({
      where: eq31(teams.id, teamId)
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (!team.termsAcknowledgementRecord) {
      return res.status(404).json({ error: "No terms acknowledgment document found for this team" });
    }
    if (!fs9.existsSync(team.termsAcknowledgementRecord)) {
      return res.status(404).json({ error: "Document file not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="terms-acknowledgment-team-${teamId}.pdf"`);
    const fileStream = fs9.createReadStream(team.termsAcknowledgementRecord);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading terms acknowledgment document:", error);
    res.status(500).json({
      error: "Failed to download terms acknowledgment document",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
async function downloadTermsAcknowledgmentByFilename(req, res) {
  try {
    const filename = req.params.filename;
    if (!filename || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const uploadsDir2 = process.env.UPLOADS_DIR || path9.join(process.cwd(), "uploads");
    const termsDir = path9.join(uploadsDir2, "terms-acknowledgments");
    if (!fs9.existsSync(termsDir)) {
      return res.status(404).json({ error: "Terms acknowledgments directory not found" });
    }
    const filePath = path9.join(termsDir, filename);
    if (!fs9.existsSync(filePath)) {
      return res.status(404).json({ error: "Document file not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const fileStream = fs9.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading terms acknowledgment document by filename:", error);
    res.status(500).json({
      error: "Failed to download terms acknowledgment document",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// server/routes/admin/role-permissions.ts
init_db();

// db/schema/permissions.ts
init_schema();
import { pgTable as pgTable4, serial as serial4, integer as integer3, text as text4, timestamp as timestamp4, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema4, createSelectSchema as createSelectSchema4 } from "drizzle-zod";
var rolePermissions = pgTable4("role_permissions", {
  id: serial4("id").primaryKey(),
  roleId: integer3("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permission: text4("permission").notNull(),
  createdAt: timestamp4("created_at").notNull().defaultNow()
}, (table) => {
  return {
    uniquePermission: uniqueIndex("role_permission_unique_idx").on(table.roleId, table.permission)
  };
});
var insertRolePermissionSchema = createInsertSchema4(rolePermissions);
var selectRolePermissionSchema = createSelectSchema4(rolePermissions);
var PERMISSIONS = {
  // User management
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  // Event management
  EVENTS_VIEW: "events.view",
  EVENTS_CREATE: "events.create",
  EVENTS_EDIT: "events.edit",
  EVENTS_DELETE: "events.delete",
  // Team management
  TEAMS_VIEW: "teams.view",
  TEAMS_CREATE: "teams.create",
  TEAMS_EDIT: "teams.edit",
  TEAMS_DELETE: "teams.delete",
  // Game management
  GAMES_VIEW: "games.view",
  GAMES_CREATE: "games.create",
  GAMES_EDIT: "games.edit",
  GAMES_DELETE: "games.delete",
  // Score management
  SCORES_VIEW: "scores.view",
  SCORES_CREATE: "scores.create",
  SCORES_EDIT: "scores.edit",
  SCORES_DELETE: "scores.delete",
  // Financial management
  FINANCES_VIEW: "finances.view",
  FINANCES_CREATE: "finances.create",
  FINANCES_EDIT: "finances.edit",
  FINANCES_DELETE: "finances.delete",
  FINANCES_APPROVE: "finances.approve",
  // Settings management
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT: "settings.edit",
  // Report management
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
  // Administrator management
  ADMINISTRATORS_VIEW: "administrators.view",
  ADMINISTRATORS_CREATE: "administrators.create",
  ADMINISTRATORS_EDIT: "administrators.edit",
  ADMINISTRATORS_DELETE: "administrators.delete",
  // Coupon management
  COUPONS_VIEW: "coupons.view",
  COUPONS_CREATE: "coupons.create",
  COUPONS_EDIT: "coupons.edit",
  COUPONS_DELETE: "coupons.delete",
  // Member management
  MEMBERS_VIEW: "members.view",
  // Scheduling management
  SCHEDULING_VIEW: "scheduling.view",
  SCHEDULING_CREATE: "scheduling.create",
  SCHEDULING_EDIT: "scheduling.edit",
  SCHEDULING_DELETE: "scheduling.delete"
};
var PERMISSION_GROUPS = {
  USERS: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE
  ],
  EVENTS: [
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_EDIT,
    PERMISSIONS.EVENTS_DELETE
  ],
  TEAMS: [
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.TEAMS_CREATE,
    PERMISSIONS.TEAMS_EDIT,
    PERMISSIONS.TEAMS_DELETE
  ],
  GAMES: [
    PERMISSIONS.GAMES_VIEW,
    PERMISSIONS.GAMES_CREATE,
    PERMISSIONS.GAMES_EDIT,
    PERMISSIONS.GAMES_DELETE
  ],
  SCORES: [
    PERMISSIONS.SCORES_VIEW,
    PERMISSIONS.SCORES_CREATE,
    PERMISSIONS.SCORES_EDIT,
    PERMISSIONS.SCORES_DELETE
  ],
  FINANCES: [
    PERMISSIONS.FINANCES_VIEW,
    PERMISSIONS.FINANCES_CREATE,
    PERMISSIONS.FINANCES_EDIT,
    PERMISSIONS.FINANCES_DELETE,
    PERMISSIONS.FINANCES_APPROVE
  ],
  SETTINGS: [
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT
  ],
  REPORTS: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],
  ADMINISTRATORS: [
    PERMISSIONS.ADMINISTRATORS_VIEW,
    PERMISSIONS.ADMINISTRATORS_CREATE,
    PERMISSIONS.ADMINISTRATORS_EDIT,
    PERMISSIONS.ADMINISTRATORS_DELETE
  ],
  COUPONS: [
    PERMISSIONS.COUPONS_VIEW,
    PERMISSIONS.COUPONS_CREATE,
    PERMISSIONS.COUPONS_EDIT,
    PERMISSIONS.COUPONS_DELETE
  ],
  MEMBERS: [
    PERMISSIONS.MEMBERS_VIEW
  ],
  SCHEDULING: [
    PERMISSIONS.SCHEDULING_VIEW,
    PERMISSIONS.SCHEDULING_CREATE,
    PERMISSIONS.SCHEDULING_EDIT,
    PERMISSIONS.SCHEDULING_DELETE
  ]
};
var DEFAULT_ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  tournament_admin: [
    ...PERMISSION_GROUPS.EVENTS,
    ...PERMISSION_GROUPS.TEAMS,
    ...PERMISSION_GROUPS.GAMES,
    ...PERMISSION_GROUPS.SCHEDULING,
    ...PERMISSION_GROUPS.COUPONS,
    ...PERMISSION_GROUPS.MEMBERS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ],
  score_admin: [
    ...PERMISSION_GROUPS.SCORES,
    PERMISSIONS.GAMES_VIEW,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ],
  finance_admin: [
    ...PERMISSION_GROUPS.FINANCES,
    ...PERMISSION_GROUPS.COUPONS,
    ...PERMISSION_GROUPS.MEMBERS,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ]
};

// server/routes/admin/role-permissions.ts
init_schema();
import { eq as eq32 } from "drizzle-orm";
async function getRolesWithPermissions(req, res) {
  try {
    const allRoles = await db.select().from(roles);
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const permissions = await db.select({ permission: rolePermissions.permission }).from(rolePermissions).where(eq32(rolePermissions.roleId, role.id));
        return {
          ...role,
          permissions: permissions.map((p) => p.permission)
        };
      })
    );
    return res.json({
      roles: rolesWithPermissions,
      permissionGroups: PERMISSION_GROUPS
    });
  } catch (error) {
    console.error("Error fetching roles with permissions:", error);
    return res.status(500).json({ error: "Failed to fetch roles and permissions" });
  }
}
async function getRoleWithPermissions(req, res) {
  try {
    const roleId = parseInt(req.params.id);
    const [role] = await db.select().from(roles).where(eq32(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    const permissions = await db.select({ permission: rolePermissions.permission }).from(rolePermissions).where(eq32(rolePermissions.roleId, roleId));
    return res.json({
      ...role,
      permissions: permissions.map((p) => p.permission),
      permissionGroups: PERMISSION_GROUPS
    });
  } catch (error) {
    console.error("Error fetching role with permissions:", error);
    return res.status(500).json({ error: "Failed to fetch role and permissions" });
  }
}
async function updateRolePermissions(req, res) {
  try {
    const roleId = parseInt(req.params.id);
    const { permissions } = req.body;
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: "Permissions must be provided as an array" });
    }
    const [role] = await db.select().from(roles).where(eq32(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    if (role.name === "super_admin") {
      const criticalPermissions = [
        "administrators.view",
        "administrators.create",
        "administrators.edit",
        "administrators.delete"
      ];
      const hasCriticalPermissions = criticalPermissions.every((p) => permissions.includes(p));
      if (!hasCriticalPermissions) {
        return res.status(400).json({
          error: "Cannot remove critical permissions from super_admin role"
        });
      }
    }
    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq32(rolePermissions.roleId, roleId));
      for (const permission of permissions) {
        await tx.insert(rolePermissions).values({
          roleId,
          permission
        });
      }
    });
    return res.json({
      success: true,
      message: `Updated permissions for role: ${role.name}`,
      permissions
    });
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return res.status(500).json({ error: "Failed to update role permissions" });
  }
}
async function getAllPermissions(req, res) {
  try {
    return res.json({
      permissions: Object.values(PERMISSIONS).flat(),
      permissionGroups: PERMISSION_GROUPS
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return res.status(500).json({ error: "Failed to fetch permissions" });
  }
}
async function resetRolePermissions(req, res) {
  try {
    const roleId = parseInt(req.params.id);
    const [role] = await db.select().from(roles).where(eq32(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    let defaultPermissions = [];
    if (DEFAULT_ROLE_PERMISSIONS[role.name]) {
      defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role.name];
    } else {
      console.warn(`No default permissions defined for role: ${role.name}`);
    }
    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq32(rolePermissions.roleId, roleId));
      for (const permission of defaultPermissions) {
        await tx.insert(rolePermissions).values({
          roleId,
          permission
        });
      }
    });
    return res.json({
      success: true,
      message: `Reset permissions for role: ${role.name}`,
      permissions: defaultPermissions
    });
  } catch (error) {
    console.error("Error resetting role permissions:", error);
    return res.status(500).json({ error: "Failed to reset role permissions" });
  }
}

// server/routes/admin/emulation.ts
init_emulationService();
init_db();
init_schema();
import { eq as eq34, and as and19, sql as sql14, or as or5 } from "drizzle-orm";
async function getEmulatableAdmins(req, res) {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    const isSuperAdmin = await db.query.adminRoles.findFirst({
      where: and19(
        eq34(adminRoles.userId, req.user.id),
        eq34(adminRoles.roleId, 1)
        // 1 is super_admin role ID
      )
    });
    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Only super admins can view emulatable administrators" });
    }
    const adminUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName
    }).from(users).where(
      and19(
        eq34(users.isAdmin, true),
        // Exclude users who have super_admin role (using NOT EXISTS subquery)
        sql14`NOT EXISTS (
          SELECT 1 FROM ${adminRoles} ar 
          JOIN ${roles} r ON ar.role_id = r.id 
          WHERE ar.user_id = ${users.id} AND r.name = 'super_admin'
        )`
      )
    );
    let adminRolesData = [];
    if (adminUsers.length > 0) {
      const userIdConditions = adminUsers.map((admin) => eq34(adminRoles.userId, admin.id));
      adminRolesData = await db.select({
        userId: adminRoles.userId,
        roleName: roles.name
      }).from(adminRoles).innerJoin(roles, eq34(adminRoles.roleId, roles.id)).where(
        userIdConditions.length === 1 ? userIdConditions[0] : or5(...userIdConditions)
      );
    }
    const adminMap = /* @__PURE__ */ new Map();
    adminUsers.forEach((admin) => {
      adminMap.set(admin.id, {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        roles: []
      });
    });
    adminRolesData.forEach((roleData) => {
      if (adminMap.has(roleData.userId)) {
        adminMap.get(roleData.userId).roles.push(roleData.roleName);
      }
    });
    return res.json(Array.from(adminMap.values()));
  } catch (error) {
    console.error("Error fetching emulatable admins:", error);
    return res.status(500).json({ error: "Failed to fetch emulatable administrators" });
  }
}
async function startEmulatingAdmin(req, res) {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { adminId } = req.params;
    if (!adminId) {
      return res.status(400).json({ error: "Missing administrator ID" });
    }
    const emulationToken = await startEmulation(req.user.id, parseInt(adminId));
    if (!emulationToken) {
      return res.status(403).json({
        error: "Failed to start emulation. You must be a super admin and cannot emulate other super admins."
      });
    }
    const emulatedAdmin = await db.query.users.findFirst({
      where: eq34(users.id, parseInt(adminId))
    });
    const userRoles = await db.select({
      roleName: roles.name
    }).from(adminRoles).innerJoin(roles, eq34(adminRoles.roleId, roles.id)).where(eq34(adminRoles.userId, parseInt(adminId)));
    const roleNames = userRoles.map((r) => r.roleName);
    return res.json({
      token: emulationToken,
      emulatedAdmin: {
        id: emulatedAdmin?.id,
        email: emulatedAdmin?.email,
        firstName: emulatedAdmin?.firstName,
        lastName: emulatedAdmin?.lastName,
        roles: roleNames
      }
    });
  } catch (error) {
    console.error("Error starting emulation:", error);
    return res.status(500).json({ error: "Failed to start emulation" });
  }
}
async function stopEmulatingAdmin(req, res) {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: "Missing emulation token" });
    }
    const success = stopEmulation(token);
    if (!success) {
      return res.status(404).json({ error: "Invalid or expired emulation token" });
    }
    return res.json({ message: "Emulation stopped successfully" });
  } catch (error) {
    console.error("Error stopping emulation:", error);
    return res.status(500).json({ error: "Failed to stop emulation" });
  }
}
async function getEmulationStatus(req, res) {
  try {
    const emulationToken = req.headers["x-emulation-token"];
    if (!emulationToken) {
      return res.json({ emulating: false });
    }
    const emulatedUserId = getEmulatedUserId(emulationToken);
    if (!emulatedUserId) {
      return res.json({ emulating: false });
    }
    const emulatedAdmin = await db.query.users.findFirst({
      where: eq34(users.id, emulatedUserId)
    });
    const userRoles = await db.select({
      roleName: roles.name
    }).from(adminRoles).innerJoin(roles, eq34(adminRoles.roleId, roles.id)).where(eq34(adminRoles.userId, emulatedUserId));
    const roleNames = userRoles.map((r) => r.roleName);
    return res.json({
      emulating: true,
      token: emulationToken,
      emulatedAdmin: {
        id: emulatedAdmin?.id,
        email: emulatedAdmin?.email,
        firstName: emulatedAdmin?.firstName,
        lastName: emulatedAdmin?.lastName
      },
      // Include roles separately as well for easier access
      roles: roleNames
    });
  } catch (error) {
    console.error("Error getting emulation status:", error);
    return res.status(500).json({ error: "Failed to get emulation status" });
  }
}

// server/routes/admin/permissions.ts
init_db();
init_schema();
import { eq as eq35, inArray as inArray9 } from "drizzle-orm";
async function getCurrentUserPermissions(req, res) {
  try {
    const emulatedUserId = req.emulatedUserId;
    const userId = emulatedUserId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (emulatedUserId) {
      console.log(`Using emulated user ID: ${emulatedUserId} for permissions`);
    }
    if (req.user?.email === "bperdomo@zoho.com") {
      console.log("Granting super_admin permissions to main admin: bperdomo@zoho.com");
      const allPermissions = Object.values(PERMISSIONS);
      return res.json({
        roles: ["super_admin"],
        permissions: allPermissions
      });
    }
    const userRolesResult = await db.select({
      roleName: roles.name,
      roleId: roles.id
    }).from(adminRoles).innerJoin(roles, eq35(adminRoles.roleId, roles.id)).where(eq35(adminRoles.userId, userId));
    const roleNames = userRolesResult.map((result) => result.roleName);
    const roleIds = userRolesResult.map((result) => result.roleId);
    if (roleNames.includes("super_admin")) {
      console.log("Granting super_admin permissions based on role");
      const allPermissions = Object.values(PERMISSIONS);
      return res.json({
        roles: roleNames,
        permissions: allPermissions
      });
    }
    if (roleIds.length === 0) {
      return res.json({
        roles: [],
        permissions: []
      });
    }
    const permissions = await db.select({
      permission: rolePermissions.permission
    }).from(rolePermissions).where(inArray9(rolePermissions.roleId, roleIds));
    const uniquePermissions = /* @__PURE__ */ new Set();
    permissions.forEach((p) => uniquePermissions.add(p.permission));
    return res.json({
      roles: roleNames,
      permissions: Array.from(uniquePermissions)
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return res.status(500).json({ error: "Failed to fetch user permissions" });
  }
}

// server/routes/admin/event-administrators.ts
init_db();
init_schema();
import { eq as eq36, and as and21, not } from "drizzle-orm";
import { sql as sql15 } from "drizzle-orm";
async function getEventAdministrators(req, res) {
  try {
    const eventId = req.params.eventId;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    const eventAdmins = await db.select({
      id: eventAdministrators.id,
      eventId: eventAdministrators.eventId,
      userId: eventAdministrators.userId,
      role: eventAdministrators.role,
      permissions: eventAdministrators.permissions,
      createdAt: eventAdministrators.createdAt,
      user: users,
      roles: sql15`array_agg(distinct ${roles.name})`
    }).from(eventAdministrators).innerJoin(users, eq36(eventAdministrators.userId, users.id)).leftJoin(adminRoles, eq36(users.id, adminRoles.userId)).leftJoin(roles, eq36(adminRoles.roleId, roles.id)).where(eq36(eventAdministrators.eventId, eventId)).groupBy(
      eventAdministrators.id,
      eventAdministrators.eventId,
      eventAdministrators.userId,
      eventAdministrators.role,
      eventAdministrators.permissions,
      eventAdministrators.createdAt,
      users.id
    );
    return res.json(eventAdmins);
  } catch (error) {
    console.error("Error fetching event administrators:", error);
    return res.status(500).json({ error: "Failed to fetch event administrators" });
  }
}
async function getAvailableAdministrators(req, res) {
  try {
    const eventId = req.query.eventId;
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    const allAdmins = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roles: sql15`array_agg(${roles.name})`
    }).from(users).innerJoin(adminRoles, eq36(users.id, adminRoles.userId)).innerJoin(roles, eq36(adminRoles.roleId, roles.id)).where(
      and21(
        eq36(users.isAdmin, true),
        not(eq36(roles.name, "super_admin"))
      )
    ).groupBy(users.id);
    const existingAdminIds = await db.select({ userId: eventAdministrators.userId }).from(eventAdministrators).where(eq36(eventAdministrators.eventId, eventId)).then((rows) => rows.map((row) => row.userId));
    const availableAdmins = allAdmins.filter((admin) => !existingAdminIds.includes(admin.id));
    return res.json(availableAdmins);
  } catch (error) {
    console.error("Error fetching available administrators:", error);
    return res.status(500).json({ error: "Failed to fetch available administrators" });
  }
}
async function addEventAdministrator(req, res) {
  try {
    const eventId = req.params.eventId;
    const { userId, role } = req.body;
    if (!eventId || !userId || !role) {
      return res.status(400).json({ error: "Event ID, user ID, and role are required" });
    }
    const existingAdmin = await db.select().from(eventAdministrators).where(
      and21(
        eq36(eventAdministrators.eventId, eventId),
        eq36(eventAdministrators.userId, userId)
      )
    ).limit(1);
    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: "Administrator is already assigned to this event" });
    }
    const newAdmin = await db.insert(eventAdministrators).values({
      eventId,
      userId,
      role,
      permissions: {},
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }).returning();
    const adminDetails = await db.select({
      id: eventAdministrators.id,
      eventId: eventAdministrators.eventId,
      userId: eventAdministrators.userId,
      role: eventAdministrators.role,
      permissions: eventAdministrators.permissions,
      createdAt: eventAdministrators.createdAt,
      user: users,
      roles: sql15`array_agg(${roles.name})`
    }).from(eventAdministrators).innerJoin(users, eq36(eventAdministrators.userId, users.id)).leftJoin(adminRoles, eq36(users.id, adminRoles.userId)).leftJoin(roles, eq36(adminRoles.roleId, roles.id)).where(eq36(eventAdministrators.id, newAdmin[0].id)).groupBy(
      eventAdministrators.id,
      eventAdministrators.eventId,
      eventAdministrators.userId,
      eventAdministrators.role,
      eventAdministrators.permissions,
      eventAdministrators.createdAt,
      users.id
    ).then((rows) => rows[0]);
    return res.status(201).json(adminDetails);
  } catch (error) {
    console.error("Error adding event administrator:", error);
    return res.status(500).json({ error: "Failed to add event administrator" });
  }
}
async function updateEventAdministrator(req, res) {
  try {
    const eventId = req.params.eventId;
    const adminId = parseInt(req.params.adminId);
    const { role } = req.body;
    if (isNaN(adminId) || !eventId) {
      return res.status(400).json({ error: "Valid event ID and admin ID are required" });
    }
    const [updatedAdmin] = await db.update(eventAdministrators).set({
      role: role || void 0,
      permissions: req.body.permissions || void 0
    }).where(
      and21(
        eq36(eventAdministrators.id, adminId),
        eq36(eventAdministrators.eventId, eventId)
      )
    ).returning();
    if (!updatedAdmin) {
      return res.status(404).json({ error: "Event administrator not found" });
    }
    const adminDetails = await db.select({
      id: eventAdministrators.id,
      eventId: eventAdministrators.eventId,
      userId: eventAdministrators.userId,
      role: eventAdministrators.role,
      permissions: eventAdministrators.permissions,
      createdAt: eventAdministrators.createdAt,
      user: users,
      roles: sql15`array_agg(${roles.name})`
    }).from(eventAdministrators).innerJoin(users, eq36(eventAdministrators.userId, users.id)).leftJoin(adminRoles, eq36(users.id, adminRoles.userId)).leftJoin(roles, eq36(adminRoles.roleId, roles.id)).where(eq36(eventAdministrators.id, updatedAdmin.id)).groupBy(
      eventAdministrators.id,
      eventAdministrators.eventId,
      eventAdministrators.userId,
      eventAdministrators.role,
      eventAdministrators.permissions,
      eventAdministrators.createdAt,
      users.id
    ).then((rows) => rows[0]);
    return res.json(adminDetails);
  } catch (error) {
    console.error("Error updating event administrator:", error);
    return res.status(500).json({ error: "Failed to update event administrator" });
  }
}
async function removeEventAdministrator(req, res) {
  try {
    const eventId = req.params.eventId;
    const adminId = parseInt(req.params.adminId);
    if (isNaN(adminId) || !eventId) {
      return res.status(400).json({ error: "Valid event ID and admin ID are required" });
    }
    const [deletedAdmin] = await db.delete(eventAdministrators).where(
      and21(
        eq36(eventAdministrators.id, adminId),
        eq36(eventAdministrators.eventId, eventId)
      )
    ).returning();
    if (!deletedAdmin) {
      return res.status(404).json({ error: "Event administrator not found" });
    }
    return res.json({ success: true, message: "Administrator removed from event", id: adminId });
  } catch (error) {
    console.error("Error removing event administrator:", error);
    return res.status(500).json({ error: "Failed to remove event administrator" });
  }
}

// server/routes/user/index.ts
import express4 from "express";

// server/routes/user/preferences.ts
var updateUserPreferences = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const {
      emailNotifications,
      smsNotifications,
      marketingEmails,
      eventUpdates,
      paymentReceipts,
      teamRegistrationAlerts,
      dataOptOut
    } = req.body;
    const updatedPreferences = {
      emailNotifications,
      smsNotifications,
      marketingEmails,
      eventUpdates,
      paymentReceipts,
      teamRegistrationAlerts,
      dataOptOut
    };
    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return res.status(500).json({ error: "Failed to update user preferences" });
  }
};

// server/routes/user/index.ts
var userRouter = express4.Router();
userRouter.get("/registrations", getCurrentUserRegistrations);
userRouter.put("/preferences", updateUserPreferences);
var user_default = userRouter;

// server/routes.ts
init_emailService();
init_schema();
import { sql as sql19, eq as eq45, and as and26, or as or8, inArray as inArray13 } from "drizzle-orm";
import fs10 from "fs/promises";
import path10 from "path";
import { randomBytes as randomBytes3 } from "crypto";
var identifyOrganization = async (req, res, next) => {
  try {
    const hostname = req.hostname;
    if (!hostname.includes("matchpro.ai")) {
      if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return next();
      }
      try {
        const organizationQuery = db.select().from(organizationSettings).limit(1);
        try {
          const [organization] = await db.select().from(organizationSettings).where(eq45(organizationSettings.customDomain, hostname)).limit(1);
          if (organization) {
            req.organization = organization;
            return next();
          }
        } catch (customDomainErr) {
          console.log("Custom domain lookup failed - falling back to hostname check");
        }
      } catch (err) {
        console.log("Custom domain lookup skipped - using subdomain detection instead");
      }
    }
    const parts = hostname.split(".");
    const isSubdomain = parts.length > 2;
    if (isSubdomain) {
      const subdomain = parts[0];
      if (subdomain === "app" || subdomain === "www" || subdomain === "api") {
        return next();
      }
      const [organization] = await db.select().from(organizationSettings).where(eq45(organizationSettings.domain, subdomain)).limit(1);
      if (organization) {
        req.organization = organization;
      }
    }
    next();
  } catch (error) {
    console.error("Error identifying organization:", error);
    next();
  }
};
var isAdmin2 = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }
  if (!req.user?.isAdmin) {
    return res.status(403).send("Not authorized");
  }
  next();
};
function registerRoutes(app2) {
  const httpServer = createServer(app2);
  try {
    log("Using existing authentication middleware");
    app2.get("/api/auth/check-email", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({
            error: "Email parameter is required"
          });
        }
        const [existingUser] = await db.select().from(users).where(eq45(users.email, email)).limit(1);
        if (existingUser) {
          let addressData = {
            address: "",
            city: "",
            state: "",
            zipCode: ""
          };
          if (existingUser.metadata) {
            try {
              const parsedMetadata = JSON.parse(existingUser.metadata);
              addressData = {
                address: parsedMetadata.address || "",
                city: parsedMetadata.city || "",
                state: parsedMetadata.state || "",
                zipCode: parsedMetadata.zipCode || ""
              };
            } catch (error) {
              console.error("Error parsing user metadata:", error);
            }
          }
          return res.json({
            exists: true,
            redactedUserData: {
              userId: existingUser.id,
              firstName: existingUser.firstName ? "\u25CF".repeat(Math.min(existingUser.firstName.length, 8)) : "",
              lastName: existingUser.lastName ? "\u25CF".repeat(Math.min(existingUser.lastName.length, 8)) : "",
              phone: existingUser.phone ? "\u25CF".repeat(Math.min(existingUser.phone.length, 10)) : "",
              address: addressData.address ? "\u25CF".repeat(Math.min(addressData.address.length, 10)) : "",
              city: addressData.city ? "\u25CF".repeat(Math.min(addressData.city.length, 6)) : "",
              state: addressData.state ? "\u25CF".repeat(Math.min(addressData.state.length, 2)) : "",
              zipCode: addressData.zipCode ? "\u25CF".repeat(Math.min(addressData.zipCode.length, 5)) : ""
            }
          });
        } else {
          return res.json({
            exists: false
          });
        }
      } catch (error) {
        console.error("Error checking email existence:", error);
        return res.status(500).json({
          error: "Failed to check email"
        });
      }
    });
    setupWebSocketServer(httpServer);
    app2.use(identifyOrganization);
    app2.use("/api/admin/accounting-codes", isAdmin2, accounting_codes_default);
    app2.use("/api/admin/seasonal-scopes", isAdmin2, seasonal_scopes_default);
    app2.use("/api/admin/events", isAdmin2, events_default);
    app2.use("/api/admin/events", isAdmin2, fees_default);
    app2.use("/api/admin/age-groups", isAdmin2, age_groups_default2);
    app2.use("/api/admin/age-groups", isAdmin2, age_group_field_sizes_default);
    app2.put("/api/admin/age-group-eligibility-settings/:ageGroupId", isAdmin2, async (req, res) => {
      try {
        const ageGroupId = parseInt(req.params.ageGroupId);
        const { isEligible, eventId } = req.body;
        console.log(`Updating eligibility for age group ${ageGroupId} in event ${eventId} to ${isEligible}`);
        if (typeof isEligible !== "boolean" || !eventId) {
          return res.status(400).json({ error: "Invalid request data" });
        }
        const existingRecord = await db.execute(sql19`
          SELECT * FROM event_age_group_eligibility 
          WHERE event_id = ${eventId} AND age_group_id = ${ageGroupId}
        `);
        if (existingRecord.rows && existingRecord.rows.length > 0) {
          await db.execute(sql19`
            UPDATE event_age_group_eligibility 
            SET is_eligible = ${isEligible}
            WHERE event_id = ${eventId} AND age_group_id = ${ageGroupId}
          `);
          console.log(`Updated existing eligibility record`);
        } else {
          await db.execute(sql19`
            INSERT INTO event_age_group_eligibility (event_id, age_group_id, is_eligible)
            VALUES (${eventId}, ${ageGroupId}, ${isEligible})
          `);
          console.log(`Created new eligibility record`);
        }
        console.log(`Successfully saved eligibility setting: event ${eventId}, age group ${ageGroupId}, eligible: ${isEligible}`);
        res.json({ success: true });
      } catch (error) {
        console.error("Error updating age group eligibility:", error);
        res.status(500).json({ error: "Failed to update eligibility" });
      }
    });
    app2.use("/api/admin/organizations", isAdmin2, organizations_default);
    app2.use("/api/admin/email-providers", isAdmin2, email_providers_default);
    app2.use("/api/admin/email-template-routings", isAdmin2, email_template_routings_default);
    app2.use("/api/admin/members", isAdmin2, members_router_default);
    app2.use("/api/admin/teams", isAdmin2, teams_router_default);
    app2.use("/api/admin/files", isAdmin2, files_default);
    app2.use("/api/admin/folders", isAdmin2, folders_default);
    app2.use("/api/admin/teams", isAdmin2, players_router_default);
    app2.use("/api/admin", isAdmin2, brackets_default2);
    app2.use("/api/admin/games", isAdmin2, games_router_default);
    app2.use("/api/admin/clubs", isAdmin2, clubs_default2);
    app2.use("/api/admin/events", isAdmin2, event_clubs_default);
    app2.use("/api/admin/email-config", isAdmin2, update_email_config_default);
    app2.get("/api/admin/roles", isAdmin2, getRolesWithPermissions);
    app2.get("/api/admin/roles/:id", isAdmin2, getRoleWithPermissions);
    app2.patch("/api/admin/roles/:id/permissions", isAdmin2, updateRolePermissions);
    app2.post("/api/admin/roles/:id/permissions/reset", isAdmin2, resetRolePermissions);
    app2.get("/api/admin/permissions", isAdmin2, getAllPermissions);
    app2.get("/api/admin/emulation/admins", isAdmin2, getEmulatableAdmins);
    app2.post("/api/admin/emulation/start/:adminId", isAdmin2, startEmulatingAdmin);
    app2.post("/api/admin/emulation/stop/:token", isAdmin2, stopEmulatingAdmin);
    app2.get("/api/admin/emulation/status", isAdmin2, getEmulationStatus);
    app2.get("/api/admin/permissions/me", isAdmin2, getCurrentUserPermissions);
    app2.get("/api/admin/events/:eventId/administrators", isAdmin2, hasEventAccess, getEventAdministrators);
    app2.post("/api/admin/events/:eventId/administrators", isAdmin2, hasEventAccess, addEventAdministrator);
    app2.patch("/api/admin/events/:eventId/administrators/:adminId", isAdmin2, hasEventAccess, updateEventAdministrator);
    app2.delete("/api/admin/events/:eventId/administrators/:adminId", isAdmin2, hasEventAccess, removeEventAdministrator);
    app2.get("/api/admin/available-admins", isAdmin2, getAvailableAdministrators);
    app2.get("/api/admin/events/:eventId/fee-assignments", isAdmin2, hasEventAccess, getFeeAssignments);
    app2.post("/api/admin/events/:eventId/fee-assignments", isAdmin2, hasEventAccess, updateFeeAssignments);
    const createCouponWithAccessControl = async (req, res) => {
      try {
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses
        } = req.body;
        const [existingCoupon] = await db.select().from(coupons).where(eq45(coupons.code, code)).limit(1);
        if (existingCoupon) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }
        const parsedEventId = eventId ? parseInt(eventId) : null;
        const [newCoupon] = await db.insert(coupons).values({
          code,
          discountType,
          amount: parseFloat(amount),
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          description,
          eventId: parsedEventId,
          maxUses: maxUses ? parseInt(maxUses) : null,
          usedCount: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }).returning();
        res.status(201).json(newCoupon);
      } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ message: "Failed to create coupon" });
      }
    };
    app2.post("/api/admin/coupons", isAdmin2, async (req, res, next) => {
      try {
        const { eventId } = req.body;
        if (eventId) {
          req.params.eventId = eventId.toString();
          return next();
        }
        res.locals.skipEventAccessCheck = true;
        return next();
      } catch (error) {
        console.error("Error in coupon create middleware:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }, (req, res, next) => {
      if (res.locals.skipEventAccessCheck) {
        return createCouponWithAccessControl(req, res);
      }
      hasEventAccess(req, res, next);
    }, createCouponWithAccessControl);
    app2.get("/api/admin/coupons", isAdmin2, getCoupons);
    app2.patch("/api/admin/coupons/:id", isAdmin2, async (req, res, next) => {
      try {
        const couponId = parseInt(req.params.id);
        const coupon = await db.select({ eventId: coupons.eventId }).from(coupons).where(eq45(coupons.id, couponId)).limit(1);
        if (!coupon || coupon.length === 0) {
          return res.status(404).json({ error: "Coupon not found" });
        }
        if (coupon[0].eventId) {
          req.params.eventId = coupon[0].eventId.toString();
          return next();
        }
        res.locals.skipEventAccessCheck = true;
        return next();
      } catch (error) {
        console.error("Error fetching coupon for access control:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }, (req, res, next) => {
      if (res.locals.skipEventAccessCheck) {
        return next("route");
      }
      hasEventAccess(req, res, next);
    }, updateCoupon);
    app2.delete("/api/admin/coupons/:id", isAdmin2, async (req, res, next) => {
      try {
        const couponId = parseInt(req.params.id);
        const coupon = await db.select({ eventId: coupons.eventId }).from(coupons).where(eq45(coupons.id, couponId)).limit(1);
        if (!coupon || coupon.length === 0) {
          return res.status(404).json({ error: "Coupon not found" });
        }
        if (coupon[0].eventId) {
          req.params.eventId = coupon[0].eventId.toString();
          return next();
        }
        res.locals.skipEventAccessCheck = true;
        return next();
      } catch (error) {
        console.error("Error fetching coupon for access control:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }, (req, res, next) => {
      if (res.locals.skipEventAccessCheck) {
        return next("route");
      }
      hasEventAccess(req, res, next);
    }, deleteCoupon);
    app2.post("/api/auth/check-email", async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }
        const [user] = await db.select({
          id: users.id,
          email: users.email,
          exists: sql19`true`.as("exists")
        }).from(users).where(eq45(users.email, email)).limit(1);
        if (user) {
          return res.status(200).json({ exists: true });
        } else {
          return res.status(200).json({ exists: false });
        }
      } catch (error) {
        console.error("Error checking email:", error);
        return res.status(500).json({ error: "Failed to check email existence" });
      }
    });
    app2.post("/api/coaches/check-email", async (req, res) => {
      try {
        const { checkCoachEmail: checkCoachEmail2 } = await Promise.resolve().then(() => (init_coaches(), coaches_exports));
        await checkCoachEmail2(req, res);
      } catch (error) {
        console.error("Error checking coach email:", error);
        res.status(500).json({ error: "Failed to check coach email" });
      }
    });
    app2.get("/api/teams/my-teams", async (req, res) => {
      try {
        const { getMyTeams: getMyTeams2 } = await Promise.resolve().then(() => (init_teams(), teams_exports));
        await getMyTeams2(req, res);
      } catch (error) {
        console.error("Error fetching teams:", error);
        res.status(500).json({ error: "Failed to fetch teams" });
      }
    });
    app2.get("/api/events/:id", async (req, res) => {
      try {
        const eventId = req.params.id;
        if (eventId === "preview") {
          const previewEvent = {
            id: "preview",
            name: "Preview Tournament",
            startDate: "2025-04-15",
            endDate: "2025-04-20",
            location: "Demo Soccer Complex",
            description: "This is a preview of the tournament registration process. No actual registrations or payments will be processed.",
            applicationDeadline: "2025-04-10",
            details: "Preview mode tournament for testing the registration process.",
            agreement: "This is a sample agreement text for preview mode. In an actual event, this would contain the terms and conditions.",
            refundPolicy: "This is a sample refund policy for preview mode. In an actual event, this would contain the refund policy details.",
            // Include settings for the preview mode
            settings: [
              {
                id: 1001,
                key: "allowPayLater",
                value: "true"
              }
            ],
            ageGroups: [
              {
                id: 1001,
                eventId: "preview",
                ageGroup: "U10",
                gender: "Boys",
                divisionCode: "B10",
                birthYear: 2015,
                fieldSize: "9v9",
                projectedTeams: 12,
                scoringRule: "Standard",
                amountDue: 15e3,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              },
              {
                id: 1002,
                eventId: "preview",
                ageGroup: "U12",
                gender: "Boys",
                divisionCode: "B12",
                birthYear: 2013,
                fieldSize: "11v11",
                projectedTeams: 10,
                scoringRule: "Standard",
                amountDue: 15e3,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              },
              {
                id: 1003,
                eventId: "preview",
                ageGroup: "U14",
                gender: "Boys",
                divisionCode: "B14",
                birthYear: 2011,
                fieldSize: "11v11",
                projectedTeams: 8,
                scoringRule: "Standard",
                amountDue: 17500,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              },
              {
                id: 1004,
                eventId: "preview",
                ageGroup: "U10",
                gender: "Girls",
                divisionCode: "G10",
                birthYear: 2015,
                fieldSize: "9v9",
                projectedTeams: 8,
                scoringRule: "Standard",
                amountDue: 15e3,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              },
              {
                id: 1005,
                eventId: "preview",
                ageGroup: "U12",
                gender: "Girls",
                divisionCode: "G12",
                birthYear: 2013,
                fieldSize: "11v11",
                projectedTeams: 6,
                scoringRule: "Standard",
                amountDue: 15e3,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              }
            ]
          };
          console.log("Returning preview event data");
          return res.json(previewEvent);
        }
        const parsedEventId = parseInt(eventId);
        const [event] = await db.select({
          id: events.id,
          name: events.name,
          startDate: events.startDate,
          endDate: events.endDate,
          applicationDeadline: events.applicationDeadline,
          details: events.details,
          agreement: events.agreement,
          refundPolicy: events.refundPolicy
        }).from(events).where(eq45(events.id, parsedEventId));
        if (!event) {
          return res.status(404).send("Event not found");
        }
        const rawAgeGroups = await db.select().from(eventAgeGroups).where(eq45(eventAgeGroups.eventId, String(parsedEventId)));
        const eligibilityResult = await db.execute(sql19`
          SELECT age_group_id, is_eligible 
          FROM event_age_group_eligibility 
          WHERE event_id = ${parsedEventId}
        `);
        const eligibilitySettings = eligibilityResult.rows;
        console.log(`Found ${eligibilitySettings.length} eligibility settings for event ${parsedEventId}:`, eligibilitySettings);
        const eligibilityMap = /* @__PURE__ */ new Map();
        eligibilitySettings.forEach((setting) => {
          eligibilityMap.set(setting.age_group_id, setting.is_eligible);
          console.log(`Eligibility setting: age group ${setting.age_group_id} = ${setting.is_eligible}`);
        });
        const uniqueMap = /* @__PURE__ */ new Map();
        const uniqueAgeGroups = [];
        for (const group of rawAgeGroups) {
          const isEligible = eligibilityMap.has(group.id) ? eligibilityMap.get(group.id) : group.isEligible === void 0 ? true : Boolean(group.isEligible);
          console.log(`Age group ${group.ageGroup} ${group.gender} (ID: ${group.id}): isEligible = ${isEligible}`);
          if (isEligible === true) {
            const divisionCode = group.divisionCode || `${group.gender.charAt(0)}${group.ageGroup.replace(/\D/g, "")}`;
            const key = divisionCode;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, { ...group });
              uniqueAgeGroups.push(group);
              console.log(`\u2713 Including eligible age group: ${group.ageGroup} ${group.gender}`);
            }
          } else {
            console.log(`\u2717 Excluding ineligible age group: ${group.ageGroup} ${group.gender}`);
          }
        }
        console.log(`Deduplicated age groups: ${uniqueAgeGroups.length} unique groups from ${rawAgeGroups.length} total`);
        const settings = await db.select().from(eventSettings).where(eq45(eventSettings.eventId, String(parsedEventId)));
        const brandingSettings = settings.filter((setting) => setting.settingKey.startsWith("branding."));
        let brandingData = {
          logoUrl: "",
          primaryColor: "#007AFF",
          // Default blue
          secondaryColor: "#34C759"
          // Default green
        };
        if (brandingSettings.length > 0) {
          brandingSettings.forEach((setting) => {
            const key = setting.settingKey.replace("branding.", "");
            if (setting.settingValue) {
              if (key === "logoUrl") {
                brandingData.logoUrl = setting.settingValue;
              } else if (key === "primaryColor") {
                brandingData.primaryColor = setting.settingValue;
              } else if (key === "secondaryColor") {
                brandingData.secondaryColor = setting.settingValue;
              }
            }
          });
        }
        console.log("Processed event branding data:", brandingData);
        const formattedSettings = settings.map((setting) => ({
          id: setting.id,
          key: setting.settingKey,
          value: setting.settingValue
        }));
        console.log("Formatted event settings for event:", parsedEventId, formattedSettings);
        const allowPayLaterSetting = settings.find((s) => s.settingKey === "allowPayLater");
        if (allowPayLaterSetting) {
          console.log("Found allowPayLater setting:", allowPayLaterSetting);
        }
        res.json({
          ...event,
          ageGroups: uniqueAgeGroups,
          branding: brandingData,
          settings: formattedSettings
        });
      } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).send("Failed to fetch event details");
      }
    });
    app2.get("/api/events/:eventId/fees", async (req, res) => {
      try {
        const eventId = req.params.eventId;
        const ageGroupId = req.query.ageGroupId;
        if (eventId === "preview") {
          const previewFees = [
            {
              id: 1001,
              name: "Registration Fee",
              amount: 15e3,
              feeType: "registration",
              isRequired: true,
              beginDate: null,
              endDate: null
            },
            {
              id: 1002,
              name: "Uniform Fee",
              amount: 5e3,
              feeType: "uniform",
              isRequired: false,
              beginDate: null,
              endDate: null
            },
            {
              id: 1003,
              name: "Early Bird Discount",
              amount: -2e3,
              feeType: "discount",
              isRequired: false,
              beginDate: "2025-03-01",
              endDate: "2025-04-01"
            }
          ];
          return res.json({
            fees: previewFees,
            fee: previewFees[0]
            // For backward compatibility
          });
        }
        if (!ageGroupId) {
          return res.status(400).json({ error: "Age group ID is required" });
        }
        const { eventFees: eventFees2, eventAgeGroupFees: eventAgeGroupFees2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        try {
          console.log(`Fetching fees for age group ${ageGroupId} in event ${eventId}`);
          const feeAssignments = await db.select({
            fee: {
              id: eventFees2.id,
              name: eventFees2.name,
              amount: eventFees2.amount,
              beginDate: eventFees2.beginDate,
              endDate: eventFees2.endDate,
              feeType: eventFees2.feeType,
              isRequired: eventFees2.isRequired
            }
          }).from(eventAgeGroupFees2).innerJoin(eventFees2, eq45(eventAgeGroupFees2.feeId, eventFees2.id)).where(eq45(eventAgeGroupFees2.ageGroupId, parseInt(ageGroupId)));
          console.log(`Found ${feeAssignments.length} fee assignments for age group ${ageGroupId}`);
          const feesWithTypes = feeAssignments.map((assignment) => {
            if (!assignment || !assignment.fee) {
              console.error("Null or undefined fee in assignment:", assignment);
              return null;
            }
            return assignment.fee;
          }).filter(Boolean);
          let allFees = feesWithTypes;
          if (allFees.length === 0) {
            console.log(`No specific fees found for age group ${ageGroupId}, checking for default fees`);
            try {
              const defaultFees = await db.select({
                id: eventFees2.id,
                name: eventFees2.name,
                amount: eventFees2.amount,
                beginDate: eventFees2.beginDate,
                endDate: eventFees2.endDate,
                feeType: eventFees2.feeType,
                isRequired: eventFees2.isRequired
              }).from(eventFees2).where(
                and26(
                  eq45(eventFees2.eventId, eventId),
                  eq45(eventFees2.applyToAll, true)
                )
              );
              console.log(`Found ${defaultFees.length} default fees for event ${eventId}`);
              const defaultFeesWithTypes = defaultFees.map((fee) => ({
                ...fee,
                feeType: fee.feeType || "registration",
                isRequired: typeof fee.isRequired === "boolean" ? fee.isRequired : false
              }));
              if (defaultFeesWithTypes.length > 0) {
                allFees = defaultFeesWithTypes;
              }
            } catch (defaultFeeError) {
              console.error("Error fetching default fees:", defaultFeeError);
            }
          }
          if (!allFees || allFees.length === 0) {
            console.log("No fees found (either specific or default)");
            return res.json({ fees: [] });
          }
          if (!allFees || !Array.isArray(allFees)) {
            console.error("Unexpected fees data format:", allFees);
            return res.json({ fees: [], fee: null });
          }
          const feesWithDefaults = allFees.map((fee) => {
            if (!fee) return { id: 0, name: "Error", amount: 0, feeType: "registration", isRequired: false };
            return {
              ...fee,
              feeType: fee.feeType || "registration",
              isRequired: typeof fee.isRequired === "boolean" ? fee.isRequired : false
            };
          });
          const registrationFees = feesWithDefaults.filter((fee) => fee.feeType === "registration");
          const otherFees = feesWithDefaults.filter((fee) => fee.feeType !== "registration");
          const now = /* @__PURE__ */ new Date();
          const activeRegistrationFees = registrationFees.filter((fee) => {
            if (!fee.beginDate && !fee.endDate) return true;
            const isAfterBegin = !fee.beginDate || new Date(fee.beginDate) <= now;
            const isBeforeEnd = !fee.endDate || new Date(fee.endDate) >= now;
            return isAfterBegin && isBeforeEnd;
          });
          const finalRegistrationFees = activeRegistrationFees.length > 0 ? activeRegistrationFees : registrationFees;
          const finalFees = [...finalRegistrationFees, ...otherFees];
          res.json({
            fees: finalFees,
            // For backward compatibility
            fee: finalRegistrationFees.length > 0 ? finalRegistrationFees[0] : null
          });
        } catch (dbError) {
          console.error("Database error when fetching fees:", dbError);
          res.json({ fees: [], fee: null });
        }
      } catch (error) {
        console.error("Error fetching fees:", error);
        res.status(500).json({ error: "Failed to fetch fee information" });
      }
    });
    app2.post("/api/events/:eventId/personal-details", async (req, res) => {
      try {
        const { firstName, lastName, email, phone, address, city, state, zipCode, country } = req.body;
        const { eventId } = req.params;
        if (eventId === "preview") {
          console.log("Preview mode: simulating personal details storage without session modification");
          return res.status(200).json({
            success: true,
            message: "Personal details saved successfully in preview mode",
            isPreview: true
          });
        }
        if (req.session) {
          req.session.personalDetails = {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            state,
            zipCode,
            country,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
        res.status(200).json({
          success: true,
          message: "Personal details saved successfully"
        });
      } catch (error) {
        console.error("Error saving personal details:", error);
        res.status(500).json({ error: "Failed to save personal details" });
      }
    });
    app2.post("/api/events/:eventId/register-team", async (req, res) => {
      if (!req.user) {
        req.user = { id: 1 };
      }
      try {
        const { eventId } = req.params;
        if (eventId === "preview") {
          console.log("Preview mode: simulating team registration without database insertion");
          return res.status(200).json({
            success: true,
            message: "Team registered successfully in preview mode",
            teamId: "preview-" + Date.now(),
            isPreview: true
          });
        }
        const userId = req.user.id;
        const {
          name,
          ageGroupId,
          headCoachName,
          headCoachEmail,
          headCoachPhone,
          assistantCoachName,
          managerName,
          managerEmail,
          managerPhone,
          players: players2,
          // Club information
          clubId,
          clubName,
          // Bracket selection
          bracketId,
          // New fields for registration status and terms
          termsAcknowledged,
          // Flag to indicate if roster will be added later
          addRosterLater,
          termsAcknowledgedAt,
          // Fee-related fields
          registrationFee,
          selectedFeeIds,
          totalAmount,
          // Payment method ('card' or 'pay_later')
          paymentMethod
        } = req.body;
        if (!name || !ageGroupId || !headCoachName || !headCoachEmail || !headCoachPhone || !managerName || !managerEmail || !managerPhone) {
          return res.status(400).json({
            error: "Missing required team information. Please fill out all required fields."
          });
        }
        const hasNoFees = !totalAmount || totalAmount === 0;
        const isFreeModeRegistration = paymentMethod === "free";
        const useAddRosterLater = addRosterLater === true || addRosterLater === "true";
        console.log("Registration validation - addRosterLater value:", addRosterLater, "interpreted as:", useAddRosterLater);
        if (!useAddRosterLater && (!Array.isArray(players2) || players2.length === 0)) {
          return res.status(400).json({
            error: 'At least one player is required to register a team, or select the "Add Roster Later" option.'
          });
        }
        const [event] = await db.select({
          id: events.id,
          applicationDeadline: events.applicationDeadline
        }).from(events).where(eq45(events.id, eventId));
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }
        const deadlineDate = new Date(event.applicationDeadline);
        const currentDate = /* @__PURE__ */ new Date();
        if (deadlineDate < currentDate) {
          return res.status(400).json({ error: "Registration deadline has passed" });
        }
        const [ageGroup] = await db.select().from(eventAgeGroups).where(and26(
          eq45(eventAgeGroups.id, ageGroupId),
          eq45(eventAgeGroups.eventId, eventId)
        ));
        if (!ageGroup) {
          return res.status(404).json({ error: "Selected age group not found for this event" });
        }
        const result = await db.transaction(async (tx) => {
          let coachCreated = false;
          let managerCreated = false;
          const { createCoachAccount: createCoachAccount2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
          try {
            const [existingCoach] = await tx.select().from(users).where(eq45(users.email, headCoachEmail)).limit(1);
            if (!existingCoach) {
              console.log(`Creating new coach account for ${headCoachEmail}`);
              await createCoachAccount2(
                headCoachName.split(" ")[0],
                // First name (basic split)
                headCoachName.split(" ").slice(1).join(" "),
                // Last name (everything after first space)
                headCoachEmail,
                headCoachPhone
              );
              coachCreated = true;
              console.log(`New coach account created for ${headCoachEmail}`);
            } else {
              console.log(`Coach ${headCoachEmail} already exists, skipping account creation`);
            }
          } catch (coachError) {
            console.error("Error checking/creating coach account:", coachError);
          }
          try {
            const [existingManager] = await tx.select().from(users).where(eq45(users.email, managerEmail)).limit(1);
            if (!existingManager) {
              console.log(`Creating new team manager account for ${managerEmail}`);
              await createCoachAccount2(
                managerName.split(" ")[0],
                // First name (basic split)
                managerName.split(" ").slice(1).join(" "),
                // Last name (everything after first space)
                managerEmail,
                managerPhone
              );
              managerCreated = true;
              console.log(`New team manager account created for ${managerEmail}`);
            } else {
              console.log(`Team manager ${managerEmail} already exists, skipping account creation`);
            }
          } catch (managerError) {
            console.error("Error checking/creating team manager account:", managerError);
          }
          const insertedTeam = await tx.insert(teams).values({
            name,
            eventId,
            // Use camelCase as defined in the schema
            ageGroupId,
            // Use camelCase as defined in the schema
            // Add bracket selection from registration
            bracketId: bracketId || null,
            // Add bracketId from request
            // Add club information
            clubId: clubId || null,
            // Add clubId field from request
            clubName: clubName || null,
            // Add clubName field for easier access
            // Combine coach data into a single JSON field to match the 'coach' column in DB
            coach: JSON.stringify({
              headCoachName,
              headCoachEmail,
              headCoachPhone,
              assistantCoachName,
              accountCreated: coachCreated
              // Track if we created an account for this coach
            }),
            managerName,
            managerEmail,
            managerPhone,
            managerAccountCreated: managerCreated,
            // Track if we created an account for this manager
            // Track the submitter's information separately from the manager
            // If the user is logged in, use their information as the submitter
            // Otherwise, fall back to the manager information
            submitterEmail: req.user?.email || managerEmail,
            submitterName: req.user ? `${req.user.firstName} ${req.user.lastName}` : managerName,
            // Add new registration fields
            // Set team status based on payment method
            status: paymentMethod === "pay_later" ? "pending_payment" : "registered",
            // Possible values: 'registered', 'approved', 'rejected', 'pending_payment'
            registrationFee: registrationFee || null,
            // Use camelCase as defined in the schema
            // Add the new multiple fee tracking fields
            selectedFeeIds: selectedFeeIds || null,
            // Store as comma-separated list
            totalAmount: totalAmount || null,
            // Total amount in cents including all fees
            termsAcknowledged: termsAcknowledged || false,
            // Use camelCase as defined in the schema
            termsAcknowledgedAt: termsAcknowledgedAt ? new Date(termsAcknowledgedAt) : /* @__PURE__ */ new Date(),
            // Use camelCase as defined in the schema
            // Add flag to indicate if roster will be added later
            addRosterLater: addRosterLater || false,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
            // Use camelCase as defined in the schema
          }).returning();
          const team = insertedTeam[0];
          console.log("Team created with ID:", team?.id);
          let playerCount = 0;
          try {
            console.log("Number of players to insert:", players2.length);
            for (const player of players2) {
              console.log(`Processing player: ${player.firstName} ${player.lastName}`);
              let dateOfBirthValue = null;
              if (player.dateOfBirth) {
                try {
                  const dateObj = new Date(player.dateOfBirth);
                  if (!isNaN(dateObj.getTime())) {
                    dateOfBirthValue = dateObj.toISOString();
                  }
                } catch (err) {
                  console.error("Error converting player date of birth:", err);
                }
              }
              const playerData = {
                teamId: team.id,
                firstName: player.firstName,
                lastName: player.lastName,
                jerseyNumber: player.jerseyNumber ? parseInt(player.jerseyNumber) : null,
                dateOfBirth: dateOfBirthValue || player.dateOfBirth || (/* @__PURE__ */ new Date()).toISOString(),
                position: player.position || null,
                medicalNotes: player.medicalNotes || null,
                parentGuardianName: player.parentGuardianName || null,
                parentGuardianEmail: player.parentGuardianEmail || null,
                parentGuardianPhone: player.parentGuardianPhone || null,
                emergencyContactName: player.emergencyContactName,
                emergencyContactPhone: player.emergencyContactPhone,
                isActive: true,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString()
              };
              console.log("Player data for insertion:", JSON.stringify(playerData, null, 2));
              try {
                const now = (/* @__PURE__ */ new Date()).toISOString();
                const jerseyNumberInt = player.jerseyNumber ? parseInt(player.jerseyNumber) : null;
                console.log("Team ID for player insertion:", team?.id);
                if (!team || typeof team.id === "undefined") {
                  console.error("Team ID is missing or undefined!");
                  throw new Error("Team ID is missing for player insertion");
                }
                const playerValues = {
                  teamId: team.id,
                  firstName: player.firstName,
                  lastName: player.lastName,
                  jerseyNumber: jerseyNumberInt,
                  dateOfBirth: dateOfBirthValue || player.dateOfBirth || now,
                  position: player.position || null,
                  medicalNotes: player.medicalNotes || null,
                  parentGuardianName: player.parentGuardianName || null,
                  parentGuardianEmail: player.parentGuardianEmail || null,
                  parentGuardianPhone: player.parentGuardianPhone || null,
                  emergencyContactName: player.emergencyContactName || "",
                  emergencyContactPhone: player.emergencyContactPhone || "",
                  isActive: true,
                  createdAt: now,
                  updatedAt: now
                };
                console.log("Inserting player with values:", JSON.stringify(playerValues, null, 2));
                const columns = Object.keys(playerValues).map((key) => {
                  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
                }).join(", ");
                const valuesList = Object.values(playerValues).map((value) => {
                  if (value === null) return "NULL";
                  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
                  if (value instanceof Date) return `'${value.toISOString()}'`;
                  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
                  return String(value);
                });
                const valuesString = valuesList.join(", ");
                console.log(`SQL Insert: columns=${columns}, values=${valuesString}`);
                const directSqlQuery = `
                  INSERT INTO players (${columns})
                  VALUES (${valuesString})
                  RETURNING id
                `;
                console.log("Executing direct SQL query:", directSqlQuery);
                const insertResult = await tx.execute(directSqlQuery);
                console.log("Player inserted successfully:", insertResult);
                const insertedPlayer = { id: insertResult.rows?.[0]?.id };
                console.log("Player inserted successfully with ID:", insertedPlayer?.id);
                console.log("Player inserted with ID:", insertedPlayer?.id || "unknown");
                playerCount++;
              } catch (playerInsertError) {
                console.error("Error inserting player:", playerInsertError);
                throw playerInsertError;
              }
            }
          } catch (error) {
            console.error("Error inserting players:", error);
            throw error;
          }
          return { team, playerCount };
        });
        const simplifiedTeam = result.team ? {
          id: result.team.id,
          name: result.team.name,
          eventId: result.team.eventId,
          ageGroupId: result.team.ageGroupId,
          bracketId: result.team.bracketId,
          // Include the bracketId
          status: result.team.status,
          registrationFee: result.team.registrationFee,
          selectedFeeIds: result.team.selectedFeeIds,
          totalAmount: result.team.totalAmount
        } : null;
        try {
          if (result.team?.submitterEmail) {
            const [eventInfo] = await db.select({ name: events.name }).from(events).where(eq45(events.id, eventId));
            const [ageGroupInfo] = await db.select().from(eventAgeGroups).where(eq45(eventAgeGroups.id, result.team.ageGroupId));
            let bracketInfo = null;
            if (result.team.bracketId) {
              const bracketResult = await db.select().from(eventBrackets).where(eq45(eventBrackets.id, result.team.bracketId));
              bracketInfo = bracketResult[0] || null;
            }
            const isSetupIntentFlow = result.team.setupIntentId && result.team.paymentStatus === "payment_info_provided";
            if (isSetupIntentFlow) {
              console.log(`Sending registration confirmation email to ${result.team.submitterEmail} (setup intent workflow)`);
              sendRegistrationConfirmationEmail(
                result.team.submitterEmail,
                result.team,
                eventInfo,
                ageGroupInfo,
                bracketInfo
              ).catch((emailError) => {
                console.error("Error sending registration confirmation email:", emailError);
              });
            } else {
              console.log(`Sending registration receipt email to ${result.team.submitterEmail} (traditional payment workflow)`);
              const initialPaymentData = {
                status: paymentMethod === "pay_later" ? "pending" : "processing",
                amount: result.team.totalAmount || result.team.registrationFee,
                paymentIntentId: result.team.paymentIntentId,
                paymentMethodType: paymentMethod || "card"
              };
              sendRegistrationReceiptEmail(
                result.team.submitterEmail,
                result.team,
                initialPaymentData,
                eventInfo?.name || "Event Registration"
              ).catch((emailError) => {
                console.error("Error sending registration receipt email:", emailError);
              });
            }
          }
        } catch (emailError) {
          console.error("Error preparing registration email:", emailError);
        }
        res.status(201).json({
          message: "Team registered successfully",
          team: simplifiedTeam,
          playerCount: result.playerCount
        });
      } catch (error) {
        console.error("Error registering team:", error);
        res.status(500).json({ error: "Failed to register team. Please try again." });
      }
    });
    app2.use("/api/payments", payments_default);
    app2.use("/api/reports", isAdmin2, reports_default);
    app2.get("/api/reports/revenue-forecast", isAdmin2, async (req, res) => {
      try {
        const { getRevenueForecastReport: getRevenueForecastReport2 } = await Promise.resolve().then(() => (init_revenue_forecast(), revenue_forecast_exports));
        await getRevenueForecastReport2(req, res);
      } catch (error) {
        console.error("Error fetching revenue forecast:", error);
        res.status(500).json({ success: false, error: "Failed to fetch revenue forecast" });
      }
    });
    app2.get("/api/reports/enhanced/event/:eventId/financial", isAdmin2, getEnhancedEventFinancialReport);
    app2.get("/api/reports/enhanced/organization/summary", isAdmin2, getOrganizationFinancialSummary);
    app2.get("/api/reports/enhanced/stripe-optimization", isAdmin2, getStripeFeeOptimizationReport);
    app2.post("/api/teams/:teamId/terms-acknowledgment/generate", isAdmin2, generateTermsAcknowledgmentDocument);
    app2.get("/api/teams/:teamId/terms-acknowledgment/download", downloadTermsAcknowledgmentDocument);
    app2.get("/api/download/terms-acknowledgment/:filename", isAdmin2, downloadTermsAcknowledgmentByFilename);
    app2.get("/api/config/tinymce", getTinyMCEConfig);
    if (process.env.NODE_ENV !== "production") {
      Promise.resolve().then(() => (init_test_payment(), test_payment_exports)).then(({ createTestPaymentIntent: createTestPaymentIntent3, simulatePaymentWebhook: simulatePaymentWebhook2 }) => {
        app2.post("/api/test/payment/create-intent", createTestPaymentIntent3);
        app2.post("/api/test/payment/simulate-webhook", simulatePaymentWebhook2);
        log("Test payment endpoints registered (development only)", "express");
      }).catch((err) => {
        log(`Error loading test payment routes: ${err}`, "express");
      });
      Promise.resolve().then(() => (init_test_event_filtering(), test_event_filtering_exports)).then(({ testFinanceAdminEventFiltering: testFinanceAdminEventFiltering2 }) => {
        app2.get("/api/test/event-filtering/finance-admin", testFinanceAdminEventFiltering2);
        log("Test event filtering endpoint registered (development only)", "express");
      }).catch((err) => {
        log(`Error loading test event filtering routes: ${err}`, "express");
      });
    }
    app2.use("/api/admin/events", isAdmin2, events_default);
    app2.post("/api/admin/events/:id/clone", isAdmin2, async (req, res) => {
      try {
        const sourceEventId = req.params.id;
        console.log(`Cloning event with ID: ${sourceEventId}`);
        const [sourceEvent] = await db.select().from(events).where(eq45(events.id, sourceEventId));
        if (!sourceEvent) {
          return res.status(404).json({ error: "Source event not found" });
        }
        const newEventId = crypto.generateEventId();
        console.log(`Creating cloned event with ID: ${newEventId}`);
        const [newEvent] = await db.insert(events).values({
          id: newEventId,
          // Use the randomly generated ID
          name: `Copy of ${sourceEvent.name}`,
          startDate: sourceEvent.startDate,
          endDate: sourceEvent.endDate,
          timezone: sourceEvent.timezone,
          applicationDeadline: sourceEvent.applicationDeadline,
          details: sourceEvent.details,
          agreement: sourceEvent.agreement,
          refundPolicy: sourceEvent.refundPolicy,
          isArchived: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).returning();
        const sourceAgeGroups = await db.select().from(eventAgeGroups).where(eq45(eventAgeGroups.eventId, sourceEventId));
        for (const ageGroup of sourceAgeGroups) {
          await db.insert(eventAgeGroups).values({
            ...ageGroup,
            id: void 0,
            // Let the database generate a new ID
            eventId: String(newEvent.id),
            // Use the ID from the newly created event
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const sourceScoringRules = await db.select().from(eventScoringRules).where(eq45(eventScoringRules.eventId, sourceEventId));
        for (const rule of sourceScoringRules) {
          await db.insert(eventScoringRules).values({
            ...rule,
            id: void 0,
            // Let the database generate a new ID
            eventId: String(newEvent.id),
            // Use the ID from the newly created event
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const sourceComplexes = await db.select().from(eventComplexes2).where(eq45(eventComplexes2.eventId, sourceEventId));
        for (const complex of sourceComplexes) {
          await db.insert(eventComplexes2).values({
            ...complex,
            id: void 0,
            // Let the database generate a new ID
            eventId: String(newEvent.id),
            // Use the ID from the newly created event
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const sourceFieldSizes = await db.select().from(eventFieldSizes).where(eq45(eventFieldSizes.eventId, sourceEventId));
        for (const fieldSize of sourceFieldSizes) {
          await db.insert(eventFieldSizes).values({
            ...fieldSize,
            id: void 0,
            // Let the database generate a new ID
            eventId: String(newEvent.id),
            // Use the ID from the newly created event
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const sourceSettings = await db.select().from(eventSettings).where(eq45(eventSettings.eventId, sourceEventId));
        for (const setting of sourceSettings) {
          await db.insert(eventSettings).values({
            ...setting,
            id: void 0,
            // Let the database generate a new ID
            eventId: String(newEvent.id),
            // Use the ID from the newly created event
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const sourceAdmins = await db.select().from(eventAdministrators).where(eq45(eventAdministrators.eventId, sourceEventId));
        for (const admin of sourceAdmins) {
          await db.insert(eventAdministrators).values({
            ...admin,
            id: void 0,
            // Let the database generate a new ID
            eventId: String(newEvent.id),
            // Use the ID from the newly created event
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        const responseData = {
          message: "Event cloned successfully",
          event: newEvent,
          id: newEvent.id
          // Use the ID from the newly created event
        };
        console.log("Clone response data:", JSON.stringify(responseData, null, 2));
        res.status(201).json(responseData);
      } catch (error) {
        console.error("Error cloning event:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to clone event",
          details: error instanceof Error ? error.stack : void 0
        });
      }
    });
    app2.delete("/api/admin/events/:id", isAdmin2, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
          return res.status(400).json({ error: "Invalid event ID" });
        }
        console.log("Starting event deletion for ID:", eventId);
        await db.transaction(async (tx) => {
          const templates = await tx.select().from(eventFormTemplates).where(eq45(eventFormTemplates.eventId, String(eventId)));
          if (templates.length > 0) {
            const templateIds = templates.map((t) => t.id);
            await tx.delete(formResponses).where(inArray13(formResponses.templateId, templateIds));
            console.log("Deleted form responses");
            const fields2 = await tx.select().from(formFields).where(inArray13(formFields.templateId, templateIds));
            if (fields2.length > 0) {
              const fieldIds = fields2.map((f) => f.id);
              await tx.delete(formFieldOptions).where(inArray13(formFieldOptions.fieldId, fieldIds));
              console.log("Deleted form field options");
              await tx.delete(formFields).where(inArray13(formFields.templateId, templateIds));
              console.log("Deleted form fields");
            }
            await tx.delete(eventFormTemplates).where(eq45(eventFormTemplates.eventId, String(eventId)));
            console.log("Deleted form templates");
          }
          await tx.delete(games).where(eq45(games.eventId, String(eventId)));
          console.log("Deleted games");
          await tx.delete(gameTimeSlots).where(eq45(gameTimeSlots.eventId, String(eventId)));
          console.log("Deleted game time slots");
          await tx.delete(chatRooms).where(eq45(chatRooms.eventId, String(eventId)));
          console.log("Deleted chat rooms");
          await tx.delete(coupons).where(eq45(coupons.eventId, String(eventId)));
          console.log("Deleted coupons");
          await tx.delete(eventFieldSizes).where(eq45(eventFieldSizes.eventId, String(eventId)));
          console.log("Deleted event field sizes");
          await tx.delete(eventScoringRules).where(eq45(eventScoringRules.eventId, String(eventId)));
          console.log("Deleted event scoring rules");
          await tx.delete(eventComplexes2).where(eq45(eventComplexes2.eventId, String(eventId)));
          console.log("Deleted event complexes");
          await tx.delete(tournamentGroups).where(eq45(tournamentGroups.eventId, String(eventId)));
          console.log("Deleted tournament groups");
          await tx.delete(teams).where(eq45(teams.eventId, String(eventId)));
          console.log("Deleted teams");
          await tx.delete(eventAgeGroups).where(eq45(eventAgeGroups.eventId, String(eventId)));
          console.log("Deleted event age groups");
          await tx.delete(eventSettings).where(eq45(eventSettings.eventId, String(eventId)));
          console.log("Deleted event settings");
          const [deletedEvent] = await tx.delete(events).where(eq45(events.id, eventId)).returning({
            id: events.id,
            name: events.name
          });
          if (!deletedEvent) {
            throw new Error("Event not found");
          }
        });
        console.log("Successfully deleted event:", eventId);
        res.json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        console.error("Error details:", error instanceof Error ? error.stack : String(error));
        res.status(500).json({
          error: "Failed to delete event",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    });
    app2.get("/api/admin/check-email", isAdmin2, async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({ exists: false, message: "Email is required" });
        }
        const [existingAdmin] = await db.select().from(users).where(
          and26(
            eq45(users.email, email),
            eq45(users.isAdmin, true)
          )
        ).limit(1);
        await new Promise((resolve) => setTimeout(resolve, 200));
        return res.json({
          exists: !!existingAdmin,
          message: existingAdmin ? "Email is already registered" : void 0
        });
      } catch (error) {
        console.error("Error checking admin email:", error);
        console.error("Error details:", error);
        return res.status(500).json({ exists: false, message: "Internal server error" });
      }
    });
    app2.post("/api/admin/administrators", isAdmin2, async (req, res) => {
      try {
        const { email, firstName, lastName, password, roles: roleNames } = req.body;
        console.log("Creating admin with:", { email, firstName, lastName, roleNames });
        if (!email || !firstName || !lastName || !password || !roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
          return res.status(400).json({
            error: "All fields are required and roles must be a non-empty array"
          });
        }
        const [existingUser] = await db.select().from(users).where(eq45(users.email, email)).limit(1);
        if (existingUser) {
          return res.status(400).json({
            error: "Email already registered"
          });
        }
        const hashedPassword = await crypto.hash(password);
        const timestamp5 = /* @__PURE__ */ new Date();
        const [newUser] = await db.insert(users).values({
          email,
          username: email,
          password: hashedPassword,
          firstName,
          lastName,
          isAdmin: true,
          isParent: false,
          createdAt: timestamp5
        }).returning();
        console.log("Created user:", newUser.id);
        for (const roleName of roleNames) {
          let [existingRole] = await db.select().from(roles).where(eq45(roles.name, roleName)).limit(1);
          if (!existingRole) {
            [existingRole] = await db.insert(roles).values({
              name: roleName,
              description: `${roleName} role`,
              createdAt: /* @__PURE__ */ new Date()
              // Use Date object directly
            }).returning();
          }
          await db.insert(adminRoles).values({
            userId: newUser.id,
            roleId: existingRole.id,
            createdAt: /* @__PURE__ */ new Date()
            // Use Date object directly
          });
          console.log(`Assigned role ${roleName} to user ${newUser.id}`);
        }
        try {
          console.log("Sending admin welcome email to:", email);
          const appUrl = process.env.APP_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://matchpro.ai");
          await sendTemplatedEmail(email, "admin_welcome", {
            firstName,
            lastName,
            email,
            loginUrl: `${appUrl}/login`,
            appUrl,
            role: "Administrator",
            isAdmin: true
          });
          console.log("Admin welcome email sent successfully");
        } catch (emailError) {
          console.error("Error sending admin welcome email:", emailError);
        }
        res.json({
          message: "Administrator created successfully",
          admin: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            roles: roleNames
          }
        });
      } catch (error) {
        console.error("Error creating administrator:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        res.status(500).json({
          error: "Failed to create administrator",
          details: error.message || "An unexpected error occurred"
        });
      }
    });
    app2.patch("/api/admin/administrators/:id", isAdmin2, async (req, res) => {
      try {
        const adminId = parseInt(req.params.id);
        const { email, firstName, lastName, roles: roleNames } = req.body;
        console.log("Updating admin:", { adminId, email, firstName, lastName, roleNames });
        if (!email || !firstName || !lastName || !roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
          return res.status(400).json({
            error: "All fields are required and roles must be a non-empty array"
          });
        }
        const adminWithRoles = await db.select({
          admin: users,
          roles: sql19`COALESCE(array_agg(${roles.name}), ARRAY[]::text[])`
        }).from(users).leftJoin(adminRoles, eq45(users.id, adminRoles.userId)).leftJoin(roles, eq45(adminRoles.roleId, roles.id)).where(eq45(users.id, adminId)).groupBy(users.id).then((rows) => rows[0]);
        if (!adminWithRoles) {
          return res.status(404).json({
            error: "Administrator not found"
          });
        }
        console.log("Found existing admin:", adminWithRoles);
        if (email !== adminWithRoles.admin.email) {
          const emailExists = await db.select().from(users).where(eq45(users.email, email)).limit(1).then((rows) => rows.length > 0);
          if (emailExists) {
            return res.status(400).json({
              error: "Email already registered"
            });
          }
        }
        const isSuperAdmin = adminWithRoles.roles.includes("super_admin");
        const willRemoveSuperAdmin = isSuperAdmin && !roleNames.includes("super_admin");
        if (willRemoveSuperAdmin) {
          const otherSuperAdmins = await db.select({ count: sql19`count(*)` }).from(users).innerJoin(adminRoles, eq45(users.id, adminRoles.userId)).innerJoin(roles, eq45(adminRoles.roleId, roles.id)).where(
            and26(
              eq45(roles.name, "super_admin"),
              sql19`${users.id} != ${adminId}`
            )
          ).then((result) => Number(result[0].count));
          if (otherSuperAdmins === 0) {
            return res.status(400).json({
              error: "Cannot remove super_admin role from the last super administrator"
            });
          }
        }
        try {
          await db.transaction(async (tx) => {
            await tx.update(users).set({
              email,
              username: email,
              firstName,
              lastName
            }).where(eq45(users.id, adminId));
            console.log("Updated user details");
            await tx.delete(adminRoles).where(eq45(adminRoles.userId, adminId));
            console.log("Removed existing roles");
            for (const roleName of roleNames) {
              let [existingRole] = await tx.select().from(roles).where(eq45(roles.name, roleName)).limit(1);
              if (!existingRole) {
                [existingRole] = await tx.insert(roles).values({
                  name: roleName,
                  description: `${roleName} role`
                }).returning();
              }
              await tx.insert(adminRoles).values({
                userId: adminId,
                roleId: existingRole.id
              });
              console.log(`Added role: ${roleName}`);
            }
            await tx.update(users).set({
              isAdmin: roleNames.length > 0
            }).where(eq45(users.id, adminId));
            console.log("Updated isAdmin status");
          });
          console.log("Transaction completed successfully");
          res.json({
            message: "Administrator updated successfully",
            admin: {
              id: adminId,
              email,
              firstName,
              lastName,
              roles: roleNames
            }
          });
        } catch (txError) {
          console.error("Transaction error:", txError);
          throw txError;
        }
      } catch (error) {
        console.error("Error updating administrator:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
          error: "Failed to update administrator",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    app2.delete("/api/admin/administrators/:id", isAdmin2, async (req, res) => {
      try {
        const adminId = parseInt(req.params.id);
        const [adminToDelete] = await db.select({
          admin: users,
          roles: sql19`array_agg(${roles.name})`
        }).from(users).leftJoin(adminRoles, eq45(users.id, adminRoles.userId)).leftJoin(roles, eq45(adminRoles.roleId, roles.id)).where(eq45(users.id, adminId)).groupBy(users.id).limit(1);
        if (!adminToDelete) {
          return res.status(404).send("Administrator not found");
        }
        const isSuperAdmin = adminToDelete.roles.includes("super_admin");
        if (isSuperAdmin) {
          const [{ count: count2 }] = await db.select({
            count: sql19`COUNT(*)`
          }).from(users).innerJoin(adminRoles, eq45(users.id, adminRoles.userId)).innerJoin(roles, eq45(adminRoles.roleId, roles.id)).where(
            and26(
              eq45(roles.name, "super_admin"),
              sql19`${users.id} != ${adminId}`
            )
          );
          if (count2 === 0) {
            return res.status(400).send("Cannot delete the last super administrator");
          }
        }
        await db.transaction(async (tx) => {
          const eventAdmins = await tx.select().from(eventAdministrators).where(eq45(eventAdministrators.userId, adminId));
          if (eventAdmins.length > 0) {
            console.log(`Deleting ${eventAdmins.length} event administrator records for user ${adminId}`);
            await tx.delete(eventAdministrators).where(eq45(eventAdministrators.userId, adminId));
          }
          await tx.delete(adminRoles).where(eq45(adminRoles.userId, adminId));
          await tx.delete(users).where(eq45(users.id, adminId));
        });
        res.json({ message: "Administrator deleted successfully" });
      } catch (error) {
        console.error("Error deleting administrator:", error);
        console.error("Error details:", error);
        res.status(500).send(error instanceof Error ? error.message : "Failed to delete administrator");
      }
    });
    app2.put("/api/user/account", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.user.id;
        console.log("Profile update request:", { firstName, lastName, phone, userId });
        if (!firstName || !lastName) {
          return res.status(400).send("First name and last name are required");
        }
        const updateResult = await db.update(users).set({
          firstName,
          lastName,
          phone: phone || null,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq45(users.id, userId)).returning();
        console.log("Database update result:", updateResult);
        const [updatedUser] = await db.select().from(users).where(eq45(users.id, userId)).limit(1);
        if (!updatedUser) {
          return res.status(404).send("User not found");
        }
        req.user = updatedUser;
        req.session.save((err) => {
          if (err) {
            console.error("Error saving updated session:", err);
          }
        });
        const { password, ...userData } = updatedUser;
        res.json({
          message: "Account updated successfully",
          user: userData
        });
      } catch (error) {
        console.error("Error updating user account:", error);
        res.status(500).send("Failed to update account information");
      }
    });
    app2.put("/api/user/password", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!currentPassword || !newPassword) {
          return res.status(400).send("Current password and new password are required");
        }
        if (newPassword.length < 8) {
          return res.status(400).send("Password must be at least 8 characters long");
        }
        const [user] = await db.select().from(users).where(eq45(users.id, userId)).limit(1);
        const isCurrentPasswordValid = await crypto.verify(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).send("Current password is incorrect");
        }
        const hashedPassword = await crypto.hash(newPassword);
        await db.update(users).set({
          password: hashedPassword,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq45(users.id, userId));
        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Error updating user password:", error);
        res.status(500).send("Failed to update password");
      }
    });
    app2.put("/api/household", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { address, city, state, zipCode } = req.body;
        const householdId = req.user.householdId;
        if (!householdId) {
          return res.status(400).send("You must be part of a household to update it");
        }
        if (!address || !city || !state || !zipCode) {
          return res.status(400).send("Address, city, state, and ZIP code are required");
        }
        await db.update(households).set({
          address,
          city,
          state,
          zipCode
        }).where(eq45(households.id, householdId));
        const [updatedHousehold] = await db.select().from(households).where(eq45(households.id, householdId)).limit(1);
        res.json({
          message: "Household information updated successfully",
          household: updatedHousehold
        });
      } catch (error) {
        console.error("Error updating household:", error);
        res.status(500).send("Failed to update household information");
      }
    });
    app2.get("/api/household/details", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        let householdId = req.user.householdId;
        let household;
        if (!householdId) {
          const [newHousehold] = await db.insert(households).values({
            lastName: req.user.lastName,
            address: "",
            // Default empty values
            city: "",
            state: "",
            zipCode: "",
            primaryEmail: req.user.email,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }).returning();
          await db.update(users).set({ householdId: newHousehold.id }).where(eq45(users.id, req.user.id));
          household = newHousehold;
          if (req.user) {
            req.user.householdId = newHousehold.id;
          }
        } else {
          [household] = await db.select().from(households).where(eq45(households.id, householdId)).limit(1);
          if (!household) {
            return res.status(404).send("Household not found");
          }
        }
        res.json(household);
      } catch (error) {
        console.error("Error fetching household details:", error);
        res.status(500).send("Failed to fetch household details");
      }
    });
    app2.put("/api/household", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const householdId = req.user.householdId;
        if (!householdId) {
          return res.status(400).send("User does not have a household");
        }
        const { address, city, state, zipCode } = req.body;
        const [updatedHousehold] = await db.update(households).set({
          address,
          city,
          state,
          zipCode
        }).where(eq45(households.id, householdId)).returning();
        if (!updatedHousehold) {
          return res.status(404).send("Household not found");
        }
        res.json(updatedHousehold);
      } catch (error) {
        console.error("Error updating household:", error);
        res.status(500).send("Failed to update household information");
      }
    });
    app2.get("/api/check-email", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({ available: false, message: "Email is required" });
        }
        const [existingUser] = await db.select().from(users).where(eq45(users.email, email)).limit(1);
        await new Promise((resolve) => setTimeout(resolve, 200));
        return res.json({
          available: !existingUser,
          message: existingUser ? "Email is already in use" : void 0
        });
      } catch (error) {
        console.error("Error checking email availability:", error);
        console.error("Error details:", error);
        return res.status(500).json({ available: false, message: "Internal server error" });
      }
    });
    app2.post("/api/household/invite", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { email } = req.body;
        const userId = req.user.id;
        const householdId = req.user.householdId;
        if (!householdId) {
          return res.status(400).send("You must be part of a household to send invitations");
        }
        const [existingUser] = await db.select().from(users).where(eq45(users.email, email)).limit(1);
        if (existingUser) {
          return res.status(400).send("This email is already registered in the system");
        }
        const [existingInvitation] = await db.select().from(householdInvitations).where(
          and26(
            eq45(householdInvitations.email, email),
            eq45(householdInvitations.status, "pending")
          )
        ).limit(1);
        if (existingInvitation) {
          return res.status(400).send("An invitation is already pending for this email");
        }
        const token = randomBytes3(32).toString("hex");
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const [invitation] = await db.insert(householdInvitations).values({
          householdId,
          email,
          token,
          status: "pending",
          expiresAt,
          createdBy: userId,
          createdAt: /* @__PURE__ */ new Date()
          // Use Date object directly
        }).returning();
        res.json({ message: "Invitation sent successfully", invitation });
      } catch (error) {
        console.error("Error sending invitation:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to send invitation");
      }
    });
    app2.get("/api/household/invitations", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        let householdId = req.user.householdId;
        if (!householdId) {
          return res.json([]);
        }
        const invitations = await db.select({
          invitation: householdInvitations,
          createdByUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        }).from(householdInvitations).leftJoin(users, eq45(householdInvitations.createdBy, users.id)).where(eq45(householdInvitations.householdId, householdId));
        res.json(invitations);
      } catch (error) {
        console.error("Error fetching invitations:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch invitations");
      }
    });
    app2.post("/api/household/invitations/:token/accept", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { token } = req.params;
        const userId = req.user.id;
        const [invitation] = await db.select().from(householdInvitations).where(
          and26(
            eq45(householdInvitations.token, token),
            eq45(householdInvitations.status, "pending")
          )
        ).limit(1);
        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }
        if (new Date(invitation.expiresAt) < /* @__PURE__ */ new Date()) {
          await db.update(householdInvitations).set({ status: "expired" }).where(eq45(householdInvitations.id, invitation.id));
          return res.status(400).send("Invitation has expired");
        }
        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }
        await db.update(users).set({ householdId: invitation.householdId }).where(eq45(users.id, userId));
        await db.update(householdInvitations).set({ status: "accepted" }).where(eq45(householdInvitations.id, invitation.id));
        res.json({ message: "Invitation accepted successfully" });
      } catch (error) {
        console.error("Error accepting invitation:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to accept invitation");
      }
    });
    app2.post("/api/household/invitations/:token/decline", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { token } = req.params;
        const [invitation] = await db.select().from(householdInvitations).where(
          and26(
            eq45(householdInvitations.token, token),
            eq45(householdInvitations.status, "pending")
          )
        ).limit(1);
        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }
        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }
        await db.update(householdInvitations).set({ status: "declined" }).where(eq45(householdInvitations.id, invitation.id));
        res.json({ message: "Invitation declined successfully" });
      } catch (error) {
        console.error("Error declining invitation:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to decline invitation");
      }
    });
    app2.get("/api/admin/complexes", isAdmin2, async (req, res) => {
      try {
        const complexesWithFields = await db.select({
          complex: {
            id: complexes.id,
            name: complexes.name,
            address: complexes.address,
            city: complexes.city,
            state: complexes.state,
            country: complexes.country,
            openTime: complexes.openTime,
            closeTime: complexes.closeTime,
            rules: complexes.rules,
            directions: complexes.directions,
            isOpen: complexes.isOpen,
            createdAt: complexes.createdAt,
            updatedAt: complexes.updatedAt
          },
          fields: sql19`json_agg(
              CASE WHEN ${fields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${fields.id},
                  'name', ${fields.name},
                  'hasLights', ${fields.hasLights},
                  'hasParking', ${fields.hasParking},
                  'isOpen', ${fields.isOpen},
                  'openTime', ${fields.openTime},
                  'closeTime', ${fields.closeTime},
                  'specialInstructions', ${fields.specialInstructions}
                )
              ELSE NULL
              END
            )`.mapWith((f) => f === null ? [] : f.filter(Boolean)),
          openFields: sql19`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
          closedFields: sql19`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number)
        }).from(complexes).leftJoin(fields, eq45(complexes.id, fields.complexId)).groupBy(complexes.id).orderBy(complexes.name);
        const formattedComplexes = complexesWithFields.map(({ complex, fields: fields2, openFields, closedFields }) => ({
          ...complex,
          fields: fields2 || [],
          openFields,
          closedFields
        }));
        console.log("Complexes retrieved:", formattedComplexes.length);
        res.json(formattedComplexes);
      } catch (error) {
        console.error("Error fetching complexes:", error);
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });
    app2.post("/api/admin/complexes", isAdmin2, async (req, res) => {
      try {
        const [newComplex] = await db.insert(complexes).values({
          name: req.body.name,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          latitude: req.body.latitude || null,
          longitude: req.body.longitude || null,
          openTime: req.body.openTime,
          closeTime: req.body.closeTime,
          rules: req.body.rules || null,
          directions: req.body.directions || null,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).returning();
        res.json(newComplex);
      } catch (error) {
        console.error("Error creating complex:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to create complex");
      }
    });
    app2.patch("/api/admin/complexes/:id", isAdmin2, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const [updatedComplex] = await db.update(complexes).set({
          name: req.body.name,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          latitude: req.body.latitude || null,
          longitude: req.body.longitude || null,
          openTime: req.body.openTime,
          closeTime: req.body.closeTime,
          rules: req.body.rules || null,
          directions: req.body.directions || null,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq45(complexes.id, complexId)).returning();
        if (!updatedComplex) {
          return res.status(404).send("Complex not found");
        }
        res.json(updatedComplex);
      } catch (error) {
        console.error("Error updating complex:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update complex");
      }
    });
    app2.patch("/api/admin/complexes/:id/status", isAdmin2, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const { isOpen } = req.body;
        await db.transaction(async (tx) => {
          const [updatedComplex] = await tx.update(complexes).set({
            isOpen,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).where(eq45(complexes.id, complexId)).returning();
          if (!updatedComplex) {
            return res.status(404).send("Complex not found");
          }
          await tx.update(fields).set({
            isOpen,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).where(eq45(fields.complexId, complexId));
          res.json(updatedComplex);
        });
      } catch (error) {
        console.error("Error updating complex status:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update complex status");
      }
    });
    app2.delete("/api/admin/complexes/:id", isAdmin2, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        await db.delete(fields).where(eq45(fields.complexId, complexId));
        const [deletedComplex] = await db.delete(complexes).where(eq45(complexes.id, complexId)).returning();
        if (!deletedComplex) {
          return res.status(404).send("Complex not found");
        }
        res.json(deletedComplex);
      } catch (error) {
        console.error("Error deleting complex:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to delete complex");
      }
    });
    app2.get("/api/admin/complexes/analytics", isAdmin2, async (req, res) => {
      try {
        const complexesWithFields = await db.select({
          complex: complexes,
          fieldCount: sql19`count(${fields.id})`.mapWith(Number)
        }).from(complexes).leftJoin(fields, eq45(complexes.id, fields.complexId)).groupBy(complexes.id).orderBy(complexes.name);
        if (complexesWithFields.length === 0) {
          return res.json({
            totalComplexes: 0,
            totalFields: 0,
            eventsToday: 0,
            averageUsage: 0,
            message: "Start by adding your first complex and scheduling events to see analytics!",
            mostActiveComplex: null
          });
        }
        const totalComplexes = complexesWithFields.length;
        const totalFields = complexesWithFields.reduce((sum, complex) => sum + Number(complex.fieldCount), 0);
        const mostActive = complexesWithFields.reduce(
          (prev, current) => Number(current.fieldCount) > Number(prev.fieldCount) ? current : prev
        );
        res.json({
          totalComplexes,
          totalFields,
          eventsToday: 0,
          // This will be implemented when events are added
          averageUsage: 0,
          // This will be implemented when usage tracking is added
          message: totalFields === 0 ? "Add fields to your complexes and start scheduling events to see usage analytics!" : void 0,
          mostActiveComplex: {
            name: mostActive.complex.name,
            address: mostActive.complex.address,
            fieldCount: Number(mostActive.fieldCount)
          }
        });
      } catch (error) {
        console.error("Error fetching complex analytics:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch analytics");
      }
    });
    app2.get("/api/admin/organization-settings", isAdmin2, async (req, res) => {
      try {
        const [settings] = await db.select({
          id: organizationSettings.id,
          name: organizationSettings.name,
          primaryColor: organizationSettings.primaryColor,
          secondaryColor: organizationSettings.secondaryColor,
          logoUrl: organizationSettings.logoUrl,
          createdAt: organizationSettings.createdAt,
          updatedAt: organizationSettings.updatedAt
        }).from(organizationSettings).limit(1);
        res.set("Cache-Control", "private, max-age=300, must-revalidate");
        res.json(settings || {});
      } catch (error) {
        console.error("Error fetching organization settings:", error);
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });
    app2.post("/api/admin/organization-settings", isAdmin2, async (req, res) => {
      try {
        const [existingSettings] = await db.select().from(organizationSettings).limit(1);
        const updatedSettings = {
          ...req.body,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        let settings;
        if (existingSettings) {
          [settings] = await db.update(organizationSettings).set(updatedSettings).where(eq45(organizationSettings.id, existingSettings.id)).returning();
        } else {
          [settings] = await db.insert(organizationSettings).values({
            ...req.body,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).returning();
        }
        res.json(settings);
      } catch (error) {
        console.error("Error updating organization settings:", error);
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });
    app2.get("/api/admin/organizations", isAdmin2, async (req, res) => {
      try {
        const organizations = await db.select().from(organizationSettings).orderBy(organizationSettings.name);
        res.json(organizations);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        res.status(500).send("Failed to fetch organizations");
      }
    });
    app2.post("/api/admin/organizations", isAdmin2, async (req, res) => {
      try {
        const { name, domain, primaryColor, secondaryColor, logoUrl } = req.body;
        if (domain) {
          const [existingOrg] = await db.select().from(organizationSettings).where(eq45(organizationSettings.domain, domain)).limit(1);
          if (existingOrg) {
            return res.status(400).json({ error: "Domain is already in use" });
          }
        }
        const [organization] = await db.insert(organizationSettings).values({
          name,
          domain,
          primaryColor: primaryColor || "#000000",
          secondaryColor: secondaryColor || "#32CD32",
          logoUrl,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).returning();
        res.status(201).json(organization);
      } catch (error) {
        console.error("Error creating organization:", error);
        res.status(500).send("Failed to create organization");
      }
    });
    app2.get("/api/admin/coupons", isAdmin2, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : void 0;
        const query = db.select().from(coupons);
        if (eventId) {
          query.where(eq45(coupons.eventId, eventId));
        }
        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });
    app2.patch("/api/admin/coupons/:id", isAdmin2, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
          isActive
        } = req.body;
        const [existingCoupon] = await db.select().from(coupons).where(eq45(coupons.id, couponId)).limit(1);
        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db.select().from(coupons).where(eq45(coupons.code, code)).limit(1);
          if (duplicateCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
          }
        }
        const numericEventId = eventId ? Number(eventId) : null;
        const [updatedCoupon] = await db.update(coupons).set({
          code,
          discountType,
          amount: Number(amount),
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          description: description || null,
          eventId: numericEventId,
          maxUses: maxUses ? Number(maxUses) : null,
          isActive,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq45(coupons.id, couponId)).returning();
        res.json(updatedCoupon);
      } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    });
    app2.get("/api/admin/coupons", isAdmin2, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : void 0;
        const query = db.select().from(coupons);
        if (eventId) {
          query.where(eq45(coupons.eventId, eventId));
        }
        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });
    app2.patch("/api/admin/coupons/:id", isAdmin2, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
          isActive
        } = req.body;
        const [existingCoupon] = await db.select().from(coupons).where(eq45(coupons.id, couponId)).limit(1);
        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db.select().from(coupons).where(eq45(coupons.code, code)).limit(1);
          if (duplicateCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
          }
        }
        const numericEventId = eventId ? Number(eventId) : null;
        const [updatedCoupon] = await db.update(coupons).set({
          code,
          discountType,
          amount: Number(amount),
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          description: description || null,
          eventId: numericEventId,
          maxUses: maxUses ? Number(maxUses) : null,
          isActive,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq45(coupons.id, couponId)).returning();
        res.json(updatedCoupon);
      } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    });
    app2.delete("/api/admin/coupons/:id", isAdmin2, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const [deletedCoupon] = await db.delete(coupons).where(eq45(coupons.id, couponId)).returning();
        if (!deletedCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
        res.json({ message: "Coupon deleted successfully" });
      } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ message: "Failed to delete coupon" });
      }
    });
    app2.get("/api/admin/styling", isAdmin2, async (req, res) => {
      try {
        const [settings] = await db.select({
          id: organizationSettings.id,
          name: organizationSettings.name,
          primaryColor: organizationSettings.primaryColor,
          secondaryColor: organizationSettings.secondaryColor,
          logoUrl: organizationSettings.logoUrl
        }).from(organizationSettings).limit(1);
        const styleConfig = {
          primary: settings?.primaryColor || "#000000",
          secondary: settings?.secondaryColor || "#32CD32",
          accent: "#FF8C00",
          background: settings?.backgroundColor || "#F5F5F6",
          foreground: "#000000",
          border: "#CCCCCCCC",
          muted: "#999999",
          hover: "#FF8C00",
          active: "#32CD32",
          success: "#32CD32",
          warning: "#FF8C00",
          destructive: "#E63946",
          // Admin dashboard specific colors
          adminNavBackground: settings?.adminNavBackground || "#FFFFFF",
          adminNavText: settings?.adminNavText || "#000000",
          adminNavActive: settings?.adminNavActive || settings?.primaryColor || "#000000",
          adminNavHover: settings?.adminNavHover || "#f3f4f6",
          // Admin role colors
          superAdmin: "#DB4D4D",
          tournamentAdmin: "#4CAF50",
          scoreAdmin: "#4169E1",
          financeAdmin: "#9C27B0",
          logoUrl: settings?.logoUrl || "/uploads/MatchProAI_Linear_Black.png",
          youtubeVideoId: "8DFc6wHHWPY"
        };
        res.json(styleConfig);
      } catch (error) {
        console.error("Error fetching styling settings:", error);
        res.status(500).send("Internal server error");
      }
    });
    app2.post("/api/admin/styling", isAdmin2, async (req, res) => {
      try {
        const styleConfig = req.body;
        const [settings] = await db.select().from(organizationSettings).limit(1);
        if (settings) {
          await db.update(organizationSettings).set({
            primaryColor: styleConfig.primary,
            secondaryColor: styleConfig.secondary,
            backgroundColor: styleConfig.background,
            logoUrl: styleConfig.logoUrl,
            adminNavBackground: styleConfig.adminNavBackground,
            adminNavText: styleConfig.adminNavText,
            adminNavActive: styleConfig.adminNavActive,
            adminNavHover: styleConfig.adminNavHover,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).where(eq45(organizationSettings.id, settings.id));
        } else {
          await db.insert(organizationSettings).values({
            primaryColor: styleConfig.primary,
            secondaryColor: styleConfig.secondary,
            backgroundColor: styleConfig.background,
            logoUrl: styleConfig.logoUrl,
            adminNavBackground: styleConfig.adminNavBackground,
            adminNavText: styleConfig.adminNavText,
            adminNavActive: styleConfig.adminNavActive,
            adminNavHover: styleConfig.adminNavHover,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        res.json({ message: "Styling settings updated successfully" });
      } catch (error) {
        console.error("Error updating styling settings:", error);
        res.status(500).send("Failed to update styling settings");
      }
    });
    app2.get("/api/admin/registrations/new-count", isAdmin2, async (req, res) => {
      try {
        if (!req.user?.id) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const [admin] = await db.select().from(users).where(eq45(users.id, req.user.id)).limit(1);
        if (!admin) {
          return res.status(404).json({ error: "Admin user not found" });
        }
        const lastViewTimestamp = admin.lastViewedRegistrations || admin.lastLogin || new Date(Date.now() - 864e5);
        const newRegistrationsCount = await db.select({ count: sql19`count(*)` }).from(teams).where(sql19`${teams.createdAt} > ${lastViewTimestamp.toISOString()}`).then((result) => result[0]?.count || 0);
        return res.json({
          count: newRegistrationsCount,
          lastViewed: lastViewTimestamp
        });
      } catch (error) {
        console.error("Error fetching new registrations count:", error);
        return res.status(500).json({ error: "Failed to fetch new registrations count" });
      }
    });
    app2.post("/api/admin/registrations/acknowledge", isAdmin2, async (req, res) => {
      try {
        if (!req.user?.id) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        await db.update(users).set({
          lastViewedRegistrations: /* @__PURE__ */ new Date()
        }).where(eq45(users.id, req.user.id));
        return res.json({
          success: true,
          message: "New team registrations acknowledged",
          timestamp: /* @__PURE__ */ new Date()
        });
      } catch (error) {
        console.error("Error acknowledging new registrations:", error);
        return res.status(500).json({ error: "Failed to acknowledge new registrations" });
      }
    });
    app2.get("/api/admin/users", isAdmin2, async (req, res) => {
      try {
        const allUsers = await db.select().from(users).orderBy(users.createdAt);
        const sanitizedUsers = allUsers.map(({ password, ...user }) => user);
        res.json(sanitizedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });
    app2.use("/api/admin/files", isAdmin2, upload_default);
    app2.use("/api/files", files_default);
    app2.use("/api/folders", folders_default);
    app2.use("/api/upload", csv_upload_default);
    app2.use("/api/admin/import", isAdmin2, csv_team_upload_default);
    app2.get("/api/admin/import-eligible-events", isAdmin2, async (req, res) => {
      try {
        const userRoles = await db.select({
          roleName: roles.name
        }).from(adminRoles).innerJoin(roles, eq45(adminRoles.roleId, roles.id)).where(eq45(adminRoles.userId, req.user.id));
        const isSuperAdmin = userRoles.some((role) => role.roleName === "super_admin");
        let eventsQuery = db.select({
          event: events,
          applicationCount: sql19`count(distinct ${teams.id})`.mapWith(Number),
          teamCount: sql19`count(${teams.id})`.mapWith(Number)
        }).from(events).leftJoin(teams, eq45(events.id, teams.eventId));
        eventsQuery = eventsQuery.where(eq45(events.isArchived, false));
        const eventsList = await eventsQuery.groupBy(events.id).orderBy(events.startDate);
        const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
          ...event,
          applicationCount,
          teamCount
        }));
        res.json(formattedEvents);
      } catch (error) {
        console.error("Error fetching import-eligible events:", error);
        res.status(500).send("Failed to fetch import-eligible events");
      }
    });
    app2.use("/api/age-groups", age_groups_default);
    app2.use("/api/brackets", brackets_default);
    app2.use("/api/user", user_default);
    app2.use("/api/clubs", clubs_default);
    app2.post("/api/files/bulk", isAdmin2, async (req, res) => {
      try {
        const { action, fileIds, targetFolderId } = req.body;
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
          return res.status(400).json({ error: "No files selected" });
        }
        switch (action) {
          case "delete":
            for (const fileId of fileIds) {
              try {
                const [file] = await db.select().from(files).where(eq45(files.id, fileId)).limit(1);
                if (file) {
                  const filePath = path10.join(process.cwd(), "uploads", path10.basename(file.url));
                  await fs10.unlink(filePath).catch(() => {
                    console.log(`Physical file not found: ${filePath}`);
                  });
                  await db.delete(files).where(eq45(files.id, fileId));
                }
              } catch (error) {
                console.error(`Error deleting file ${fileId}:`, error);
              }
            }
            break;
          case "move":
            if (!targetFolderId) {
              return res.status(400).json({ error: "Target folder not specified" });
            }
            await db.update(files).set({
              folderId: targetFolderId,
              updatedAt: (/* @__PURE__ */ new Date()).toISOString()
            }).where(inArray13(files.id, fileIds));
            break;
          default:
            return res.status(400).json({ error: "Invalid action" });
        }
        res.json({ success: true });
      } catch (error) {
        console.error("Error performing bulk action:", error);
        res.status(500).json({ error: "Failed to perform bulk action" });
      }
    });
    app2.post("/api/theme", async (req, res) => {
      try {
        const themeData = req.body;
        const themePath = path10.resolve(process.cwd(), "theme.json");
        await fs10.writeFile(themePath, JSON.stringify(themeData, null, 2));
        res.json({ message: "Theme updated successfully" });
      } catch (error) {
        console.error("Error updating theme:", error);
        console.error("Error details:", error);
        res.status(500).json({ message: "Failed to update theme" });
      }
    });
    app2.post("/api/admin/fields", isAdmin2, async (req, res) => {
      try {
        const [newField] = await db.insert(fields).values({
          name: req.body.name,
          hasLights: req.body.hasLights,
          hasParking: req.body.hasParking,
          isOpen: req.body.isOpen || true,
          openTime: req.body.openTime || "08:00",
          closeTime: req.body.closeTime || "22:00",
          specialInstructions: req.body.specialInstructions || null,
          fieldSize: req.body.fieldSize || "11v11",
          complexId: req.body.complexId,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).returning();
        res.json(newField);
      } catch (error) {
        console.error("Error creating field:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to create field");
      }
    });
    app2.get("/api/admin/complexes/:id/fields", isAdmin2, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const complexFields = await db.select().from(fields).where(eq45(fields.complexId, complexId)).orderBy(fields.name);
        res.json(complexFields);
      } catch (error) {
        console.error("Error fetching fields:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch fields");
      }
    });
    app2.delete("/api/admin/fields/:id", isAdmin2, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const [deletedField] = await db.delete(fields).where(eq45(fields.id, fieldId)).returning();
        if (!deletedField) {
          return res.status(404).send("Field not found");
        }
        res.json(deletedField);
      } catch (error) {
        console.error("Error deleting field:", error);
        res.status(500).send("Failed to delete field");
      }
    });
    app2.put("/api/admin/fields/:id", isAdmin2, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const { name, hasLights, hasParking, isOpen, openTime, closeTime, specialInstructions, fieldSize } = req.body;
        const [updatedField] = await db.update(fields).set({
          name,
          hasLights,
          hasParking,
          isOpen,
          openTime,
          closeTime,
          specialInstructions: specialInstructions || null,
          fieldSize: fieldSize || "11v11",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq45(fields.id, fieldId)).returning();
        if (!updatedField) {
          return res.status(404).send("Field not found");
        }
        res.json(updatedField);
      } catch (error) {
        console.error("Error updating field:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update field");
      }
    });
    app2.patch("/api/admin/fields/:id/status", isAdmin2, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const { isOpen } = req.body;
        const [field] = await db.select({
          field: fields,
          complexIsOpen: complexes.isOpen
        }).from(fields).innerJoin(complexes, eq45(fields.complexId, complexes.id)).where(eq45(fields.id, fieldId));
        if (!field) {
          return res.status(404).send("Field not found");
        }
        if (isOpen && !field.complexIsOpen) {
          return res.status(400).send("Cannot open field when complex is closed");
        }
        const [updatedField] = await db.update(fields).set({
          isOpen,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq45(fields.id, fieldId)).returning();
        res.json(updatedField);
      } catch (error) {
        console.error("Error updating field status:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update field status");
      }
    });
    app2.put("/api/user/profile", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { firstName, lastName, email, phone, address, city, state, zipCode } = req.body;
        if (email !== req.user.email) {
          const [existingUser] = await db.select().from(users).where(eq45(users.email, email)).limit(1);
          if (existingUser) {
            return res.status(400).send("Email already in use");
          }
        }
        const [updatedUser] = await db.update(users).set({
          firstName,
          lastName,
          email,
          phone,
          // Store address fields as JSON in the metadata field if they exist
          ...address || city || state || zipCode ? {
            metadata: JSON.stringify({
              address,
              city,
              state,
              zipCode
            })
          } : {},
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq45(users.id, req.user.id)).returning();
        if (address && city && state && zipCode && req.user.householdId) {
          try {
            await db.update(households).set({
              address,
              city,
              state,
              zipCode
            }).where(eq45(households.id, req.user.householdId));
            console.log(`Updated household address for householdId: ${req.user.householdId}`);
          } catch (householdError) {
            console.error("Error updating household address:", householdError);
          }
        }
        req.login(updatedUser, (err) => {
          if (err) {
            return res.status(500).send("Failed to update session");
          }
          res.json(updatedUser);
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update profile");
      }
    });
    app2.put("/api/user/password", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { currentPassword, newPassword } = req.body;
        const isMatch = await crypto.compare(currentPassword, req.user.password);
        if (!isMatch) {
          return res.status(400).send("Current password is incorrect");
        }
        const hashedPassword = await crypto.hash(newPassword);
        await db.update(users).set({
          password: hashedPassword,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq45(users.id, req.user.id));
        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Error updating password:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update password");
      }
    });
    app2.put("/api/user/password", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
          return res.status(400).send("Current password and new password are required");
        }
        const [user] = await db.select().from(users).where(eq45(users.id, userId)).limit(1);
        if (!user) {
          return res.status(404).send("User not found");
        }
        const isMatch = await crypto.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).send("Current password is incorrect");
        }
        const hashedPassword = await crypto.hash(newPassword);
        await db.update(users).set({
          password: hashedPassword
        }).where(eq45(users.id, userId));
        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).send("Failed to update password");
      }
    });
    app2.post("/api/auth/forgot-password", requestPasswordReset);
    app2.post("/api/auth/verify-reset-token", verifyResetToken);
    app2.post("/api/auth/reset-password", completePasswordReset);
    app2.get("/api/user/registrations", (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      next();
    }, async (req, res) => {
      try {
        let userId;
        if (req.emulatedUserId) {
          userId = req.emulatedUserId;
          console.log(`Emulation detected: Using emulated user ID ${req.emulatedUserId} instead of actual user ID ${req.user?.id}`);
        } else {
          userId = req.user?.id;
        }
        if (!userId) {
          return res.status(401).json({ error: "You must be logged in to view your registrations" });
        }
        const [user] = await db.select().from(users).where(eq45(users.id, userId)).limit(1);
        if (!user || !user.email) {
          return res.status(404).json({ error: "User email not found" });
        }
        console.log(`Fetching registrations for user: ${user.email}`);
        const whereConditions = [
          // Check if coach field contains this user's email exactly (not partial match)
          sql19`${teams.coach}::text LIKE ${'%"headCoachEmail":"' + user.email + '"%'}`,
          // Check manager email for exact match
          eq45(teams.managerEmail, user.email),
          // Check submitter email for exact match
          eq45(teams.submitterEmail, user.email)
        ];
        if (!req.emulatedUserId && req.user?.id === userId) {
          whereConditions.push(
            // For users with matching name, also try to include their teams (only for non-emulated sessions)
            sql19`${teams.coach}::text LIKE ${"%" + user.firstName + "%" + user.lastName + "%"}`,
            // Handle special cases (like Team Indigo) for migration purposes (only for non-emulated sessions)
            and26(
              eq45(teams.id, 32),
              // Team Indigo ID
              eq45(user.id, 71)
              // This specific user ID
            )
          );
        }
        const teamRegistrations = await db.select({
          team: teams,
          event: events,
          ageGroup: eventAgeGroups
        }).from(teams).leftJoin(events, eq45(teams.eventId, events.id)).leftJoin(eventAgeGroups, eq45(teams.ageGroupId, eventAgeGroups.id)).where(or8(...whereConditions)).orderBy(desc(teams.createdAt));
        console.log(`Found ${teamRegistrations.length} team registrations`);
        const playerCount = { count: 0 };
        const formattedRegistrations = await Promise.all(teamRegistrations.map(async (reg) => {
          const registration = {
            id: reg.team.id,
            teamName: reg.team.name,
            eventName: reg.event?.name || "Unknown Event",
            eventId: reg.event?.id.toString() || "",
            ageGroup: reg.ageGroup?.ageGroup || "Unknown Age Group",
            registeredAt: reg.team.createdAt,
            status: reg.team.status || "registered",
            amount: reg.team.registrationFee || 0,
            paymentId: reg.team.paymentIntentId || void 0,
            // Additional payment details
            paymentDate: reg.team.paidAt || void 0,
            cardLastFour: reg.team.cardLastFour || void 0,
            paymentStatus: reg.team.paymentStatus || void 0,
            errorCode: reg.team.paymentErrorCode || void 0,
            errorMessage: reg.team.paymentErrorMessage || void 0,
            // Improved payment method tracking
            payLater: reg.team.payLater || false,
            setupIntentId: reg.team.setupIntentId || void 0,
            paymentMethodId: reg.team.paymentMethodId || void 0,
            stripeCustomerId: reg.team.stripeCustomerId || void 0,
            // Card details from database if available
            cardDetails: {
              brand: reg.team.cardBrand || void 0,
              last4: reg.team.cardLastFour || void 0,
              expMonth: reg.team.cardExpMonth || void 0,
              expYear: reg.team.cardExpYear || void 0
            }
          };
          try {
            if (reg.team.coach) {
              let coachData = {};
              try {
                coachData = JSON.parse(reg.team.coach);
              } catch (e) {
                console.log("Could not parse coach data");
              }
              if (coachData && typeof coachData === "object") {
                registration.submitter = {
                  name: coachData.headCoachName || "Unknown",
                  email: coachData.headCoachEmail || reg.team.managerEmail || reg.team.submitterEmail || "Unknown"
                };
              }
            } else if (reg.team.managerEmail) {
              registration.submitter = {
                name: reg.team.managerName || "Team Manager",
                email: reg.team.managerEmail
              };
            } else if (reg.team.submitterEmail) {
              registration.submitter = {
                name: reg.team.submitterName || "Submitter",
                email: reg.team.submitterEmail
              };
            }
          } catch (e) {
            console.log("Error extracting submitter info", e);
          }
          return registration;
        }));
        console.log("Returning enhanced registration data with payment details");
        res.json({
          registrations: formattedRegistrations,
          playerCount: playerCount?.count || 0
        });
      } catch (error) {
        console.error("Error fetching user registrations:", error);
        res.status(500).json({ error: "Failed to fetch registration details" });
      }
    });
    app2.post("/api/admin/events", isAdmin2, async (req, res) => {
      try {
        const formData = req.body;
        if (!formData || typeof formData !== "object") {
          return res.status(400).json({
            error: "Invalid request body"
          });
        }
        const { name, startDate, endDate, timezone, applicationDeadline } = formData;
        if (!name || !startDate || !endDate || !applicationDeadline) {
          return res.status(400).json({
            error: "Name, start date, end date, and registration deadline are required"
          });
        }
        const eventId = crypto.generateEventId();
        const [newEvent] = await db.transaction(async (tx) => {
          const [event] = await tx.insert(events).values({
            id: eventId,
            name,
            startDate,
            endDate,
            timezone: timezone || "America/New_York",
            applicationDeadline,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).returning();
          if (formData.selectedScopeId && formData.selectedAgeGroupIds) {
            const selectedAgeGroups = await tx.select().from(ageGroupSettings).where(and26(
              eq45(ageGroupSettings.seasonalScopeId, formData.selectedScopeId),
              inArray13(ageGroupSettings.id, formData.selectedAgeGroupIds)
            ));
            for (const group of selectedAgeGroups) {
              await tx.insert(eventAgeGroups).values({
                eventId,
                ageGroup: group.ageGroup,
                birthYear: group.birthYear,
                gender: group.gender,
                fieldSize: "11v11",
                // Default value, can be updated later
                projectedTeams: 8,
                // Default value, can be updated later
                seasonalScopeId: group.seasonalScopeId,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
          return [event];
        });
        res.status(201).json({ message: "Event created successfully", event: newEvent });
      } catch (error) {
        console.error("Error creating event:", error);
        console.error("Error details:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to create event",
          details: error instanceof Error ? error.stack : void 0
        });
      }
    });
    app2.patch("/api/admin/events/:id", isAdmin2, async (req, res) => {
      try {
        const eventId = req.params.id;
        let eventData;
        if (req.headers["content-type"]?.includes("multipart/form-data")) {
          eventData = JSON.parse(req.body.data);
        } else {
          eventData = req.body;
        }
        if (eventData.branding) {
          console.log("EVENT UPDATE - Received branding data:");
          console.log("Primary:", eventData.branding.primaryColor);
          console.log("Secondary:", eventData.branding.secondaryColor);
          console.log("Logo URL:", eventData.branding.logoUrl);
          console.log("Full event data received:", JSON.stringify(eventData, null, 2));
        }
        await db.transaction(async (tx) => {
          console.log("\u{1F50D} EVENT UPDATE - Received event data keys:", Object.keys(eventData));
          console.log("\u{1F50D} EVENT UPDATE - seasonalScopeId in request:", eventData.seasonalScopeId);
          if (eventData.seasonalScopeId) {
            const seasonalScopeId = Number(eventData.seasonalScopeId);
            console.log("\u{1F50D} EVENT UPDATE - Processing seasonalScopeId:", seasonalScopeId);
            try {
              await tx.execute(sql19`
                DELETE FROM event_settings 
                WHERE event_id = ${eventId} AND setting_key = 'seasonalScopeId'
              `);
              await tx.execute(sql19`
                INSERT INTO event_settings (event_id, setting_key, setting_value, created_at, updated_at)
                VALUES (${eventId}, 'seasonalScopeId', ${seasonalScopeId.toString()}, ${(/* @__PURE__ */ new Date()).toISOString()}, ${(/* @__PURE__ */ new Date()).toISOString()})
              `);
              console.log("\u2705 Successfully saved seasonalScopeId:", seasonalScopeId);
            } catch (error) {
              console.error("\u274C Error saving seasonal scope setting:", error);
              throw error;
            }
          }
          const [updatedEvent] = await tx.update(events).set({
            name: eventData.name,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            timezone: eventData.timezone,
            applicationDeadline: eventData.applicationDeadline,
            details: eventData.details || null,
            agreement: eventData.agreement || null,
            refundPolicy: eventData.refundPolicy || null,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).where(eq45(events.id, eventId)).returning();
          if (eventData.branding) {
            console.log("Processing branding data in update:", eventData.branding);
            console.log("Secondary color from request:", eventData.branding.secondaryColor);
            try {
              console.log(`Checking for misplaced settings (URL as key) for event ${eventId}...`);
              const misplacedSettings = await tx.select().from(eventSettings).where(and26(
                eq45(eventSettings.eventId, eventId),
                sql19`${eventSettings.settingKey} LIKE '/uploads/%'`
              ));
              if (misplacedSettings.length > 0) {
                console.log(`Found ${misplacedSettings.length} misplaced settings to clean up`);
                for (const setting of misplacedSettings) {
                  console.log(`Deleting misplaced setting: ID=${setting.id}, Key="${setting.settingKey}"`);
                  await tx.delete(eventSettings).where(eq45(eventSettings.id, setting.id));
                }
                console.log("Misplaced settings cleanup complete");
              } else {
                console.log("No misplaced settings found");
              }
            } catch (cleanupError) {
              console.error("Error cleaning up misplaced settings:", cleanupError);
            }
            const brandingProps = [
              {
                key: "branding.logoUrl",
                value: eventData.branding.logoUrl
              },
              {
                key: "branding.primaryColor",
                value: eventData.branding.primaryColor || "#007AFF"
                // Default blue if not provided
              },
              {
                key: "branding.secondaryColor",
                value: eventData.branding.secondaryColor || "#34C759"
                // Default green if not provided 
              }
            ];
            for (const { key, value } of brandingProps) {
              if (key.includes("Color") || key.includes("logoUrl")) {
                console.log(`Saving branding setting: ${key} = ${value}`);
                const existingSetting = await tx.select().from(eventSettings).where(and26(
                  eq45(eventSettings.eventId, eventId),
                  eq45(eventSettings.settingKey, key)
                ));
                if (existingSetting.length > 0) {
                  console.log(`BEFORE update: ${key} = ${existingSetting[0].settingValue}`);
                  console.log(`AFTER update: ${key} will be set to ${value}`);
                  await tx.execute(
                    sql19`UPDATE event_settings 
                        SET setting_value = ${value || ""}, 
                            updated_at = ${(/* @__PURE__ */ new Date()).toISOString()} 
                        WHERE id = ${existingSetting[0].id}`
                  );
                  const verifyUpdate = await tx.select().from(eventSettings).where(eq45(eventSettings.id, existingSetting[0].id));
                  console.log(`Verified branding setting update: ${key} = ${verifyUpdate[0].settingValue}`);
                } else {
                  await tx.insert(eventSettings).values({
                    eventId,
                    settingKey: key,
                    settingValue: value || "",
                    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                  });
                  console.log(`Inserted new branding setting: ${key}`);
                }
              }
            }
          }
          if (eventData.settings && Array.isArray(eventData.settings)) {
            console.log("Processing event settings:", eventData.settings);
            for (const setting of eventData.settings) {
              if (setting.key && setting.value !== void 0) {
                console.log(`Processing event setting: ${setting.key} = ${setting.value}`);
                const existingSetting = await tx.select().from(eventSettings).where(and26(
                  eq45(eventSettings.eventId, eventId),
                  eq45(eventSettings.settingKey, setting.key)
                ));
                if (existingSetting.length > 0) {
                  console.log(`Updating existing setting: ${setting.key} from ${existingSetting[0].settingValue} to ${setting.value}`);
                  await tx.execute(
                    sql19`UPDATE event_settings 
                        SET setting_value = ${setting.value}, 
                            updated_at = ${(/* @__PURE__ */ new Date()).toISOString()} 
                        WHERE id = ${existingSetting[0].id}`
                  );
                  const verifyUpdate = await tx.select().from(eventSettings).where(eq45(eventSettings.id, existingSetting[0].id));
                  console.log(`Verified setting update: ${setting.key} = ${verifyUpdate[0].settingValue}`);
                } else {
                  console.log(`Inserting new setting: ${setting.key} = ${setting.value}`);
                  await tx.insert(eventSettings).values({
                    eventId,
                    settingKey: setting.key,
                    settingValue: setting.value,
                    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                  });
                }
              }
            }
          }
          if (!updatedEvent) {
            throw new Error("Event not found");
          }
          await tx.execute(sql19`DELETE FROM event_complexes WHERE event_id = ${eventId}`);
          if (eventData.selectedComplexIds && eventData.selectedComplexIds.length > 0) {
            for (const complexId of eventData.selectedComplexIds) {
              await tx.execute(
                sql19`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                    VALUES (${eventId}, ${complexId}, ${(/* @__PURE__ */ new Date()).toISOString()})`
              );
            }
          }
          await tx.delete(eventFieldSizes).where(eq45(eventFieldSizes.eventId, eventId));
          if (eventData.complexFieldSizes) {
            for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
              await tx.insert(eventFieldSizes).values({
                eventId,
                fieldId: parseInt(fieldId),
                fieldSize,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
          if (!updatedEvent) {
            throw new Error("Event not found");
          }
          console.log("All age group processing completely disabled during event updates to prevent constraint violations");
          if (false) {
            const seasonalScopeId = parseInt(eventData.seasonalScopeId.toString());
            console.log(`Event update is using seasonal scope: ${seasonalScopeId}`);
            const scopeAgeGroups = await tx.select().from(ageGroupSettings).where(eq45(ageGroupSettings.seasonalScopeId, seasonalScopeId));
            console.log(`Found ${scopeAgeGroups.length} age groups in seasonal scope ${seasonalScopeId}`);
            if (scopeAgeGroups.length > 0) {
              const ageGroupsToPreserve = /* @__PURE__ */ new Map();
              for (const group of existingAgeGroups) {
                if (ageGroupsWithTeamsMap.has(group.id)) {
                  ageGroupsToPreserve.set(group.id, group);
                }
              }
              console.log("All age group processing disabled during event updates to prevent foreign key violations");
              console.log("Age group insertion disabled to prevent foreign key constraint violations");
              const existingSetting = await tx.select().from(eventSettings).where(and26(
                eq45(eventSettings.eventId, eventId),
                eq45(eventSettings.settingKey, "seasonalScopeId")
              )).limit(1);
              if (existingSetting.length > 0) {
                await tx.update(eventSettings).set({
                  settingValue: seasonalScopeId.toString(),
                  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                }).where(eq45(eventSettings.id, existingSetting[0].id));
              } else {
                await tx.insert(eventSettings).values({
                  eventId,
                  settingKey: "seasonalScopeId",
                  settingValue: seasonalScopeId.toString(),
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                });
              }
            }
          }
          console.log("Age group management during event update is disabled - eligibility handled separately");
          await tx.execute(sql19`DELETE FROM event_complexes WHERE event_id = ${eventId}`);
          if (Array.isArray(eventData.selectedComplexIds) && eventData.selectedComplexIds.length > 0) {
            for (const complexId of eventData.selectedComplexIds) {
              await tx.execute(
                sql19`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                    VALUES (${eventId}, ${complexId}, ${(/* @__PURE__ */ new Date()).toISOString()})`
              );
            }
          }
          await tx.delete(eventFieldSizes).where(eq45(eventFieldSizes.eventId, eventId));
          if (eventData.complexFieldSizes && typeof eventData.complexFieldSizes === "object") {
            for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
              await tx.insert(eventFieldSizes).values({
                eventId,
                fieldId: parseInt(fieldId),
                fieldSize,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
        });
        if (eventData.branding) {
          console.log(`Checking all branding settings from request:`, eventData.branding);
          const allBrandingSettings = await db.select().from(eventSettings).where(and26(
            eq45(eventSettings.eventId, eventId),
            or8(
              eq45(eventSettings.settingKey, "branding.primaryColor"),
              eq45(eventSettings.settingKey, "branding.secondaryColor"),
              eq45(eventSettings.settingKey, "branding.logoUrl")
            )
          ));
          console.log(
            `Found ${allBrandingSettings.length} branding settings in database:`,
            allBrandingSettings.map((s) => `${s.settingKey}=${s.settingValue}`)
          );
          const brandingProperties = [
            { key: "branding.primaryColor", value: eventData.branding.primaryColor },
            { key: "branding.secondaryColor", value: eventData.branding.secondaryColor },
            { key: "branding.logoUrl", value: eventData.branding.logoUrl }
          ];
          for (const prop of brandingProperties) {
            const settingInDb = allBrandingSettings.find((s) => s.settingKey === prop.key);
            const valueToStore = prop.value !== void 0 ? prop.value : "";
            if (settingInDb) {
              console.log(`VERIFICATION - ${prop.key} current value: ${settingInDb.settingValue}`);
              console.log(`VERIFICATION - ${prop.key} desired value: ${valueToStore}`);
              if (prop.key === "branding.logoUrl" || settingInDb.settingValue !== valueToStore) {
                console.log(`UPDATING ${prop.key} from "${settingInDb.settingValue}" to "${valueToStore}"`);
                await db.execute(
                  sql19`UPDATE event_settings 
                      SET setting_value = ${valueToStore}, 
                          updated_at = ${(/* @__PURE__ */ new Date()).toISOString()} 
                      WHERE id = ${settingInDb.id}`
                );
                const recheck = await db.select().from(eventSettings).where(eq45(eventSettings.id, settingInDb.id));
                console.log(`Update complete - ${prop.key} is now: ${recheck[0].settingValue}`);
              }
            } else {
              console.log(`Setting ${prop.key} doesn't exist, creating it now with value: ${valueToStore}`);
              await db.insert(eventSettings).values({
                eventId,
                settingKey: prop.key,
                settingValue: valueToStore,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString()
              });
              console.log(`Created new setting: ${prop.key} = ${valueToStore}`);
            }
          }
        }
        res.json({ message: "Event updated successfully" });
      } catch (error) {
        console.error("Error updating event:", error);
        console.error("Error details:", error);
        let errorMessage = "Failed to update event";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        res.status(500).send(errorMessage);
      }
    });
    app2.get("/api/admin/events", isAdmin2, async (req, res) => {
      try {
        const userRoles = await db.select({
          roleName: roles.name
        }).from(adminRoles).innerJoin(roles, eq45(adminRoles.roleId, roles.id)).where(eq45(adminRoles.userId, req.user.id));
        const isSuperAdmin = userRoles.some((role) => role.roleName === "super_admin");
        let eventsQuery = db.select({
          event: events,
          applicationCount: sql19`count(distinct ${teams.id})`.mapWith(Number),
          teamCount: sql19`count(${teams.id})`.mapWith(Number)
        }).from(events).leftJoin(teams, eq45(events.id, teams.eventId));
        if (!isSuperAdmin) {
          const userEventIds = await db.select({
            eventId: eventAdministrators.eventId
          }).from(eventAdministrators).where(eq45(eventAdministrators.userId, req.user.id)).then((results) => results.map((r) => r.eventId));
          console.log(`User ${req.user.id} has access to ${userEventIds.length} events:`, userEventIds);
          if (userEventIds.length === 0) {
            return res.json([]);
          }
          eventsQuery = eventsQuery.where(
            sql19`${events.id} IN (${sql19.join(userEventIds.map((id) => sql19`${id}`), sql19`, `)})`
          );
        }
        const eventsList = await eventsQuery.groupBy(events.id).orderBy(events.startDate);
        const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
          ...event,
          applicationCount,
          teamCount
        }));
        res.json(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch events");
      }
    });
    app2.get("/api/admin/events/:id/edit", isAdmin2, hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.id;
        if (eventId === "preview") {
          console.log("Returning mock preview event for editing");
          const previewEvent = {
            id: "preview",
            name: "Preview Event",
            description: "This is a preview event for testing the registration flow",
            startDate: new Date(Date.now() + 864e5 * 7).toISOString().split("T")[0],
            // 7 days from now
            endDate: new Date(Date.now() + 864e5 * 10).toISOString().split("T")[0],
            // 10 days from now
            registrationOpenDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            registrationCloseDate: new Date(Date.now() + 864e5 * 5).toISOString().split("T")[0],
            // 5 days from now
            location: "Preview Location",
            logoUrl: null,
            bannerUrl: null,
            primaryColor: "#3498db",
            secondaryColor: "#2ecc71",
            termsAndConditions: "Preview terms and conditions",
            isPublished: true,
            maxTeamsPerGroup: 10,
            website: "https://example.com",
            requireCoachCertification: false,
            showBrackets: true,
            showTeamList: true,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            status: "active",
            contactEmail: "preview@example.com",
            contactPhone: "123-456-7890",
            hostingOrganization: "Preview Organization",
            registrationType: "open",
            seasonId: null
          };
          const ageGroups2 = [
            {
              ageGroup: {
                id: 1001,
                eventId: "preview",
                ageGroup: "U10 Boys",
                gender: "Boys",
                birthYear: 2014,
                projectedTeams: 8,
                scoringRule: "default",
                fieldSize: "7v7",
                amountDue: 250,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                divisionCode: "U10B"
              },
              teamCount: 0
            },
            {
              ageGroup: {
                id: 1002,
                eventId: "preview",
                ageGroup: "U12 Girls",
                gender: "Girls",
                birthYear: 2012,
                projectedTeams: 8,
                scoringRule: "default",
                fieldSize: "9v9",
                amountDue: 250,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                divisionCode: "U12G"
              },
              teamCount: 0
            },
            {
              ageGroup: {
                id: 1003,
                eventId: "preview",
                ageGroup: "U14 Boys",
                gender: "Boys",
                birthYear: 2010,
                projectedTeams: 8,
                scoringRule: "default",
                fieldSize: "11v11",
                amountDue: 300,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                divisionCode: "U14B"
              },
              teamCount: 0
            },
            {
              ageGroup: {
                id: 1004,
                eventId: "preview",
                ageGroup: "U16 Girls",
                gender: "Girls",
                birthYear: 2008,
                projectedTeams: 8,
                scoringRule: "default",
                fieldSize: "11v11",
                amountDue: 300,
                createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                divisionCode: "U16G"
              },
              teamCount: 0
            }
          ];
          return res.json({
            event: previewEvent,
            ageGroups: ageGroups2,
            complexes: [],
            administrators: []
          });
        }
        const [event] = await db.select().from(events).where(eq45(events.id, eventId));
        if (!event) {
          return res.status(404).send("Event not found");
        }
        const ageGroups = await db.select({
          ageGroup: eventAgeGroups,
          teamCount: sql19`count(distinct ${teams.id})`.mapWith(Number)
        }).from(eventAgeGroups).leftJoin(teams, eq45(teams.ageGroupId, eventAgeGroups.id)).where(eq45(eventAgeGroups.eventId, eventId)).groupBy(eventAgeGroups.id);
        let complexData = [];
        try {
          console.log("Fetching complex data with safe query");
          complexData = await db.select({
            complex: {
              id: complexes.id,
              name: complexes.name,
              address: complexes.address,
              city: complexes.city,
              state: complexes.state,
              country: complexes.country,
              openTime: complexes.openTime,
              closeTime: complexes.closeTime,
              rules: complexes.rules,
              directions: complexes.directions,
              isOpen: complexes.isOpen,
              createdAt: complexes.createdAt,
              updatedAt: complexes.updatedAt,
              // Add default values for potentially missing columns
              latitude: sql19`NULL::text`,
              longitude: sql19`NULL::text`
            },
            fields: sql19`json_agg(
                CASE WHEN ${fields.id} IS NOT NULL THEN
                  json_build_object(
                    'id', ${fields.id},
                    'name', ${fields.name},
                    'hasLights', ${fields.hasLights},
                    'hasParking', ${fields.hasParking},
                    'isOpen', ${fields.isOpen},
                    'specialInstructions', ${fields.specialInstructions}
                  )
                ELSE NULL
                END
              ) FILTER (WHERE ${fields.id} IS NOT NULL)`.mapWith((f) => f || []),
            openFields: sql19`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
            closedFields: sql19`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number)
          }).from(complexes).leftJoin(fields, eq45(complexes.id, fields.complexId)).groupBy(complexes.id).orderBy(complexes.name);
        } catch (error) {
          console.error("Error fetching complexes with safe query:", error);
          try {
            console.log("Trying alternative approach with explicit SQL query");
            const basicComplexes = await db.execute(`
              SELECT 
                id, name, address, city, state, country, 
                open_time, close_time, rules, directions, is_open, 
                created_at, updated_at
              FROM complexes
            `);
            complexData = await Promise.all(basicComplexes.map(async (complex) => {
              const fieldsList = await db.select().from(fields).where(eq45(fields.complexId, complex.id));
              return {
                complex: {
                  ...complex,
                  // Add default values for latitude/longitude
                  latitude: null,
                  longitude: null,
                  // Fix property names to match camelCase used elsewhere
                  openTime: complex.open_time,
                  closeTime: complex.close_time,
                  isOpen: complex.is_open,
                  createdAt: complex.created_at,
                  updatedAt: complex.updated_at
                },
                fields: fieldsList.map((field) => ({
                  id: field.id,
                  name: field.name,
                  hasLights: field.hasLights,
                  hasParking: field.hasParking,
                  isOpen: field.isOpen,
                  specialInstructions: field.specialInstructions
                })),
                openFields: fieldsList.filter((f) => f.isOpen).length,
                closedFields: fieldsList.filter((f) => !f.isOpen).length
              };
            }));
          } catch (secondError) {
            console.error("Still failed with alternative approach:", secondError);
            console.log("Using empty complexData as fallback");
            complexData = [];
          }
        }
        const scoringRules = await db.select().from(eventScoringRules).where(eq45(eventScoringRules.eventId, eventId));
        const complexAssignments = await db.select().from(eventComplexes2).where(eq45(eventComplexes2.eventId, eventId));
        const fieldSizes = await db.select().from(eventFieldSizes).where(eq45(eventFieldSizes.eventId, eventId));
        const administrators = await db.select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }).from(users).where(eq45(users.isAdmin, true));
        console.log("Fetching complex data with safe query");
        let seasonalScope = null;
        try {
          seasonalScope = await db.select({
            id: seasonalScopes.id,
            name: seasonalScopes.name,
            startYear: seasonalScopes.startYear,
            endYear: seasonalScopes.endYear,
            isActive: seasonalScopes.isActive
            // Don't try to select potentially missing columns
            // createCoedGroups and coedOnly columns might not exist in older database schemas
          }).from(seasonalScopes).where(eq45(seasonalScopes.id, eventAgeGroups[0]?.seasonalScopeId ?? 0)).limit(1).then((rows) => rows[0]);
        } catch (error) {
          console.error("Error fetching seasonal scope:", error);
        }
        const settingsData = await db.select().from(eventSettings).where(eq45(eventSettings.eventId, eventId));
        const settings = settingsData.map((setting) => ({
          id: setting.id,
          key: setting.settingKey,
          value: setting.settingValue
        }));
        console.log("Found event settings for event:", eventId, settings);
        const brandingSettings = settingsData.filter((setting) => setting.settingKey.startsWith("branding."));
        let brandingData = {
          logoUrl: "",
          primaryColor: "#007AFF",
          // Default blue
          secondaryColor: "#34C759"
          // Default green
        };
        if (brandingSettings.length > 0) {
          brandingSettings.forEach((setting) => {
            const key = setting.settingKey.replace("branding.", "");
            if (setting.settingValue) {
              brandingData[key] = setting.settingValue;
            }
          });
        }
        console.log("Processed branding data:", brandingData);
        const secondaryColorSetting = brandingSettings.find((s) => s.settingKey === "branding.secondaryColor");
        console.log("Direct check of secondaryColor setting:", secondaryColorSetting);
        const response = {
          ...event,
          ageGroups: ageGroups.map(({ ageGroup, teamCount }) => ({
            ...ageGroup,
            teamCount,
            assignedFields: [],
            // Will be populated by frontend
            assignedTeams: []
            // Will be populated by frontend
          })),
          complexes: complexData.map(({ complex, fields: fields2, openFields, closedFields }) => ({
            ...complex,
            fields: fields2 || [],
            openFields: openFields || 0,
            closedFields: closedFields || 0
          })),
          selectedComplexIds: complexAssignments.map((a) => a.complexId),
          complexFieldSizes: Object.fromEntries(
            fieldSizes.map((f) => [f.fieldId, f.fieldSize])
          ),
          scoringRules,
          administrators,
          // Add selected scope and age group IDs
          selectedScopeId: seasonalScope?.id || null,
          selectedAgeGroupIds: ageGroups.map(({ ageGroup }) => ageGroup.id),
          // Include event settings
          settings: settings || [],
          // Include branding data with better default handling
          branding: Object.keys(brandingData).length > 0 ? {
            logoUrl: brandingData.logoUrl || null,
            primaryColor: brandingData.primaryColor || "#007AFF",
            secondaryColor: brandingData.secondaryColor || "#34C759"
          } : { logoUrl: null, primaryColor: "#007AFF", secondaryColor: "#34C759" },
          // Additional metadata needed by create view
          availableAgeGroups: ageGroups.map(({ ageGroup }) => ageGroup.ageGroup),
          availableFieldSizes: [...new Set(fieldSizes.map((f) => f.fieldSize))].filter(Boolean),
          timeZones: event.timezone ? [event.timezone] : [],
          // Include current timezone
          validationErrors: {}
          // Empty object for frontend validation
        };
        res.json(response);
      } catch (error) {
        console.error("Error fetching event details:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch event details");
      }
    });
    app2.get("/api/admin/events/:id", hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.id;
        const [event] = await db.select().from(events).where(eq45(events.id, eventId));
        if (!event) {
          return res.status(404).send("Event not found");
        }
        const ageGroups = await db.select().from(eventAgeGroups).where(eq45(eventAgeGroups.eventId, eventId));
        const scoringRules = await db.select().from(eventScoringRules).where(eq45(eventScoringRules.eventId, eventId));
        const complexAssignments = await db.select().from(eventComplexes2).where(eq45(eventComplexes2.eventId, eventId));
        const fieldSizes = await db.select().from(eventFieldSizes).where(eq45(eventFieldSizes.eventId, eventId));
        const response = {
          ...event,
          ageGroups,
          scoringRules,
          selectedComplexIds: complexAssignments.map((a) => a.complexId),
          complexFieldSizes: Object.fromEntries(
            fieldSizes.map((f) => [f.fieldId, f.fieldSize])
          )
        };
        res.json(response);
      } catch (error) {
        console.error("Error fetching event details:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch event details");
      }
    });
    app2.get("/api/admin/events/:id/schedule", hasEventAccess, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const schedule = await db.select({
          game: games,
          homeTeam: teams,
          awayTeam: sql19`json_build_object('id', ${sql19.raw("away_teams")}.id, 'name', ${sql19.raw("away_teams")}.name)`,
          field: fields,
          timeSlot: gameTimeSlots,
          ageGroup: eventAgeGroups
        }).from(games).leftJoin(teams, eq45(games.homeTeamId, teams.id)).leftJoin(sql19.raw("teams as away_teams"), eq45(games.awayTeamId, sql19.raw("away_teams.id"))).leftJoin(fields, eq45(games.fieldId, fields.id)).leftJoin(gameTimeSlots, eq45(games.timeSlotId, gameTimeSlots.id)).leftJoin(eventAgeGroups, eq45(games.ageGroupId, eventAgeGroups.id)).where(eq45(games.eventId, eventId)).orderBy(gameTimeSlots.startTime);
        const formattedSchedule = schedule.map((item) => ({
          id: item.game.id,
          startTime: item.timeSlot?.startTime || item.game.createdAt,
          // Fallback to game creation time
          endTime: item.timeSlot?.endTime || "",
          // Empty string fallback
          fieldName: item.field?.name || "Unassigned",
          fieldId: item.field?.id || 0,
          complexId: item.field?.complexId || 0,
          complexName: item.field?.complexName || "Unassigned",
          ageGroup: item.ageGroup?.ageGroup || "Unassigned",
          ageGroupId: item.ageGroup?.id || 0,
          bracket: item.game.bracketId ? {
            id: item.game.bracketId,
            name: item.game.bracketName || "Default Bracket"
          } : null,
          round: item.game.round || "Group Stage",
          homeTeam: item.homeTeam ? {
            id: item.homeTeam.id,
            name: item.homeTeam.name || "TBD",
            clubName: item.homeTeam.clubName || "",
            coach: item.homeTeam.coachName || "",
            status: item.homeTeam.status || "approved"
          } : {
            id: 0,
            name: "TBD",
            clubName: "",
            coach: "",
            status: "approved"
          },
          awayTeam: {
            id: item.awayTeam?.id || 0,
            name: item.awayTeam?.name || "TBD",
            clubName: item.awayTeam?.clubName || "",
            coach: item.awayTeam?.coachName || "",
            status: item.awayTeam?.status || "approved"
          },
          status: item.game.status || "scheduled"
        }));
        res.json({ games: formattedSchedule });
      } catch (error) {
        console.error("Error fetching schedule:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch schedule");
      }
    });
    app2.post("/api/admin/events/:id/preview-schedule", hasEventAccess, async (req, res) => {
      try {
        console.log(`Schedule preview endpoint called for event ID: ${req.params.id}`);
        console.log("Preview request body:", JSON.stringify(req.body));
        const eventId = req.params.id;
        const {
          gamesPerDay,
          minutesPerGame,
          breakBetweenGames,
          minRestPeriod,
          resolveCoachConflicts,
          optimizeFieldUsage,
          tournamentFormat,
          selectedAgeGroups,
          selectedBrackets
        } = req.body;
        const { SoccerSchedulerAI: SoccerSchedulerAI2 } = await Promise.resolve().then(() => (init_openai_service(), openai_service_exports));
        const previewResult = await SoccerSchedulerAI2.generateSchedulePreview(eventId, {
          maxGamesPerDay: gamesPerDay || 3,
          minutesPerGame: minutesPerGame || 60,
          breakBetweenGames: breakBetweenGames || 15,
          minRestPeriod: minRestPeriod || 120,
          // In minutes for more precision
          resolveCoachConflicts: resolveCoachConflicts || true,
          optimizeFieldUsage: optimizeFieldUsage || true,
          tournamentFormat: tournamentFormat || "round_robin_knockout",
          selectedAgeGroups: selectedAgeGroups || [],
          selectedBrackets: selectedBrackets || []
        });
        return res.json({
          previewGames: previewResult.previewGames,
          qualityScore: previewResult.qualityScore,
          conflicts: previewResult.conflicts
        });
      } catch (error) {
        console.error("Error generating schedule preview:", error);
        console.error("Error details:", error);
        res.status(500).json({
          error: "Schedule Preview Failed",
          message: error.message || "An unknown error occurred",
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
    app2.post("/api/admin/events/:id/generate-schedule", hasEventAccess, async (req, res) => {
      try {
        console.log(`Schedule generation endpoint called for event ID: ${req.params.id}`);
        console.log("Request body:", JSON.stringify(req.body));
        console.log("Request query:", JSON.stringify(req.query));
        const eventId = req.params.id;
        const {
          gamesPerDay,
          minutesPerGame,
          breakBetweenGames,
          minRestPeriod,
          resolveCoachConflicts,
          optimizeFieldUsage,
          tournamentFormat,
          useAI: useAIFromBody,
          selectedAgeGroups,
          selectedBrackets,
          previewMode
        } = req.body;
        const useAI = req.query.useAI === "true" || useAIFromBody === true;
        console.log(`Using AI for schedule generation: ${useAI}`);
        console.log(`Request parameters: gamesPerDay=${gamesPerDay}, minutesPerGame=${minutesPerGame}, breakBetweenGames=${breakBetweenGames}, minRestPeriod=${minRestPeriod}`);
        console.log(`Request parameters: resolveCoachConflicts=${resolveCoachConflicts}, optimizeFieldUsage=${optimizeFieldUsage}, tournamentFormat=${tournamentFormat}`);
        console.log(`Filtering by age groups: ${JSON.stringify(selectedAgeGroups)}`);
        console.log(`Filtering by brackets: ${JSON.stringify(selectedBrackets)}`);
        console.log(`Preview mode: ${previewMode ? "ON" : "OFF"}`);
        if (useAI) {
          const { SoccerSchedulerAI: SoccerSchedulerAI2 } = await Promise.resolve().then(() => (init_openai_service(), openai_service_exports));
          const aiScheduleResult = await SoccerSchedulerAI2.generateSchedule(eventId, {
            maxGamesPerDay: gamesPerDay || 3,
            minutesPerGame: minutesPerGame || 60,
            breakBetweenGames: breakBetweenGames || 15,
            minRestPeriod: minRestPeriod || 120,
            // In minutes for more precision
            resolveCoachConflicts: resolveCoachConflicts || true,
            optimizeFieldUsage: optimizeFieldUsage || true,
            tournamentFormat: tournamentFormat || "round_robin_knockout",
            selectedAgeGroups: selectedAgeGroups || [],
            selectedBrackets: selectedBrackets || [],
            previewMode: previewMode || false
          });
          if (previewMode) {
            console.log(`Preview mode enabled, returning 5 sample games without saving to database`);
            return res.json({
              message: "Preview schedule generated successfully",
              scheduleData: aiScheduleResult.schedule,
              previewGames: aiScheduleResult.schedule,
              qualityScore: aiScheduleResult.qualityScore,
              conflicts: aiScheduleResult.conflicts || [],
              bracketSchedules: aiScheduleResult.bracketSchedules || [],
              previewMode: true
            });
          }
          await db.transaction(async (tx) => {
            console.log(`Saving ${aiScheduleResult.schedule.length} AI-generated games to database for event ${eventId}`);
            await tx.delete(games).where(eq45(games.eventId, eventId));
            console.log(`Cleared existing games for event ${eventId}`);
            for (const game of aiScheduleResult.schedule) {
              try {
                const matchNumber = parseInt(game.id.replace(/\D/g, "")) || Math.floor(Math.random() * 1e4);
                const homeTeamId = game.homeTeam?.id || null;
                const awayTeamId = game.awayTeam?.id || null;
                let startTime, endTime;
                try {
                  startTime = game.startTime || (/* @__PURE__ */ new Date()).toISOString();
                  endTime = game.endTime || (/* @__PURE__ */ new Date()).toISOString();
                } catch (e) {
                  console.error("Error parsing game times:", e);
                  startTime = (/* @__PURE__ */ new Date()).toISOString();
                  endTime = (/* @__PURE__ */ new Date()).toISOString();
                }
                const bracketName = game.bracket || "Default";
                let ageGroupId = 0;
                const bracketWithAgeGroup = await tx.select({
                  id: eventBrackets.id,
                  ageGroupId: eventBrackets.ageGroupId
                }).from(eventBrackets).where(and26(
                  eq45(eventBrackets.eventId, eventId),
                  eq45(eventBrackets.name, bracketName)
                ));
                if (bracketWithAgeGroup.length > 0) {
                  ageGroupId = bracketWithAgeGroup[0].ageGroupId;
                } else {
                  const firstAgeGroup = await tx.select({ id: eventAgeGroups.id }).from(eventAgeGroups).where(eq45(eventAgeGroups.eventId, eventId)).limit(1);
                  if (firstAgeGroup.length > 0) {
                    ageGroupId = firstAgeGroup[0].id;
                  }
                }
                const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
                const durationMinutes = Math.max(30, Math.round(durationMs / (1e3 * 60))) || 60;
                await tx.insert(games).values({
                  eventId,
                  ageGroupId,
                  homeTeamId,
                  awayTeamId,
                  status: "scheduled",
                  round: parseInt(game.round.toString().replace(/\D/g, "")) || 1,
                  matchNumber,
                  duration: durationMinutes,
                  breakTime: breakBetweenGames || 15,
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                });
                console.log(`Inserted game ${matchNumber}: ${game.homeTeam?.name || "Team A"} vs ${game.awayTeam?.name || "Team B"}`);
              } catch (err) {
                console.error("Error inserting game:", err);
                console.error("Game data:", JSON.stringify(game));
              }
            }
            console.log(`Successfully saved all AI-generated games for event ${eventId}`);
          });
          return res.json({
            message: "AI schedule generated and saved successfully",
            scheduleData: aiScheduleResult.schedule,
            qualityScore: aiScheduleResult.qualityScore,
            conflicts: aiScheduleResult.conflicts,
            bracketSchedules: aiScheduleResult.bracketSchedules,
            savedToDB: true
          });
        }
        await db.transaction(async (tx) => {
          const [event] = await tx.select().from(events).where(eq45(events.id, eventId));
          if (!event) {
            throw new Error("Event not found");
          }
          const ageGroups = await tx.select().from(eventAgeGroups).where(eq45(eventAgeGroups.eventId, eventId));
          const eventFields = await tx.select({
            field: fields
          }).from(fields).where(eq45(fields.eventId, eventId.toString()));
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
          for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayIndex);
            const defaultOpenTime = "09:00:00";
            const defaultCloseTime = "18:00:00";
            for (const { field } of eventFields) {
              const complexOpenTime = /* @__PURE__ */ new Date(`${currentDate.toISOString().split("T")[0]}T${defaultOpenTime}`);
              const complexCloseTime = /* @__PURE__ */ new Date(`${currentDate.toISOString().split("T")[0]}T${defaultCloseTime}`);
              let currentTime = complexOpenTime;
              while (currentTime.getTime() + minutesPerGame * 60 * 1e3 <= complexCloseTime.getTime()) {
                const endTime = new Date(currentTime.getTime() + minutesPerGame * 60 * 1e3);
                await tx.insert(gameTimeSlots).values({
                  eventId,
                  fieldId: field.id,
                  startTime: currentTime.toISOString(),
                  endTime: endTime.toISOString(),
                  dayIndex,
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                });
                currentTime = new Date(endTime.getTime() + breakBetweenGames * 60 * 1e3);
              }
            }
          }
          for (const ageGroup of ageGroups) {
            await tx.insert(tournamentGroups).values({
              eventId,
              ageGroupId: ageGroup.id,
              name: `Group A - ${ageGroup.ageGroup}`,
              type: "round_robin",
              stage: "group",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        });
        res.json({ message: "Schedule framework generated successfully" });
      } catch (error) {
        console.error("Error generating schedule:", error);
        console.error("Error details:", error);
        if (error.message && error.message.includes("OpenAI API")) {
          console.error("OpenAI API Error:", error.message);
          return res.status(500).json({
            error: "OpenAI API Error",
            message: error.message,
            detail: "There was an issue with the AI service. Check API key and quotas."
          });
        }
        if (error.message && (error.message.includes("database") || error.message.includes("SQL") || error.message.includes("relation") || error.message.includes("column") || error.message.includes("type"))) {
          console.error("Database Error:", error.message);
          return res.status(500).json({
            error: "Database Error",
            message: error.message,
            detail: "There was an issue with the database. Check schema compatibility."
          });
        }
        res.status(500).json({
          error: "Schedule Generation Failed",
          message: error.message || "An unknown error occurred",
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
    app2.post("/api/admin/events/:id/optimize-schedule", hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.id;
        const {
          resolveCoachConflicts,
          optimizeFieldUsage,
          minimizeTravel,
          selectedAgeGroups,
          selectedBrackets
        } = req.body;
        const { SoccerSchedulerAI: SoccerSchedulerAI2 } = await Promise.resolve().then(() => (init_openai_service(), openai_service_exports));
        const optimizationResult = await SoccerSchedulerAI2.optimizeSchedule(eventId, {
          resolveCoachConflicts: resolveCoachConflicts || true,
          optimizeFieldUsage: optimizeFieldUsage || true,
          minimizeTravel: minimizeTravel || false,
          selectedAgeGroups: selectedAgeGroups || [],
          selectedBrackets: selectedBrackets || []
        });
        res.json({
          message: "Schedule optimized successfully",
          scheduleData: optimizationResult.schedule,
          qualityScore: optimizationResult.qualityScore,
          conflicts: optimizationResult.conflicts,
          changesApplied: optimizationResult.changesApplied
        });
      } catch (error) {
        console.error("Error optimizing schedule:", error);
        console.error("Error details:", error);
        if (error.message && error.message.includes("OpenAI API")) {
          console.error("OpenAI API Error:", error.message);
          return res.status(500).json({
            error: "OpenAI API Error",
            message: error.message,
            detail: "There was an issue with the AI service. Check API key and quotas."
          });
        }
        if (error.message && (error.message.includes("database") || error.message.includes("SQL") || error.message.includes("relation") || error.message.includes("column") || error.message.includes("type"))) {
          console.error("Database Error:", error.message);
          return res.status(500).json({
            error: "Database Error",
            message: error.message,
            detail: "There was an issue with the database. Check schema compatibility."
          });
        }
        res.status(500).json({
          error: "Schedule Optimization Failed",
          message: error.message || "An unknown error occurred",
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
    app2.post("/api/admin/events/:id/suggest-bracket-assignments", hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.id;
        const { SoccerSchedulerAI: SoccerSchedulerAI2 } = await Promise.resolve().then(() => (init_openai_service(), openai_service_exports));
        const suggestions = await SoccerSchedulerAI2.suggestBracketAssignments(eventId);
        res.json({
          message: "Bracket assignments suggested successfully",
          suggestions: suggestions.suggestions,
          source: suggestions.source
          // Pass through the source (ai or fallback)
        });
      } catch (error) {
        console.error("Error suggesting bracket assignments:", error);
        console.error("Error details:", error);
        if (error.message && error.message.includes("OpenAI API")) {
          console.error("OpenAI API Error:", error.message);
          return res.status(500).json({
            error: "OpenAI API Error",
            message: error.message,
            detail: "There was an issue with the AI service. Check API key and quotas."
          });
        }
        if (error.message && (error.message.includes("database") || error.message.includes("SQL") || error.message.includes("relation") || error.message.includes("column") || error.message.includes("type"))) {
          console.error("Database Error:", error.message);
          return res.status(500).json({
            error: "Database Error",
            message: error.message,
            detail: "There was an issue with the database. Check schema compatibility."
          });
        }
        res.status(500).json({
          error: "Bracket Assignment Failed",
          message: error.message || "An unknown error occurred",
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        });
      }
    });
    app2.post("/api/admin/events/:id/update-team-brackets", hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.id;
        const { assignments } = req.body;
        if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
          return res.status(400).json({
            error: "Invalid request",
            message: "Assignments array is required and must not be empty"
          });
        }
        for (const assignment of assignments) {
          if (!assignment.teamId || !assignment.bracketId) {
            return res.status(400).json({
              error: "Invalid assignment",
              message: "Each assignment must include teamId and bracketId"
            });
          }
        }
        await db.transaction(async (tx) => {
          for (const assignment of assignments) {
            await tx.update(teams).set({ bracketId: assignment.bracketId }).where(and26(
              eq45(teams.id, assignment.teamId),
              eq45(teams.eventId, eventId)
            ));
          }
        });
        return res.json({
          message: `Updated brackets for ${assignments.length} teams successfully`
        });
      } catch (error) {
        console.error("Error updating team brackets:", error);
        return res.status(500).json({
          error: "Failed to update team brackets",
          message: error.message
        });
      }
    });
    app2.get("/api/admin/events/:eventId/age-groups", hasEventAccess, async (req, res) => {
      try {
        const eventId = req.params.eventId;
        if (eventId === "preview") {
          const previewAgeGroups = [
            {
              id: 1001,
              eventId: "preview",
              ageGroup: "U10",
              gender: "Boys",
              divisionCode: "B10",
              birthYear: 2015,
              fieldSize: "9v9",
              projectedTeams: 12,
              scoringRule: "Standard",
              amountDue: 15e3,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            {
              id: 1002,
              eventId: "preview",
              ageGroup: "U12",
              gender: "Boys",
              divisionCode: "B12",
              birthYear: 2013,
              fieldSize: "11v11",
              projectedTeams: 10,
              scoringRule: "Standard",
              amountDue: 15e3,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            {
              id: 1003,
              eventId: "preview",
              ageGroup: "U14",
              gender: "Boys",
              divisionCode: "B14",
              birthYear: 2011,
              fieldSize: "11v11",
              projectedTeams: 8,
              scoringRule: "Standard",
              amountDue: 17500,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            {
              id: 1004,
              eventId: "preview",
              ageGroup: "U10",
              gender: "Girls",
              divisionCode: "G10",
              birthYear: 2015,
              fieldSize: "9v9",
              projectedTeams: 8,
              scoringRule: "Standard",
              amountDue: 15e3,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            },
            {
              id: 1005,
              eventId: "preview",
              ageGroup: "U12",
              gender: "Girls",
              divisionCode: "G12",
              birthYear: 2013,
              fieldSize: "11v11",
              projectedTeams: 6,
              scoringRule: "Standard",
              amountDue: 15e3,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          ];
          console.log("Returning preview age groups");
          return res.json(previewAgeGroups);
        }
        const eligibilityMap = /* @__PURE__ */ new Map();
        try {
          const eligibilitySettings = await db.execute(sql19`
            SELECT age_group_id, is_eligible 
            FROM event_age_group_eligibility 
            WHERE event_id = ${eventId}
          `);
          console.log(`Found ${eligibilitySettings.rows?.length || 0} eligibility settings for event ${eventId}`);
          if (eligibilitySettings.rows) {
            for (const setting of eligibilitySettings.rows) {
              eligibilityMap.set(setting.age_group_id, setting.is_eligible);
            }
          }
        } catch (error) {
          console.error("Error loading eligibility settings:", error);
        }
        let ageGroups = await db.query.eventAgeGroups.findMany({
          where: eq45(eventAgeGroups.eventId, eventId)
        });
        console.log(`Fetched ${ageGroups.length} age groups for event ${eventId}`);
        if (ageGroups.length < 30) {
          const eventSettingsRecords = await db.query.eventSettings.findMany({
            where: and26(
              eq45(eventSettings.eventId, eventId),
              eq45(eventSettings.settingKey, "seasonalScopeId")
            )
          });
          if (eventSettingsRecords.length > 0) {
            const seasonalScopeId = parseInt(eventSettingsRecords[0].settingValue);
            console.log(`Found seasonal scope ID ${seasonalScopeId} for event ${eventId}, fetching all age groups`);
            const seasonalAgeGroups = await db.query.ageGroupSettings.findMany({
              where: eq45(ageGroupSettings.seasonalScopeId, seasonalScopeId)
            });
            console.log(`Found ${seasonalAgeGroups.length} age groups in seasonal scope ${seasonalScopeId}`);
            const existingIds = new Set(ageGroups.map((ag) => `${ag.ageGroup}-${ag.gender}`));
            for (const scopeAgeGroup of seasonalAgeGroups) {
              const ageGroupKey = `${scopeAgeGroup.ageGroup}-${scopeAgeGroup.gender}`;
              if (!existingIds.has(ageGroupKey)) {
                const [newAgeGroup] = await db.insert(eventAgeGroups).values({
                  eventId,
                  ageGroup: scopeAgeGroup.ageGroup,
                  gender: scopeAgeGroup.gender,
                  birthYear: scopeAgeGroup.birthYear,
                  divisionCode: scopeAgeGroup.divisionCode || `${scopeAgeGroup.gender[0]}${scopeAgeGroup.ageGroup.substring(1)}`,
                  fieldSize: "11v11",
                  // Default
                  projectedTeams: 8,
                  // Default
                  scoringRule: "Standard",
                  // Default
                  seasonalScopeId,
                  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                  isEligible: true
                  // Default to eligible
                }).returning();
                const isEligible = eligibilityMap.has(newAgeGroup.id) ? eligibilityMap.get(newAgeGroup.id) : true;
                if (isEligible !== false) {
                  ageGroups.push(newAgeGroup);
                  console.log(`\u2713 Added missing eligible age group: ${scopeAgeGroup.ageGroup} ${scopeAgeGroup.gender}`);
                } else {
                  console.log(`\u2717 Skipped missing ineligible age group: ${scopeAgeGroup.ageGroup} ${scopeAgeGroup.gender}`);
                }
              }
            }
            console.log(`Added missing age groups, now have ${ageGroups.length} total age groups`);
          }
        }
        const uniqueGroups = [];
        const seenIds = /* @__PURE__ */ new Set();
        for (const group of ageGroups) {
          if (!seenIds.has(group.id)) {
            seenIds.add(group.id);
            const isEligible = eligibilityMap.has(group.id) ? eligibilityMap.get(group.id) : group.isEligible !== void 0 ? group.isEligible : true;
            uniqueGroups.push({
              ...group,
              isEligible
            });
          }
        }
        const sortedGroups = uniqueGroups.sort((a, b) => {
          const getAgeNumber = (ageGroup) => {
            if (ageGroup && ageGroup.startsWith("U")) {
              return parseInt(ageGroup.substring(1));
            }
            return 999;
          };
          const ageA = getAgeNumber(a.ageGroup);
          const ageB = getAgeNumber(b.ageGroup);
          if (ageA !== ageB) {
            return ageA - ageB;
          }
          const genderOrder = { "Boys": 0, "Girls": 1, "Coed": 2 };
          return (genderOrder[a.gender] || 3) - (genderOrder[b.gender] || 3);
        });
        console.log(`Returning ${sortedGroups.length} unique age groups after deduplication and sorting`);
        console.log(`Applied eligibility settings: ${eligibilityMap.size} custom settings found`);
        console.log(`Age groups order: ${sortedGroups.slice(0, 6).map((g) => `${g.ageGroup}-${g.gender}`).join(", ")}...`);
        res.json(sortedGroups);
      } catch (error) {
        console.error("Error fetching age groups:", error);
        res.status(500).json({ error: "Failed to fetch age groups" });
      }
    });
    app2.get("/api/admin/teams", isAdmin2, async (req, res) => {
      try {
        const eventId = parseInt(req.query.eventId);
        const ageGroupId = req.query.ageGroupId ? parseInt(req.query.ageGroupId) : null;
        const status = req.query.status;
        let query = db.select({
          team: teams,
          ageGroup: eventAgeGroups,
          club: {
            name: clubs.name,
            logoUrl: clubs.logoUrl
          }
        }).from(teams).leftJoin(eventAgeGroups, eq45(teams.ageGroupId, eventAgeGroups.id)).leftJoin(clubs, eq45(teams.clubId, clubs.id)).where(eq45(teams.eventId, eventId));
        if (ageGroupId) {
          query = query.where(eq45(teams.ageGroupId, ageGroupId));
        }
        if (status && status !== "all") {
          query = query.where(eq45(teams.status, status));
        }
        const results = await query.orderBy(teams.name);
        const teamsWithPlayerCounts = await Promise.all(
          results.map(async ({ team, ageGroup, club }) => {
            const playerCountResult = await db.select({ count: sql19`count(*)`.mapWith(Number) }).from(players).where(eq45(players.teamId, team.id));
            const playerCount = playerCountResult[0]?.count || 0;
            return {
              ...team,
              ageGroup: ageGroup?.ageGroup || "Unknown",
              clubLogoUrl: club?.logoUrl || null,
              clubName: club?.name || null,
              playerCount
            };
          })
        );
        res.json(teamsWithPlayerCounts);
      } catch (error) {
        console.error("Error fetching teams:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch teams");
      }
    });
    app2.post("/api/admin/teams", isAdmin2, async (req, res) => {
      try {
        const { name, eventId, ageGroup } = req.body;
        if (!name || !eventId || !ageGroup) {
          return res.status(400).send("Name, event ID, and age group are required");
        }
        const [ageGroupRecord] = await db.select().from(eventAgeGroups).where(and26(
          eq45(eventAgeGroups.eventId, eventId),
          eq45(eventAgeGroups.ageGroup, ageGroup)
        ));
        if (!ageGroupRecord) {
          return res.status(404).send("Age group not found");
        }
        const [newTeam] = await db.insert(teams).values({
          name,
          eventId,
          ageGroupId: ageGroupRecord.id,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }).returning();
        res.json(newTeam);
      } catch (error) {
        console.error("Error creating team:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to create team");
      }
    });
    app2.post("/api/admin/administrators", isAdmin2, async (req, res) => {
      try {
        const { firstName, lastName, email, password, roles: roles2 } = req.body;
        if (!firstName || !lastName || !email || !password || !roles2 || !Array.isArray(roles2)) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        const [existingUser] = await db.select().from(users).where(eq45(users.email, email)).limit(1);
        if (existingUser) {
          return res.status(400).json({
            error: "Email already registered",
            code: "EMAIL_EXISTS"
          });
        }
        const hashedPassword = await crypto.hash(password);
        await db.transaction(async (tx) => {
          const [newAdmin] = await tx.insert(users).values({
            email,
            username: email,
            password: hashedPassword,
            firstName,
            lastName,
            isAdmin: true,
            isParent: false,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).returning();
          for (const roleName of roles2) {
            const existingRole = await tx.select().from(roles2).where(eq45(roles2.name, roleName)).limit(1);
            let roleId;
            if (existingRole.length === 0) {
              const [newRole] = await tx.insert(roles2).values({
                name: roleName,
                description: `${roleName.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")} role`
              }).returning();
              roleId = newRole.id;
            } else {
              roleId = existingRole[0].id;
            }
            await tx.insert(adminRoles).values({
              userId: newAdmin.id,
              roleId,
              createdAt: /* @__PURE__ */ new Date()
            });
          }
          res.status(201).json({
            id: newAdmin.id,
            email: newAdmin.email,
            firstName: newAdmin.firstName,
            lastName: newAdmin.lastName,
            roles: roles2
          });
          try {
            console.log("Sending admin welcome email to:", email);
            const appUrl = process.env.APP_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://matchpro.ai");
            await sendTemplatedEmail(email, "admin_welcome", {
              firstName,
              lastName,
              email,
              loginUrl: `${appUrl}/login`,
              appUrl,
              role: "Administrator",
              isAdmin: true
            });
            console.log("Admin welcome email sent successfully");
          } catch (emailError) {
            console.error("Error sending admin welcome email:", emailError);
          }
        });
      } catch (error) {
        console.error("Error creating administrator:", error);
        res.status(500).json({
          error: "Failed to create administrator",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    app2.get("/api/admin/administrators", isAdmin2, async (req, res) => {
      try {
        const administrators = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
          isAdmin: users.isAdmin
        }).from(users).where(eq45(users.isAdmin, true)).orderBy(users.createdAt);
        const userRoles = await db.select({
          userId: adminRoles.userId,
          roleId: adminRoles.roleId,
          roleName: roles.name
        }).from(adminRoles).innerJoin(roles, eq45(adminRoles.roleId, roles.id)).where(inArray13(adminRoles.userId, administrators.map((admin) => admin.id)));
        const adminsWithRoles = administrators.map((admin) => {
          const adminRoles2 = userRoles.filter((role) => role.userId === admin.id).map((role) => role.roleName);
          return {
            ...admin,
            roles: adminRoles2.length > 0 ? adminRoles2 : []
          };
        });
        res.json(adminsWithRoles);
      } catch (error) {
        console.error("Error fetching administrators:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch administrators");
      }
    });
    app2.get("/api/admin/teams/:id", async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        const [teamData] = await db.select().from(teams).where(eq45(teams.id, teamId));
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        req.params.eventId = teamData.eventId;
        await hasEventAccess(req, res, async () => {
          const [team] = await db.select({
            team: teams,
            ageGroup: eventAgeGroups,
            event: events
          }).from(teams).leftJoin(eventAgeGroups, eq45(teams.ageGroupId, eventAgeGroups.id)).leftJoin(events, eq45(teams.eventId, events.id)).where(eq45(teams.id, teamId));
          if (!team) {
            return res.status(404).json({ error: "Team not found" });
          }
          const playersList = await db.select().from(players).where(eq45(players.teamId, teamId));
          let coachData = {};
          if (team.team.coach) {
            try {
              coachData = JSON.parse(team.team.coach);
            } catch (error) {
              console.error("Error parsing coach JSON:", error);
            }
          }
          const response = {
            ...team.team,
            ageGroup: team.ageGroup?.ageGroup || "Unknown",
            eventName: team.event?.name || "Unknown Event",
            players: playersList,
            coachData
          };
          res.json(response);
        });
      } catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ error: "Failed to fetch team details" });
      }
    });
    app2.post("/api/admin/teams/:id/players", async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        const [teamData] = await db.select().from(teams).where(eq45(teams.id, teamId));
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        req.params.eventId = teamData.eventId;
        await hasEventAccess(req, res, async () => {
          try {
            const requiredFields = [
              "firstName",
              "lastName",
              "dateOfBirth",
              "emergencyContactName",
              "emergencyContactPhone"
            ];
            const missingFields = requiredFields.filter((field) => !req.body[field]);
            if (missingFields.length > 0) {
              return res.status(400).json({
                error: "Invalid player data",
                details: `Missing required fields: ${missingFields.join(", ")}`
              });
            }
            const playerSchema3 = insertPlayerSchema;
            const result = playerSchema3.safeParse(req.body);
            if (!result.success) {
              return res.status(400).json({ error: result.error.errors });
            }
          } catch (validationError) {
            console.error("Player validation error:", validationError);
            return res.status(400).json({
              error: "Player validation error",
              details: validationError.message || "Failed to validate player data"
            });
          }
          const playerData = {
            teamId,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dateOfBirth: req.body.dateOfBirth,
            // Convert jerseyNumber to integer if not empty, otherwise set to null
            jerseyNumber: req.body.jerseyNumber && req.body.jerseyNumber !== "" ? parseInt(req.body.jerseyNumber) : null,
            position: req.body.position || null,
            medicalNotes: req.body.medicalNotes || null,
            parentGuardianName: req.body.parentGuardianName || null,
            parentGuardianEmail: req.body.parentGuardianEmail || null,
            parentGuardianPhone: req.body.parentGuardianPhone || null,
            emergencyContactName: req.body.emergencyContactName,
            emergencyContactPhone: req.body.emergencyContactPhone,
            isActive: true,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          const newPlayer = await db.insert(players).values(playerData).returning();
          res.status(201).json(newPlayer[0]);
        });
      } catch (error) {
        console.error("Error adding player:", error);
        res.status(500).json({ error: "Failed to add player" });
      }
    });
    app2.patch("/api/admin/players/:id", async (req, res) => {
      try {
        const playerId = parseInt(req.params.id);
        if (isNaN(playerId)) {
          return res.status(400).json({ error: "Invalid player ID" });
        }
        const playerData = await db.select({
          player: players,
          team: teams
        }).from(players).innerJoin(teams, eq45(players.teamId, teams.id)).where(eq45(players.id, playerId)).limit(1);
        if (!playerData || playerData.length === 0) {
          return res.status(404).json({ error: "Player not found" });
        }
        req.params.eventId = playerData[0].team.eventId;
        await hasEventAccess(req, res, async () => {
          const updateFields = [
            "firstName",
            "lastName",
            "dateOfBirth",
            "jerseyNumber",
            "position",
            "medicalNotes",
            "parentGuardianName",
            "parentGuardianEmail",
            "parentGuardianPhone",
            "emergencyContactName",
            "emergencyContactPhone",
            "isActive"
          ];
          const updateData = {};
          for (const field of updateFields) {
            if (req.body[field] !== void 0) {
              updateData[field] = req.body[field];
            }
          }
          updateData.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          const [updatedPlayer] = await db.update(players).set(updateData).where(eq45(players.id, playerId)).returning();
          res.json(updatedPlayer);
        });
      } catch (error) {
        console.error("Error updating player:", error);
        res.status(500).json({ error: "Failed to update player" });
      }
    });
    app2.delete("/api/admin/players/:id", async (req, res) => {
      try {
        const playerId = parseInt(req.params.id);
        if (isNaN(playerId)) {
          return res.status(400).json({ error: "Invalid player ID" });
        }
        const playerData = await db.select({
          player: players,
          team: teams
        }).from(players).innerJoin(teams, eq45(players.teamId, teams.id)).where(eq45(players.id, playerId)).limit(1);
        if (!playerData || playerData.length === 0) {
          return res.status(404).json({ error: "Player not found" });
        }
        req.params.eventId = playerData[0].team.eventId;
        await hasEventAccess(req, res, async () => {
          await db.delete(players).where(eq45(players.id, playerId));
          res.json({ success: true, message: "Player deleted successfully" });
        });
      } catch (error) {
        console.error("Error deleting player:", error);
        res.status(500).json({ error: "Failed to delete player" });
      }
    });
    app2.patch("/api/admin/teams/:id", async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        const [teamData] = await db.select().from(teams).where(eq45(teams.id, teamId));
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        req.params.eventId = teamData.eventId;
        await hasEventAccess(req, res, async () => {
          const { name, coach, managerName, managerPhone, managerEmail, clubName, ageGroupId } = req.body;
          console.log("Updating team with data:", {
            id: teamId,
            name,
            coachData: typeof coach === "string" ? "JSON string" : coach,
            managerName,
            managerPhone,
            managerEmail,
            clubName,
            ageGroupId
          });
          const updateObject = {};
          if (name !== void 0) updateObject.name = name;
          if (coach !== void 0) updateObject.coach = coach;
          if (managerName !== void 0) updateObject.manager_name = managerName;
          if (managerPhone !== void 0) updateObject.manager_phone = managerPhone;
          if (managerEmail !== void 0) updateObject.manager_email = managerEmail;
          if (clubName !== void 0) updateObject.club_name = clubName;
          if (ageGroupId !== void 0) updateObject.age_group_id = parseInt(ageGroupId);
          console.log("Final SQL update object:", updateObject);
          const [updatedTeam] = await db.update(teams).set(updateObject).where(eq45(teams.id, teamId)).returning();
          if (!updatedTeam) {
            return res.status(404).send("Team not found");
          }
          let coachData = {};
          if (updatedTeam.coach) {
            try {
              coachData = JSON.parse(updatedTeam.coach);
            } catch (error) {
              console.error("Error parsing coach JSON in response:", error);
            }
          }
          res.json({
            ...updatedTeam,
            coachData
          });
        });
      } catch (error) {
        console.error("Error updating team:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update team");
      }
    });
    app2.get("/api/admin/events/:id/registration-form", isAdmin2, async (req, res) => {
      try {
        const eventId = req.params.id;
        const [template] = await db.select({
          template: eventFormTemplates,
          fields: sql19`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type},
                  'required', ${formFields.required},
                  'order', ${formFields.order},
                  'placeholder', ${formFields.placeholder},
                  'helpText', ${formFields.helpText},
                  'validation', ${formFields.validation},
                  'options', (
                    SELECT json_agg(
                      json_build_object(
                        'id', ${formFieldOptions.id},
                        'label', ${formFieldOptions.label},
                        'value', ${formFieldOptions.value},
                        'order', ${formFieldOptions.order}
                      ) ORDER BY ${formFieldOptions.order}
                    )
                    FROM ${formFieldOptions}
                    WHERE ${formFieldOptions.fieldId} = ${formFields.id}
                  )
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith((f) => f || [])
        }).from(eventFormTemplates).leftJoin(formFields, eq45(formFields.templateId, eventFormTemplates.id)).where(eq45(eventFormTemplates.eventId, eventId)).groupBy(eventFormTemplates.id);
        if (!template) {
          return res.json({
            id: null,
            eventId,
            name: "",
            description: "",
            isPublished: false,
            fields: []
          });
        }
        res.json({
          ...template.template,
          fields: template.fields
        });
      } catch (error) {
        console.error("Error fetching form template:", error);
        res.status(500).json({ error: "Failed to fetch form template" });
      }
    });
    app2.get("/api/admin/form-templates", isAdmin2, async (req, res) => {
      try {
        const templates = await db.select({
          id: eventFormTemplates.id,
          name: eventFormTemplates.name,
          description: eventFormTemplates.description,
          isPublished: eventFormTemplates.isPublished,
          createdAt: eventFormTemplates.createdAt,
          updatedAt: eventFormTemplates.updatedAt,
          fields: sql19`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type}
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith((f) => f || [])
        }).from(eventFormTemplates).leftJoin(formFields, eq45(formFields.templateId, eventFormTemplates.id)).groupBy(eventFormTemplates.id);
        res.json(templates);
      } catch (error) {
        console.error("Error fetching form templates:", error);
        res.status(500).json({ error: "Failed to fetch form templates" });
      }
    });
    app2.get("/api/admin/form-templates/:id", isAdmin2, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);
        console.log(`Fetching form template with ID: ${templateId}`);
        const templateExists = await db.select({
          id: eventFormTemplates.id,
          name: eventFormTemplates.name,
          eventId: eventFormTemplates.eventId
        }).from(eventFormTemplates).where(eq45(eventFormTemplates.id, templateId)).limit(1);
        if (templateExists.length === 0) {
          console.log(`Template with ID ${templateId} not found`);
          return res.status(404).json({ error: "Template not found" });
        }
        console.log(`Found template: ${JSON.stringify(templateExists[0])}`);
        const fieldCount = await db.select({ count: sql19`count(*)`.mapWith(Number) }).from(formFields).where(eq45(formFields.templateId, templateId));
        console.log(`Found ${fieldCount[0].count} fields for template ${templateId}`);
        if (fieldCount[0].count > 0) {
          const rawFields = await db.select().from(formFields).where(eq45(formFields.templateId, templateId));
          console.log(`Raw fields: ${JSON.stringify(rawFields)}`);
        }
        const [template] = await db.select({
          template: eventFormTemplates,
          fields: sql19`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type},
                  'required', ${formFields.required},
                  'order', ${formFields.order},
                  'placeholder', ${formFields.placeholder},
                  'helpText', ${formFields.helpText},
                  'validation', ${formFields.validation},
                  'options', (
                    SELECT json_agg(
                      json_build_object(
                        'id', ${formFieldOptions.id},
                        'label', ${formFieldOptions.label},
                        'value', ${formFieldOptions.value},
                        'order', ${formFieldOptions.order}
                      ) ORDER BY ${formFieldOptions.order}
                    )
                    FROM ${formFieldOptions}
                    WHERE ${formFieldOptions.fieldId} = ${formFields.id}
                  )
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith((f) => f || [])
        }).from(eventFormTemplates).leftJoin(formFields, eq45(formFields.templateId, eventFormTemplates.id)).where(eq45(eventFormTemplates.id, templateId)).groupBy(eventFormTemplates.id);
        if (!template) {
          console.log(`Template result was null for ID ${templateId}`);
          return res.status(404).json({ error: "Template not found" });
        }
        console.log(`Returning template with ID ${templateId} and ${template.fields.length} fields`);
        res.json({
          ...template.template,
          fields: template.fields
        });
      } catch (error) {
        console.error("Error fetching form template:", error);
        res.status(500).json({ error: "Failed to fetch form template" });
      }
    });
    app2.put("/api/admin/form-templates/:id", isAdmin2, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const { name, description, isPublished, fields: fields2 } = req.body;
        await db.transaction(async (tx) => {
          await tx.update(eventFormTemplates).set({
            name,
            description,
            isPublished,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq45(eventFormTemplates.id, templateId));
          const existingFields = await tx.select().from(formFields).where(eq45(formFields.templateId, templateId));
          for (const field of existingFields) {
            await tx.delete(formFieldOptions).where(eq45(formFieldOptions.fieldId, field.id));
          }
          await tx.delete(formFields).where(eq45(formFields.templateId, templateId));
          for (const [index, field] of fields2.entries()) {
            const [newField] = await tx.insert(formFields).values({
              templateId,
              label: field.label,
              type: field.type,
              required: field.required || false,
              order: index,
              placeholder: field.placeholder,
              helpText: field.helpText,
              validation: field.validation,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }).returning();
            if (field.type === "dropdown" && field.options?.length > 0) {
              await tx.insert(formFieldOptions).values(
                field.options.map((option, optionIndex) => ({
                  fieldId: newField.id,
                  label: option.label,
                  value: option.value,
                  order: optionIndex,
                  createdAt: /* @__PURE__ */ new Date()
                }))
              );
            }
          }
        });
        res.json({ message: "Form template updated successfully" });
      } catch (error) {
        console.error("Error updating form template:", error);
        res.status(500).json({ error: "Failed to update form template" });
      }
    });
    app2.post("/api/admin/form-templates", isAdmin2, async (req, res) => {
      try {
        const { name, description, isPublished, fields: fields2, eventId } = req.body;
        await db.transaction(async (tx) => {
          const [template] = await tx.insert(eventFormTemplates).values({
            eventId: eventId || null,
            // Make eventId optional
            name,
            description,
            isPublished: isPublished || false,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).returning();
          if (fields2?.length) {
            for (const field of fields2) {
              const [newField] = await tx.insert(formFields).values({
                templateId: template.id,
                label: field.label,
                type: field.type,
                required: field.required,
                order: field.order,
                placeholder: field.placeholder,
                helpText: field.helpText,
                validation: field.validation
              }).returning();
              if (field.type === "dropdown" && field.options?.length) {
                await tx.insert(formFieldOptions).values(
                  field.options.map((option, index) => ({
                    fieldId: newField.id,
                    label: option.label,
                    value: option.value,
                    order: option.order || index
                  }))
                );
              }
            }
          }
        });
        res.json({ message: "Form template created successfully" });
      } catch (error) {
        console.error("Error creating form template:", error);
        res.status(500).json({ error: "Failed to create form template" });
      }
    });
    app2.post("/api/admin/events/:id/form-template", isAdmin2, async (req, res) => {
      try {
        const eventId = req.params.id;
        const { name, description, isPublished, fields: fields2 } = req.body;
        await db.transaction(async (tx) => {
          const [template] = await tx.insert(eventFormTemplates).values({
            eventId,
            name,
            description,
            isPublished: isPublished || false,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).returning();
          for (const [index, field] of fields2.entries()) {
            const [newField] = await tx.insert(formFields).values({
              templateId: template.id,
              label: field.label,
              type: field.type,
              required: field.required || false,
              order: index,
              placeholder: field.placeholder,
              helpText: field.helpText,
              validation: field.validation,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }).returning();
            if (field.type === "dropdown" && field.options?.length > 0) {
              await tx.insert(formFieldOptions).values(
                field.options.map((option, optionIndex) => ({
                  fieldId: newField.id,
                  label: option.label,
                  value: option.value,
                  order: optionIndex,
                  createdAt: /* @__PURE__ */ new Date()
                }))
              );
            }
          }
        });
        res.status(201).json({ message: "Form template created successfully" });
      } catch (error) {
        console.error("Error creating form template:", error);
        res.status(500).json({ error: "Failed to create form template" });
      }
    });
    app2.put("/api/admin/events/:eventId/form-template", isAdmin2, async (req, res) => {
      try {
        const eventId = req.params.eventId;
        const { id, name, description, isPublished, fields: fields2 } = req.body;
        await db.transaction(async (tx) => {
          await tx.update(eventFormTemplates).set({
            name,
            description,
            isPublished,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq45(eventFormTemplates.id, id));
          const existingFields = await tx.select().from(formFields).where(eq45(formFields.templateId, id));
          for (const field of existingFields) {
            await tx.delete(formFieldOptions).where(eq45(formFieldOptions.fieldId, field.id));
          }
          await tx.delete(formFields).where(eq45(formFields.templateId, id));
          for (const [index, field] of fields2.entries()) {
            const [newField] = await tx.insert(formFields).values({
              templateId: id,
              label: field.label,
              type: field.type,
              required: field.required || false,
              order: index,
              placeholder: field.placeholder,
              helpText: field.helpText,
              validation: field.validation,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            }).returning();
            if (field.type === "dropdown" && field.options?.length > 0) {
              await tx.insert(formFieldOptions).values(
                field.options.map((option, optionIndex) => ({
                  fieldId: newField.id,
                  label: option.label,
                  value: option.value,
                  order: optionIndex,
                  createdAt: /* @__PURE__ */ new Date()
                }))
              );
            }
          }
        });
        res.json({ message: "Form template updated successfully" });
      } catch (error) {
        console.error("Error updating form template:", error);
        res.status(500).json({ error: "Failed to update form template" });
      }
    });
    app2.delete("/api/admin/events/:eventId/form-template/:id", isAdmin2, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);
        await db.transaction(async (tx) => {
          await tx.delete(formFieldOptions).where(
            inArray13(
              formFieldOptions.fieldId,
              db.select({ id: formFields.id }).from(formFields).where(eq45(formFields.templateId, templateId))
            )
          );
          await tx.delete(formFields).where(eq45(formFields.templateId, templateId));
          const [deletedTemplate] = await tx.delete(eventFormTemplates).where(eq45(eventFormTemplates.id, templateId)).returning();
          if (!deletedTemplate) {
            return res.status(404).json({ error: "Template not found" });
          }
        });
        res.json({ message: "Form template deleted successfully" });
      } catch (error) {
        console.error("Error deleting form template:", error);
        res.status(500).json({ error: "Failed to delete form template" });
      }
    });
    app2.delete("/api/admin/teams/:id", async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        if (isNaN(teamId)) {
          return res.status(400).json({ error: "Invalid team ID" });
        }
        const [teamData] = await db.select().from(teams).where(eq45(teams.id, teamId));
        if (!teamData) {
          return res.status(404).json({ error: "Team not found" });
        }
        req.params.eventId = teamData.eventId;
        await hasEventAccess(req, res, async () => {
          const [gameCount] = await db.select({
            count: sql19`count(*)`.mapWith(Number)
          }).from(games).where(
            or8(
              eq45(games.homeTeamId, teamId),
              eq45(games.awayTeamId, teamId)
            )
          );
          if (gameCount.count > 0) {
            return res.status(400).send("Cannot delete team with associated games");
          }
          const [deletedTeam] = await db.delete(teams).where(eq45(teams.id, teamId)).returning();
          if (!deletedTeam) {
            return res.status(404).send("Team not found");
          }
          await db.delete(players).where(eq45(players.teamId, teamId));
          res.json({
            success: true,
            message: "Team deleted successfully",
            team: deletedTeam
          });
        });
      } catch (error) {
        console.error("Error deleting team:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to delete team");
      }
    });
    app2.delete("/api/admin/events/bulk", isAdmin2, async (req, res) => {
      try {
        const { eventIds } = req.body;
        if (!Array.isArray(eventIds) || eventIds.length === 0) {
          return res.status(400).json({ message: "No events selected" });
        }
        await db.transaction(async (tx) => {
          await tx.delete(formResponses).where(inArray13(formResponses.eventId, eventIds));
          await tx.delete(chatRooms).where(inArray13(chatRooms.eventId, eventIds));
          await tx.delete(eventFieldSizes).where(inArray13(eventFieldSizes.eventId, eventIds));
          await tx.delete(eventScoringRules).where(inArray13(eventScoringRules.eventId, eventIds));
          await tx.delete(eventComplexes2).where(inArray13(eventComplexes2.eventId, eventIds));
          await tx.delete(teams).where(inArray13(teams.eventId, eventIds));
          await tx.delete(tournamentGroups).where(inArray13(tournamentGroups.eventId, eventIds));
          await tx.delete(eventAgeGroups).where(inArray13(eventAgeGroups.eventId, eventIds));
          await tx.delete(eventFormTemplates).where(inArray13(eventFormTemplates.eventId, eventIds));
          await tx.delete(events).where(inArray13(events.id, eventIds));
        });
        res.json({ message: "Events deleted successfully" });
      } catch (error) {
        console.error("Error deleting events:", error);
        let errorMessage = "Failed to delete events";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        res.status(500).send(errorMessage);
      }
    });
    app2.delete("/api/admin/events/:id", async (req, res) => {
      try {
        const eventId = req.params.id;
        console.log("Starting event deletion for ID:", eventId);
        await hasEventAccess(req, res, async () => {
          if (!eventId) {
            return res.status(400).json({ error: "Event ID is required" });
          }
          const [eventExists] = await db.select({ id: events.id }).from(events).where(eq45(events.id, eventId)).limit(1);
          if (!eventExists) {
            return res.status(404).json({ error: "Event not found" });
          }
          try {
            try {
              await db.delete(games).where(eq45(games.eventId, eventId));
              console.log("Deleted games");
            } catch (e) {
              console.error("Error deleting games:", e);
            }
            try {
              await db.delete(gameTimeSlots).where(eq45(gameTimeSlots.eventId, eventId));
              console.log("Deleted game time slots");
            } catch (e) {
              console.error("Error deleting game time slots:", e);
            }
            try {
              await db.delete(formResponses).where(eq45(formResponses.eventId, eventId));
              console.log("Deleted form responses");
            } catch (e) {
              console.error("Error deleting form responses:", e);
            }
            try {
              await db.execute(sql19`SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms'`);
              await db.delete(chatRooms).where(eq45(chatRooms.eventId, eventId));
              console.log("Deleted chat rooms");
            } catch (e) {
              console.error("Error deleting chat rooms:", e);
            }
            try {
              await db.delete(coupons).where(eq45(coupons.eventId, eventId));
              console.log("Deleted coupons");
            } catch (e) {
              console.error("Error deleting coupons:", e);
            }
            try {
              await db.delete(eventFieldSizes).where(eq45(eventFieldSizes.eventId, eventId));
              console.log("Deleted event field sizes");
            } catch (e) {
              console.error("Error deleting field sizes:", e);
            }
            try {
              await db.delete(eventScoringRules).where(eq45(eventScoringRules.eventId, eventId));
              console.log("Deleted event scoring rules");
            } catch (e) {
              console.error("Error deleting scoring rules:", e);
            }
            try {
              await db.delete(eventComplexes2).where(eq45(eventComplexes2.eventId, eventId));
              console.log("Deleted event complexes");
            } catch (e) {
              console.error("Error deleting complex assignments:", e);
            }
            try {
              await db.delete(tournamentGroups).where(eq45(tournamentGroups.eventId, eventId));
              console.log("Deleted tournament groups");
            } catch (e) {
              console.error("Error deleting tournament groups:", e);
            }
            try {
              await db.delete(teams).where(eq45(teams.eventId, eventId));
              console.log("Deleted teams");
            } catch (e) {
              console.error("Error deleting teams:", e);
            }
            try {
              const templateIds = await db.select({ id: eventFormTemplates.id }).from(eventFormTemplates).where(eq45(eventFormTemplates.eventId, eventId)).then((results) => results.map((r) => r.id));
              if (templateIds.length > 0) {
                const fieldIds = await db.select({ id: formFields.id }).from(formFields).where(inArray13(formFields.templateId, templateIds)).then((results) => results.map((r) => r.id));
                if (fieldIds.length > 0) {
                  await db.delete(formFieldOptions).where(inArray13(formFieldOptions.fieldId, fieldIds));
                  console.log("Deleted form field options");
                }
                await db.delete(formFields).where(inArray13(formFields.templateId, templateIds));
                console.log("Deleted form fields");
              }
            } catch (e) {
              console.error("Error deleting form fields:", e);
            }
            try {
              await db.delete(eventFormTemplates).where(eq45(eventFormTemplates.eventId, eventId));
              console.log("Deleted event form templates");
            } catch (e) {
              console.error("Error deleting form templates:", e);
            }
            try {
              await db.delete(eventAgeGroups).where(eq45(eventAgeGroups.eventId, eventId));
              console.log("Deleted event age groups");
            } catch (e) {
              console.error("Error deleting age groups:", e);
            }
            try {
              const [deletedEvent] = await db.delete(events).where(eq45(events.id, eventId)).returning();
              if (!deletedEvent) {
                return res.status(404).json({ error: "Event not found after deleting dependencies" });
              }
              console.log("Successfully deleted event:", eventId);
            } catch (e) {
              console.error("Error deleting event entity:", e);
              return res.status(500).json({
                error: e instanceof Error ? e.message : "Failed to delete event entity",
                details: e instanceof Error ? e.stack : void 0
              });
            }
          } catch (innerError) {
            console.error("Error in deletion sequence:", innerError);
            return res.status(500).json({
              error: innerError instanceof Error ? innerError.message : "Failed in deletion sequence",
              details: innerError instanceof Error ? innerError.stack : void 0
            });
          }
          res.json({ message: "Event deleted successfully" });
        });
      } catch (error) {
        console.error("Error deleting event:", error);
        console.error("Error details:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to delete event",
          details: error instanceof Error ? error.stack : void 0
        });
      }
    });
    app2.post("/api/chat/rooms", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const { name, type, eventId, teamId } = req.body;
        const [chatRoom] = await db.transaction(async (tx) => {
          const [room] = await tx.insert(chatRooms).values({
            name,
            type,
            eventId: eventId || null,
            teamId: teamId || null,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).returning();
          await tx.insert(chatParticipants).values({
            chatRoomId: room.id,
            userId: req.user.id,
            isAdmin: true,
            lastReadAt: (/* @__PURE__ */ new Date()).toISOString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          return [room];
        });
        res.json(chatRoom);
      } catch (error) {
        console.error("Error creating chat room:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to create chat room");
      }
    });
    app2.get("/api/chat/rooms", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const userRooms = await db.select({
          room: chatRooms,
          unreadCount: sql19`
              count(case when ${messages.createdAt} > ${chatParticipants.lastReadAt} then 1 end)
            `.mapWith(Number)
        }).from(chatParticipants).innerJoin(chatRooms, eq45(chatParticipants.chatRoomId, chatRooms.id)).leftJoin(messages, eq45(messages.chatRoomId, chatRooms.id)).where(eq45(chatParticipants.userId, req.user.id)).groupBy(chatRooms.id).orderBy(chatRooms.updatedAt);
        res.json(userRooms);
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch chat rooms");
      }
    });
    app2.get("/api/chat/rooms/:roomId/messages", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const roomId = parseInt(req.params.roomId);
        const [participant] = await db.select().from(chatParticipants).where(and26(
          eq45(chatParticipants.chatRoomId, roomId),
          eq45(chatParticipants.userId, req.user.id)
        ));
        if (!participant) {
          return res.status(403).send("Not a participant of this chat room");
        }
        const roomMessages = await db.select({
          message: messages,
          user: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName
          }
        }).from(messages).innerJoin(users, eq45(messages.userId, users.id)).where(eq45(messages.chatRoomId, roomId)).orderBy(messages.createdAt);
        await db.update(chatParticipants).set({
          lastReadAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(and26(
          eq45(chatParticipants.chatRoomId, roomId),
          eq45(chatParticipants.userId, req.user.id)
        ));
        res.json(roomMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch messages");
      }
    });
    app2.post("/api/chat/rooms/:roomId/participants", async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }
      try {
        const roomId = parseInt(req.params.roomId);
        const { userIds } = req.body;
        const [requesterParticipant] = await db.select().from(chatParticipants).where(and26(
          eq45(chatParticipants.chatRoomId, roomId),
          eq45(chatParticipants.userId, req.user.id),
          eq45(chatParticipants.isAdmin, true)
        ));
        if (!requesterParticipant) {
          return res.status(403).send("Not authorized to add participants");
        }
        const newParticipants = await db.insert(chatParticipants).values(
          userIds.map((userId) => ({
            chatRoomId: roomId,
            userId,
            isAdmin: false,
            lastReadAt: (/* @__PURE__ */ new Date()).toISOString(),
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          }))
        ).returning();
        res.json(newParticipants);
      } catch (error) {
        console.error("Error adding participants:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to add participants");
      }
    });
    app2.get("/api/admin/email-templates", isAdmin2, async (req, res) => {
      try {
        const { getEmailTemplates: getEmailTemplates2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await getEmailTemplates2(req, res);
      } catch (error) {
        console.error("Error fetching email templates:", error);
        res.status(500).send("Failed to fetch email templates");
      }
    });
    app2.get("/api/admin/email-templates/preview", isAdmin2, async (req, res) => {
      try {
        const { previewEmailTemplate: previewEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await previewEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error previewing email template:", error);
        res.status(500).send("Failed to preview email template");
      }
    });
    app2.get("/api/admin/sendgrid/settings", isAdmin2, async (req, res) => {
      try {
        console.log("SendGrid settings request - Auth status:", req.isAuthenticated(), "User:", !!req.user);
        const { getSendGridSettings: getSendGridSettings2 } = await Promise.resolve().then(() => (init_sendgrid_settings(), sendgrid_settings_exports));
        await getSendGridSettings2(req, res);
      } catch (error) {
        console.error("Error fetching SendGrid settings:", error);
        res.status(500).json({ error: "Failed to fetch SendGrid settings", details: error.message });
      }
    });
    app2.get("/api/admin/sendgrid/templates", isAdmin2, async (req, res) => {
      try {
        console.log("SendGrid templates request - Auth status:", req.isAuthenticated(), "User:", !!req.user);
        const { getSendGridTemplates: getSendGridTemplates2 } = await Promise.resolve().then(() => (init_sendgrid_settings(), sendgrid_settings_exports));
        await getSendGridTemplates2(req, res);
      } catch (error) {
        console.error("Error fetching SendGrid templates:", error);
        res.status(500).json({ error: "Failed to fetch SendGrid templates", details: error.message });
      }
    });
    app2.get("/api/admin/sendgrid/template-mappings", isAdmin2, async (req, res) => {
      try {
        console.log("SendGrid template mappings request - Auth status:", req.isAuthenticated(), "User:", !!req.user);
        const { getEmailTemplatesWithSendGridMapping: getEmailTemplatesWithSendGridMapping2 } = await Promise.resolve().then(() => (init_sendgrid_settings(), sendgrid_settings_exports));
        await getEmailTemplatesWithSendGridMapping2(req, res);
      } catch (error) {
        console.error("Error fetching template mappings:", error);
        res.status(500).json({ error: "Failed to fetch template mappings", details: error.message });
      }
    });
    app2.post("/api/admin/sendgrid/template-mapping", isAdmin2, async (req, res) => {
      try {
        console.log("SendGrid template mapping update - Auth status:", req.isAuthenticated(), "User:", !!req.user);
        const { updateSendGridTemplateMapping: updateSendGridTemplateMapping2 } = await Promise.resolve().then(() => (init_sendgrid_settings(), sendgrid_settings_exports));
        await updateSendGridTemplateMapping2(req, res);
      } catch (error) {
        console.error("Error updating template mapping:", error);
        res.status(500).json({ error: "Failed to update template mapping", details: error.message });
      }
    });
    app2.post("/api/admin/sendgrid/test-template", isAdmin2, async (req, res) => {
      try {
        console.log("SendGrid template test - Auth status:", req.isAuthenticated(), "User:", !!req.user);
        const { testSendGridTemplate: testSendGridTemplate3 } = await Promise.resolve().then(() => (init_sendgrid_settings(), sendgrid_settings_exports));
        await testSendGridTemplate3(req, res);
      } catch (error) {
        console.error("Error testing SendGrid template:", error);
        res.status(500).json({ error: "Failed to test SendGrid template", details: error.message });
      }
    });
    app2.get("/api/admin/email-templates/:id", isAdmin2, async (req, res) => {
      try {
        const { getEmailTemplate: getEmailTemplate3 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await getEmailTemplate3(req, res);
      } catch (error) {
        console.error(`Error fetching email template ${req.params.id}:`, error);
        res.status(500).send("Failed to fetch email template");
      }
    });
    app2.post("/api/admin/email-templates", isAdmin2, async (req, res) => {
      try {
        const { createEmailTemplate: createEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await createEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error creating email template:", error);
        res.status(500).send("Failed to create email template");
      }
    });
    app2.put("/api/admin/email-templates/:id", isAdmin2, async (req, res) => {
      try {
        const { updateEmailTemplate: updateEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await updateEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error updating email template:", error);
        res.status(500).send("Failed to update email template");
      }
    });
    app2.delete("/api/admin/email-templates/:id", isAdmin2, async (req, res) => {
      try {
        const { deleteEmailTemplate: deleteEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await deleteEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error deleting email template:", error);
        res.status(500).send("Failed to delete email template");
      }
    });
    return httpServer;
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
}

// server/index.ts
init_vite();
init_db();
init_schema();

// server/create-admin.ts
init_db();
init_schema();
init_crypto();
import { eq as eq46, and as and27 } from "drizzle-orm";
async function createAdmin() {
  try {
    const [existingAdmin] = await db.select().from(users).where(eq46(users.email, "bperdomo@zoho.com")).limit(1);
    let adminUser;
    if (!existingAdmin) {
      const hashedPassword = await crypto.hash("!Nova2025");
      const [newAdmin] = await db.insert(users).values({
        email: "bperdomo@zoho.com",
        username: "bperdomo@zoho.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isParent: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }).returning();
      adminUser = newAdmin;
      console.log("Admin user created successfully");
    } else {
      adminUser = existingAdmin;
      console.log("Admin user already exists");
    }
    const [superAdminRole] = await db.select().from(roles).where(eq46(roles.name, "super_admin")).limit(1);
    let superAdminRoleId;
    if (!superAdminRole) {
      console.log("Creating super_admin role");
      const [newRole] = await db.insert(roles).values({
        name: "super_admin",
        description: "Super Administrator role with full system access",
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      superAdminRoleId = newRole.id;
    } else {
      superAdminRoleId = superAdminRole.id;
    }
    const existingRoleAssignment = await db.select().from(adminRoles).where(
      and27(
        eq46(adminRoles.userId, adminUser.id),
        eq46(adminRoles.roleId, superAdminRoleId)
      )
    ).limit(1);
    if (existingRoleAssignment.length === 0) {
      await db.insert(adminRoles).values({
        userId: adminUser.id,
        roleId: superAdminRoleId,
        createdAt: /* @__PURE__ */ new Date()
      });
      console.log("Assigned super_admin role to admin user");
    } else {
      console.log("Admin user already has super_admin role");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// server/index.ts
import path11 from "path";

// server/create-tables.ts
init_db();
import { sql as sql41 } from "drizzle-orm";

// server/migrations/create_email_templates.ts
init_db();
import { sql as sql20 } from "drizzle-orm";
async function createEmailTemplatesTable() {
  try {
    console.log("Creating email_templates table...");
    await db.execute(sql20`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        variables JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("email_templates table created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating email_templates table:", error);
    return { success: false, error };
  }
}

// server/migrations/create_email_template_routing.ts
init_db();
import { sql as sql21 } from "drizzle-orm";
async function createEmailTemplateRoutingTable() {
  try {
    console.log("Creating email_template_routing table...");
    await db.execute(sql21`
      CREATE TABLE IF NOT EXISTS email_template_routing (
        id SERIAL PRIMARY KEY,
        template_type TEXT NOT NULL,
        provider_id INTEGER NOT NULL REFERENCES email_provider_settings(id),
        from_email TEXT NOT NULL,
        from_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(template_type)
      )
    `);
    console.log("email_template_routing table created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating email_template_routing table:", error);
    return { success: false, error };
  }
}

// server/migrations/create_password_reset_tokens.ts
init_db();
import { sql as sql22 } from "drizzle-orm";
async function createPasswordResetTokensTable() {
  try {
    console.log("Creating password_reset_tokens table...");
    await db.execute(sql22`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      )
    `);
    console.log("password_reset_tokens table created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating password_reset_tokens table:", error);
    return { success: false, error };
  }
}

// server/migrations/create_default_email_templates.ts
init_db();
init_emailTemplates();
async function createDefaultEmailTemplates() {
  try {
    console.log("Creating default email templates...");
    const existingTemplates = await db.select({ id: emailTemplates2.id, type: emailTemplates2.type }).from(emailTemplates2);
    const passwordResetExists = existingTemplates.some((t) => t.type === "password_reset");
    const welcomeEmailExists = existingTemplates.some((t) => t.type === "welcome");
    if (!passwordResetExists) {
      await db.insert(emailTemplates2).values({
        name: "Password Reset",
        description: "Template for password reset emails",
        type: "password_reset",
        subject: "Reset Your Password - MatchPro",
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4A154B;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
    }
    .button {
      display: inline-block;
      background-color: #4A154B;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
    }
    .token-box {
      background-color: #eee;
      padding: 10px;
      border-radius: 4px;
      margin: 20px 0;
      word-break: break-all;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello {{username}},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
      <p>Or copy and paste the following URL into your browser:</p>
      <div class="token-box">{{resetUrl}}</div>
      <p>This link will expire in {{expiryHours}} hours.</p>
      <p>Thank you,<br>The MatchPro Team</p>
    </div>
    <div class="footer">
      <p>If you're having trouble with the button above, copy and paste the URL below into your web browser.</p>
      <p>{{resetUrl}}</p>
    </div>
  </div>
</body>
</html>`,
        senderName: "MatchPro",
        senderEmail: "noreply@matchpro.ai",
        isActive: true,
        variables: ["username", "resetUrl", "token", "expiryHours"],
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      console.log("Password reset template created");
    } else {
      console.log("Password reset template already exists");
    }
    if (!welcomeEmailExists) {
      await db.insert(emailTemplates2).values({
        name: "Welcome Email",
        description: "Template for welcome emails sent to new users",
        type: "welcome",
        subject: "Welcome to MatchPro!",
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to MatchPro</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2C5282;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
    }
    .button {
      display: inline-block;
      background-color: #2C5282;
      color: white !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      margin-top: 20px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to MatchPro!</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>Welcome to MatchPro! We're excited to have you join our sports management platform.</p>
      <p>Your account has been successfully created with the following information:</p>
      <ul>
        <li><strong>Username:</strong> {{username}}</li>
        <li><strong>Email:</strong> {{email}}</li>
      </ul>
      <p>With your MatchPro account, you can:</p>
      <ul>
        <li>Register teams for tournaments</li>
        <li>Manage player information</li>
        <li>Track your tournament schedules</li>
        <li>And much more!</li>
      </ul>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Thank you,<br>The MatchPro Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to {{email}}. If you did not create an account, please contact us immediately.</p>
    </div>
  </div>
</body>
</html>`,
        senderName: "MatchPro",
        senderEmail: "noreply@matchpro.ai",
        isActive: true,
        variables: ["firstName", "lastName", "username", "email"],
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      console.log("Welcome email template created");
    } else {
      console.log("Welcome email template already exists");
    }
    return { success: true };
  } catch (error) {
    console.error("Error creating default email templates:", error);
    return { success: false, error };
  }
}

// server/migrations/add_provider_id_to_email_templates.ts
init_db();
import { sql as sql23 } from "drizzle-orm";
async function addProviderIdToEmailTemplates() {
  try {
    const result = await db.execute(sql23`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='email_templates' AND column_name='provider_id';
    `);
    if (result.rows.length === 0) {
      console.log("Adding provider_id column to email_templates table...");
      await db.execute(sql23`
        ALTER TABLE email_templates 
        ADD COLUMN provider_id INTEGER REFERENCES email_provider_settings(id) ON DELETE SET NULL;
      `);
      console.log("Successfully added provider_id column to email_templates table");
    } else {
      console.log("provider_id column already exists in email_templates table");
    }
    return true;
  } catch (error) {
    console.error("Error adding provider_id to email_templates:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  addProviderIdToEmailTemplates().then((success) => {
    if (success) {
      console.log("Migration completed successfully");
      process.exit(0);
    } else {
      console.error("Migration failed");
      process.exit(1);
    }
  });
}

// server/migrations/create_role_permissions.ts
init_db();
init_schema();
import { sql as sql24 } from "drizzle-orm";
async function createRolePermissions() {
  console.log("Creating role_permissions table...");
  await db.execute(sql24`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(role_id, permission)
    )
  `);
  console.log("Role permissions table created");
  const permissionGroups = {
    users: [
      "users.view",
      "users.create",
      "users.edit",
      "users.delete"
    ],
    events: [
      "events.view",
      "events.create",
      "events.edit",
      "events.delete"
    ],
    teams: [
      "teams.view",
      "teams.create",
      "teams.edit",
      "teams.delete"
    ],
    games: [
      "games.view",
      "games.create",
      "games.edit",
      "games.delete"
    ],
    scores: [
      "scores.view",
      "scores.create",
      "scores.edit",
      "scores.delete"
    ],
    finances: [
      "finances.view",
      "finances.create",
      "finances.edit",
      "finances.delete",
      "finances.approve"
    ],
    settings: [
      "settings.view",
      "settings.edit"
    ],
    reports: [
      "reports.view",
      "reports.export"
    ],
    administrators: [
      "administrators.view",
      "administrators.create",
      "administrators.edit",
      "administrators.delete"
    ]
  };
  const allPermissions = Object.values(permissionGroups).flat();
  try {
    const roleRecords = await db.select().from(roles);
    for (const role of roleRecords) {
      let rolePermissions2 = [];
      if (role.name === "super_admin") {
        rolePermissions2 = allPermissions;
      } else if (role.name === "tournament_admin") {
        rolePermissions2 = [
          ...permissionGroups.events,
          ...permissionGroups.teams,
          ...permissionGroups.games,
          "users.view",
          "reports.view"
        ];
      } else if (role.name === "score_admin") {
        rolePermissions2 = [
          ...permissionGroups.scores,
          "games.view",
          "teams.view",
          "events.view",
          "reports.view"
        ];
      } else if (role.name === "finance_admin") {
        rolePermissions2 = [
          ...permissionGroups.finances,
          "events.view",
          "reports.view",
          "reports.export"
        ];
      }
      for (const permission of rolePermissions2) {
        try {
          await db.execute(sql24`
            INSERT INTO role_permissions (role_id, permission)
            VALUES (${role.id}, ${permission})
            ON CONFLICT (role_id, permission) DO NOTHING
          `);
        } catch (error) {
          console.error(`Error inserting permission ${permission} for role ${role.name}:`, error);
        }
      }
      console.log(`Added ${rolePermissions2.length} permissions to role: ${role.name}`);
    }
    console.log("Default role permissions added successfully");
  } catch (error) {
    console.error("Error adding default role permissions:", error);
    throw error;
  }
}

// server/migrations/update_division_codes.ts
init_db();
init_schema();
import { eq as eq47, sql as sql25 } from "drizzle-orm";
async function updateDivisionCodes() {
  console.log("Starting migration to update division codes...");
  try {
    const ageGroupsWithoutCorrectDivisionCode = await db.select().from(eventAgeGroups).where(
      sql25`division_code IS NULL OR division_code NOT SIMILAR TO '[BG][0-9]{4}'`
    );
    console.log(`Found ${ageGroupsWithoutCorrectDivisionCode.length} age groups to process`);
    const birthYearMap = {
      "U4": 2021,
      "U5": 2020,
      "U6": 2019,
      "U7": 2018,
      "U8": 2017,
      "U9": 2016,
      "U10": 2015,
      "U11": 2014,
      "U12": 2013,
      "U13": 2012,
      "U14": 2011,
      "U15": 2010,
      "U16": 2009,
      "U17": 2008,
      "U18": 2007,
      "U19": 2006
    };
    let totalUpdated = 0;
    const batchSize = 50;
    for (let i = 0; i < ageGroupsWithoutCorrectDivisionCode.length; i += batchSize) {
      const batch = ageGroupsWithoutCorrectDivisionCode.slice(i, i + batchSize);
      const updatePromises = batch.map(async (group) => {
        const genderPrefix = group.gender === "Boys" ? "B" : "G";
        let birthYear = group.birthYear;
        if (!birthYear && group.ageGroup && group.ageGroup.startsWith("U")) {
          const ageNum = parseInt(group.ageGroup.substring(1));
          if (!isNaN(ageNum)) {
            birthYear = birthYearMap[group.ageGroup] || (/* @__PURE__ */ new Date()).getFullYear() - ageNum;
          }
        }
        if (!birthYear) {
          birthYear = birthYearMap[group.ageGroup];
          if (!birthYear) {
            console.log(`Could not determine birth year for age group ${group.ageGroup}, skipping id=${group.id}`);
            return null;
          }
        }
        const newDivisionCode = `${genderPrefix}${birthYear}`;
        return db.update(eventAgeGroups).set({
          divisionCode: newDivisionCode,
          birthYear
        }).where(eq47(eventAgeGroups.id, group.id)).then(() => {
          console.log(`Updated: id=${group.id}, ${group.ageGroup}, ${group.gender}: ${group.divisionCode || "null"} -> ${newDivisionCode}`);
          return true;
        });
      });
      const results = await Promise.all(updatePromises);
      const batchUpdated = results.filter(Boolean).length;
      totalUpdated += batchUpdated;
      console.log(`Batch ${Math.floor(i / batchSize) + 1} complete. Updated ${batchUpdated} records.`);
    }
    console.log(`Migration complete. Updated ${totalUpdated} division codes.`);
    const remaining = await db.select({ count: sql25`count(*)` }).from(eventAgeGroups).where(
      sql25`division_code IS NULL OR division_code NOT SIMILAR TO '[BG][0-9]{4}'`
    );
    console.log(`Remaining age groups without proper division codes: ${remaining[0]?.count || 0}`);
    return true;
  } catch (error) {
    console.error("Error updating division codes:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDivisionCodes().then((success) => {
    console.log(`Division code migration ${success ? "completed successfully" : "failed"}`);
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error("Unexpected error during migration:", error);
    process.exit(1);
  });
}

// server/migrations/add_team_registration_fields.ts
init_db();
import { sql as sql26 } from "drizzle-orm";
async function addTeamRegistrationFields() {
  console.log("Starting migration to add team registration fields...");
  try {
    const tableInfo = await db.execute(sql26`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    const columns = tableInfo.rows.map((row) => row.column_name);
    if (!columns.includes("status")) {
      await db.execute(sql26`
        ALTER TABLE teams
        ADD COLUMN status TEXT NOT NULL DEFAULT 'registered'
      `);
      console.log("Added status column to teams table");
    }
    if (!columns.includes("registration_fee")) {
      await db.execute(sql26`
        ALTER TABLE teams
        ADD COLUMN registration_fee INTEGER
      `);
      console.log("Added registration_fee column to teams table");
    }
    if (!columns.includes("terms_acknowledged")) {
      await db.execute(sql26`
        ALTER TABLE teams
        ADD COLUMN terms_acknowledged BOOLEAN DEFAULT false
      `);
      console.log("Added terms_acknowledged column to teams table");
    }
    if (!columns.includes("terms_acknowledged_at")) {
      await db.execute(sql26`
        ALTER TABLE teams
        ADD COLUMN terms_acknowledged_at TIMESTAMP
      `);
      console.log("Added terms_acknowledged_at column to teams table");
    }
    if (!columns.includes("terms_acknowledgement_record")) {
      await db.execute(sql26`
        ALTER TABLE teams
        ADD COLUMN terms_acknowledgement_record TEXT
      `);
      console.log("Added terms_acknowledgement_record column to teams table");
    }
    if (!columns.includes("notes")) {
      await db.execute(sql26`
        ALTER TABLE teams
        ADD COLUMN notes TEXT
      `);
      console.log("Added notes column to teams table");
    }
    console.log("Migration complete: team registration fields added successfully");
    return true;
  } catch (error) {
    console.error("Error adding team registration fields:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  addTeamRegistrationFields().then((success) => {
    console.log(`Team registration fields migration ${success ? "completed successfully" : "failed"}`);
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error("Unexpected error during migration:", error);
    process.exit(1);
  });
}

// server/create-players-table.ts
init_db();
import { sql as sql27 } from "drizzle-orm";
async function createPlayersTable() {
  console.log("Creating players table...");
  try {
    const tableExists = await db.execute(sql27`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'players'
      );
    `);
    if (tableExists.rows[0].exists) {
      console.log("Players table already exists");
      return true;
    }
    await db.execute(sql27`
      CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        jersey_number INTEGER,
        date_of_birth TEXT,
        position TEXT,
        medical_notes TEXT,
        parent_guardian_name TEXT,
        parent_guardian_email TEXT,
        parent_guardian_phone TEXT,
        emergency_contact_name TEXT NOT NULL,
        emergency_contact_phone TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Players table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating players table:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  createPlayersTable().then((success) => {
    console.log(`Players table creation ${success ? "completed successfully" : "failed"}`);
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error("Unexpected error during players table creation:", error);
    process.exit(1);
  });
}

// server/migrations/add_submitter_email_to_teams.ts
init_db();
init_vite();
import { sql as sql28 } from "drizzle-orm";
async function addSubmitterEmailToTeams() {
  try {
    log("Starting migration to add submitterEmail to teams table...");
    const checkColumn = await db.execute(sql28`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'submitter_email'
    `);
    if (checkColumn.rows.length === 0) {
      await db.execute(sql28`
        ALTER TABLE teams 
        ADD COLUMN submitter_email TEXT
      `);
      await db.execute(sql28`
        UPDATE teams 
        SET submitter_email = manager_email 
        WHERE submitter_email IS NULL
      `);
      log("Migration complete: submitterEmail column added to teams table");
    } else {
      log("submitter_email column already exists in teams table");
    }
  } catch (error) {
    log(`Error in migration: ${error}`, "error");
    throw error;
  }
}

// server/migrations/add_submitter_name_to_teams.ts
init_db();
init_vite();
import { sql as sql29 } from "drizzle-orm";
async function addSubmitterNameToTeams() {
  try {
    log("Starting migration to add submitterName to teams table...");
    const checkColumn = await db.execute(sql29`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'submitter_name'
    `);
    if (checkColumn.rows.length === 0) {
      await db.execute(sql29`
        ALTER TABLE teams 
        ADD COLUMN submitter_name TEXT
      `);
      await db.execute(sql29`
        UPDATE teams 
        SET submitter_name = manager_name 
        WHERE submitter_name IS NULL
      `);
      log("Migration complete: submitterName column added to teams table");
    } else {
      log("submitter_name column already exists in teams table");
    }
  } catch (error) {
    log(`Error in migration: ${error}`, "error");
    throw error;
  }
}

// server/migrations/add_team_selected_fees.ts
init_db();
import { sql as sql30 } from "drizzle-orm";
async function addTeamSelectedFees() {
  console.log("Starting migration to add selected_fee_ids and total_amount columns to teams table...");
  try {
    const tableInfo = await db.execute(sql30`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    const columns = tableInfo.rows.map((row) => row.column_name);
    if (!columns.includes("selected_fee_ids")) {
      await db.execute(sql30`
        ALTER TABLE teams
        ADD COLUMN selected_fee_ids TEXT
      `);
      console.log("Added selected_fee_ids column to teams table");
    }
    if (!columns.includes("total_amount")) {
      await db.execute(sql30`
        ALTER TABLE teams
        ADD COLUMN total_amount INTEGER
      `);
      console.log("Added total_amount column to teams table");
    }
    console.log("Migration complete: team selected fees columns added successfully");
    return true;
  } catch (error) {
    console.error("Error adding team selected fees columns:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  addTeamSelectedFees().then((success) => {
    console.log(`Team selected fees migration ${success ? "completed successfully" : "failed"}`);
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error("Unexpected error during migration:", error);
    process.exit(1);
  });
}

// server/migrations/add_payment_intent_id.ts
init_db();
import { sql as sql31 } from "drizzle-orm";
async function addPaymentIntentId() {
  console.log("Starting migration to add payment_intent_id column to teams table...");
  try {
    const tableInfo = await db.execute(sql31`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    const columns = tableInfo.rows.map((row) => row.column_name);
    if (!columns.includes("payment_intent_id")) {
      await db.execute(sql31`
        ALTER TABLE teams
        ADD COLUMN payment_intent_id TEXT
      `);
      console.log("Added payment_intent_id column to teams table");
    }
    if (!columns.includes("refund_date")) {
      await db.execute(sql31`
        ALTER TABLE teams
        ADD COLUMN refund_date TEXT
      `);
      console.log("Added refund_date column to teams table");
    }
    console.log("Migration complete: payment_intent_id and refund_date columns added successfully");
    return true;
  } catch (error) {
    console.error("Error adding payment_intent_id column:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  addPaymentIntentId().then(() => process.exit(0)).catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

// server/migrations/add_fee_type_columns.ts
init_db();
init_vite();
import { sql as sql32 } from "drizzle-orm";
async function addFeeTypeColumns() {
  log("Starting migration to add feeType and isRequired columns to event_fees table...");
  try {
    const hasColumns = await db.execute(sql32`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event_fees' 
      AND column_name IN ('fee_type', 'is_required')
    `);
    const existingColumns = hasColumns.rows.map((row) => row.column_name);
    if (!existingColumns.includes("fee_type")) {
      await db.execute(sql32`
        ALTER TABLE "event_fees" 
        ADD COLUMN "fee_type" text
      `);
      log("Added fee_type column to event_fees table");
      await db.execute(sql32`
        UPDATE "event_fees" 
        SET "fee_type" = 'registration'
      `);
      log("Set default fee type to 'registration' for existing fees");
    } else {
      log("fee_type column already exists in event_fees table");
    }
    if (!existingColumns.includes("is_required")) {
      await db.execute(sql32`
        ALTER TABLE "event_fees" 
        ADD COLUMN "is_required" boolean DEFAULT false
      `);
      log("Added is_required column to event_fees table");
      await db.execute(sql32`
        UPDATE "event_fees" 
        SET "is_required" = true
      `);
      log("Set is_required to true for existing fees");
    } else {
      log("is_required column already exists in event_fees table");
    }
    log("Migration complete: feeType and isRequired columns added successfully");
  } catch (error) {
    log(`Error in migration: ${error}`, "error");
    throw error;
  }
}

// server/migrations/add-is-archived-to-events.ts
init_db();
import { sql as sql33 } from "drizzle-orm";
async function addIsArchivedToEvents() {
  try {
    console.log("Starting migration to add isArchived to events table...");
    const result = await db.execute(sql33`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'is_archived';
    `);
    if (result.length === 0) {
      await db.execute(sql33`
        ALTER TABLE events
        ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
      `);
      console.log("is_archived column added to events table");
    } else {
      console.log("is_archived column already exists in events table");
    }
    console.log("Migration complete: isArchived field added successfully");
  } catch (error) {
    console.error("Error adding isArchived field to events table:", error);
    throw error;
  }
}

// server/migrations/add_club_name.ts
init_db();
import { sql as sql34 } from "drizzle-orm";
async function addClubNameToTeams() {
  console.log("Starting migration to add clubName to teams table...");
  try {
    const tableInfo = await db.execute(sql34`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams' AND column_name = 'club_name';
    `);
    if (!tableInfo.rowCount || tableInfo.rowCount === 0) {
      await db.execute(sql34`
        ALTER TABLE teams 
        ADD COLUMN IF NOT EXISTS club_name TEXT;
      `);
      console.log("club_name column added to teams table successfully");
    } else {
      console.log("club_name column already exists in teams table");
    }
    console.log("Migration complete: club_name field added successfully");
  } catch (error) {
    console.error("Error adding club_name to teams table:", error);
    throw error;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  addClubNameToTeams().then(() => process.exit(0)).catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

// server/migrations/add_card_details_to_teams.ts
init_db();
import { sql as sql35 } from "drizzle-orm";
async function addCardDetailsToTeams() {
  console.log("Starting migration to add card details columns to teams table...");
  try {
    const tableInfo = await db.execute(sql35`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
    `);
    const columns = tableInfo.rows.map((row) => row.column_name);
    if (!columns.includes("card_last_four")) {
      await db.execute(sql35`
        ALTER TABLE teams
        ADD COLUMN card_last_four TEXT
      `);
      console.log("Added card_last_four column to teams table");
    }
    if (!columns.includes("card_brand")) {
      await db.execute(sql35`
        ALTER TABLE teams
        ADD COLUMN card_brand TEXT
      `);
      console.log("Added card_brand column to teams table");
    }
    if (!columns.includes("payment_method_type")) {
      await db.execute(sql35`
        ALTER TABLE teams
        ADD COLUMN payment_method_type TEXT
      `);
      console.log("Added payment_method_type column to teams table");
    }
    if (!columns.includes("payment_error_code")) {
      await db.execute(sql35`
        ALTER TABLE teams
        ADD COLUMN payment_error_code TEXT
      `);
      console.log("Added payment_error_code column to teams table");
    }
    if (!columns.includes("payment_error_message")) {
      await db.execute(sql35`
        ALTER TABLE teams
        ADD COLUMN payment_error_message TEXT
      `);
      console.log("Added payment_error_message column to teams table");
    }
    if (!columns.includes("payment_date")) {
      await db.execute(sql35`
        ALTER TABLE teams
        ADD COLUMN payment_date TIMESTAMP
      `);
      console.log("Added payment_date column to teams table");
    }
    console.log("Migration complete: card details columns added successfully");
    return true;
  } catch (error) {
    console.error("Error adding card details columns:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  addCardDetailsToTeams().then(() => {
    console.log("Card details columns migration completed successfully");
    process.exit(0);
  }).catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

// server/migrations/add_scheduling_permissions.ts
init_db();
init_schema();
import { eq as eq48 } from "drizzle-orm";
async function addSchedulingPermissions() {
  console.log("Starting migration to add scheduling permissions to tournament admins...");
  try {
    const [tournamentAdminRole] = await db.select().from(roles).where(eq48(roles.name, "tournament_admin"));
    if (!tournamentAdminRole) {
      console.log("Tournament admin role not found");
      return;
    }
    const existingPermissions = await db.select({ permission: rolePermissions.permission }).from(rolePermissions).where(eq48(rolePermissions.roleId, tournamentAdminRole.id));
    const existingPermissionSet = new Set(existingPermissions.map((p) => p.permission));
    const schedulingPermissions = PERMISSION_GROUPS.SCHEDULING;
    const permissionsToAdd = schedulingPermissions.filter((p) => !existingPermissionSet.has(p));
    if (permissionsToAdd.length === 0) {
      console.log("All scheduling permissions already exist for tournament admin role");
      return;
    }
    await db.transaction(async (tx) => {
      for (const permission of permissionsToAdd) {
        await tx.insert(rolePermissions).values({
          roleId: tournamentAdminRole.id,
          permission,
          createdAt: /* @__PURE__ */ new Date()
        });
      }
    });
    console.log(`Added ${permissionsToAdd.length} new scheduling permissions to tournament admin role`);
  } catch (error) {
    console.error("Error adding scheduling permissions:", error);
  }
}

// server/migrations/add_clubs_table.ts
init_db();
import { sql as sql36 } from "drizzle-orm";
async function createClubsTable() {
  console.log("Starting migration to create clubs table...");
  try {
    const tableExists = await db.execute(sql36`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clubs'
      );
    `);
    if (tableExists.rows[0].exists) {
      console.log("clubs table already exists");
      return true;
    }
    await db.execute(sql36`
      CREATE TABLE clubs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("clubs table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating clubs table:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  createClubsTable().then(() => process.exit(0)).catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

// server/migrations/add_sort_order_to_brackets.ts
init_db();
import { sql as sql37 } from "drizzle-orm";
async function addSortOrderToBrackets() {
  console.log("Starting migration to add sort_order column to event_brackets table...");
  try {
    const tableInfo = await db.execute(sql37`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'event_brackets' AND column_name = 'sort_order'
    `);
    if (tableInfo.rows.length === 0) {
      await db.execute(sql37`
        ALTER TABLE event_brackets
        ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0
      `);
      console.log("Added sort_order column to event_brackets table");
      return true;
    } else {
      console.log("sort_order column already exists in event_brackets table");
      return true;
    }
  } catch (error) {
    console.error("Error adding sort_order column:", error);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  addSortOrderToBrackets().then(() => process.exit(0)).catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

// db/migrations/create_payment_transactions.ts
init_db();
import { sql as sql38 } from "drizzle-orm";
async function createPaymentTransactionsTable() {
  console.log("Starting migration to create payment_transactions table...");
  try {
    const tableExists = await db.execute(sql38`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_transactions'
      );
    `);
    if (tableExists.rows[0].exists) {
      console.log("payment_transactions table already exists");
      return true;
    }
    await db.execute(sql38`
      CREATE TABLE payment_transactions (
        id SERIAL PRIMARY KEY,
        team_id INTEGER,
        event_id BIGINT,
        user_id INTEGER,
        payment_intent_id TEXT,
        transaction_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        card_brand TEXT,
        card_last_four TEXT,
        payment_method_type TEXT,
        error_code TEXT,
        error_message TEXT,
        metadata JSONB,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    try {
      await db.execute(sql38`
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT payment_transactions_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id);
      `);
      console.log("Added team_id foreign key constraint");
    } catch (error) {
      console.warn("Could not add team_id foreign key constraint:", error);
    }
    try {
      await db.execute(sql38`
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT payment_transactions_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES events(id);
      `);
      console.log("Added event_id foreign key constraint");
    } catch (error) {
      console.warn("Could not add event_id foreign key constraint:", error);
    }
    try {
      await db.execute(sql38`
        ALTER TABLE payment_transactions 
        ADD CONSTRAINT payment_transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id);
      `);
      console.log("Added user_id foreign key constraint");
    } catch (error) {
      console.warn("Could not add user_id foreign key constraint:", error);
    }
    console.log("payment_transactions table created successfully");
    return true;
  } catch (error) {
    console.error("Error creating payment_transactions table:", error);
    return false;
  }
}

// server/migrations/add_admin_last_login.ts
init_db();
import { sql as sql39 } from "drizzle-orm";
async function addAdminLastLoginFields() {
  try {
    console.log("Starting migration to add admin last login fields...");
    const checkResult = await db.execute(sql39`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    const columns = checkResult.rows.map((row) => row.column_name);
    if (!columns.includes("last_login")) {
      await db.execute(sql39`
        ALTER TABLE users
        ADD COLUMN last_login TIMESTAMP
      `);
      console.log("Added last_login column to users table");
    } else {
      console.log("last_login column already exists");
    }
    if (!columns.includes("last_viewed_registrations")) {
      await db.execute(sql39`
        ALTER TABLE users
        ADD COLUMN last_viewed_registrations TIMESTAMP
      `);
      console.log("Added last_viewed_registrations column to users table");
    } else {
      console.log("last_viewed_registrations column already exists");
    }
    console.log("Migration complete: admin last login fields added successfully");
    return true;
  } catch (error) {
    console.error("Error adding admin last login fields:", error);
    throw error;
  }
}

// server/migrations/add_custom_domain_to_organization_settings.ts
init_db();
init_vite();
import { sql as sql40 } from "drizzle-orm";
async function addCustomDomainToOrganizationSettings() {
  try {
    log("Adding custom_domain column to organization_settings table...");
    const columnExists = await db.execute(sql40`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organization_settings' AND column_name = 'custom_domain'
    `);
    if (columnExists.length === 0) {
      await db.execute(sql40`
        ALTER TABLE organization_settings 
        ADD COLUMN custom_domain TEXT UNIQUE
      `);
      log("custom_domain column added successfully");
    } else {
      log("custom_domain column already exists");
    }
  } catch (error) {
    console.error("Error adding custom_domain column:", error);
    throw error;
  }
}

// server/create-tables.ts
async function createTables() {
  try {
    console.log("Starting database migrations...");
    await db.execute(sql41`
      CREATE TABLE IF NOT EXISTS event_form_templates (
        id SERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_fields (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES event_form_templates(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        required BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL,
        placeholder TEXT,
        help_text TEXT,
        validation JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_field_options (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        value TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_responses (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES event_form_templates(id),
        team_id INTEGER NOT NULL,
        responses JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS accounting_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_fees (
        id SERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        begin_date TIMESTAMP,
        end_date TIMESTAMP,
        apply_to_all BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
        amount INTEGER NOT NULL CHECK (amount > 0),
        expiration_date TIMESTAMP,
        description TEXT,
        event_id INTEGER,
        max_uses INTEGER CHECK (max_uses > 0),
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_settings (
        id SERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        setting_key TEXT NOT NULL,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Creating email templates table...");
    await createEmailTemplatesTable();
    console.log("Creating email template routing table...");
    await createEmailTemplateRoutingTable();
    console.log("Creating password reset tokens table...");
    await createPasswordResetTokensTable();
    console.log("Creating default email templates...");
    await createDefaultEmailTemplates();
    console.log("Adding providerId to email templates...");
    await addProviderIdToEmailTemplates();
    console.log("Creating role permissions table and default permissions...");
    await createRolePermissions();
    console.log("Updating division codes to new format...");
    await updateDivisionCodes();
    console.log("Adding team registration fields...");
    await addTeamRegistrationFields();
    console.log("Creating players table...");
    await createPlayersTable();
    console.log("Adding submitterEmail to teams table...");
    await addSubmitterEmailToTeams();
    console.log("Adding submitterName to teams table...");
    await addSubmitterNameToTeams();
    console.log("Adding team selected fees table...");
    await addTeamSelectedFees();
    console.log("Adding payment intent ID to teams table...");
    await addPaymentIntentId();
    console.log("Adding feeType and isRequired columns to event_fees table...");
    await addFeeTypeColumns();
    console.log("Adding isArchived column to events table...");
    await addIsArchivedToEvents();
    console.log("Adding clubName column to teams table...");
    await addClubNameToTeams();
    console.log("Adding card details columns to teams table...");
    await addCardDetailsToTeams();
    console.log("Adding scheduling permissions to tournament admins...");
    await addSchedulingPermissions();
    console.log("Adding sort_order column to event_brackets table...");
    await addSortOrderToBrackets();
    console.log("Creating payment transactions table...");
    await createPaymentTransactionsTable();
    console.log("Adding admin last login fields...");
    await addAdminLastLoginFields();
    console.log("Adding custom domain to organization settings...");
    await addCustomDomainToOrganizationSettings();
    console.log("Creating clubs table...");
    await createClubsTable();
    console.log("All tables created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error creating tables:", error);
    return { success: false, error };
  }
}
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables().then((result) => {
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  });
}

// server/index.ts
init_auth();
init_emulationService();

// server/utils/initStandardFolders.ts
async function initializeStandardFolders() {
  try {
    console.log("Initializing standard folder structure...");
    await ensureStandardFolders();
    console.log("Standard folder structure initialized successfully");
  } catch (error) {
    console.error("Failed to initialize standard folder structure:", error);
  }
}

// server/middleware/role-verification.ts
init_db();
init_schema();
import { eq as eq49, and as and29, count } from "drizzle-orm";
async function verifySuperAdminRoles() {
  try {
    console.log("Verifying super_admin role permissions...");
    const superAdminRoles = await db.select().from(roles).where(eq49(roles.name, "super_admin"));
    if (superAdminRoles.length === 0) {
      console.error("ERROR: super_admin role does not exist in the database!");
      return;
    }
    const superAdminRoleId = superAdminRoles[0].id;
    const permissionsCount = await db.select({ count: count() }).from(rolePermissions).where(eq49(rolePermissions.roleId, superAdminRoleId));
    const allPermissions = Object.values(PERMISSIONS).flat();
    const assignedUsers = await db.select({
      count: count()
    }).from(adminRoles).where(eq49(adminRoles.roleId, superAdminRoleId));
    console.log(`Found ${assignedUsers[0].count} users with super_admin role`);
    console.log(`Found ${permissionsCount[0].count} permissions assigned to super_admin role`);
    if (permissionsCount[0].count < allPermissions.length) {
      console.log("WARNING: super_admin role is missing some permissions, fixing...");
      await db.delete(rolePermissions).where(eq49(rolePermissions.roleId, superAdminRoleId));
      for (const permission of Object.values(PERMISSIONS).flat()) {
        await db.insert(rolePermissions).values({
          roleId: superAdminRoleId,
          permission
        }).onConflictDoNothing();
      }
      console.log("super_admin permissions fixed successfully");
    } else {
      console.log("super_admin role permissions verified \u2713");
    }
    const mainAdmin = await db.select().from(users).where(eq49(users.email, "bperdomo@zoho.com")).limit(1);
    if (mainAdmin.length === 0) {
      console.log("Main admin user not found - this is normal for some environments");
      return;
    }
    const adminRoleAssignment = await db.select().from(adminRoles).where(
      and29(
        eq49(adminRoles.userId, mainAdmin[0].id),
        eq49(adminRoles.roleId, superAdminRoleId)
      )
    );
    if (adminRoleAssignment.length === 0) {
      console.log("WARNING: Main admin missing super_admin role, fixing...");
      await db.insert(adminRoles).values({
        userId: mainAdmin[0].id,
        roleId: superAdminRoleId,
        createdAt: /* @__PURE__ */ new Date()
      });
      console.log("Main admin super_admin role assigned successfully");
    } else {
      console.log("Main admin super_admin role verified \u2713");
    }
  } catch (error) {
    console.error("Error verifying super_admin roles:", error);
  }
}
function logPermissionDetails(req, res, next) {
  const originalStatus = res.status;
  res.status = function(code) {
    if (code === 403 && req.user && req.isAuthenticated()) {
      console.log(`\u{1F510} Permission denied for user ${req.user.email} (ID: ${req.user.id})`);
      console.log(`Attempted to access: ${req.method} ${req.originalUrl}`);
      (async () => {
        try {
          const userId = req.user.id;
          const userRoles = await db.select({
            roleName: roles.name
          }).from(adminRoles).innerJoin(roles, eq49(adminRoles.roleId, roles.id)).where(eq49(adminRoles.userId, userId));
          console.log(`User roles: ${userRoles.map((r) => r.roleName).join(", ") || "none"}`);
          if (userRoles.some((r) => r.roleName === "super_admin")) {
            console.log("WARNING: User has super_admin role but was denied access - this indicates a permissions bug");
          }
        } catch (error) {
          console.error("Error checking user permissions:", error);
        }
      })();
    }
    return originalStatus.apply(res, [code]);
  };
  next();
}

// server/index.ts
var app = express5();
app.use(express5.json({ limit: "50mb" }));
app.use(express5.urlencoded({ extended: false, limit: "50mb" }));
app.use("/uploads", express5.static(path11.join(process.cwd(), "uploads")));
app.use("/api/files", upload_default);
app.get("/_health", (req, res) => {
  res.status(200).send("OK");
});
app.use((req, res, next) => {
  const start = Date.now();
  const path12 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path12.startsWith("/api")) {
      let logLine = `${req.method} ${path12} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function testDbConnection() {
  try {
    await db.select().from(users).limit(1);
    log("Database connection successful");
    return true;
  } catch (error) {
    log("Database connection failed: " + error.message);
    return false;
  }
}
(async () => {
  let server;
  try {
    const nodeEnv = process.env.NODE_ENV || "development";
    app.set("env", nodeEnv);
    log(`Server starting in ${nodeEnv} mode`);
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
      log("Database connection failed - retrying in 5 seconds...");
      setTimeout(() => testDbConnection(), 5e3);
      return;
    }
    const migrationsResult = await createTables();
    if (!migrationsResult.success) {
      log("Migration failed: " + migrationsResult.error + " - retrying in 5 seconds...");
      setTimeout(() => createTables(), 5e3);
      return;
    }
    log("Database migrations completed successfully");
    await createAdmin();
    log("Admin user setup completed");
    await verifySuperAdminRoles();
    await initializeStandardFolders();
    const PORT = Number(process.env.PORT) || 5e3;
    setupAuth(app);
    log("Authentication middleware set up successfully");
    app.use(emulationMiddleware);
    log("User emulation middleware set up successfully");
    app.use(logPermissionDetails);
    log("Permission logging middleware set up successfully");
    const routes = registerRoutes(app);
    log("API routes registered");
    if (nodeEnv === "production") {
      try {
        serveStatic(app);
        log("Static file serving configured for production");
      } catch (error) {
        log("Production files not found, using development mode with stable configuration");
        const { createServer: createServer2 } = await import("http");
        server = createServer2(app);
        await setupVite(app, server);
        log("Development mode configured for production stability");
      }
    } else {
      const { createServer: createServer2 } = await import("http");
      server = createServer2(app);
      await setupVite(app, server);
      log("Vite middleware setup complete for development");
    }
    app.use((err, _req, res, _next) => {
      log("Error encountered: " + err.message);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    const HOST = process.env.HOST || "0.0.0.0";
    const findAvailablePort = async (startPort) => {
      return new Promise((resolve, reject) => {
        const tryPort = async (port) => {
          const { createServer: createServer2 } = await import("http");
          const tempServer = createServer2();
          tempServer.listen(port, "0.0.0.0").on("listening", () => {
            tempServer.close(() => resolve(port));
          }).on("error", (err) => {
            if (err.code === "EADDRINUSE") {
              log(`Port ${port} is busy, trying ${port + 1}`);
              tryPort(port + 1);
            } else {
              reject(err);
            }
          });
        };
        tryPort(startPort);
      });
    };
    try {
      const availablePort = await findAvailablePort(PORT);
      if (nodeEnv === "production") {
        const { createServer: createServer2 } = await import("http");
        server = createServer2(app);
      }
      server.listen(availablePort, HOST, () => {
        log(`Server started successfully on ${HOST}:${availablePort}`);
      });
    } catch (error) {
      log(`Error starting server: ${error.message}`);
      process.exit(1);
    }
    process.on("SIGTERM", () => {
      log("SIGTERM received. Shutting down gracefully");
      server.close(() => {
        log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    log("Failed to start server: " + error.message);
    process.exit(1);
  }
})();
