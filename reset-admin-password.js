/**
 * Reset Admin Password for Banking Access
 * 
 * This script resets the admin password to enable banking functionality access.
 */

import { db } from './db/index.ts';
import { users } from './db/schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password for banking access...');
    
    // Find admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'bperdomo@zoho.com'))
      .limit(1);
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      isAdmin: adminUser.isAdmin
    });
    
    // Reset password
    const newPassword = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    await db.update(users)
      .set({ 
        password: hashedPassword,
        isAdmin: true // Ensure admin flag is set
      })
      .where(eq(users.id, adminUser.id));
    
    console.log('✓ Admin password reset to: admin123');
    console.log('✓ Admin privileges confirmed');
    console.log('Banking access should now work properly');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  }
}

resetAdminPassword().then(() => process.exit(0));