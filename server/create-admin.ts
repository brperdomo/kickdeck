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
      console.log("Creating new admin user...");
      const password = "!Nova2025";
      const hashedPassword = await crypto.hash(password);
      console.log("Password hashed successfully");

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

      // Verify the password works
      const [newAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.email, "bperdomo@zoho.com"))
        .limit(1);

      if (newAdmin) {
        const passwordVerifies = await crypto.compare(password, newAdmin.password);
        console.log("Password verification check:", passwordVerifies ? "SUCCESS" : "FAILED");
      }
    } else {
      console.log("Admin user already exists");
      // Test existing admin password
      const passwordVerifies = await crypto.compare("!Nova2025", existingAdmin.password);
      console.log("Existing admin password verification:", passwordVerifies ? "SUCCESS" : "FAILED");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}