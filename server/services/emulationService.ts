import { Request, Response, NextFunction } from 'express';
import { db } from '@db/index';
import { adminRoles, users } from '@db/schema';
import { eq, and } from 'drizzle-orm';

interface EmulationSession {
  actualUserId: number;
  emulatedUserId: number;
  expiresAt: Date;
}

// Store emulation sessions in memory
// In a production app, this should be stored in Redis or another distributed cache
const emulationSessions: Record<string, EmulationSession> = {};

/**
 * Generate a unique emulation token
 */
function generateEmulationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Start an emulation session for a super admin to emulate another admin
 */
export async function startEmulation(
  superAdminId: number, 
  adminToEmulateId: number
): Promise<string | null> {
  try {
    // Verify the requesting user is a super admin
    const superAdminRole = await db.query.adminRoles.findFirst({
      where: and(
        eq(adminRoles.userId, superAdminId),
        eq(adminRoles.roleId, 1) // 1 is super_admin role
      )
    });

    if (!superAdminRole) {
      console.error(`User ${superAdminId} is not a super admin`);
      return null;
    }

    // Verify the user to emulate exists and is not a super admin
    const adminToEmulate = await db.query.users.findFirst({
      where: eq(users.id, adminToEmulateId)
    });

    if (!adminToEmulate || !adminToEmulate.isAdmin) {
      console.error(`User ${adminToEmulateId} is not an admin`);
      return null;
    }

    // Check if the user to emulate is also a super admin (not allowed)
    const isTargetSuperAdmin = await db.query.adminRoles.findFirst({
      where: and(
        eq(adminRoles.userId, adminToEmulateId),
        eq(adminRoles.roleId, 1) // 1 is super_admin role
      )
    });

    if (isTargetSuperAdmin) {
      console.error(`Cannot emulate super admin ${adminToEmulateId}`);
      return null;
    }

    // Generate token and create session
    const token = generateEmulationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // Session expires in 2 hours

    emulationSessions[token] = {
      actualUserId: superAdminId,
      emulatedUserId: adminToEmulateId,
      expiresAt
    };

    return token;
  } catch (error) {
    console.error('Error starting emulation session:', error);
    return null;
  }
}

/**
 * Stop an emulation session
 */
export function stopEmulation(token: string): boolean {
  if (emulationSessions[token]) {
    delete emulationSessions[token];
    return true;
  }
  return false;
}

/**
 * Get the currently emulated user ID if a session exists
 */
export function getEmulatedUserId(token: string): number | null {
  const session = emulationSessions[token];
  
  if (!session) {
    return null;
  }

  // Check if session has expired
  if (new Date() > session.expiresAt) {
    delete emulationSessions[token];
    return null;
  }

  return session.emulatedUserId;
}

/**
 * Middleware to handle emulation sessions
 */
export function emulationMiddleware(req: Request, res: Response, next: NextFunction) {
  const emulationToken = req.headers['x-emulation-token'] as string;
  
  if (emulationToken && emulationSessions[emulationToken]) {
    const session = emulationSessions[emulationToken];
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      delete emulationSessions[emulationToken];
      console.log(`Emulation session expired: ${emulationToken}`);
    } else {
      // Store both the actual and emulated user IDs in the request
      (req as any).actualUserId = session.actualUserId;
      (req as any).emulatedUserId = session.emulatedUserId;
      
      // Log detailed emulation status (only on authorization routes to avoid log spam)
      if (req.path.includes('/api/user') || req.path.includes('/api/admin/permissions')) {
        console.log(`Emulating user ID ${session.emulatedUserId} from actual user ${session.actualUserId} on path ${req.path}`);
      }
    }
  }
  
  next();
}