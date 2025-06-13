import { Request, Response, NextFunction } from "express";

// Enhanced admin authentication middleware with debugging
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[Banking Auth] Session ID: ${req.sessionID}`);
  console.log(`[Banking Auth] isAuthenticated: ${req.isAuthenticated()}`);
  console.log(`[Banking Auth] User: ${req.user ? 'exists' : 'null'}`);
  console.log(`[Banking Auth] isAdmin: ${req.user?.isAdmin}`);
  
  if (!req.isAuthenticated()) {
    console.log(`[Banking Auth] Authentication failed - not authenticated`);
    return res.status(401).json({ error: "Authentication required for banking access" });
  }

  if (!req.user?.isAdmin) {
    console.log(`[Banking Auth] Authorization failed - not admin`);
    return res.status(403).json({ error: "Admin privileges required for banking access" });
  }

  console.log(`[Banking Auth] Authentication successful for banking access`);
  next();
};

// Middleware to validate authentication only (not admin)
export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Legacy support
export const authenticateAdmin = isAdmin;
export const validateAdmin = isAdmin;
