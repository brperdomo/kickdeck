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
  eventComplexes: () => eventComplexes,
  eventFees: () => eventFees,
  eventFeesRelations: () => eventFeesRelations,
  eventFieldSizes: () => eventFieldSizes,
  eventFormTemplates: () => eventFormTemplates,
  eventFormTemplatesRelations: () => eventFormTemplatesRelations,
  eventScoringRules: () => eventScoringRules,
  eventSettings: () => eventSettings,
  events: () => events,
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
  insertComplexSchema: () => insertComplexSchema,
  insertCouponSchema: () => insertCouponSchema,
  insertEmailProviderSettingsSchema: () => insertEmailProviderSettingsSchema,
  insertEmailTemplateRoutingSchema: () => insertEmailTemplateRoutingSchema,
  insertEventAdministratorSchema: () => insertEventAdministratorSchema,
  insertEventAgeGroupFeeSchema: () => insertEventAgeGroupFeeSchema,
  insertEventAgeGroupSchema: () => insertEventAgeGroupSchema,
  insertEventFeeSchema: () => insertEventFeeSchema,
  insertEventFormTemplateSchema: () => insertEventFormTemplateSchema,
  insertEventSchema: () => insertEventSchema,
  insertEventScoringRuleSchema: () => insertEventScoringRuleSchema,
  insertEventSettingSchema: () => insertEventSettingSchema,
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
  insertRoleSchema: () => insertRoleSchema,
  insertSeasonalScopeSchema: () => insertSeasonalScopeSchema,
  insertTeamSchema: () => insertTeamSchema,
  insertTournamentGroupSchema: () => insertTournamentGroupSchema,
  insertUpdateSchema: () => insertUpdateSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  organizationSettings: () => organizationSettings,
  roles: () => roles,
  seasonalScopes: () => seasonalScopes,
  seasonalScopesRelations: () => seasonalScopesRelations,
  selectAccountingCodeSchema: () => selectAccountingCodeSchema,
  selectAdminRoleSchema: () => selectAdminRoleSchema,
  selectAgeGroupSettingSchema: () => selectAgeGroupSettingSchema,
  selectChatParticipantSchema: () => selectChatParticipantSchema,
  selectChatRoomSchema: () => selectChatRoomSchema,
  selectComplexSchema: () => selectComplexSchema,
  selectCouponSchema: () => selectCouponSchema,
  selectEmailProviderSettingsSchema: () => selectEmailProviderSettingsSchema,
  selectEmailTemplateRoutingSchema: () => selectEmailTemplateRoutingSchema,
  selectEventAdministratorSchema: () => selectEventAdministratorSchema,
  selectEventAgeGroupFeeSchema: () => selectEventAgeGroupFeeSchema,
  selectEventFeeSchema: () => selectEventFeeSchema,
  selectEventFormTemplateSchema: () => selectEventFormTemplateSchema,
  selectEventScoringRuleSchema: () => selectEventScoringRuleSchema,
  selectEventSettingSchema: () => selectEventSettingSchema,
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
  selectRoleSchema: () => selectRoleSchema,
  selectSeasonalScopeSchema: () => selectSeasonalScopeSchema,
  selectTeamSchema: () => selectTeamSchema,
  selectTournamentGroupSchema: () => selectTournamentGroupSchema,
  selectUpdateSchema: () => selectUpdateSchema,
  selectUserSchema: () => selectUserSchema,
  teams: () => teams,
  tournamentGroups: () => tournamentGroups,
  updates: () => updates,
  users: () => users
});
import { pgTable, text, serial, boolean, jsonb, timestamp, integer, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
var organizationSettings, users, households, complexes, fields, passwordSchema, insertOrganizationSettingsSchema, selectOrganizationSettingsSchema, insertUserSchema, insertHouseholdSchema, insertComplexSchema, selectComplexSchema, selectUserSchema, selectHouseholdSchema, insertFieldSchema, selectFieldSchema, events, eventAgeGroups, insertEventAgeGroupSchema, insertEventSchema, gameTimeSlots, tournamentGroups, teams, games, insertGameTimeSlotSchema, insertTournamentGroupSchema, insertTeamSchema, insertGameSchema, selectGameTimeSlotSchema, selectTournamentGroupSchema, selectTeamSchema, selectGameSchema, eventComplexes, eventFieldSizes, eventScoringRules, insertEventScoringRuleSchema, selectEventScoringRuleSchema, eventAdministrators, eventSettings, insertEventAdministratorSchema, insertEventSettingSchema, selectEventAdministratorSchema, selectEventSettingSchema, chatRooms, chatParticipants, messages, insertChatRoomSchema, insertMessageSchema, insertChatParticipantSchema, selectChatRoomSchema, selectMessageSchema, selectChatParticipantSchema, householdInvitations, insertHouseholdInvitationSchema, selectHouseholdInvitationSchema, roles, files, folders, foldersRelations, filesRelations, insertFileSchema, insertFolderSchema, selectFileSchema, selectFolderSchema, seasonalScopes, ageGroupSettings, seasonalScopesRelations, ageGroupSettingsRelations, insertSeasonalScopeSchema, insertAgeGroupSettingSchema, selectSeasonalScopeSchema, selectAgeGroupSettingSchema, adminRoles, insertRoleSchema, selectRoleSchema, adminRolesRelations, insertAdminRoleSchema, selectAdminRoleSchema, adminFormSchema, updates, insertUpdateSchema, selectUpdateSchema, eventFees, eventAgeGroupFees, eventFeesRelations, eventAgeGroupFeesRelations, insertEventFeeSchema, insertEventAgeGroupFeeSchema, selectEventFeeSchema, selectEventAgeGroupFeeSchema, accountingCodes, insertAccountingCodeSchema, selectAccountingCodeSchema, coupons, insertCouponSchema, selectCouponSchema, eventFormTemplates, formFields, formFieldOptions, formResponses, insertEventFormTemplateSchema, insertFormFieldSchema, insertFormFieldOptionSchema, insertFormResponseSchema, selectEventFormTemplateSchema, selectFormFieldSchema, selectFormFieldOptionSchema, selectFormResponseSchema, eventFormTemplatesRelations, formFieldsRelations, formFieldOptionsRelations, formResponsesRelations, emailProviderSettings, insertEmailProviderSettingsSchema, selectEmailProviderSettingsSchema, emailTemplateRouting, insertEmailTemplateRoutingSchema, selectEmailTemplateRoutingSchema, emailTemplateRoutingRelations, emailTemplates, emailTemplatesRelations;
var init_schema = __esm({
  "db/schema.ts"() {
    "use strict";
    organizationSettings = pgTable("organization_settings", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      domain: text("domain").unique(),
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
      householdId: serial("householdId").references(() => households.id)
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
      specialInstructions: text("special_instructions"),
      complexId: serial("complex_id").references(() => complexes.id),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString()),
      updatedAt: text("updated_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
    });
    passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(/[0-9]/, "Password must contain at least one number").regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");
    insertOrganizationSettingsSchema = createInsertSchema(organizationSettings, {
      name: z.string().min(1, "Organization name is required"),
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
      specialInstructions: z.string().optional(),
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
      divisionCode: text("division_code")
    });
    insertEventAgeGroupSchema = createInsertSchema(eventAgeGroups, {
      ageGroup: z.string().min(1, "Age group is required"),
      birthYear: z.number().int("Birth year must be a valid year"),
      gender: z.enum(["Boys", "Girls"], "Gender must be either Boys or Girls"),
      divisionCode: z.string().min(1, "Division code is required"),
      projectedTeams: z.number().int().min(0, "Projected teams must be 0 or greater").optional(),
      fieldSize: z.string().min(1, "Field size is required"),
      amountDue: z.number().int().min(0, "Amount due must be 0 or greater").optional(),
      scoringRule: z.string().optional(),
      birth_date_start: z.string().optional()
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
      name: text("name").notNull(),
      coach: text("coach"),
      managerName: text("manager_name"),
      managerPhone: text("manager_phone"),
      managerEmail: text("manager_email"),
      seedRanking: integer("seed_ranking"),
      createdAt: text("created_at").notNull().default((/* @__PURE__ */ new Date()).toISOString())
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
    insertGameTimeSlotSchema = createInsertSchema(gameTimeSlots);
    insertTournamentGroupSchema = createInsertSchema(tournamentGroups);
    insertTeamSchema = createInsertSchema(teams);
    insertGameSchema = createInsertSchema(games, {
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
      duration: z.number().min(20).max(120),
      breakTime: z.number().min(0).max(30)
    });
    selectGameTimeSlotSchema = createSelectSchema(gameTimeSlots);
    selectTournamentGroupSchema = createSelectSchema(tournamentGroups);
    selectTeamSchema = createSelectSchema(teams);
    selectGameSchema = createSelectSchema(games);
    eventComplexes = pgTable("event_complexes", {
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
      adminType: text("admin_type").notNull().default("super_admin"),
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
      adminType: z.enum(["super_admin", "tournament_admin", "score_admin", "finance_admin"]).default("super_admin"),
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
      isActive: z.boolean()
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
      eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: "cascade" }),
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

// db/schema/emailTemplates.ts
import { pgTable as pgTable2, serial as serial2, text as text2, timestamp as timestamp2, boolean as boolean2, json } from "drizzle-orm/pg-core";
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
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow()
    });
    insertEmailTemplateSchema = createInsertSchema2(emailTemplates2);
    selectEmailTemplateSchema = createSelectSchema2(emailTemplates2);
  }
});

