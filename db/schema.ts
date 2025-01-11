import { pgTable, text, serial, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define available roles and their hierarchy
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EVENT_MANAGER: 'EVENT_MANAGER',
  TEAM_MANAGER: 'TEAM_MANAGER',
} as const;

// Define available permissions
export const Permission = {
  MANAGE_ADMINS: 'MANAGE_ADMINS',
  MANAGE_EVENTS: 'MANAGE_EVENTS',
  MANAGE_TEAMS: 'MANAGE_TEAMS',
  VIEW_EVENTS: 'VIEW_EVENTS',
  VIEW_TEAMS: 'VIEW_TEAMS',
  VIEW_REPORTS: 'VIEW_REPORTS',
} as const;

// Role to permissions mapping
export const RolePermissions: Record<keyof typeof UserRole, Array<keyof typeof Permission>> = {
  SUPER_ADMIN: [
    'MANAGE_ADMINS',
    'MANAGE_EVENTS',
    'MANAGE_TEAMS',
    'VIEW_EVENTS',
    'VIEW_TEAMS',
    'VIEW_REPORTS',
  ],
  ADMIN: [
    'MANAGE_EVENTS',
    'MANAGE_TEAMS',
    'VIEW_EVENTS',
    'VIEW_TEAMS',
    'VIEW_REPORTS',
  ],
  EVENT_MANAGER: [
    'MANAGE_EVENTS',
    'VIEW_EVENTS',
    'VIEW_TEAMS',
    'VIEW_REPORTS',
  ],
  TEAM_MANAGER: [
    'MANAGE_TEAMS',
    'VIEW_TEAMS',
    'VIEW_EVENTS',
  ],
};

// Role table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  permissions: jsonb("permissions").notNull().$type<Array<keyof typeof Permission>>(),
  createdAt: text("createdAt").notNull().default(new Date().toISOString()),
});

// Users table with role reference
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  phone: text("phone"),
  isParent: boolean("isParent").default(false).notNull(),
  roleId: integer("roleId").references(() => roles.id),
  createdAt: text("createdAt").notNull().default(new Date().toISOString()),
});

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  isParent: z.boolean(),
  roleId: z.number().optional(),
});

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type SelectRole = typeof roles.$inferSelect;