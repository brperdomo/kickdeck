import { pgTable, serial, varchar, text, date, timestamp } from "drizzle-orm/pg-core";

// Define product updates table schema
export const productUpdates = pgTable("product_updates", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 20 }).notNull(),
  releaseDate: date("release_date").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // e.g., "Authentication", "UI", "Event Management"
  isHighlighted: boolean("is_highlighted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define categories for updates
export const UPDATE_CATEGORIES = {
  AUTHENTICATION: "Authentication & User Management",
  UI: "User Interface & Experience",
  EVENTS: "Event Management",
  TEAMS: "Team & Player Management",
  FINANCIAL: "Financial Features",
  ADMIN: "Administrative Tools",
  TECHNICAL: "Technical Improvements",
  COMMUNICATION: "Communication Features"
};