/**
 * Schema Updates
 * 
 * This file contains schema updates that are added after the main schema.js file.
 * It serves as a place to add new tables and modifications without altering the main schema file.
 */

import { pgTable, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { events, eventAgeGroups } from "./schema.js";

/**
 * Event Age Group Eligibility Settings
 * 
 * This table stores the eligibility settings for age groups within events.
 * It's separate from event_age_groups to avoid foreign key constraints with brackets.
 */
export const eventAgeGroupEligibility = pgTable(
  "event_age_group_eligibility",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id),
    ageGroupId: integer("age_group_id")
      .notNull()
      .references(() => eventAgeGroups.id),
    isEligible: boolean("is_eligible").notNull().default(true)
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.eventId, table.ageGroupId] })
    };
  }
);