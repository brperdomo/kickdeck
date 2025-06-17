import { Request, Response, NextFunction } from "express";

// Enhanced admin authentication middleware with role-based access
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[Admin Auth] Session ID: ${req.sessionID}`);
  console.log(`[Admin Auth] isAuthenticated: ${req.isAuthenticated()}`);
  console.log(`[Admin Auth] User: ${req.user ? 'exists' : 'null'}`);
  console.log(`[Admin Auth] isAdmin flag: ${req.user?.isAdmin}`);
  
  if (!req.isAuthenticated()) {
    console.log(`[Admin Auth] Authentication failed - not authenticated`);
    return res.status(401).json({ error: "Authentication required. Please log in as an admin." });
  }

  // Check for admin access via roles or isAdmin flag
  const user = req.user as any;
  const hasAdminRole = user?.roles?.includes('super_admin') || 
                       user?.roles?.includes('tournament_admin') ||
                       user?.roles?.includes('finance_admin') ||
                       user?.roles?.includes('score_admin');
  
  console.log(`[Admin Auth] Has admin roles: ${hasAdminRole}`);
  console.log(`[Admin Auth] User roles: ${user?.roles}`);
  
  if (!user?.isAdmin && !hasAdminRole) {
    console.log(`[Admin Auth] Authorization failed - not admin`);
    return res.status(403).json({ error: "Admin privileges required for this action." });
  }

  console.log(`[Admin Auth] Authentication successful for admin access`);
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
