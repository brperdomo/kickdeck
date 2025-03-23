import { db } from "../../db";
import { roles } from "../../db/schema";
import { sql } from "drizzle-orm";

/**
 * Migration to add role_permissions table for storing role-specific permissions
 */
export async function createRolePermissions() {
  console.log("Creating role_permissions table...");

  // First, create the table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(role_id, permission)
    )
  `);

  console.log("Role permissions table created");

  // Now define default permissions for each role
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

  // Flatten all permissions into a single array
  const allPermissions = Object.values(permissionGroups).flat();

  try {
    // Get all role IDs and names
    const roleRecords = await db.select().from(roles);

    // Assign default permissions to each role
    for (const role of roleRecords) {
      let rolePermissions: string[] = [];

      // Super admin gets all permissions
      if (role.name === "super_admin") {
        rolePermissions = allPermissions;
      } 
      // Tournament admin gets event, team, and game management
      else if (role.name === "tournament_admin") {
        rolePermissions = [
          ...permissionGroups.events,
          ...permissionGroups.teams,
          ...permissionGroups.games,
          "users.view",
          "reports.view"
        ];
      } 
      // Score admin gets score management and related views
      else if (role.name === "score_admin") {
        rolePermissions = [
          ...permissionGroups.scores,
          "games.view",
          "teams.view",
          "events.view",
          "reports.view"
        ];
      } 
      // Finance admin gets financial management
      else if (role.name === "finance_admin") {
        rolePermissions = [
          ...permissionGroups.finances,
          "events.view",
          "reports.view",
          "reports.export"
        ];
      }

      // Insert permissions for this role
      for (const permission of rolePermissions) {
        try {
          await db.execute(sql`
            INSERT INTO role_permissions (role_id, permission)
            VALUES (${role.id}, ${permission})
            ON CONFLICT (role_id, permission) DO NOTHING
          `);
        } catch (error) {
          console.error(`Error inserting permission ${permission} for role ${role.name}:`, error);
        }
      }
      
      console.log(`Added ${rolePermissions.length} permissions to role: ${role.name}`);
    }

    console.log("Default role permissions added successfully");
  } catch (error) {
    console.error("Error adding default role permissions:", error);
    throw error;
  }
}