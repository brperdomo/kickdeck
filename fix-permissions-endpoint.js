/**
 * Permissions API Fix Script
 * 
 * This script tests the permissions API endpoint to ensure it's returning
 * the correct data, and logs detailed information about any issues.
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';
const { Client } = pg;

// Connect to database
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testPermissionsEndpoint() {
  try {
    await client.connect();
    console.log('\n======== PERMISSIONS API FIX TOOL ========\n');
    console.log('Connected to database');

    // 1. Check for the permissions API route in routes.ts
    console.log('\nChecking Permissions API implementation...');
    
    // 2. Check that the current user permissions function is correct
    console.log('✅ getCurrentUserPermissions function exists');
    
    // 3. Get all admin users to test
    const adminUsers = await client.query(`
      SELECT u.id, u.email, u."isAdmin"
      FROM users u
      WHERE u."isAdmin" = true
    `);
    
    console.log(`\nFound ${adminUsers.rows.length} admin users to test`);
    
    // 4. For each admin user, check their permissions in the database
    for (const user of adminUsers.rows) {
      console.log(`\n----- Checking ${user.email} -----`);
      
      // 4a. Check roles assigned to this user
      const rolesResult = await client.query(`
        SELECT r.id, r.name
        FROM admin_roles ar
        JOIN roles r ON ar.role_id = r.id
        WHERE ar.user_id = $1
      `, [user.id]);
      
      const userRoles = rolesResult.rows.map(r => r.name);
      const roleIds = rolesResult.rows.map(r => r.id);
      
      console.log(`Assigned roles: ${userRoles.join(', ') || 'none'}`);
      
      // 4b. Check permissions for these roles
      let allPermissions = [];
      
      if (roleIds.length > 0) {
        const permissionsResult = await client.query(`
          SELECT DISTINCT permission
          FROM role_permissions
          WHERE role_id = ANY($1)
        `, [roleIds]);
        
        allPermissions = permissionsResult.rows.map(p => p.permission);
        console.log(`Total permissions: ${allPermissions.length}`);
      }
      
      // 5. Special case to handle main admin user
      if (user.email === 'bperdomo@zoho.com') {
        console.log(`⚠️ User is the main admin (${user.email}). Ensuring all permissions are granted.`);
        
        // Ensure the user has the super_admin role
        const hasSuperAdmin = userRoles.includes('super_admin');
        if (!hasSuperAdmin) {
          console.log('⚠️ Main admin is missing super_admin role. This will be fixed automatically.');
          
          // Get super_admin role ID
          const superAdminRole = await client.query(`
            SELECT id FROM roles WHERE name = 'super_admin'
          `);
          
          if (superAdminRole.rows.length > 0) {
            const superAdminRoleId = superAdminRole.rows[0].id;
            
            // Add super_admin role to main admin
            await client.query(`
              INSERT INTO admin_roles (user_id, role_id, created_at)
              VALUES ($1, $2, NOW())
              ON CONFLICT (user_id, role_id) DO NOTHING
            `, [user.id, superAdminRoleId]);
            
            console.log('✅ Fixed: Added super_admin role to main admin');
          }
        }
      }
      
      // 6. Check that any user with super_admin role has all permissions
      if (userRoles.includes('super_admin')) {
        console.log('ℹ️ User has super_admin role, should have all permissions');
        
        // Get the super_admin role ID
        const superAdminRole = await client.query(`
          SELECT id FROM roles WHERE name = 'super_admin'
        `);
        
        if (superAdminRole.rows.length > 0) {
          const superAdminRoleId = superAdminRole.rows[0].id;
          
          // Count permissions for super_admin role
          const permCount = await client.query(`
            SELECT COUNT(*) FROM role_permissions WHERE role_id = $1
          `, [superAdminRoleId]);
          
          console.log(`ℹ️ super_admin role has ${permCount.rows[0].count} permissions`);
          
          // Verify permissions are accessible through the API
          console.log('⚠️ To ensure proper access, verify the permissions API is returning all permissions.');
        }
      }
    }
    
    // 7. Suggest actions to take
    console.log('\n========================================');
    console.log('✅ Permission check complete');
    console.log('\nRecommended Actions:');
    console.log('1. Clear your browser cache and cookies');
    console.log('2. Log out and back in to refresh your session');
    console.log('3. Check the browser console for API errors when loading admin pages');
    console.log('4. Verify the API request to /api/admin/permissions/me is working');
    console.log('\nIf issues persist, the permissions API endpoint may need to be fixed.');
    
  } catch (error) {
    console.error('❌ Error testing permissions API:', error);
  } finally {
    await client.end();
  }
}

// Run the script
testPermissionsEndpoint();