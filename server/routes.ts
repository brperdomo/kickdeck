import type { Express } from "express";
import { setupAuth } from "./auth";
import { log } from "./vite";

export function registerRoutes(app: Express): void {
  try {
    // Set up authentication routes and middleware
    setupAuth(app);
    log("Authentication routes registered successfully");
  } catch (error) {
    log("Error registering routes: " + (error as Error).message);
    throw error;
  }
}