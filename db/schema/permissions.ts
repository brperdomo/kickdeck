import { pgTable, serial, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { roles } from "../schema";

/**
 * Table for storing role-specific permissions
 */
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permission: text("permission").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniquePermission: uniqueIndex("role_permission_unique_idx").on(table.roleId, table.permission),
  };
});

// Schema definitions for validation
export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
export const selectRolePermissionSchema = createSelectSchema(rolePermissions);

// Type exports
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;

/**
 * Permission definitions for the application
 */
export const PERMISSIONS = {
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
};

/**
 * Permission groups for UI organization and bulk assignment
 */
export const PERMISSION_GROUPS = {
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
  ]
};

/**
 * Default permission sets for each role type
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  tournament_admin: [
    ...PERMISSION_GROUPS.EVENTS,
    ...PERMISSION_GROUPS.TEAMS,
    ...PERMISSION_GROUPS.GAMES,
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
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ]
};