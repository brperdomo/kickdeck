/**
 * Admin Permission Check Tool
 * 
 * This script checks the permissions for specified admin users.
 * It will show detailed information about their role assignments and permissions.
 */

import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

// Connect to database
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkAdminPermissions() {
  try {
    await client.connect();
    console.log('\n======== ADMIN PERMISSIONS CHECK TOOL ========\n');
    console.log('Connected to database');

    // Array of emails to check
    const emailsToCheck = [
      'bperdomo@zoho.com',
      'jesus.desantiagojr@gmail.com'
    ];

    // Check each email
    for (const email of emailsToCheck) {
      console.log(`\n----- Checking permissions for ${email} -----`);
      
      // 1. Find the user
      const userResult = await client.query(
        "SELECT id, email, \"isAdmin\" FROM users WHERE email = $1",
        [email]
      );
      
      if (userResult.rows.length === 0) {
        console.log(`⚠️ User with email ${email} does not exist`);
        continue;
      }
      
      const user = userResult.rows[0];
      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
      console.log(`   isAdmin flag: ${user.isAdmin ? 'YES' : 'NO'}`);
      
      // 2. Get user's roles
      const rolesResult = await client.query(`
        SELECT r.id, r.name, r.description
        FROM admin_roles ar
        JOIN roles r ON ar.role_id = r.id
        WHERE ar.user_id = $1
      `, [user.id]);
      
      if (rolesResult.rows.length === 0) {
        console.log('⚠️ User has no role assignments');
      } else {
        console.log(`\nAssigned Roles: (${rolesResult.rows.length})`);
        for (const role of rolesResult.rows) {
          console.log(`   - ${role.name}: ${role.description || 'No description'}`);
          
          // 3. Get permissions for this role
          const permissionsResult = await client.query(`
            SELECT permission 
            FROM role_permissions 
            WHERE role_id = $1
            ORDER BY permission
          `, [role.id]);
          
          if (permissionsResult.rows.length === 0) {
            console.log('     ⚠️ This role has no permissions');
          } else {
            console.log(`     Permissions: (${permissionsResult.rows.length})`);
            
            // Group permissions by category
            const permissionGroups = {};
            
            for (const perm of permissionsResult.rows) {
              const [category, action] = perm.permission.split('.');
              if (!permissionGroups[category]) {
                permissionGroups[category] = [];
              }
              permissionGroups[category].push(action);
            }
            
            // Display permissions by category
            for (const category in permissionGroups) {
              console.log(`     • ${category}: ${permissionGroups[category].join(', ')}`);
            }
          }
        }
      }
    }
    
    console.log('\n✅ Admin permission check completed!\n');
    
  } catch (error) {
    console.error('❌ Error checking admin permissions:', error);
  } finally {
    await client.end();
  }
}

// Run the script
checkAdminPermissions();