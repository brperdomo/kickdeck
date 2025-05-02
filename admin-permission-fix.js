/**
 * Admin Permission Repair Tool
 * 
 * This script verifies and repairs admin role permissions.
 * Run this if administrators are experiencing access issues.
 * 
 * Usage:
 *   node admin-permission-fix.js
 *   
 * What it does:
 *   1. Verifies that the super_admin role exists and has all permissions
 *   2. Ensures the main admin user (bperdomo@zoho.com) has the super_admin role
 *   3. Provides a detailed log of user roles and permissions
 */

import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

// Connect to database
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function fixAdminPermissions() {
  try {
    await client.connect();
    console.log('\n======== ADMIN PERMISSIONS REPAIR TOOL ========\n');
    console.log('Connected to database');

    // 1. Find the super_admin role
    const roleResult = await client.query(
      "SELECT id FROM roles WHERE name = 'super_admin'"
    );

    if (roleResult.rows.length === 0) {
      console.error('❌ ERROR: super_admin role does not exist!');
      console.log('Creating super_admin role...');
      
      const newRoleResult = await client.query(
        "INSERT INTO roles (name, description, created_at) VALUES ('super_admin', 'Super Administrator role with full system access', NOW()) RETURNING id"
      );
      
      if (newRoleResult.rows.length === 0) {
        console.error('❌ ERROR: Failed to create super_admin role!');
        return;
      }
      
      roleId = newRoleResult.rows[0].id;
      console.log(`✅ Created super_admin role with ID: ${roleId}`);
    } else {
      const roleId = roleResult.rows[0].id;
      console.log(`✅ Found super_admin role with ID: ${roleId}`);
      
      // 2. Count existing permissions for this role
      const permissionCountResult = await client.query(
        'SELECT COUNT(*) FROM role_permissions WHERE role_id = $1',
        [roleId]
      );
      
      const permissionCount = parseInt(permissionCountResult.rows[0].count);
      console.log(`ℹ️ Role has ${permissionCount} permissions assigned`);
      
      // 3. Get all assigned permissions for this role
      const permissionsResult = await client.query(
        'SELECT permission FROM role_permissions WHERE role_id = $1',
        [roleId]
      );
      
      const existingPermissions = permissionsResult.rows.map(row => row.permission);
      
      // List of all expected permissions for super_admin
      const allPermissions = [
        'events.view', 'events.create', 'events.edit', 'events.delete',
        'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
        'games.view', 'games.create', 'games.edit', 'games.delete',
        'scores.view', 'scores.create', 'scores.edit', 'scores.delete',
        'finances.view', 'finances.edit', 'finances.export',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'reports.view', 'reports.export',
        'fields.view', 'fields.create', 'fields.edit', 'fields.delete',
        'scheduling.view', 'scheduling.create', 'scheduling.edit', 'scheduling.delete',
        'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
        'administrators.view', 'administrators.create', 'administrators.edit', 'administrators.delete',
        'organization.view', 'organization.edit',
        'members.view', 'members.create', 'members.edit', 'members.delete',
        'communications.view', 'communications.send', 'communications.templates',
        'clubs.view', 'clubs.create', 'clubs.edit', 'clubs.delete'
      ];
      
      // Check for missing permissions
      const missingPermissions = allPermissions.filter(
        permission => !existingPermissions.includes(permission)
      );
      
      if (missingPermissions.length > 0) {
        console.log(`⚠️ Found ${missingPermissions.length} missing permissions. Fixing...`);
        
        // Add all missing permissions
        for (const permission of missingPermissions) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [roleId, permission]
          );
          console.log(`  Added: ${permission}`);
        }
        
        console.log('✅ Fixed missing permissions');
      } else {
        console.log('✅ All required permissions are present');
      }
      
      // 4. Find the admin user
      const adminResult = await client.query(
        "SELECT id FROM users WHERE email = 'bperdomo@zoho.com'"
      );
      
      if (adminResult.rows.length === 0) {
        console.log('ℹ️ Main admin user not found - this is expected in some environments');
      } else {
        const adminId = adminResult.rows[0].id;
        console.log(`✅ Found main admin user with ID: ${adminId}`);
        
        // 5. Check if admin has super_admin role
        const roleAssignmentResult = await client.query(
          'SELECT * FROM admin_roles WHERE user_id = $1 AND role_id = $2',
          [adminId, roleId]
        );
        
        if (roleAssignmentResult.rows.length === 0) {
          console.log('⚠️ Admin user is missing super_admin role. Fixing...');
          
          await client.query(
            'INSERT INTO admin_roles (user_id, role_id, created_at) VALUES ($1, $2, NOW())',
            [adminId, roleId]
          );
          
          console.log('✅ Assigned super_admin role to the admin user');
        } else {
          console.log('✅ Admin user has super_admin role properly assigned');
        }
        
        // 6. Check all roles for admin user
        const userRolesResult = await client.query(`
          SELECT r.name
          FROM admin_roles ar
          JOIN roles r ON ar.role_id = r.id
          WHERE ar.user_id = $1
        `, [adminId]);
        
        if (userRolesResult.rows.length > 0) {
          console.log('\nℹ️ Admin roles:');
          userRolesResult.rows.forEach(row => {
            console.log(`  - ${row.name}`);
          });
        }
      }
      
      // 7. Bonus: Check for any admins without roles
      const adminsWithoutRolesResult = await client.query(`
        SELECT u.id, u.email
        FROM users u
        WHERE u.is_admin = true
        AND NOT EXISTS (
          SELECT 1 FROM admin_roles ar WHERE ar.user_id = u.id
        )
      `);
      
      if (adminsWithoutRolesResult.rows.length > 0) {
        console.log('\n⚠️ WARNING: Found admin users without any role assignments:');
        adminsWithoutRolesResult.rows.forEach(row => {
          console.log(`  - ${row.email} (ID: ${row.id})`);
        });
        console.log('   These users may experience access issues.');
      }
    }
    
    console.log('\n✅ Admin permission check and fix completed successfully!');
    console.log('\nPlease log out and log back in to see the changes. If issues persist, check the browser console for errors.');
    
  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
  } finally {
    await client.end();
  }
}

// Run the script
fixAdminPermissions();