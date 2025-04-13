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

    // First, get all admin users excluding those who are super admins
    // This gets us distinct users who don't have the super_admin role
    const adminUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName
    })
    .from(users)
    .where(
      and(
        eq(users.isAdmin, true),
        // Exclude users who have super_admin role (using NOT EXISTS subquery)
        sql`NOT EXISTS (
          SELECT 1 FROM ${adminRoles} ar 
          JOIN ${roles} r ON ar.role_id = r.id 
          WHERE ar.user_id = ${users.id} AND r.name = 'super_admin'
        )`
      )
    );
    
    // Now get all the roles for these users in a separate query
    // Use parameterized query to avoid SQL injection and syntax errors
    const adminRolesData = await db.select({
      userId: adminRoles.userId,
      roleName: roles.name
    })
    .from(adminRoles)
    .innerJoin(roles, eq(adminRoles.roleId, roles.id))
    .where(
      adminUsers.length > 0 
        ? sql`${adminRoles.userId} IN (${sql.join(adminUsers.map(admin => admin.id))})`
        : sql`1=0` // If no admin users, return empty set
    );

    // Create a map of admin users with their roles
    const adminMap = new Map();
    
    // First add all admin users to the map
    adminUsers.forEach((admin) => {
      adminMap.set(admin.id, {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        roles: []
      });
    });
    
    // Then add all their roles
    adminRolesData.forEach((roleData) => {
      if (adminMap.has(roleData.userId)) {
        adminMap.get(roleData.userId).roles.push(roleData.roleName);
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

    // Fetch the emulated admin's details with their roles
    const emulatedAdmin = await db.query.users.findFirst({
      where: eq(users.id, parseInt(adminId))
    });

    // Fetch the user's roles
    const userRoles = await db.select({
      roleName: roles.name
    })
    .from(adminRoles)
    .innerJoin(roles, eq(adminRoles.roleId, roles.id))
    .where(eq(adminRoles.userId, parseInt(adminId)));

    const roleNames = userRoles.map((r) => r.roleName);

    return res.json({ 
      token: emulationToken,
      emulatedAdmin: {
        id: emulatedAdmin?.id,
        email: emulatedAdmin?.email,
        firstName: emulatedAdmin?.firstName,
        lastName: emulatedAdmin?.lastName,
        roles: roleNames
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

    // Fetch the user's roles
    const userRoles = await db.select({
      roleName: roles.name
    })
    .from(adminRoles)
    .innerJoin(roles, eq(adminRoles.roleId, roles.id))
    .where(eq(adminRoles.userId, emulatedUserId));

    const roleNames = userRoles.map((r) => r.roleName);

    return res.json({
      emulating: true,
      token: emulationToken,
      emulatedAdmin: {
        id: emulatedAdmin?.id,
        email: emulatedAdmin?.email,
        firstName: emulatedAdmin?.firstName,
        lastName: emulatedAdmin?.lastName
      },
      // Include roles separately as well for easier access
      roles: roleNames
    });
  } catch (error) {
    console.error('Error getting emulation status:', error);
    return res.status(500).json({ error: 'Failed to get emulation status' });
  }
}