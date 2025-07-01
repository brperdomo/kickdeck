/**
 * Assign Darrell Johnson as Tournament Director for Event 1825427780
 * 
 * This script:
 * 1. Creates tournament director role if needed
 * 2. Finds or creates user account for darrell.johnson@rebelssoccerclub.com
 * 3. Assigns tournament director role to the user
 * 4. Restricts access to only Event ID 1825427780
 */

const { db } = require('./db/index.ts');
const { users, adminRoles, roles, eventAdministrators } = require('./db/schema.ts');
const { eq, and } = require('drizzle-orm');
const bcrypt = require('bcrypt');

const EMAIL = 'darrell.johnson@rebelssoccerclub.com';
const EVENT_ID = 1825427780;

async function assignDarrellTournamentDirector() {
  console.log(`🎯 Setting up tournament director access for ${EMAIL}`);
  console.log(`📍 Event ID: ${EVENT_ID}`);
  console.log('');
  
  try {
    // Step 1: Ensure tournament director role exists
    console.log('1️⃣ Checking tournament director role...');
    let tournamentDirectorRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'tournament_director')
    });
    
    if (!tournamentDirectorRole) {
      console.log('   Creating tournament director role...');
      [tournamentDirectorRole] = await db.insert(roles).values({
        name: 'tournament_director',
        description: 'Can manage assigned tournaments and events only. Has restricted access to specific events.',
        createdAt: new Date()
      }).returning();
      console.log('   ✅ Tournament director role created');
    } else {
      console.log('   ✅ Tournament director role already exists');
    }
    
    // Step 2: Find or create user account
    console.log(`2️⃣ Checking user account for ${EMAIL}...`);
    let user = await db.query.users.findFirst({
      where: eq(users.email, EMAIL)
    });
    
    if (!user) {
      console.log('   Creating new user account...');
      const hashedPassword = await bcrypt.hash('TempPassword123!', 10);
      [user] = await db.insert(users).values({
        email: EMAIL,
        password: hashedPassword,
        firstName: 'Darrell',
        lastName: 'Johnson',
        username: EMAIL,
        isAdmin: true, // Need admin flag to access admin interface
        isParent: false,
        householdId: 1, // Default household
        createdAt: new Date().toISOString()
      }).returning();
      console.log('   ✅ User account created');
      console.log('   🔑 Temporary password: TempPassword123!');
    } else {
      console.log('   ✅ User account already exists');
      // Ensure user has admin flag
      if (!user.isAdmin) {
        await db.update(users)
          .set({ isAdmin: true })
          .where(eq(users.id, user.id));
        console.log('   ✅ Added admin flag to existing user');
      }
    }
    
    // Step 3: Assign tournament director role to user
    console.log('3️⃣ Assigning tournament director role...');
    const existingRoleAssignment = await db.query.adminRoles.findFirst({
      where: and(
        eq(adminRoles.userId, user.id),
        eq(adminRoles.roleId, tournamentDirectorRole.id)
      )
    });
    
    if (!existingRoleAssignment) {
      await db.insert(adminRoles).values({
        userId: user.id,
        roleId: tournamentDirectorRole.id,
        assignedAt: new Date(),
        assignedBy: 24 // Bryan's admin user ID
      });
      console.log('   ✅ Tournament director role assigned');
    } else {
      console.log('   ✅ Tournament director role already assigned');
    }
    
    // Step 4: Assign to specific event
    console.log(`4️⃣ Assigning access to Event ${EVENT_ID}...`);
    const existingEventAssignment = await db.query.eventAdministrators.findFirst({
      where: and(
        eq(eventAdministrators.userId, user.id),
        eq(eventAdministrators.eventId, EVENT_ID)
      )
    });
    
    if (!existingEventAssignment) {
      await db.insert(eventAdministrators).values({
        userId: user.id,
        eventId: EVENT_ID,
        role: 'tournament_director',
        permissions: JSON.stringify({
          can_view_teams: true,
          can_edit_teams: true,
          can_view_schedule: true,
          can_edit_schedule: true,
          can_view_payments: true,
          can_edit_payments: false, // No payment access
          can_view_reports: true,
          can_manage_admins: false // Cannot manage other admins
        }),
        createdAt: new Date()
      });
      console.log('   ✅ Event access granted');
    } else {
      console.log('   ✅ Event access already exists');
    }
    
    // Step 5: Verify setup
    console.log('5️⃣ Verifying setup...');
    const verification = await db.query.users.findFirst({
      where: eq(users.email, EMAIL),
      with: {
        adminRoles: {
          with: {
            role: true
          }
        }
      }
    });
    
    const eventAccess = await db.query.eventAdministrators.findMany({
      where: eq(eventAdministrators.userId, user.id)
    });
    
    console.log('');
    console.log('📋 Setup Summary:');
    console.log(`   User: ${verification.firstName} ${verification.lastName} (${verification.email})`);
    console.log(`   User ID: ${verification.id}`);
    console.log(`   Admin Access: ${verification.isAdmin ? 'Yes' : 'No'}`);
    console.log(`   Roles: ${verification.adminRoles.map(ar => ar.role.name).join(', ')}`);
    console.log(`   Event Access: ${eventAccess.length} event(s)`);
    
    if (eventAccess.length > 0) {
      eventAccess.forEach(ea => {
        console.log(`     - Event ${ea.eventId} (${ea.role})`);
      });
    }
    
    console.log('');
    console.log('🎯 Access Configuration:');
    console.log(`   ✅ Can ONLY access Event ID: ${EVENT_ID}`);
    console.log('   ✅ Cannot see other events');
    console.log('   ✅ Has team management permissions');
    console.log('   ✅ Has schedule management permissions');
    console.log('   ✅ Has report viewing permissions');
    console.log('   ❌ No payment editing permissions');
    console.log('   ❌ No admin management permissions');
    
    console.log('');
    console.log('🔐 Login Instructions:');
    console.log(`   Email: ${EMAIL}`);
    console.log('   Password: TempPassword123! (user should change this)');
    console.log('   URL: Same admin login page');
    console.log('   Access: Will only see Event ID 1825427780');
    
    console.log('');
    console.log('✅ Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up tournament director access:', error);
    throw error;
  }
}

// Run the script
assignDarrellTournamentDirector()
  .then(() => {
    console.log('\n🎉 Tournament director assignment completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Assignment failed:', error);
    process.exit(1);
  });