/**
 * Verify User Event Access Script
 * 
 * This script verifies that darrell.johnson@rebelssoccerclub.com
 * only has access to event ID 1825427780 and cannot see other events.
 */

import { db } from './db/index.js';
import { users, events, eventAdministrators, adminRoles, roles } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function verifyUserEventAccess() {
  try {
    const targetEmail = 'darrell.johnson@rebelssoccerclub.com';
    const allowedEventId = '1825427780';
    
    console.log('🔍 Verifying event access for:', targetEmail);
    console.log('✅ Should only have access to event ID:', allowedEventId);
    console.log('');
    
    // 1. Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.email, targetEmail)
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log('');
    
    // 2. Check user's roles
    const userRoles = await db
      .select({
        roleName: roles.name
      })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, user.id));
    
    console.log('🔐 User roles:');
    userRoles.forEach(role => {
      console.log(`   - ${role.roleName}`);
    });
    
    const isSuperAdmin = userRoles.some(role => role.roleName === 'super_admin');
    console.log(`   Super Admin: ${isSuperAdmin ? 'YES' : 'NO'}`);
    console.log('');
    
    // 3. Get events user has access to
    const userEventIds = await db
      .select({
        eventId: eventAdministrators.eventId,
        role: eventAdministrators.role
      })
      .from(eventAdministrators)
      .where(eq(eventAdministrators.userId, user.id));
    
    console.log('🎯 Events user has access to:');
    if (userEventIds.length === 0) {
      console.log('   No events assigned');
    } else {
      for (const eventAccess of userEventIds) {
        const eventDetails = await db.query.events.findFirst({
          where: eq(events.id, eventAccess.eventId)
        });
        console.log(`   - Event ID: ${eventAccess.eventId}`);
        console.log(`     Name: ${eventDetails?.name || 'Unknown'}`);
        console.log(`     Role: ${eventAccess.role}`);
        console.log(`     ${eventAccess.eventId === allowedEventId ? '✅ ALLOWED' : '❌ SHOULD BE REMOVED'}`);
        console.log('');
      }
    }
    
    // 4. Check if filtering is working correctly
    console.log('🔍 Event filtering verification:');
    if (isSuperAdmin) {
      console.log('   ⚠️  User is super admin - can see ALL events');
    } else if (userEventIds.length === 1 && userEventIds[0].eventId === allowedEventId) {
      console.log('   ✅ Perfect! User can only see the allowed event');
    } else if (userEventIds.length === 0) {
      console.log('   ⚠️  User has no event access');
    } else {
      console.log('   ❌ User has access to unauthorized events');
    }
    
    // 5. Get total events in system for reference
    const allEvents = await db.select({
      id: events.id,
      name: events.name
    }).from(events);
    
    console.log('');
    console.log(`📊 Total events in system: ${allEvents.length}`);
    console.log(`📊 Events accessible to user: ${userEventIds.length}`);
    console.log('');
    
    if (!isSuperAdmin && userEventIds.length === 1 && userEventIds[0].eventId === allowedEventId) {
      console.log('🎉 SUCCESS: User access is properly restricted!');
      console.log(`   User can only see: ${allowedEventId} (Rise Cup)`);
      console.log(`   Hidden events: ${allEvents.length - 1}`);
    } else {
      console.log('⚠️  Review needed - access may not be properly restricted');
    }
    
  } catch (error) {
    console.error('❌ Error verifying user access:', error);
  }
}

// Run the verification
verifyUserEventAccess().then(() => {
  console.log('\n✅ Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});