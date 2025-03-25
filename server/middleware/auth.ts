import { Request, Response, NextFunction } from "express";

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  next();
};
import { Request, Response, NextFunction } from "express";

// Admin middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }

  if (!req.user?.isAdmin) {
    return res.status(403).send("Not authorized");
  }

  next();
};
import { Request, Response, NextFunction } from 'express';

// Middleware to validate authentication
export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[Auth Debug] Request headers: ${JSON.stringify(req.headers)}`);
  console.log(`[Auth Debug] isAuthenticated: ${req.isAuthenticated()}`);
  console.log(`[Auth Debug] Session ID: ${req.sessionID}`);
  console.log(`[Auth Debug] Session: ${JSON.stringify(req.session)}`);
  console.log(`[Auth Debug] User: ${JSON.stringify(req.user)}`);
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Middleware to validate admin privileges
export const validateAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  next();
};
