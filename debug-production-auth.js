/**
 * Debug Production Authentication Issues
 * 
 * This script diagnoses the specific authentication problems in production
 * by testing database connectivity, user lookup, and session management.
 */

import { db } from './db/index.js';
import { users, adminRoles, roles } from './db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load production environment
dotenv.config({ path: '.env.production' });

async function debugProductionAuth() {
  console.log('🔍 Debugging Production Authentication Issues\n');
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const dbTest = await db.select().from(users).limit(1);
    console.log('   ✅ Database connection successful');
    
    // 2. Verify admin user exists and has correct permissions
    console.log('\n2. Checking admin user account...');
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'bperdomo@zoho.com'))
      .limit(1);
    
    if (!adminUser) {
      console.log('   ❌ Admin user not found in database');
      return;
    }
    
    console.log(`   ✅ Admin user found: ID ${adminUser.id}`);
    console.log(`   ✅ isAdmin flag: ${adminUser.isAdmin}`);
    console.log(`   ✅ Email: ${adminUser.email}`);
    
    // 3. Check admin roles
    console.log('\n3. Checking admin roles...');
    const userRoles = await db
      .select({ roleName: roles.name })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, adminUser.id));
    
    if (userRoles.length === 0) {
      console.log('   ⚠️  No roles assigned to admin user');
    } else {
      console.log(`   ✅ Roles assigned: ${userRoles.map(r => r.roleName).join(', ')}`);
    }
    
    // 4. Test the authentication middleware logic
    console.log('\n4. Testing authentication middleware logic...');
    
    // Simulate the middleware check
    const hasAdminRole = userRoles.some(r => 
      ['super_admin', 'tournament_admin', 'finance_admin', 'score_admin'].includes(r.roleName)
    );
    
    const shouldPassAuth = adminUser.isAdmin || hasAdminRole;
    console.log(`   isAdmin flag: ${adminUser.isAdmin}`);
    console.log(`   Has admin role: ${hasAdminRole}`);
    console.log(`   Should pass auth: ${shouldPassAuth}`);
    
    // 5. Check environment variables
    console.log('\n5. Checking critical environment variables...');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
    console.log(`   SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? 'Set' : 'Missing'}`);
    console.log(`   SESSION_SECRET: ${process.env.SESSION_SECRET ? 'Set' : 'Missing'}`);
    
    // 6. Test a direct API call to production
    console.log('\n6. Testing production API endpoints...');
    
    const testUrls = [
      'https://app.matchpro.ai/api/health',
      'https://app.matchpro.ai/api/user',
      'https://app.matchpro.ai/api/admin/sendgrid-settings/templates'
    ];
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url);
        console.log(`   ${url}: ${response.status} ${response.statusText}`);
        
        if (response.status === 401) {
          console.log('     → Authentication required (expected for protected routes)');
        } else if (response.status === 404) {
          console.log('     → Route not found (possible routing issue)');
        } else if (response.status === 500) {
          console.log('     → Server error (possible middleware or database issue)');
        }
      } catch (error) {
        console.log(`   ${url}: Error - ${error.message}`);
      }
    }
    
    console.log('\n7. Recommendations:');
    
    if (!shouldPassAuth) {
      console.log('   ❌ User authentication setup is incorrect');
      console.log('   → Either set isAdmin=true or assign an admin role');
    } else {
      console.log('   ✅ User authentication setup is correct');
      console.log('   → Issue likely in session management or middleware deployment');
    }
    
    console.log('\n   Possible issues:');
    console.log('   • Session middleware not properly configured in production');
    console.log('   • Database connection issues in production environment');
    console.log('   • Authentication middleware not deployed correctly');
    console.log('   • Route registration order causing API routes to be bypassed');
    
  } catch (error) {
    console.error('❌ Error during production auth debugging:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugProductionAuth();