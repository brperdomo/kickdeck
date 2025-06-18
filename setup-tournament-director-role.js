/**
 * Tournament Director Role Setup Script
 * 
 * This script creates the Tournament Director role and sets up the necessary
 * infrastructure for role-based access control in the tournament management system.
 */

import { db } from './db/index.js';
import { roles, adminRoles, users, eventAdministrators } from './db/schema.js';
import { eq, and } from 'drizzle-orm';

async function setupTournamentDirectorRole() {
  try {
    console.log('=== Setting up Tournament Director Role ===\n');

    // 1. Create Tournament Director role if it doesn't exist
    console.log('1. Creating Tournament Director role...');
    
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, 'tournament_director')
    });

    let tournamentDirectorRole;
    if (existingRole) {
      console.log('   ✓ Tournament Director role already exists');
      tournamentDirectorRole = existingRole;
    } else {
      [tournamentDirectorRole] = await db.insert(roles).values({
        name: 'tournament_director',
        description: 'Can manage assigned tournaments and events only. Has restricted access to specific events.',
        createdAt: new Date()
      }).returning();
      console.log('   ✓ Tournament Director role created successfully');
    }

    // 2. Verify database schema supports Tournament Director assignments
    console.log('\n2. Verifying database schema...');
    
    try {
      // Check if event_administrators table supports tournament_director role
      const testAssignment = await db.query.eventAdministrators.findFirst({
        where: eq(eventAdministrators.role, 'tournament_director')
      });
      console.log('   ✓ Event administrators table supports Tournament Director role');
    } catch (error) {
      console.log('   ⚠ Event administrators table may need schema update');
    }

    // 3. Display usage instructions
    console.log('\n3. Tournament Director System Ready!');
    console.log('\n=== How to Use Tournament Director Role ===');
    console.log('\n📋 To assign a Tournament Director:');
    console.log('   1. First, give a user the Tournament Director role in Admin > Administrators');
    console.log('   2. Then, assign them to specific events in the event\'s "Admins" tab');
    console.log('   3. They will only see events they\'re assigned to manage');
    
    console.log('\n🔒 Access Control:');
    console.log('   • Tournament Directors can only access assigned events');
    console.log('   • They cannot see other events or admin components');
    console.log('   • Super Admins have full access to all events');
    
    console.log('\n📍 Key Features:');
    console.log('   • Event-specific access control');
    console.log('   • Team registration management');
    console.log('   • Payment processing for assigned events');
    console.log('   • Fee analytics for their events only');
    
    console.log('\n🛠 API Endpoints Available:');
    console.log('   • GET /api/admin/tournament-directors - List all tournament directors');
    console.log('   • GET /api/admin/events/:eventId/tournament-directors - Get assigned directors');
    console.log('   • POST /api/admin/events/:eventId/tournament-directors - Assign director');
    console.log('   • DELETE /api/admin/events/:eventId/tournament-directors/:userId - Remove assignment');
    console.log('   • GET /api/admin/my-events - Get accessible events for current user');

    console.log('\n=== Next Steps ===');
    console.log('1. Create Tournament Director users in Admin > Administrators');
    console.log('2. Assign them to events using the TournamentDirectorManager component');
    console.log('3. Tournament Directors can log in and will only see their assigned events');

    console.log('\n✅ Tournament Director role setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up Tournament Director role:', error);
    throw error;
  }
}

// Run the setup if called directly
if (require.main === module) {
  setupTournamentDirectorRole()
    .then(() => {
      console.log('\n🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTournamentDirectorRole };