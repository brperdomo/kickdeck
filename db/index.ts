import dotenv from "dotenv";
dotenv.config();

import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let db: any;

if (process.env.DATABASE_URL.includes("neon.tech") || process.env.DATABASE_URL.includes("neon.")) {
  // Neon serverless driver for cloud deployments
  const { drizzle: neonDrizzle } = await import("drizzle-orm/neon-serverless");
  const ws = (await import("ws")).default;
  db = neonDrizzle({
    connection: process.env.DATABASE_URL,
    schema,
    ws: ws,
  });
} else {
  // Standard pg driver for local development
  const { drizzle: pgDrizzle } = await import("drizzle-orm/node-postgres");
  db = pgDrizzle({
    connection: process.env.DATABASE_URL,
    schema,
  });
}

export { db };
