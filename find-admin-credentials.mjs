import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function findAdminCredentials() {
  console.log('🔍 Finding Admin Credentials\n');
  
  try {
    // Check users table for admin users
    const adminUsers = await sql`
      SELECT id, email, username, "firstName", "lastName", "isAdmin", "createdAt"
      FROM users 
      WHERE "isAdmin" = true
      LIMIT 10
    `;
    
    console.log('Admin Users:');
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
    } else {
      adminUsers.forEach(admin => {
        console.log(`📧 Email: ${admin.email}`);
        console.log(`👤 Username: ${admin.username || 'None'}`);
        console.log(`👨‍💼 Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`🔑 Is Admin: ${admin.isAdmin}`);
        console.log('---');
      });
    }
    
    // Check for the main admin user that should exist
    const mainAdmin = await sql`
      SELECT id, email, username, created_at
      FROM users 
      WHERE email = 'admin@matchpro.ai' 
      OR email LIKE '%admin%'
      LIMIT 5
    `;
    
    console.log('\nMain Admin Check:');
    if (mainAdmin.length > 0) {
      mainAdmin.forEach(user => {
        console.log(`📧 ${user.email} (ID: ${user.id})`);
      });
    } else {
      console.log('❌ No admin@matchpro.ai user found');
    }
    
    // Show solution
    console.log('\n💡 Solutions:');
    console.log('1. Access the app at / and use the login form');
    console.log('2. Use the default admin credentials from the system setup');
    console.log('3. The SendGrid settings require admin authentication for security');
    console.log('4. Once logged in as admin, /sendgrid-settings will be accessible');
    
  } catch (error) {
    console.error('❌ Error finding admin credentials:', error.message);
  } finally {
    await sql.end();
  }
}

findAdminCredentials();