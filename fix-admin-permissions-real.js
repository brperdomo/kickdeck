/**
 * Admin Permissions Fix Tool (Comprehensive)
 * 
 * This script performs a thorough fix of admin permissions by:
 * 1. Ensuring all admin users have the super_admin role
 * 2. Ensuring the super_admin role has all required permissions
 * 3. Adding temporary debug code to the permissions endpoint to log errors
 * 
 * This should resolve issues with admin tool access.
 */

import 'dotenv/config';
import { promises as fs } from 'fs';
import pg from 'pg';
const { Client } = pg;

// Connect to database
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function fixAdminPermissions() {
  try {
    await client.connect();
    console.log('\n======== COMPREHENSIVE ADMIN PERMISSIONS FIX TOOL ========\n');
    console.log('Connected to database');

    // 1. Verify super_admin role exists
    console.log('\nStep 1: Verifying super_admin role...');
    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'super_admin'"
    );

    let superAdminRoleId;
    if (roleResult.rows.length === 0) {
      console.log('⚠️ super_admin role does not exist! Creating it...');
      
      const newRoleResult = await client.query(
        "INSERT INTO roles (name, description, created_at) VALUES ('super_admin', 'Full system access with all permissions', NOW()) RETURNING id"
      );
      
      superAdminRoleId = newRoleResult.rows[0].id;
      console.log(`✅ Created super_admin role with ID: ${superAdminRoleId}`);
    } else {
      superAdminRoleId = roleResult.rows[0].id;
      console.log(`✅ Found super_admin role with ID: ${superAdminRoleId}`);
    }

    // 2. Define all needed permissions (ensure this matches PERMISSIONS object)
    console.log('\nStep 2: Defining and updating all permissions...');
    const allPermissions = [
      'events.view', 'events.create', 'events.edit', 'events.delete',
      'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
      'games.view', 'games.create', 'games.edit', 'games.delete',
      'scores.view', 'scores.create', 'scores.edit', 'scores.delete',
      'finances.view', 'finances.create', 'finances.edit', 'finances.delete', 'finances.approve',
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'reports.view', 'reports.export',
      'settings.view', 'settings.edit',
      'administrators.view', 'administrators.create', 'administrators.edit', 'administrators.delete',
      'organization.view', 'organization.edit',
      'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
      'members.view',
      'scheduling.view', 'scheduling.create', 'scheduling.edit', 'scheduling.delete',
      'files.view', 'files.upload', 'files.delete', 'files.folders'
    ];

    // 3. Reset permissions for super_admin role
    console.log('Clearing existing permissions to avoid duplicates...');
    await client.query(
      'DELETE FROM role_permissions WHERE role_id = $1',
      [superAdminRoleId]
    );

    // 4. Add all permissions to super_admin role
    console.log('Adding all permissions to super_admin role...');
    for (const permission of allPermissions) {
      await client.query(
        'INSERT INTO role_permissions (role_id, permission, created_at) VALUES ($1, $2, NOW())',
        [superAdminRoleId, permission]
      );
    }

    // 5. Get all admin users
    console.log('\nStep 3: Fixing admin user role assignments...');
    const adminUsers = await client.query(
      'SELECT id, email FROM users WHERE "isAdmin" = true'
    );

    console.log(`Found ${adminUsers.rows.length} admin users.`);

    // 6. Ensure all admin users have super_admin role
    for (const user of adminUsers.rows) {
      console.log(`Checking roles for user: ${user.email}...`);
      
      const roleAssignment = await client.query(
        'SELECT * FROM admin_roles WHERE user_id = $1 AND role_id = $2',
        [user.id, superAdminRoleId]
      );
      
      if (roleAssignment.rows.length === 0) {
        console.log(`⚠️ User ${user.email} is missing super_admin role. Adding it...`);
        
        await client.query(
          'INSERT INTO admin_roles (user_id, role_id, created_at) VALUES ($1, $2, NOW())',
          [user.id, superAdminRoleId]
        );
        
        console.log(`✅ Added super_admin role to user ${user.email}`);
      } else {
        console.log(`✅ User ${user.email} already has super_admin role`);
      }
    }

    // 7. Patch permissions endpoint to fix permission conversion bug
    console.log('\nStep 4: Patching permissions API endpoint...');
    
    try {
      // Find and read the current permissions.ts file
      const permissionsFilePath = 'server/routes/admin/permissions.ts';
      const permissionsCode = await fs.readFile(permissionsFilePath, 'utf8');
      
      // Look for the bug and fix it if found
      if (permissionsCode.includes('const allPermissions = Object.values(PERMISSIONS);')) {
        console.log('⚠️ Found potential bug in permissions endpoint. Creating a fix...');
        
        // Create the fixed version
        const fixedCode = permissionsCode.replace(
          'const allPermissions = Object.values(PERMISSIONS);',
          'const allPermissions = Object.values(PERMISSIONS).flat();'
        ).replace(
          'const allPermissions = Object.values(PERMISSIONS);',
          'const allPermissions = Object.values(PERMISSIONS).flat();'
        );
        
        // Create a backup
        await fs.writeFile(`${permissionsFilePath}.bak`, permissionsCode);
        
        // Write the fixed file
        await fs.writeFile(permissionsFilePath, fixedCode);
        
        console.log('✅ Created fix for permissions API endpoint');
        console.log('⚠️ You will need to restart your application for this change to take effect');
      } else {
        console.log('ℹ️ No permission endpoint issues detected.');
      }
    } catch (error) {
      console.log('Error while attempting to patch permissions file: ', error);
      console.log('⚠️ You may need to manually fix the permissions.ts file');
    }

    // 8. Verify permissions count
    const permissionCount = await client.query(
      'SELECT COUNT(*) FROM role_permissions WHERE role_id = $1',
      [superAdminRoleId]
    );
    
    console.log(`\nTotal permissions assigned to super_admin role: ${permissionCount.rows[0].count}`);
    
    console.log('\n✅ Admin permissions fix completed successfully!');
    console.log('\nPlease log out and log back in to see the changes. If issues persist, restart the application.');
    
  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
  } finally {
    await client.end();
  }
}

// Run the script
fixAdminPermissions();