
import express, { Router } from "express";
import path from "path";
import http from "http";
import { db } from "@db";
import { 
  users, 
  roles,
  adminRoles
} from "@db/schema";

// Import route handlers
import authRouter from "./routes/auth";

// Register all routes
export function registerRoutes(app: express.Application) {
  const apiRouter = Router();
  
  // Mount authentication routes
  apiRouter.use("/auth", authRouter);
  
  // Add other API routes here
  // apiRouter.use("/users", userRouter);
  // apiRouter.use("/admin", adminRouter);
  
  // Mount all API routes under /api
  app.use("/api", apiRouter);
  
  // Create and return HTTP server
  const server = http.createServer(app);
  
  return server;
}
