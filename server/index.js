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
      // Configure production mode with enhanced static file handling
      configureProductionServer(app);
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
import { configureProductionServer } from './production-server.js';
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
