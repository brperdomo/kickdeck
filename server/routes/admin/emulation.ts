import { Request, Response } from 'express';
import { 
  startEmulation, 
  stopEmulation, 
  getEmulatedUserId 
} from '../../services/emulationService';
import { db } from '@db/index';
import { users, adminRoles, roles } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Get all administrators that can be emulated (non-super admins)
 * Only accessible by super admins
 */
export async function getEmulatableAdmins(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if the user is a super admin
    const isSuperAdmin = await db.query.adminRoles.findFirst({
      where: and(
        eq(adminRoles.userId, req.user.id),
        eq(adminRoles.roleId, 1) // 1 is super_admin role ID
      )
    });

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admins can view emulatable administrators' });
    }

    // Get all administrators who are not super admins
    const admins = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roles: roles.name
    })
    .from(users)
    .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
    .leftJoin(roles, eq(adminRoles.roleId, roles.id))
    .where(
      and(
        eq(users.isAdmin, true),
        // Exclude super admins - use not equal for SQL comparison
        sql`${roles.name} != 'super_admin'`
      )
    );

    // Group administrators by ID to collect all roles
    const adminMap = new Map();
    
    admins.forEach(admin => {
      if (!adminMap.has(admin.id)) {
        adminMap.set(admin.id, {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          roles: []
        });
      }
      
      if (admin.roles) {
        adminMap.get(admin.id).roles.push(admin.roles);
      }
    });

    return res.json(Array.from(adminMap.values()));
  } catch (error) {
    console.error('Error fetching emulatable admins:', error);
    return res.status(500).json({ error: 'Failed to fetch emulatable administrators' });
  }
}

/**
 * Start emulating an administrator
 * Only accessible by super admins
 */
export async function startEmulatingAdmin(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { adminId } = req.params;
    
    if (!adminId) {
      return res.status(400).json({ error: 'Missing administrator ID' });
    }

    const emulationToken = await startEmulation(req.user.id, parseInt(adminId));
    
    if (!emulationToken) {
      return res.status(403).json({ 
        error: 'Failed to start emulation. You must be a super admin and cannot emulate other super admins.'
      });
    }

    // Fetch the emulated admin's details
    const emulatedAdmin = await db.query.users.findFirst({
      where: eq(users.id, parseInt(adminId))
    });

    return res.json({ 
      token: emulationToken,
      emulatedAdmin: {
        id: emulatedAdmin?.id,
        email: emulatedAdmin?.email,
        firstName: emulatedAdmin?.firstName,
        lastName: emulatedAdmin?.lastName
      }
    });
  } catch (error) {
    console.error('Error starting emulation:', error);
    return res.status(500).json({ error: 'Failed to start emulation' });
  }
}

/**
 * Stop emulating an administrator
 */
export async function stopEmulatingAdmin(req: Request, res: Response) {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing emulation token' });
    }

    const success = stopEmulation(token);
    
    if (!success) {
      return res.status(404).json({ error: 'Invalid or expired emulation token' });
    }

    return res.json({ message: 'Emulation stopped successfully' });
  } catch (error) {
    console.error('Error stopping emulation:', error);
    return res.status(500).json({ error: 'Failed to stop emulation' });
  }
}

/**
 * Get current emulation status
 */
export async function getEmulationStatus(req: Request, res: Response) {
  try {
    const emulationToken = req.headers['x-emulation-token'] as string;
    
    if (!emulationToken) {
      return res.json({ emulating: false });
    }

    const emulatedUserId = getEmulatedUserId(emulationToken);
    
    if (!emulatedUserId) {
      return res.json({ emulating: false });
    }

    // Fetch the emulated admin's details
    const emulatedAdmin = await db.query.users.findFirst({
      where: eq(users.id, emulatedUserId)
    });

    return res.json({
      emulating: true,
      token: emulationToken,
      emulatedAdmin: {
        id: emulatedAdmin?.id,
        email: emulatedAdmin?.email,
        firstName: emulatedAdmin?.firstName,
        lastName: emulatedAdmin?.lastName
      }
    });
  } catch (error) {
    console.error('Error getting emulation status:', error);
    return res.status(500).json({ error: 'Failed to get emulation status' });
  }
}