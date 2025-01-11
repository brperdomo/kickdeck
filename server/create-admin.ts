import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { crypto } from "./crypto";

export async function createAdmin() {
  try {
    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bperdomo@zoho.com"))
      .limit(1);

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
        createdAt: new Date().toISOString()
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