// server/routes/email-templates.ts
var email_templates_exports = {};
__export(email_templates_exports, {
  createEmailTemplate: () => createEmailTemplate,
  deleteEmailTemplate: () => deleteEmailTemplate,
  getEmailTemplates: () => getEmailTemplates,
  previewEmailTemplate: () => previewEmailTemplate,
  updateEmailTemplate: () => updateEmailTemplate
});
import { eq as eq11 } from "drizzle-orm";
async function getEmailTemplates(req, res) {
  try {
    const templates = await db.select().from(emailTemplates2);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({ error: "Failed to fetch email templates" });
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
      variables
    } = req.body;
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [template] = await db.insert(emailTemplates2).values({
      name,
      description,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive: isActive ?? true,
      variables,
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
      variables
    } = req.body;
    if (!name || !type || !subject || !content || !senderName || !senderEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [template] = await db.update(emailTemplates2).set({
      name,
      description,
      type,
      subject,
      content,
      senderName,
      senderEmail,
      isActive,
      variables,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq11(emailTemplates2.id, parseInt(id))).returning();
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
    const templateData = JSON.parse(req.query.template);
    let content = templateData.content || "";
    const defaultValues = {
      firstName: "[Sample First Name]",
      lastName: "[Sample Last Name]",
      email: "[sample@email.com]",
      username: "[Sample Username]",
      resetLink: "[Reset Password Link]"
    };
    Object.entries(defaultValues).forEach(([variable, sampleValue]) => {
      const regex = new RegExp(`{{${variable}}}`, "g");
      content = content.replace(regex, sampleValue);
    });
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
    const [template] = await db.delete(emailTemplates2).where(eq11(emailTemplates2.id, parseInt(id))).returning();
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

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
init_schema();
init_db();
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, or } from "drizzle-orm";

// server/crypto.ts
import { randomBytes } from "crypto";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
var generateEventId = () => {
  const min = 1e9;
  const max = 2147483647;
  const buffer = randomBytes(4);
  const value = buffer.readUInt32BE(0);
  return min + value % (max - min);
};
var crypto = {
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
  generateEventId
};

// server/auth.ts
function setupAuth(app2) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings = {
    secret: process.env.REPL_ID || "soccer-registration-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 864e5
    })
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true
    };
  }
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(or(eq(users.email, email), eq(users.username, email))).limit(1);
        if (!user) {
          return done(null, false, { message: "Incorrect email or username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send("Invalid input: " + result.error.issues.map((i) => i.message).join(", "));
      }
      const { username, password, firstName, lastName, email, phone, isParent } = result.data;
      const [existingUser] = await db.select().from(users).where(or(eq(users.email, email), eq(users.username, username))).limit(1);
      if (existingUser) {
        return res.status(400).send("User with this email or username already exists");
      }
      const hashedPassword = await crypto.hash(password);
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
      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: newUser
        });
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }
      req.logIn(user, (err2) => {
        if (err2) {
          return next(err2);
        }
        return res.json({
          message: "Login successful",
          user
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
  app2.get("/api/check-email", async (req, res) => {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send("Email is required");
    }
    try {
      const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking email availability:", error);
      return res.status(500).send("Error checking email availability");
    }
  });
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
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

// server/vite.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
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

// server/routes.ts
init_db();

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
  ageGroups: z2.array(ageGroupSettingsSchema)
});
router.get("/", async (req, res) => {
  try {
    const scopes = await db.query.seasonalScopes.findMany({
      with: {
        ageGroups: true
      }
    });
    res.json(scopes);
  } catch (error) {
    console.error("Error fetching seasonal scopes:", error);
    res.status(500).json({ error: "Failed to fetch seasonal scopes" });
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
        isActive: validatedData.isActive
      }).returning();
      const ageGroupsWithScopeId = validatedData.ageGroups.map((group) => ({
        ...group,
        seasonalScopeId: newScope.id
      }));
      await tx.insert(ageGroupSettings).values(ageGroupsWithScopeId);
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
        isActive: validatedData.isActive
      }).where(eq2(seasonalScopes.id, parseInt(id)));
      await tx.delete(ageGroupSettings).where(eq2(ageGroupSettings.seasonalScopeId, parseInt(id)));
      const ageGroupsWithScopeId = validatedData.ageGroups.map((group) => ({
        ...group,
        seasonalScopeId: parseInt(id)
      }));
      await tx.insert(ageGroupSettings).values(ageGroupsWithScopeId);
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
    const safeFileName = `${baseName}${ext}`.replace(/[^a-zA-Z0-9-_.]/g, "_");
    if (fs2.existsSync(path3.join(uploadsDir, safeFileName))) {
      cb(new Error("File already exists"), "");
      return;
    }
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
      if (err.message === "File already exists") {
        return res.status(409).json({ error: "A file with this name already exists" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
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

// server/routes/admin/accounting-codes.ts
init_db();
init_schema();
import { eq as eq3 } from "drizzle-orm";
import { Router as Router3 } from "express";

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
var validateAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// server/routes/admin/accounting-codes.ts
var router3 = Router3();
router3.get("/", authenticateAdmin, async (req, res) => {
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
router3.post("/", authenticateAdmin, async (req, res) => {
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
router3.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertAccountingCodeSchema.parse(req.body);
    const updatedCode = await db.update(accountingCodes).set({
      ...validatedData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(accountingCodes.id, parseInt(id))).returning();
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
router3.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCode = await db.delete(accountingCodes).where(eq3(accountingCodes.id, parseInt(id))).returning();
    if (deletedCode.length === 0) {
      return res.status(404).json({ message: "Accounting code not found" });
    }
    res.json({ message: "Accounting code deleted successfully" });
  } catch (error) {
    console.error("Error deleting accounting code:", error);
    res.status(500).json({ message: "Failed to delete accounting code" });
  }
});
var accounting_codes_default = router3;

// server/routes/admin/fees.ts
init_db();
init_schema();
import { Router as Router4 } from "express";
import { eq as eq4 } from "drizzle-orm";
var router4 = Router4();
router4.get("/:eventId/fees", authenticateAdmin, async (req, res) => {
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
      createdAt: eventFees.createdAt,
      updatedAt: eventFees.updatedAt
    }).from(eventFees).where(eq4(eventFees.eventId, BigInt(eventId))).orderBy(eventFees.createdAt);
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
router4.post("/:eventId/fees", authenticateAdmin, async (req, res) => {
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
router4.patch("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    console.log("Updating fee:", feeId, "for event:", eventId, "with data:", req.body);
    const updatedFee = await db.update(eventFees).set({
      ...req.body,
      eventId: BigInt(eventId),
      beginDate: req.body.beginDate ? new Date(req.body.beginDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(eventFees.id, parseInt(feeId))).returning();
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
router4.delete("/:eventId/fees/:feeId", authenticateAdmin, async (req, res) => {
  try {
    const { eventId, feeId } = req.params;
    console.log("Deleting fee:", feeId, "from event:", eventId);
    const deletedFee = await db.delete(eventFees).where(eq4(eventFees.id, parseInt(feeId))).returning();
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
var fees_default = router4;

// server/routes/admin/events.ts
init_db();
init_schema();
import { Router as Router5 } from "express";
import { eq as eq5, sql } from "drizzle-orm";
var router5 = Router5();
router5.get("/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await db.select().from(events).where(eq5(events.id, BigInt(eventId))).limit(1);
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
      eq5(eventAgeGroups.id, eventAgeGroupFees.ageGroupId)
    ).where(eq5(eventAgeGroups.eventId, eventId));
    const complexAssignments = await db.select().from(eventComplexes).where(eq5(eventComplexes.eventId, eventId));
    const fieldSizes = await db.select().from(eventFieldSizes).where(eq5(eventFieldSizes.eventId, eventId));
    const scoringRules = await db.select().from(eventScoringRules).where(eq5(eventScoringRules.eventId, eventId));
    const fees = await db.select().from(eventFees).where(eq5(eventFees.eventId, BigInt(eventId)));
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
router5.delete("/:id", async (req, res) => {
  try {
    const eventId = BigInt(req.params.id);
    console.log("Starting event deletion for ID:", eventId);
    await db.transaction(async (tx) => {
      await tx.delete(coupons).where(eq5(coupons.eventId, eventId)).execute();
      console.log("Deleted coupons");
      await tx.delete(eventAgeGroupFees).where(
        eq5(
          eventAgeGroupFees.ageGroupId,
          sql`(SELECT id FROM event_age_groups WHERE event_id = ${eventId.toString()})`
        )
      ).execute();
      console.log("Deleted fee assignments");
      await tx.delete(eventFees).where(eq5(eventFees.eventId, eventId)).execute();
      console.log("Deleted event fees");
      await tx.delete(eventAgeGroups).where(eq5(eventAgeGroups.eventId, eventId.toString())).execute();
      console.log("Deleted event age groups");
      await tx.delete(eventComplexes).where(eq5(eventComplexes.eventId, eventId.toString())).execute();
      console.log("Deleted event complexes");
      await tx.delete(eventFieldSizes).where(eq5(eventFieldSizes.eventId, eventId.toString())).execute();
      console.log("Deleted event field sizes");
      await tx.delete(eventScoringRules).where(eq5(eventScoringRules.eventId, eventId.toString())).execute();
      console.log("Deleted event scoring rules");
      const [deletedEvent] = await tx.delete(events).where(eq5(events.id, eventId)).returning();
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
var events_default = router5;

// server/routes/admin/age-groups.ts
init_db();
init_schema();
import { Router as Router6 } from "express";
import { eq as eq6, sql as sql2 } from "drizzle-orm";
var router6 = Router6();
router6.get("/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`Fetching age groups for event ${eventId}`);
    const groups = await db.select().from(eventAgeGroups).where(eq6(eventAgeGroups.eventId, eventId));
    console.log(`Found ${groups.length} age groups`);
    res.json(groups);
  } catch (error) {
    console.error("Error fetching age groups:", error);
    res.status(500).json({ error: "Failed to fetch age groups" });
  }
});
router6.post("/cleanup/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const allAgeGroups = await db.select().from(eventAgeGroups).where(eq6(eventAgeGroups.eventId, eventId));
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
            await tx.execute(sql2`
              UPDATE teams 
              SET age_group_id = ${keptGroup.id} 
              WHERE age_group_id = ${duplicate.id}
            `);
          }
        }
        await tx.delete(eventAgeGroups).where(sql2`id = ANY(${deletedGroupIds})`);
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
var age_groups_default = router6;

// server/routes/folders.ts
init_db();
init_schema();
import { Router as Router7 } from "express";
import { eq as eq7, isNull, asc } from "drizzle-orm";
var router7 = Router7();
router7.get("/", async (req, res) => {
  try {
    const { parentId } = req.query;
    let foldersList;
    if (parentId === "root") {
      foldersList = await db.select().from(folders).where(isNull(folders.parentId)).orderBy(asc(folders.name));
    } else if (parentId) {
      foldersList = await db.select().from(folders).where(eq7(folders.parentId, parentId)).orderBy(asc(folders.name));
    } else {
      foldersList = await db.select().from(folders).orderBy(asc(folders.name));
    }
    res.json(foldersList);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});
router7.get("/:folderId/breadcrumb", async (req, res) => {
  try {
    const { folderId } = req.params;
    const breadcrumb = [];
    let currentFolderId = folderId;
    while (currentFolderId) {
      const [currentFolder] = await db.select().from(folders).where(eq7(folders.id, currentFolderId)).limit(1);
      if (!currentFolder) break;
      breadcrumb.unshift(currentFolder);
      currentFolderId = currentFolder.parentId;
    }
    res.json(breadcrumb);
  } catch (error) {
    console.error("Error fetching folder breadcrumb:", error);
    res.status(500).json({ error: "Failed to fetch folder breadcrumb" });
  }
});
router7.post("/", validateAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Folder name is required" });
    }
    const folderId = Math.random().toString(36).substring(2, 15);
    const newFolder = await db.insert(folders).values({
      id: folderId,
      name,
      parentId: parentId || null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    res.status(201).json(newFolder[0]);
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});
router7.delete("/:folderId", validateAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    const [folder] = await db.select().from(folders).where(eq7(folders.id, folderId)).limit(1);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    const folderFiles = await db.select().from(files).where(eq7(files.folderId, folderId));
    if (folderFiles.length > 0) {
      return res.status(400).json({
        error: "Cannot delete folder containing files. Please move or delete the files first."
      });
    }
    const subfolders = await db.select().from(folders).where(eq7(folders.parentId, folderId));
    if (subfolders.length > 0) {
      return res.status(400).json({
        error: "Cannot delete folder containing subfolders. Please delete the subfolders first."
      });
    }
    await db.delete(folders).where(eq7(folders.id, folderId));
    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});
router7.patch("/:folderId/rename", validateAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Folder name is required" });
    }
    const [folder] = await db.select().from(folders).where(eq7(folders.id, folderId)).limit(1);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    const updatedFolder = await db.update(folders).set({
      name,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(folders.id, folderId)).returning();
    res.status(200).json(updatedFolder[0]);
  } catch (error) {
    console.error("Error renaming folder:", error);
    res.status(500).json({ error: "Failed to rename folder" });
  }
});
router7.patch("/:folderId/move", validateAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { targetFolderId } = req.body;
    const [folder] = await db.select().from(folders).where(eq7(folders.id, folderId)).limit(1);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    if (targetFolderId) {
      const [targetFolder] = await db.select().from(folders).where(eq7(folders.id, targetFolderId)).limit(1);
      if (!targetFolder) {
        return res.status(404).json({ error: "Target folder not found" });
      }
      if (folderId === targetFolderId) {
        return res.status(400).json({ error: "Cannot move a folder into itself" });
      }
    }
    const updatedFolder = await db.update(folders).set({
      parentId: targetFolderId || null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(folders.id, folderId)).returning();
    res.status(200).json(updatedFolder[0]);
  } catch (error) {
    console.error("Error moving folder:", error);
    res.status(500).json({ error: "Failed to move folder" });
  }
});
var folders_default = router7;

// server/routes/admin/organizations.ts
init_db();
init_schema();
import { Router as Router8 } from "express";
import { eq as eq8 } from "drizzle-orm";
var router8 = Router8();
router8.get("/", async (req, res) => {
  try {
    const organizations = await db.select().from(organizationSettings).orderBy(organizationSettings.name);
    res.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).send("Failed to fetch organizations");
  }
});
router8.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [organization] = await db.select().from(organizationSettings).where(eq8(organizationSettings.id, id)).limit(1);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    res.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).send("Failed to fetch organization");
  }
});
router8.post("/", async (req, res) => {
  try {
    const { name, domain, primaryColor, secondaryColor, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }
    if (domain) {
      const [existingOrg] = await db.select().from(organizationSettings).where(eq8(organizationSettings.domain, domain)).limit(1);
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
router8.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, domain, primaryColor, secondaryColor, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Organization name is required" });
    }
    const [existingOrg] = await db.select().from(organizationSettings).where(eq8(organizationSettings.id, id)).limit(1);
    if (!existingOrg) {
      return res.status(404).json({ error: "Organization not found" });
    }
    if (domain && domain !== existingOrg.domain) {
      const [domainExists] = await db.select().from(organizationSettings).where(eq8(organizationSettings.domain, domain)).limit(1);
      if (domainExists) {
        return res.status(400).json({ error: "Domain is already in use" });
      }
    }
    const [updatedOrg] = await db.update(organizationSettings).set({
      name,
      domain,
      primaryColor: primaryColor || existingOrg.primaryColor,
      secondaryColor: secondaryColor || existingOrg.secondaryColor,
      logoUrl: logoUrl || existingOrg.logoUrl,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq8(organizationSettings.id, id)).returning();
    res.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).send("Failed to update organization");
  }
});
router8.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existingOrg] = await db.select().from(organizationSettings).where(eq8(organizationSettings.id, id)).limit(1);
    if (!existingOrg) {
      return res.status(404).json({ error: "Organization not found" });
    }
    await db.delete(organizationSettings).where(eq8(organizationSettings.id, id));
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).send("Failed to delete organization");
  }
});
var organizations_default = router8;

// server/routes/admin/email-providers.ts
init_db();
init_schema();
import { Router as Router9 } from "express";
import { eq as eq9 } from "drizzle-orm";
import * as nodemailer from "nodemailer";
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error("Email provider error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  });
};
var router9 = Router9();
router9.post("/test-connection", asyncHandler(async (req, res) => {
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
router9.get("/", asyncHandler(async (req, res) => {
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
router9.post("/", asyncHandler(async (req, res) => {
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
      await db.update(emailProviderSettings).set({ isDefault: false }).where(eq9(emailProviderSettings.isDefault, true));
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
router9.patch("/:id", asyncHandler(async (req, res) => {
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
    const [existingProvider] = await db.select().from(emailProviderSettings).where(eq9(emailProviderSettings.id, id)).limit(1);
    if (!existingProvider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    if (isDefault && !existingProvider.isDefault) {
      await db.update(emailProviderSettings).set({ isDefault: false }).where(eq9(emailProviderSettings.isDefault, true));
    }
    const [updatedProvider] = await db.update(emailProviderSettings).set({
      providerType,
      providerName,
      settings,
      isActive,
      isDefault,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(eq9(emailProviderSettings.id, id)).returning();
    console.log("Updated provider:", updatedProvider.id);
    res.json(updatedProvider);
  } catch (error) {
    console.error("Error updating email provider:", error);
    throw error;
  }
}));
router9.delete("/:id", asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid provider ID" });
  }
  try {
    const [provider] = await db.delete(emailProviderSettings).where(eq9(emailProviderSettings.id, id)).returning();
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
var email_providers_default = router9;

// server/routes/admin/email-template-routings.ts
init_db();
init_schema();
import { Router as Router10 } from "express";
import { eq as eq10 } from "drizzle-orm";
var router10 = Router10();
var asyncHandler2 = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error("Email template routing error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  });
};
router10.get("/", asyncHandler2(async (req, res) => {
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
router10.post("/", asyncHandler2(async (req, res) => {
  const { templateType, providerId, fromEmail, fromName, isActive } = req.body;
  if (!templateType || !providerId || !fromEmail || !fromName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [provider] = await db.select().from(emailProviderSettings).where(eq10(emailProviderSettings.id, parseInt(providerId))).limit(1);
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    const [existingRouting] = await db.select().from(emailTemplateRouting).where(eq10(emailTemplateRouting.templateType, templateType)).limit(1);
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
router10.patch("/:id", asyncHandler2(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid routing ID" });
  }
  const { templateType, providerId, fromEmail, fromName, isActive } = req.body;
  if (!templateType || !providerId || !fromEmail || !fromName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [existingRouting] = await db.select().from(emailTemplateRouting).where(eq10(emailTemplateRouting.id, id)).limit(1);
    if (!existingRouting) {
      return res.status(404).json({ error: "Routing not found" });
    }
    const [provider] = await db.select().from(emailProviderSettings).where(eq10(emailProviderSettings.id, parseInt(providerId))).limit(1);
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
    }).where(eq10(emailTemplateRouting.id, id)).returning();
    console.log("Updated routing:", routing.id);
    res.json(routing);
  } catch (error) {
    console.error("Error updating email template routing:", error);
    throw error;
  }
}));
router10.delete("/:id", asyncHandler2(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid routing ID" });
  }
  try {
    const [routing] = await db.delete(emailTemplateRouting).where(eq10(emailTemplateRouting.id, id)).returning();
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
var email_template_routings_default = router10;

// server/routes/coupons.ts
init_db();
import { sql as sql3 } from "drizzle-orm";
import { z as z3 } from "zod";
var couponSchema = z3.object({
  code: z3.string().min(1, "Code is required"),
  discountType: z3.enum(["percentage", "fixed"]),
  amount: z3.coerce.number().min(0, "Amount must be 0 or greater"),
  expirationDate: z3.string().nullable().optional().transform((val) => val ? new Date(val).toISOString() : null),
  description: z3.string().nullable().optional(),
  eventId: z3.union([z3.coerce.number().positive(), z3.null()]).optional(),
  maxUses: z3.coerce.number().positive("Max uses must be positive").nullable().optional(),
  isActive: z3.boolean().default(true)
});
async function createCoupon(req, res) {
  try {
    const validatedData = couponSchema.parse(req.body);
    const eventIdToUse = validatedData.eventId || null;
    const existingCoupon = await db.execute(sql3`
      SELECT id FROM coupons 
      WHERE LOWER(code) = LOWER(${validatedData.code})
      AND (expiration_date IS NULL OR expiration_date > NOW())
      AND is_active = true
    `);
    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({
        error: "Coupon code already exists",
        code: "DUPLICATE_CODE"
      });
    }
    const result = await db.execute(sql3`
      INSERT INTO coupons (
        code,
        discount_type,
        amount,
        expiration_date,
        description,
        event_id,
        max_uses,
        is_active
      ) VALUES (
        ${validatedData.code},
        ${validatedData.discountType},
        ${validatedData.amount},
        ${validatedData.expirationDate ? new Date(validatedData.expirationDate) : null},
        ${validatedData.description || null},
        ${validatedData.eventId || null},
        ${validatedData.maxUses || null},
        ${validatedData.isActive}
      ) RETURNING *;
    `);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating coupon:", error);
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to create coupon" });
  }
}
async function getCoupons(req, res) {
  try {
    const eventId = req.query.eventId;
    let query;
    if (!eventId) {
      query = sql3`SELECT * FROM coupons`;
    } else {
      const numericEventId = parseInt(eventId, 10);
      if (isNaN(numericEventId)) {
        return res.status(400).json({ error: "Invalid event ID format" });
      }
      query = sql3`SELECT * FROM coupons WHERE event_id = ${numericEventId}`;
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
    const result = await db.execute(sql3`
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
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Failed to update coupon" });
  }
}
async function deleteCoupon(req, res) {
  try {
    const { id } = req.params;
    const result = await db.execute(sql3`
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

// server/routes.ts
init_schema();
import { sql as sql4, eq as eq12, and as and3, or as or2, inArray } from "drizzle-orm";
import fs3 from "fs/promises";
import path4 from "path";

// server/websocket.ts
init_db();
init_schema();
import { WebSocket, WebSocketServer } from "ws";
function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    host: "0.0.0.0",
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
import { randomBytes as randomBytes2 } from "crypto";
var identifyOrganization = async (req, res, next) => {
  try {
    const hostname = req.hostname;
    const parts = hostname.split(".");
    const isSubdomain = parts.length > 2;
    if (isSubdomain) {
      const subdomain = parts[0];
      if (subdomain === "app" || subdomain === "www" || subdomain === "api") {
        return next();
      }
      const [organization] = await db.select().from(organizationSettings).where(eq12(organizationSettings.domain, subdomain)).limit(1);
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
var isAdmin = (req, res, next) => {
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
  setupWebSocketServer(httpServer);
  try {
    setupAuth(app2);
    log("Authentication routes registered successfully");
    app2.use(identifyOrganization);
    app2.use("/api/admin/accounting-codes", isAdmin, accounting_codes_default);
    app2.use("/api/admin/seasonal-scopes", isAdmin, seasonal_scopes_default);
    app2.use("/api/admin/events", isAdmin, events_default);
    app2.use("/api/admin/events", isAdmin, fees_default);
    app2.use("/api/admin/age-groups", isAdmin, age_groups_default);
    app2.use("/api/admin/organizations", isAdmin, organizations_default);
    app2.use("/api/admin/email-providers", isAdmin, email_providers_default);
    app2.use("/api/admin/email-template-routings", isAdmin, email_template_routings_default);
    app2.post("/api/admin/coupons", isAdmin, createCoupon);
    app2.get("/api/admin/coupons", isAdmin, getCoupons);
    app2.patch("/api/admin/coupons/:id", isAdmin, updateCoupon);
    app2.delete("/api/admin/coupons/:id", isAdmin, deleteCoupon);
    app2.get("/api/events/:id", async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const [event] = await db.select({
          id: events.id,
          name: events.name,
          startDate: events.startDate,
          endDate: events.endDate,
          applicationDeadline: events.applicationDeadline,
          details: events.details
        }).from(events).where(eq12(events.id, eventId));
        if (!event) {
          return res.status(404).send("Event not found");
        }
        res.json(event);
      } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).send("Failed to fetch event details");
      }
    });
    app2.use("/api/admin/events", isAdmin, events_default);
    app2.delete("/api/admin/events/:id", isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        if (isNaN(eventId)) {
          return res.status(400).json({ error: "Invalid event ID" });
        }
        console.log("Starting event deletion for ID:", eventId);
        await db.transaction(async (tx) => {
          const templates = await tx.select().from(eventFormTemplates).where(eq12(eventFormTemplates.eventId, String(eventId)));
          if (templates.length > 0) {
            const templateIds = templates.map((t) => t.id);
            await tx.delete(formResponses).where(inArray(formResponses.templateId, templateIds));
            console.log("Deleted form responses");
            const fields2 = await tx.select().from(formFields).where(inArray(formFields.templateId, templateIds));
            if (fields2.length > 0) {
              const fieldIds = fields2.map((f) => f.id);
              await tx.delete(formFieldOptions).where(inArray(formFieldOptions.fieldId, fieldIds));
              console.log("Deleted form field options");
              await tx.delete(formFields).where(inArray(formFields.templateId, templateIds));
              console.log("Deleted form fields");
            }
            await tx.delete(eventFormTemplates).where(eq12(eventFormTemplates.eventId, String(eventId)));
            console.log("Deleted form templates");
          }
          await tx.delete(games).where(eq12(games.eventId, String(eventId)));
          console.log("Deleted games");
          await tx.delete(gameTimeSlots).where(eq12(gameTimeSlots.eventId, String(eventId)));
          console.log("Deleted game time slots");
          await tx.delete(chatRooms).where(eq12(chatRooms.eventId, String(eventId)));
          console.log("Deleted chat rooms");
          await tx.delete(coupons).where(eq12(coupons.eventId, String(eventId)));
          console.log("Deleted coupons");
          await tx.delete(eventFieldSizes).where(eq12(eventFieldSizes.eventId, String(eventId)));
          console.log("Deleted event field sizes");
          await tx.delete(eventScoringRules).where(eq12(eventScoringRules.eventId, String(eventId)));
          console.log("Deleted event scoring rules");
          await tx.delete(eventComplexes).where(eq12(eventComplexes.eventId, String(eventId)));
          console.log("Deleted event complexes");
          await tx.delete(tournamentGroups).where(eq12(tournamentGroups.eventId, String(eventId)));
          console.log("Deleted tournament groups");
          await tx.delete(teams).where(eq12(teams.eventId, String(eventId)));
          console.log("Deleted teams");
          await tx.delete(eventAgeGroups).where(eq12(eventAgeGroups.eventId, String(eventId)));
          console.log("Deleted event age groups");
          await tx.delete(eventSettings).where(eq12(eventSettings.eventId, String(eventId)));
          console.log("Deleted event settings");
          const [deletedEvent] = await tx.delete(events).where(eq12(events.id, eventId)).returning({
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
    app2.get("/api/admin/check-email", isAdmin, async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({ exists: false, message: "Email is required" });
        }
        const [existingAdmin] = await db.select().from(users).where(
          and3(
            eq12(users.email, email),
            eq12(users.isAdmin, true)
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
    app2.post("/api/admin/administrators", isAdmin, async (req, res) => {
      try {
        const { email, firstName, lastName, password, roles: roleNames } = req.body;
        console.log("Creating admin with:", { email, firstName, lastName, roleNames });
        if (!email || !firstName || !lastName || !password || !roleNames || !Array.isArray(roleNames) || roleNames.length === 0) {
          return res.status(400).json({
            error: "All fields are required and roles must be a non-empty array"
          });
        }
        const [existingUser] = await db.select().from(users).where(eq12(users.email, email)).limit(1);
        if (existingUser) {
          return res.status(400).json({
            error: "Email already registered"
          });
        }
        const hashedPassword = await crypto.hash(password);
        const timestamp3 = (/* @__PURE__ */ new Date()).toISOString();
        const [newUser] = await db.insert(users).values({
          email,
          username: email,
          password: hashedPassword,
          firstName,
          lastName,
          isAdmin: true,
          isParent: false,
          createdAt: timestamp3
        }).returning();
        console.log("Created user:", newUser.id);
        for (const roleName of roleNames) {
          let [existingRole] = await db.select().from(roles).where(eq12(roles.name, roleName)).limit(1);
          if (!existingRole) {
            [existingRole] = await db.insert(roles).values({
              name: roleName,
              description: `${roleName} role`,
              createdAt: timestamp3
            }).returning();
          }
          await db.insert(adminRoles).values({
            userId: newUser.id,
            roleId: existingRole.id,
            createdAt: timestamp3
          });
          console.log(`Assigned role ${roleName} to user ${newUser.id}`);
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
    app2.patch("/api/admin/administrators/:id", isAdmin, async (req, res) => {
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
          roles: sql4`COALESCE(array_agg(${roles.name}), ARRAY[]::text[])`
        }).from(users).leftJoin(adminRoles, eq12(users.id, adminRoles.userId)).leftJoin(roles, eq12(adminRoles.roleId, roles.id)).where(eq12(users.id, adminId)).groupBy(users.id).then((rows) => rows[0]);
        if (!adminWithRoles) {
          return res.status(404).json({
            error: "Administrator not found"
          });
        }
        console.log("Found existing admin:", adminWithRoles);
        if (email !== adminWithRoles.admin.email) {
          const emailExists = await db.select().from(users).where(eq12(users.email, email)).limit(1).then((rows) => rows.length > 0);
          if (emailExists) {
            return res.status(400).json({
              error: "Email already registered"
            });
          }
        }
        const isSuperAdmin = adminWithRoles.roles.includes("super_admin");
        const willRemoveSuperAdmin = isSuperAdmin && !roleNames.includes("super_admin");
        if (willRemoveSuperAdmin) {
          const otherSuperAdmins = await db.select({ count: sql4`count(*)` }).from(users).innerJoin(adminRoles, eq12(users.id, adminRoles.userId)).innerJoin(roles, eq12(adminRoles.roleId, roles.id)).where(
            and3(
              eq12(roles.name, "super_admin"),
              sql4`${users.id} != ${adminId}`
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
            }).where(eq12(users.id, adminId));
            console.log("Updated user details");
            await tx.delete(adminRoles).where(eq12(adminRoles.userId, adminId));
            console.log("Removed existing roles");
            for (const roleName of roleNames) {
              let [existingRole] = await tx.select().from(roles).where(eq12(roles.name, roleName)).limit(1);
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
            }).where(eq12(users.id, adminId));
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
    app2.delete("/api/admin/administrators/:id", isAdmin, async (req, res) => {
      try {
        const adminId = parseInt(req.params.id);
        const [adminToDelete] = await db.select({
          admin: users,
          roles: sql4`array_agg(${roles.name})`
        }).from(users).leftJoin(adminRoles, eq12(users.id, adminRoles.userId)).leftJoin(roles, eq12(adminRoles.roleId, roles.id)).where(eq12(users.id, adminId)).groupBy(users.id).limit(1);
        if (!adminToDelete) {
          return res.status(404).send("Administrator not found");
        }
        const isSuperAdmin = adminToDelete.roles.includes("super_admin");
        if (isSuperAdmin) {
          const [{ count }] = await db.select({
            count: sql4`COUNT(*)`
          }).from(users).innerJoin(adminRoles, eq12(users.id, adminRoles.userId)).innerJoin(roles, eq12(adminRoles.roleId, roles.id)).where(
            and3(
              eq12(roles.name, "super_admin"),
              sql4`${users.id} != ${adminId}`
            )
          );
          if (count === 0) {
            return res.status(400).send("Cannot delete the last super administrator");
          }
        }
        await db.transaction(async (tx) => {
          await tx.delete(adminRoles).where(eq12(adminRoles.userId, adminId));
          await tx.delete(users).where(eq12(users.id, adminId));
        });
        res.json({ message: "Administrator deleted successfully" });
      } catch (error) {
        console.error("Error deleting administrator:", error);
        console.error("Error details:", error);
        res.status(500).send(error instanceof Error ? error.message : "Failed to delete administrator");
      }
    });
    app2.get("/api/check-email", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({ available: false, message: "Email is required" });
        }
        const [existingUser] = await db.select().from(users).where(eq12(users.email, email)).limit(1);
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
        const [existingUser] = await db.select().from(users).where(eq12(users.email, email)).limit(1);
        if (existingUser) {
          return res.status(400).send("This email is already registered in the system");
        }
        const [existingInvitation] = await db.select().from(householdInvitations).where(
          and3(
            eq12(householdInvitations.email, email),
            eq12(householdInvitations.status, "pending")
          )
        ).limit(1);
        if (existingInvitation) {
          return res.status(400).send("An invitation is already pending for this email");
        }
        const token = randomBytes2(32).toString("hex");
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const [invitation] = await db.insert(householdInvitations).values({
          householdId,
          email,
          token,
          status: "pending",
          expiresAt,
          createdBy: userId,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
        const householdId = req.user.householdId;
        if (!householdId) {
          return res.status(400).send("You must be part of a household to view invitations");
        }
        const invitations = await db.select({
          invitation: householdInvitations,
          createdByUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        }).from(householdInvitations).leftJoin(users, eq12(householdInvitations.createdBy, users.id)).where(eq12(householdInvitations.householdId, householdId));
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
          and3(
            eq12(householdInvitations.token, token),
            eq12(householdInvitations.status, "pending")
          )
        ).limit(1);
        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }
        if (new Date(invitation.expiresAt) < /* @__PURE__ */ new Date()) {
          await db.update(householdInvitations).set({ status: "expired" }).where(eq12(householdInvitations.id, invitation.id));
          return res.status(400).send("Invitation has expired");
        }
        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }
        await db.update(users).set({ householdId: invitation.householdId }).where(eq12(users.id, userId));
        await db.update(householdInvitations).set({ status: "accepted" }).where(eq12(householdInvitations.id, invitation.id));
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
          and3(
            eq12(householdInvitations.token, token),
            eq12(householdInvitations.status, "pending")
          )
        ).limit(1);
        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }
        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }
        await db.update(householdInvitations).set({ status: "declined" }).where(eq12(householdInvitations.id, invitation.id));
        res.json({ message: "Invitation declined successfully" });
      } catch (error) {
        console.error("Error declining invitation:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to decline invitation");
      }
    });
    app2.get("/api/admin/complexes", isAdmin, async (req, res) => {
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
          fields: sql4`json_agg(
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
            )`.mapWith((f) => f === null ? [] : f.filter(Boolean)),
          openFields: sql4`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
          closedFields: sql4`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number)
        }).from(complexes).leftJoin(fields, eq12(complexes.id, fields.complexId)).groupBy(complexes.id).orderBy(complexes.name);
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
    app2.post("/api/admin/complexes", isAdmin, async (req, res) => {
      try {
        const [newComplex] = await db.insert(complexes).values({
          name: req.body.name,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
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
    app2.patch("/api/admin/complexes/:id", isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const [updatedComplex] = await db.update(complexes).set({
          name: req.body.name,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          openTime: req.body.openTime,
          closeTime: req.body.closeTime,
          rules: req.body.rules || null,
          directions: req.body.directions || null,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq12(complexes.id, complexId)).returning();
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
    app2.patch("/api/admin/complexes/:id/status", isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const { isOpen } = req.body;
        await db.transaction(async (tx) => {
          const [updatedComplex] = await tx.update(complexes).set({
            isOpen,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).where(eq12(complexes.id, complexId)).returning();
          if (!updatedComplex) {
            return res.status(404).send("Complex not found");
          }
          await tx.update(fields).set({
            isOpen,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }).where(eq12(fields.complexId, complexId));
          res.json(updatedComplex);
        });
      } catch (error) {
        console.error("Error updating complex status:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update complex status");
      }
    });
    app2.delete("/api/admin/complexes/:id", isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        await db.delete(fields).where(eq12(fields.complexId, complexId));
        const [deletedComplex] = await db.delete(complexes).where(eq12(complexes.id, complexId)).returning();
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
    app2.get("/api/admin/complexes/analytics", isAdmin, async (req, res) => {
      try {
        const complexesWithFields = await db.select({
          complex: complexes,
          fieldCount: sql4`count(${fields.id})`.mapWith(Number)
        }).from(complexes).leftJoin(fields, eq12(complexes.id, fields.complexId)).groupBy(complexes.id).orderBy(complexes.name);
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
    app2.get("/api/admin/organization-settings", isAdmin, async (req, res) => {
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
        res.json(settings || {});
      } catch (error) {
        console.error("Error fetching organization settings:", error);
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });
    app2.post("/api/admin/organization-settings", isAdmin, async (req, res) => {
      try {
        const [existingSettings] = await db.select().from(organizationSettings).limit(1);
        const updatedSettings = {
          ...req.body,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        let settings;
        if (existingSettings) {
          [settings] = await db.update(organizationSettings).set(updatedSettings).where(eq12(organizationSettings.id, existingSettings.id)).returning();
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
    app2.get("/api/admin/organizations", isAdmin, async (req, res) => {
      try {
        const organizations = await db.select().from(organizationSettings).orderBy(organizationSettings.name);
        res.json(organizations);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        res.status(500).send("Failed to fetch organizations");
      }
    });
    app2.post("/api/admin/organizations", isAdmin, async (req, res) => {
      try {
        const { name, domain, primaryColor, secondaryColor, logoUrl } = req.body;
        if (domain) {
          const [existingOrg] = await db.select().from(organizationSettings).where(eq12(organizationSettings.domain, domain)).limit(1);
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
    app2.get("/api/admin/coupons", isAdmin, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : void 0;
        const query = db.select().from(coupons);
        if (eventId) {
          query.where(eq12(coupons.eventId, eventId));
        }
        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });
    app2.post("/api/admin/coupons", isAdmin, async (req, res) => {
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
        const [existingCoupon] = await db.select().from(coupons).where(eq12(coupons.code, code)).limit(1);
        if (existingCoupon) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }
        const numericEventId = eventId ? Number(eventId) : null;
        const [newCoupon] = await db.insert(coupons).values({
          code,
          discountType,
          amount: Number(amount),
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          description: description || null,
          eventId: numericEventId,
          maxUses: maxUses ? Number(maxUses) : null,
          usageCount: 0,
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).returning();
        res.json(newCoupon);
      } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ message: "Failed to create coupon" });
      }
    });
    app2.patch("/api/admin/coupons/:id", isAdmin, async (req, res) => {
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
        const [existingCoupon] = await db.select().from(coupons).where(eq12(coupons.id, couponId)).limit(1);
        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db.select().from(coupons).where(eq12(coupons.code, code)).limit(1);
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
        }).where(eq12(coupons.id, couponId)).returning();
        res.json(updatedCoupon);
      } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    });
    app2.get("/api/admin/coupons", isAdmin, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : void 0;
        const query = db.select().from(coupons);
        if (eventId) {
          query.where(eq12(coupons.eventId, eventId));
        }
        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });
    app2.post("/api/admin/coupons", isAdmin, async (req, res) => {
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
        const [existingCoupon] = await db.select().from(coupons).where(eq12(coupons.code, code)).limit(1);
        if (existingCoupon) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }
        const numericEventId = eventId ? Number(eventId) : null;
        const [newCoupon] = await db.insert(coupons).values({
          code,
          discountType,
          amount: Number(amount),
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          description: description || null,
          eventId: numericEventId,
          maxUses: maxUses ? Number(maxUses) : null,
          usageCount: 0,
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).returning();
        res.json(newCoupon);
      } catch (error) {
        console.error("Error creating coupon:", error);
        res.status(500).json({ message: "Failed to create coupon" });
      }
    });
    app2.patch("/api/admin/coupons/:id", isAdmin, async (req, res) => {
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
        const [existingCoupon] = await db.select().from(coupons).where(eq12(coupons.id, couponId)).limit(1);
        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db.select().from(coupons).where(eq12(coupons.code, code)).limit(1);
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
        }).where(eq12(coupons.id, couponId)).returning();
        res.json(updatedCoupon);
      } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    });
    app2.delete("/api/admin/coupons/:id", isAdmin, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const [deletedCoupon] = await db.delete(coupons).where(eq12(coupons.id, couponId)).returning();
        if (!deletedCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
        res.json({ message: "Coupon deleted successfully" });
      } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ message: "Failed to delete coupon" });
      }
    });
    app2.get("/api/admin/styling", isAdmin, async (req, res) => {
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
    app2.post("/api/admin/styling", isAdmin, async (req, res) => {
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
          }).where(eq12(organizationSettings.id, settings.id));
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
    app2.get("/api/admin/users", isAdmin, async (req, res) => {
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
    app2.use("/api/admin/files", isAdmin, upload_default);
    app2.use("/api/folders", folders_default);
    app2.post("/api/files/bulk", isAdmin, async (req, res) => {
      try {
        const { action, fileIds, targetFolderId } = req.body;
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
          return res.status(400).json({ error: "No files selected" });
        }
        switch (action) {
          case "delete":
            for (const fileId of fileIds) {
              try {
                const [file] = await db.select().from(files).where(eq12(files.id, fileId)).limit(1);
                if (file) {
                  const filePath = path4.join(process.cwd(), "uploads", path4.basename(file.url));
                  await fs3.unlink(filePath).catch(() => {
                    console.log(`Physical file not found: ${filePath}`);
                  });
                  await db.delete(files).where(eq12(files.id, fileId));
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
            }).where(inArray(files.id, fileIds));
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
        const themePath = path4.resolve(process.cwd(), "theme.json");
        await fs3.writeFile(themePath, JSON.stringify(themeData, null, 2));
        res.json({ message: "Theme updated successfully" });
      } catch (error) {
        console.error("Error updating theme:", error);
        console.error("Error details:", error);
        res.status(500).json({ message: "Failed to update theme" });
      }
    });
    app2.post("/api/admin/fields", isAdmin, async (req, res) => {
      try {
        const [newField] = await db.insert(fields).values({
          name: req.body.name,
          hasLights: req.body.hasLights,
          hasParking: req.body.hasParking,
          specialInstructions: req.body.specialInstructions || null,
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
    app2.get("/api/admin/complexes/:id/fields", isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const complexFields = await db.select().from(fields).where(eq12(fields.complexId, complexId)).orderBy(fields.name);
        res.json(complexFields);
      } catch (error) {
        console.error("Error fetching fields:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch fields");
      }
    });
    app2.delete("/api/admin/fields/:id", isAdmin, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const [deletedField] = await db.delete(fields).where(eq12(fields.id, fieldId)).returning();
        if (!deletedField) {
          return res.status(404).send("Field not found");
        }
        res.json(deletedField);
      } catch (error) {
        console.error("Error deleting field:", error);
        res.status(500).send("Failed to delete field");
      }
    });
    app2.patch("/api/admin/fields/:id/status", isAdmin, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const { isOpen } = req.body;
        const [field] = await db.select({
          field: fields,
          complexIsOpen: complexes.isOpen
        }).from(fields).innerJoin(complexes, eq12(fields.complexId, complexes.id)).where(eq12(fields.id, fieldId));
        if (!field) {
          return res.status(404).send("Field not found");
        }
        if (isOpen && !field.complexIsOpen) {
          return res.status(400).send("Cannot open field when complex is closed");
        }
        const [updatedField] = await db.update(fields).set({
          isOpen,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq12(fields.id, fieldId)).returning();
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
        const { firstName, lastName, email, phone } = req.body;
        if (email !== req.user.email) {
          const [existingUser] = await db.select().from(users).where(eq12(users.email, email)).limit(1);
          if (existingUser) {
            return res.status(400).send("Email already in use");
          }
        }
        const [updatedUser] = await db.update(users).set({
          firstName,
          lastName,
          email,
          phone,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq12(users.id, req.user.id)).returning();
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
        }).where(eq12(users.id, req.user.id));
        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Error updating password:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update password");
      }
    });
    app2.post("/api/admin/events", isAdmin, async (req, res) => {
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
            const selectedAgeGroups = await tx.select().from(ageGroupSettings).where(and3(
              eq12(ageGroupSettings.seasonalScopeId, formData.selectedScopeId),
              inArray(ageGroupSettings.id, formData.selectedAgeGroupIds)
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
    app2.patch("/api/admin/events/:id", isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        let eventData;
        if (req.headers["content-type"]?.includes("multipart/form-data")) {
          eventData = JSON.parse(req.body.data);
        } else {
          eventData = req.body;
        }
        await db.transaction(async (tx) => {
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
          }).where(eq12(events.id, eventId)).returning();
          if (!updatedEvent) {
            throw new Error("Event not found");
          }
          await tx.execute(sql4`DELETE FROM event_complexes WHERE event_id = ${eventId}`);
          if (eventData.selectedComplexIds && eventData.selectedComplexIds.length > 0) {
            for (const complexId of eventData.selectedComplexIds) {
              await tx.execute(
                sql4`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                    VALUES (${eventId}, ${complexId}, ${(/* @__PURE__ */ new Date()).toISOString()})`
              );
            }
          }
          await tx.delete(eventFieldSizes).where(eq12(eventFieldSizes.eventId, eventId));
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
          const existingAgeGroups = await tx.select().from(eventAgeGroups).where(eq12(eventAgeGroups.eventId, eventId));
          const ageGroupsWithTeams = await tx.select({
            ageGroupId: teams.ageGroupId,
            teamCount: sql4`count(*)`.mapWith(Number)
          }).from(teams).where(eq12(teams.eventId, eventId)).groupBy(teams.ageGroupId);
          const ageGroupsWithTeamsMap = new Map(
            ageGroupsWithTeams.map(({ ageGroupId, teamCount }) => [ageGroupId, teamCount])
          );
          const existingAgeGroupsMap = new Map(
            existingAgeGroups.map((group) => [
              `${group.gender}-${group.ageGroup}-${group.fieldSize}`,
              group
            ])
          );
          const PREDEFINED_AGE_GROUPS = [
            { ageGroup: "U8", gender: "Boys", divisionCode: "Boys-U8-7v7" },
            { ageGroup: "U8", gender: "Girls", divisionCode: "Girls-U8-7v7" },
            { ageGroup: "U9", gender: "Boys", divisionCode: "Boys-U9-7v7" },
            { ageGroup: "U9", gender: "Girls", divisionCode: "Girls-U9-7v7" },
            { ageGroup: "U10", gender: "Boys", divisionCode: "Boys-U10-7v7" },
            { ageGroup: "U10", gender: "Girls", divisionCode: "Girls-U10-7v7" },
            { ageGroup: "U11", gender: "Boys", divisionCode: "Boys-U11-9v9" },
            { ageGroup: "U11", gender: "Girls", divisionCode: "Girls-U11-9v9" },
            { ageGroup: "U12", gender: "Boys", divisionCode: "Boys-U12-9v9" },
            { ageGroup: "U12", gender: "Girls", divisionCode: "Girls-U12-9v9" },
            { ageGroup: "U13", gender: "Boys", divisionCode: "Boys-U13-11v11" },
            { ageGroup: "U13", gender: "Girls", divisionCode: "Girls-U13-11v11" },
            { ageGroup: "U14", gender: "Boys", divisionCode: "Boys-U14-11v11" },
            { ageGroup: "U14", gender: "Girls", divisionCode: "Girls-U14-11v11" },
            { ageGroup: "U15", gender: "Boys", divisionCode: "Boys-U15-11v11" },
            { ageGroup: "U15", gender: "Girls", divisionCode: "Girls-U15-11v11" },
            { ageGroup: "U16", gender: "Boys", divisionCode: "Boys-U16-11v11" },
            { ageGroup: "U16", gender: "Girls", divisionCode: "Girls-U16-11v11" },
            { ageGroup: "U17", gender: "Boys", divisionCode: "Boys-U17-11v11" },
            { ageGroup: "U17", gender: "Girls", divisionCode: "Girls-U17-11v11" },
            { ageGroup: "U18", gender: "Boys", divisionCode: "Boys-U18-11v11" },
            { ageGroup: "U18", gender: "Girls", divisionCode: "Girls-U18-11v11" },
            { ageGroup: "U19", gender: "Boys", divisionCode: "Boys-U19-11v11" },
            { ageGroup: "U19", gender: "Girls", divisionCode: "Girls-U19-11v11" }
          ];
          for (const group of PREDEFINED_AGE_GROUPS) {
            const groupKey = group.divisionCode;
            const existingGroup = existingAgeGroupsMap.get(groupKey);
            const ageNum = group.ageGroup.startsWith("U") ? parseInt(group.ageGroup.substring(1)) : 18;
            const fieldSize = ageNum <= 7 ? "4v4" : ageNum <= 10 ? "7v7" : ageNum <= 12 ? "9v9" : "11v11";
            if (existingGroup) {
              await tx.update(eventAgeGroups).set({
                ageGroup: group.ageGroup,
                gender: group.gender,
                divisionCode: group.divisionCode,
                birthDateStart: existingGroup.birthDateStart,
                birthDateEnd: existingGroup.birthDateEnd,
                fieldSize,
                // Keep existing values for these fields
                projectedTeams: existingGroup.projectedTeams,
                amountDue: existingGroup.amountDue,
                scoringRule: existingGroup.scoringRule
              }).where(eq12(eventAgeGroups.id, existingGroup.id));
              existingAgeGroupsMap.delete(groupKey);
            } else {
              await tx.insert(eventAgeGroups).values({
                eventId,
                gender: group.gender,
                ageGroup: group.ageGroup,
                divisionCode: group.divisionCode,
                projectedTeams: 0,
                birthDateStart: null,
                birthDateEnd: null,
                scoringRule: null,
                fieldSize,
                amountDue: null,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
          const remainingGroups = Array.from(existingAgeGroupsMap.entries());
          for (const [, group] of remainingGroups) {
            if (!ageGroupsWithTeamsMap.has(group.id)) {
              await tx.delete(eventAgeGroups).where(eq12(eventAgeGroups.id, group.id));
            }
          }
          await tx.execute(sql4`DELETE FROM event_complexes WHERE event_id = ${eventId}`);
          if (Array.isArray(eventData.selectedComplexIds) && eventData.selectedComplexIds.length > 0) {
            for (const complexId of eventData.selectedComplexIds) {
              await tx.execute(
                sql4`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                    VALUES (${eventId}, ${complexId}, ${(/* @__PURE__ */ new Date()).toISOString()})`
              );
            }
          }
          await tx.delete(eventFieldSizes).where(eq12(eventFieldSizes.eventId, eventId));
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
    app2.get("/api/admin/events", isAdmin, async (req, res) => {
      try {
        const eventsList = await db.select({
          event: events,
          applicationCount: sql4`count(distinct ${teams.id})`.mapWith(Number),
          teamCount: sql4`count(${teams.id})`.mapWith(Number)
        }).from(events).leftJoin(teams, eq12(events.id, teams.eventId)).groupBy(events.id).orderBy(events.startDate);
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
    app2.get("/api/admin/events/:id/edit", async (req, res) => {
      try {
        const eventId = req.params.id;
        const [event] = await db.select().from(events).where(eq12(events.id, eventId));
        if (!event) {
          return res.status(404).send("Event not found");
        }
        const ageGroups = await db.select({
          ageGroup: eventAgeGroups,
          teamCount: sql4`count(distinct ${teams.id})`.mapWith(Number)
        }).from(eventAgeGroups).leftJoin(teams, eq12(teams.ageGroupId, eventAgeGroups.id)).where(eq12(eventAgeGroups.eventId, eventId)).groupBy(eventAgeGroups.id);
        const complexData = await db.select({
          complex: complexes,
          fields: sql4`json_agg(
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
          openFields: sql4`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
          closedFields: sql4`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number)
        }).from(complexes).leftJoin(fields, eq12(complexes.id, fields.complexId)).groupBy(complexes.id).orderBy(complexes.name);
        const scoringRules = await db.select().from(eventScoringRules).where(eq12(eventScoringRules.eventId, eventId));
        const complexAssignments = await db.select().from(eventComplexes).where(eq12(eventComplexes.eventId, eventId));
        const fieldSizes = await db.select().from(eventFieldSizes).where(eq12(eventFieldSizes.eventId, eventId));
        const administrators = await db.select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }).from(users).where(eq12(users.isAdmin, true));
        const seasonalScope = await db.select().from(seasonalScopes).where(eq12(seasonalScopes.id, eventAgeGroups[0]?.seasonalScopeId ?? 0)).limit(1).then((rows) => rows[0]);
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
    app2.get("/api/admin/events/:id", isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        const [event] = await db.select().from(events).where(eq12(events.id, eventId));
        if (!event) {
          return res.status(404).send("Event not found");
        }
        const ageGroups = await db.select().from(eventAgeGroups).where(eq12(eventAgeGroups.eventId, eventId));
        const scoringRules = await db.select().from(eventScoringRules).where(eq12(eventScoringRules.eventId, eventId));
        const complexAssignments = await db.select().from(eventComplexes).where(eq12(eventComplexes.eventId, eventId));
        const fieldSizes = await db.select().from(eventFieldSizes).where(eq12(eventFieldSizes.eventId, eventId));
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
    app2.get("/api/admin/events/:id/schedule", isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const schedule = await db.select({
          game: games,
          homeTeam: teams,
          awayTeam: sql4`json_build_object('id', ${sql4.raw("away_teams")}.id, 'name', ${sql4.raw("away_teams")}.name)`,
          field: fields,
          timeSlot: gameTimeSlots,
          ageGroup: eventAgeGroups
        }).from(games).leftJoin(teams, eq12(games.homeTeamId, teams.id)).leftJoin(sql4.raw("teams as away_teams"), eq12(games.awayTeamId, sql4.raw("away_teams.id"))).leftJoin(fields, eq12(games.fieldId, fields.id)).leftJoin(gameTimeSlots, eq12(games.timeSlotId, gameTimeSlots.id)).leftJoin(eventAgeGroups, eq12(games.ageGroupId, eventAgeGroups.id)).where(eq12(games.eventId, eventId)).orderBy(gameTimeSlots.startTime);
        const formattedSchedule = schedule.filter((item) => item.timeSlot && item.field && item.homeTeam && item.ageGroup).map((item) => ({
          id: item.game.id,
          startTime: item.timeSlot.startTime,
          endTime: item.timeSlot.endTime,
          fieldName: item.field.name,
          ageGroup: item.ageGroup.ageGroup,
          homeTeam: item.homeTeam.name,
          awayTeam: item.awayTeam.name,
          status: item.game.status
        }));
        res.json({ games: formattedSchedule });
      } catch (error) {
        console.error("Error fetching schedule:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch schedule");
      }
    });
    app2.post("/api/admin/events/:id/generate-schedule", isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const { gamesPerDay, minutesPerGame, breakBetweenGames } = req.body;
        await db.transaction(async (tx) => {
          const [event] = await tx.select().from(events).where(eq12(events.id, eventId));
          if (!event) {
            throw new Error("Event not found");
          }
          const ageGroups = await tx.select().from(eventAgeGroups).where(eq12(eventAgeGroups.eventId, eventId));
          const eventFields = await tx.select({
            field: fields,
            complex: complexes
          }).from(eventComplexes).innerJoin(fields, eq12(eventComplexes.complexId, fields.complexId)).innerJoin(complexes, eq12(eventComplexes.complexId, complexes.id)).where(eq12(eventComplexes.eventId, eventId));
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
          for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayIndex);
            for (const { field, complex } of eventFields) {
              const complexOpenTime = /* @__PURE__ */ new Date(`${currentDate.toISOString().split("T")[0]}T${complex.openTime}`);
              const complexCloseTime = /* @__PURE__ */ new Date(`${currentDate.toISOString().split("T")[0]}T${complex.closeTime}`);
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
        res.status(500).send("Failed to generate schedule");
      }
    });
    app2.get("/api/admin/events/:eventId/age-groups", isAdmin, async (req, res) => {
      try {
        const eventId = req.params.eventId;
        let ageGroups = await db.query.eventAgeGroups.findMany({
          where: eq12(eventAgeGroups.eventId, eventId)
        });
        console.log(`Fetched ${ageGroups.length} age groups for event ${eventId}`);
        const uniqueGroups = [];
        const seenIds = /* @__PURE__ */ new Set();
        for (const group of ageGroups) {
          if (!seenIds.has(group.id)) {
            seenIds.add(group.id);
            uniqueGroups.push(group);
          }
        }
        console.log(`Returning ${uniqueGroups.length} unique age groups after deduplication`);
        res.json(uniqueGroups);
      } catch (error) {
        console.error("Error fetching age groups:", error);
        res.status(500).json({ error: "Failed to fetch age groups" });
      }
    });
    app2.get("/api/admin/teams", isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.query.eventId);
        const ageGroupId = req.query.ageGroupId ? parseInt(req.query.ageGroupId) : null;
        let query = db.select({
          team: teams,
          ageGroup: eventAgeGroups
        }).from(teams).leftJoin(eventAgeGroups, eq12(teams.ageGroupId, eventAgeGroups.id)).where(eq12(teams.eventId, eventId));
        if (ageGroupId) {
          query = query.where(eq12(teams.ageGroupId, ageGroupId));
        }
        const results = await query.orderBy(teams.name);
        const formattedTeams = results.map(({ team, ageGroup }) => ({
          ...team,
          ageGroup: ageGroup?.ageGroup || "Unknown"
        }));
        res.json(formattedTeams);
      } catch (error) {
        console.error("Error fetching teams:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch teams");
      }
    });
    app2.post("/api/admin/teams", isAdmin, async (req, res) => {
      try {
        const { name, eventId, ageGroup } = req.body;
        if (!name || !eventId || !ageGroup) {
          return res.status(400).send("Name, event ID, and age group are required");
        }
        const [ageGroupRecord] = await db.select().from(eventAgeGroups).where(and3(
          eq12(eventAgeGroups.eventId, eventId),
          eq12(eventAgeGroups.ageGroup, ageGroup)
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
    app2.get("/api/admin/events/:id/age-groups", isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const ageGroups = await db.select({
          ageGroup: eventAgeGroups.ageGroup,
          gender: eventAgeGroups.gender,
          teamCount: sql4`count(${teams.id})`.mapWith(Number)
        }).from(eventAgeGroups).leftJoin(teams, eq12(teams.ageGroupId, eventAgeGroups.id)).where(eq12(eventAgeGroups.eventId, eventId)).groupBy(eventAgeGroups.id, eventAgeGroups.ageGroup, eventAgeGroups.gender).orderBy(eventAgeGroups.ageGroup);
        res.json(ageGroups);
      } catch (error) {
        console.error("Error fetching age groups:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch age groups");
      }
    });
    app2.post("/api/admin/administrators", isAdmin, async (req, res) => {
      try {
        const { firstName, lastName, email, password, roles: roles2 } = req.body;
        if (!firstName || !lastName || !email || !password || !roles2 || !Array.isArray(roles2)) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        const [existingUser] = await db.select().from(users).where(eq12(users.email, email)).limit(1);
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
            const existingRole = await tx.select().from(roles2).where(eq12(roles2.name, roleName)).limit(1);
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
        });
      } catch (error) {
        console.error("Error creating administrator:", error);
        res.status(500).json({
          error: "Failed to create administrator",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    app2.get("/api/admin/administrators", isAdmin, async (req, res) => {
      try {
        const administrators = await db.select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt
        }).from(users).where(eq12(users.isAdmin, true)).orderBy(users.createdAt);
        res.json(administrators);
      } catch (error) {
        console.error("Error fetching administrators:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch administrators");
      }
    });
    app2.patch("/api/admin/teams/:id", isAdmin, async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        const { name, coach, managerName, managerPhone, managerEmail } = req.body;
        const [updatedTeam] = await db.update(teams).set({
          name,
          coach,
          managerName,
          managerPhone,
          managerEmail,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(eq12(teams.id, teamId)).returning();
        if (!updatedTeam) {
          return res.status(404).send("Team not found");
        }
        res.json(updatedTeam);
      } catch (error) {
        console.error("Error updating team:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to update team");
      }
    });
    app2.get("/api/admin/events/:id/registration-form", isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        const [template] = await db.select({
          template: eventFormTemplates,
          fields: sql4`json_agg(
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
        }).from(eventFormTemplates).leftJoin(formFields, eq12(formFields.templateId, eventFormTemplates.id)).where(eq12(eventFormTemplates.eventId, eventId)).groupBy(eventFormTemplates.id);
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
    app2.get("/api/admin/form-templates", isAdmin, async (req, res) => {
      try {
        const templates = await db.select({
          id: eventFormTemplates.id,
          name: eventFormTemplates.name,
          description: eventFormTemplates.description,
          isPublished: eventFormTemplates.isPublished,
          createdAt: eventFormTemplates.createdAt,
          updatedAt: eventFormTemplates.updatedAt,
          fields: sql4`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type}
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith((f) => f || [])
        }).from(eventFormTemplates).leftJoin(formFields, eq12(formFields.templateId, eventFormTemplates.id)).groupBy(eventFormTemplates.id);
        res.json(templates);
      } catch (error) {
        console.error("Error fetching form templates:", error);
        res.status(500).json({ error: "Failed to fetch form templates" });
      }
    });
    app2.get("/api/admin/form-templates/:id", isAdmin, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);
        const [template] = await db.select({
          template: eventFormTemplates,
          fields: sql4`json_agg(
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
        }).from(eventFormTemplates).leftJoin(formFields, eq12(formFields.templateId, eventFormTemplates.id)).where(eq12(eventFormTemplates.id, templateId)).groupBy(eventFormTemplates.id);
        if (!template) {
          return res.status(404).json({ error: "Template not found" });
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
    app2.post("/api/admin/form-templates", isAdmin, async (req, res) => {
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
    app2.post("/api/admin/events/:id/form-template", isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        const { name, description, isPublished, fields: fields2 } = req.body;
        awaitdb.transaction(async (tx) => {
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
    app2.put("/api/admin/events/:eventId/form-template", isAdmin, async (req, res) => {
      try {
        const eventId = req.params.eventId;
        const { id, name, description, isPublished, fields: fields2 } = req.body;
        await db.transaction(async (tx) => {
          await tx.update(eventFormTemplates).set({
            name,
            description,
            isPublished,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq12(eventFormTemplates.id, id));
          const existingFields = await tx.select().from(formFields).where(eq12(formFields.templateId, id));
          for (const field of existingFields) {
            await tx.delete(formFieldOptions).where(eq12(formFieldOptions.fieldId, field.id));
          }
          await tx.delete(formFields).where(eq12(formFields.templateId, id));
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
    app2.delete("/api/admin/events/:eventId/form-template/:id", isAdmin, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);
        await db.transaction(async (tx) => {
          await tx.delete(formFieldOptions).where(
            inArray(
              formFieldOptions.fieldId,
              db.select({ id: formFields.id }).from(formFields).where(eq12(formFields.templateId, templateId))
            )
          );
          await tx.delete(formFields).where(eq12(formFields.templateId, templateId));
          const [deletedTemplate] = await tx.delete(eventFormTemplates).where(eq12(eventFormTemplates.id, templateId)).returning();
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
    app2.delete("/api/admin/teams/:id", isAdmin, async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        const [gameCount] = await db.select({
          count: sql4`count(*)`.mapWith(Number)
        }).from(games).where(
          or2(
            eq12(games.homeTeamId, teamId),
            eq12(games.awayTeamId, teamId)
          )
        );
        if (gameCount.count > 0) {
          return res.status(400).send("Cannot delete team with associated games");
        }
        const [deletedTeam] = await db.delete(teams).where(eq12(teams.id, teamId)).returning();
        if (!deletedTeam) {
          return res.status(404).send("Team notfound");
        }
        res.json(deletedTeam);
      } catch (error) {
        console.error("Error deleting team:", error);
        console.error("Error details:", error);
        res.status(500).send("Failed to delete team");
      }
    });
    app2.get("/api/admin/events", isAdmin, async (req, res) => {
      try {
        const eventsList = await db.select({
          event: events,
          applicationCount: sql4`count(distinct ${teams.id})`.mapWith(Number),
          teamCount: sql4`count(${teams.id})`.mapWith(Number)
        }).from(events).leftJoin(teams, eq12(events.id, teams.eventId)).groupBy(events.id).orderBy(events.startDate);
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
    app2.delete("/api/admin/events/bulk", isAdmin, async (req, res) => {
      try {
        const { eventIds } = req.body;
        if (!Array.isArray(eventIds) || eventIds.length === 0) {
          return res.status(400).json({ message: "No events selected" });
        }
        await db.transaction(async (tx) => {
          await tx.delete(formResponses).where(inArray(formResponses.eventId, eventIds));
          await tx.delete(chatRooms).where(inArray(chatRooms.eventId, eventIds));
          await tx.delete(eventFieldSizes).where(inArray(eventFieldSizes.eventId, eventIds));
          await tx.delete(eventScoringRules).where(inArray(eventScoringRules.eventId, eventIds));
          await tx.delete(eventComplexes).where(inArray(eventComplexes.eventId, eventIds));
          await tx.delete(teams).where(inArray(teams.eventId, eventIds));
          await tx.delete(tournamentGroups).where(inArray(tournamentGroups.eventId, eventIds));
          await tx.delete(eventAgeGroups).where(inArray(eventAgeGroups.eventId, eventIds));
          await tx.delete(eventFormTemplates).where(inArray(eventFormTemplates.eventId, eventIds));
          await tx.delete(events).where(inArray(events.id, eventIds));
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
    app2.delete("/api/admin/events/:id", isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        console.log("Starting event deletion for ID:", eventId);
        if (!eventId) {
          return res.status(400).json({ error: "Event ID is required" });
        }
        const [eventExists] = await db.select({ id: events.id }).from(events).where(eq12(events.id, eventId)).limit(1);
        if (!eventExists) {
          return res.status(404).json({ error: "Event not found" });
        }
        try {
          try {
            await db.delete(games).where(eq12(games.eventId, eventId));
            console.log("Deleted games");
          } catch (e) {
            console.error("Error deleting games:", e);
          }
          try {
            await db.delete(gameTimeSlots).where(eq12(gameTimeSlots.eventId, eventId));
            console.log("Deleted game time slots");
          } catch (e) {
            console.error("Error deleting game time slots:", e);
          }
          try {
            await db.delete(formResponses).where(eq12(formResponses.eventId, eventId));
            console.log("Deleted form responses");
          } catch (e) {
            console.error("Error deleting form responses:", e);
          }
          try {
            await db.execute(sql4`SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms'`);
            await db.delete(chatRooms).where(eq12(chatRooms.eventId, eventId));
            console.log("Deleted chat rooms");
          } catch (e) {
            console.error("Error deleting chat rooms:", e);
          }
          try {
            await db.delete(coupons).where(eq12(coupons.eventId, eventId));
            console.log("Deleted coupons");
          } catch (e) {
            console.error("Error deleting coupons:", e);
          }
          try {
            await db.delete(eventFieldSizes).where(eq12(eventFieldSizes.eventId, eventId));
            console.log("Deleted event field sizes");
          } catch (e) {
            console.error("Error deleting field sizes:", e);
          }
          try {
            await db.delete(eventScoringRules).where(eq12(eventScoringRules.eventId, eventId));
            console.log("Deleted event scoring rules");
          } catch (e) {
            console.error("Error deleting scoring rules:", e);
          }
          try {
            await db.delete(eventComplexes).where(eq12(eventComplexes.eventId, eventId));
            console.log("Deleted event complexes");
          } catch (e) {
            console.error("Error deleting complex assignments:", e);
          }
          try {
            await db.delete(tournamentGroups).where(eq12(tournamentGroups.eventId, eventId));
            console.log("Deleted tournament groups");
          } catch (e) {
            console.error("Error deleting tournament groups:", e);
          }
          try {
            await db.delete(teams).where(eq12(teams.eventId, eventId));
            console.log("Deleted teams");
          } catch (e) {
            console.error("Error deleting teams:", e);
          }
          try {
            const templateIds = await db.select({ id: eventFormTemplates.id }).from(eventFormTemplates).where(eq12(eventFormTemplates.eventId, eventId)).then((results) => results.map((r) => r.id));
            if (templateIds.length > 0) {
              const fieldIds = await db.select({ id: formFields.id }).from(formFields).where(inArray(formFields.templateId, templateIds)).then((results) => results.map((r) => r.id));
              if (fieldIds.length > 0) {
                await db.delete(formFieldOptions).where(inArray(formFieldOptions.fieldId, fieldIds));
                console.log("Deleted form field options");
              }
              await db.delete(formFields).where(inArray(formFields.templateId, templateIds));
              console.log("Deleted form fields");
            }
          } catch (e) {
            console.error("Error deleting form fields:", e);
          }
          try {
            await db.delete(eventFormTemplates).where(eq12(eventFormTemplates.eventId, eventId));
            console.log("Deleted event form templates");
          } catch (e) {
            console.error("Error deleting form templates:", e);
          }
          try {
            await db.delete(eventAgeGroups).where(eq12(eventAgeGroups.eventId, eventId));
            console.log("Deleted event age groups");
          } catch (e) {
            console.error("Error deleting age groups:", e);
          }
          try {
            const [deletedEvent] = await db.delete(events).where(eq12(events.id, eventId)).returning();
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
          unreadCount: sql4`
              count(case when ${messages.createdAt} > ${chatParticipants.lastReadAt} then 1 end)
            `.mapWith(Number)
        }).from(chatParticipants).innerJoin(chatRooms, eq12(chatParticipants.chatRoomId, chatRooms.id)).leftJoin(messages, eq12(messages.chatRoomId, chatRooms.id)).where(eq12(chatParticipants.userId, req.user.id)).groupBy(chatRooms.id).orderBy(chatRooms.updatedAt);
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
        const [participant] = await db.select().from(chatParticipants).where(and3(
          eq12(chatParticipants.chatRoomId, roomId),
          eq12(chatParticipants.userId, req.user.id)
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
        }).from(messages).innerJoin(users, eq12(messages.userId, users.id)).where(eq12(messages.chatRoomId, roomId)).orderBy(messages.createdAt);
        await db.update(chatParticipants).set({
          lastReadAt: (/* @__PURE__ */ new Date()).toISOString()
        }).where(and3(
          eq12(chatParticipants.chatRoomId, roomId),
          eq12(chatParticipants.userId, req.user.id)
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
        const [requesterParticipant] = await db.select().from(chatParticipants).where(and3(
          eq12(chatParticipants.chatRoomId, roomId),
          eq12(chatParticipants.userId, req.user.id),
          eq12(chatParticipants.isAdmin, true)
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
    app2.get("/api/admin/email-templates", isAdmin, async (req, res) => {
      try {
        const { getEmailTemplates: getEmailTemplates2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await getEmailTemplates2(req, res);
      } catch (error) {
        console.error("Error fetching email templates:", error);
        res.status(500).send("Failed to fetch email templates");
      }
    });
    app2.post("/api/admin/email-templates", isAdmin, async (req, res) => {
      try {
        const { createEmailTemplate: createEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await createEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error creating email template:", error);
        res.status(500).send("Failed to create email template");
      }
    });
    app2.put("/api/admin/email-templates/:id", isAdmin, async (req, res) => {
      try {
        const { updateEmailTemplate: updateEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await updateEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error updating email template:", error);
        res.status(500).send("Failed to update email template");
      }
    });
    app2.delete("/api/admin/email-templates/:id", isAdmin, async (req, res) => {
      try {
        const { deleteEmailTemplate: deleteEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await deleteEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error deleting email template:", error);
        res.status(500).send("Failed to delete email template");
      }
    });
    app2.get("/api/admin/email-templates/preview", isAdmin, async (req, res) => {
      try {
        const { previewEmailTemplate: previewEmailTemplate2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
        await previewEmailTemplate2(req, res);
      } catch (error) {
        console.error("Error previewing email template:", error);
        res.status(500).send("Failed to preview email template");
      }
    });
    return httpServer;
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
}

// server/index.ts
init_db();
init_schema();

// server/create-admin.ts
init_db();
init_schema();
import { eq as eq13 } from "drizzle-orm";
async function createAdmin() {
  try {
    const [existingAdmin] = await db.select().from(users).where(eq13(users.email, "bperdomo@zoho.com")).limit(1);
    if (!existingAdmin) {
      const hashedPassword = await crypto.hash("!Nova2025");
      await db.insert(users).values({
        email: "bperdomo@zoho.com",
        username: "bperdomo@zoho.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isParent: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// server/index.ts
import { WebSocketServer as WebSocketServer2 } from "ws";
import path5 from "path";

// server/create-tables.ts
init_db();
import { sql as sql7 } from "drizzle-orm";

// server/migrations/create_email_templates.ts
init_db();
import { sql as sql5 } from "drizzle-orm";
async function createEmailTemplatesTable() {
  try {
    console.log("Creating email_templates table...");
    await db.execute(sql5`
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
import { sql as sql6 } from "drizzle-orm";
async function createEmailTemplateRoutingTable() {
  try {
    console.log("Creating email_template_routing table...");
    await db.execute(sql6`
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

// server/create-tables.ts
async function createTables() {
  try {
    console.log("Starting database migrations...");
    await db.execute(sql7`
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
var app = express2();
app.get(["/", "/_health"], (req, res) => {
  res.status(200).send("OK");
});
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use("/uploads", express2.static(path5.join(process.cwd(), "uploads")));
app.use("/api/files", upload_default);
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
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
    const PORT = process.env.PORT || 5e3;
    server = app.listen();
    server.close();
    registerRoutes(app);
    const wss = new WebSocketServer2({
      server,
      path: "/api/ws",
      verifyClient: (info) => {
        const protocol = info.req.headers["sec-websocket-protocol"];
        return !protocol || protocol !== "vite-hmr";
      }
    });
    wss.on("connection", (ws2) => {
      log("New WebSocket connection established");
      const idleTimeout = 5 * 60 * 1e3;
      let timeoutId = setTimeout(() => {
        log("Closing idle WebSocket connection");
        ws2.close();
      }, idleTimeout);
      ws2.on("message", (message) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          log("Closing idle WebSocket connection");
          ws2.close();
        }, idleTimeout);
        log("Received WebSocket message: " + message);
      });
      ws2.on("close", () => {
        clearTimeout(timeoutId);
        log("WebSocket connection closed");
      });
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Vite middleware setup complete");
    } else {
      app.use(express2.static(path5.join(process.cwd(), "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path5.join(process.cwd(), "dist", "index.html"));
      });
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
