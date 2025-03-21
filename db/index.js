/**
 * Database connection module for production environment
 * Specially designed to work with ESM imports
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('Database URL is required');
}

// Create Postgres client
const client = postgres(databaseUrl, { 
  max: 10,
  ssl: process.env.NODE_ENV === 'production'
});

// Create Drizzle instance
export const db = drizzle(client);

// Export client for potential direct usage
export const pgClient = client;