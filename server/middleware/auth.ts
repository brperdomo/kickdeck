import { Request, Response, NextFunction } from "express";

// Enhanced admin authentication middleware with role-based access
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const sessionInfo = {
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user,
    userId: req.user?.id,
    userEmail: req.user?.email,
    isAdmin: req.user?.isAdmin
  };
  
  console.log(`[Admin Auth] ${req.method} ${req.path} - Session info:`, sessionInfo);
  
  if (!req.isAuthenticated()) {
    console.log(`[Admin Auth] FAILED - User not authenticated`);
    return res.status(401).json({ 
      error: "Authentication required. Please log in as an admin.",
      debug: {
        sessionID: req.sessionID,
        path: req.path,
        method: req.method
      }
    });
  }

  const user = req.user as any;
  
  if (!user) {
    console.log(`[Admin Auth] FAILED - User object is null despite isAuthenticated=true`);
    return res.status(401).json({ 
      error: "User session invalid. Please log in again.",
      debug: {
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated()
      }
    });
  }
  
  // First check the isAdmin flag
  if (user?.isAdmin) {
    console.log(`[Admin Auth] SUCCESS - Admin access granted via isAdmin flag for user ${user.email}`);
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

// Permission-based middleware
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { checkPermission } = await import('./permissions');
      const hasPermission = await checkPermission(req, permission);
      
      if (!hasPermission) {
        return res.status(403).json({ error: `Permission required: ${permission}` });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Legacy support
export const authenticateAdmin = isAdmin;
export const validateAdmin = isAdmin;
export const requireAuth = validateAuth;
