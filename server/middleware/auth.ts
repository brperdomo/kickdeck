import { Request, Response, NextFunction } from "express";

// Enhanced admin authentication middleware with role-based access
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[Admin Auth] Session ID: ${req.sessionID}`);
  console.log(`[Admin Auth] isAuthenticated: ${req.isAuthenticated()}`);
  console.log(`[Admin Auth] User: ${req.user ? 'exists' : 'null'}`);
  console.log(`[Admin Auth] User ID: ${req.user?.id}`);
  console.log(`[Admin Auth] isAdmin flag: ${req.user?.isAdmin}`);
  
  if (!req.isAuthenticated()) {
    console.log(`[Admin Auth] Authentication failed - not authenticated`);
    return res.status(401).json({ error: "Authentication required. Please log in as an admin." });
  }

  const user = req.user as any;
  
  // First check the isAdmin flag
  if (user?.isAdmin) {
    console.log(`[Admin Auth] Authentication successful via isAdmin flag`);
    return next();
  }

  // If isAdmin flag is not set, check for admin roles in database
  try {
    const { db } = await import('@db');
    const { adminRoles, roles } = await import('@db/schema');
    const { eq } = await import('drizzle-orm');
    
    const userRoles = await db
      .select({ roleName: roles.name })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, user.id));
    
    const roleNames = userRoles.map(r => r.roleName);
    console.log(`[Admin Auth] User roles from database: ${roleNames.join(', ')}`);
    
    const hasAdminRole = roleNames.includes('super_admin') || 
                         roleNames.includes('tournament_admin') ||
                         roleNames.includes('finance_admin') ||
                         roleNames.includes('score_admin');
    
    if (hasAdminRole) {
      console.log(`[Admin Auth] Authentication successful via role-based access`);
      return next();
    }
  } catch (error) {
    console.error(`[Admin Auth] Error checking roles:`, error);
  }

  console.log(`[Admin Auth] Authorization failed - not admin`);
  return res.status(403).json({ error: "Admin privileges required for this action." });
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
export const requireAuth = validateAuth;
