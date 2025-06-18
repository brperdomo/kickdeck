/**
 * Standardize Phone Numbers Database Migration
 * 
 * This script standardizes all phone numbers in the database to the uniform format: (XXX) XXX-XXXX
 * It updates phone numbers in:
 * - users.phone
 * - teams.managerPhone
 * - players.emergencyContactPhone
 * - players.parentGuardianPhone
 * - coach data in teams.coach (JSON field)
 */

import { db } from './db/index';
import { users, teams, players } from './db/schema';
import { eq, isNotNull, and, ne } from 'drizzle-orm';

/**
 * Formats a phone number to the standard (XXX) XXX-XXXX format
 */
function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') return phoneNumber || '';

  // Strip all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle different number lengths
  if (cleaned.length === 10) {
    // Standard US 10-digit number
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US number with country code
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 7) {
    // 7-digit local number
    return `(   ) ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  // Return original if we can't format it properly
  return phoneNumber;
}

/**
 * Standardize phone numbers in the users table
 */
async function standardizeUserPhones() {
  console.log('\n📱 Standardizing phone numbers in users table...');
  
  try {
    // Get all users with phone numbers
    const usersWithPhones = await db
      .select()
      .from(users)
      .where(and(
        isNotNull(users.phone),
        ne(users.phone, '')
      ));

    console.log(`Found ${usersWithPhones.length} users with phone numbers`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithPhones) {
      const originalPhone = user.phone;
      const formattedPhone = formatPhoneNumber(originalPhone);
      
      if (originalPhone !== formattedPhone) {
        try {
          await db
            .update(users)
            .set({ phone: formattedPhone })
            .where(eq(users.id, user.id));
          
          console.log(`✅ User ${user.id} (${user.email}): "${originalPhone}" → "${formattedPhone}"`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to update user ${user.id}: ${error}`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`📊 Users table: ${updatedCount} updated, ${skippedCount} already formatted`);
    return { updated: updatedCount, skipped: skippedCount };
  } catch (error) {
    console.error('❌ Error standardizing user phone numbers:', error);
    return { updated: 0, skipped: 0, error: String(error) };
  }
}

/**
 * Standardize phone numbers in the teams table (manager phones)
 */
async function standardizeTeamManagerPhones() {
  console.log('\n📱 Standardizing manager phone numbers in teams table...');
  
  try {
    // Get all teams with manager phone numbers
    const teamsWithManagerPhones = await db
      .select()
      .from(teams)
      .where(and(
        isNotNull(teams.managerPhone),
        ne(teams.managerPhone, '')
      ));

    console.log(`Found ${teamsWithManagerPhones.length} teams with manager phone numbers`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const team of teamsWithManagerPhones) {
      const originalPhone = team.managerPhone;
      const formattedPhone = formatPhoneNumber(originalPhone);
      
      if (originalPhone !== formattedPhone) {
        try {
          await db
            .update(teams)
            .set({ managerPhone: formattedPhone })
            .where(eq(teams.id, team.id));
          
          console.log(`✅ Team ${team.id} (${team.name}): "${originalPhone}" → "${formattedPhone}"`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to update team ${team.id}: ${error}`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`📊 Teams table: ${updatedCount} updated, ${skippedCount} already formatted`);
    return { updated: updatedCount, skipped: skippedCount };
  } catch (error) {
    console.error('❌ Error standardizing team manager phone numbers:', error);
    return { updated: 0, skipped: 0, error: String(error) };
  }
}

/**
 * Standardize phone numbers in coach data (stored as JSON in teams table)
 */
async function standardizeCoachPhones() {
  console.log('\n📱 Standardizing coach phone numbers in teams table...');
  
  try {
    // Get all teams with coach data
    const teamsWithCoaches = await db
      .select()
      .from(teams)
      .where(and(
        isNotNull(teams.coach),
        ne(teams.coach, '')
      ));

    console.log(`Found ${teamsWithCoaches.length} teams with coach data`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const team of teamsWithCoaches) {
      try {
        if (!team.coach) continue;
        
        const coachData = JSON.parse(team.coach);
        let hasChanges = false;
        
        // Check and format head coach phone
        if (coachData.headCoachPhone) {
          const originalPhone = coachData.headCoachPhone;
          const formattedPhone = formatPhoneNumber(originalPhone);
          
          if (originalPhone !== formattedPhone) {
            coachData.headCoachPhone = formattedPhone;
            hasChanges = true;
            console.log(`✅ Team ${team.id} head coach: "${originalPhone}" → "${formattedPhone}"`);
          }
        }
        
        // Check and format assistant coach phone
        if (coachData.assistantCoachPhone) {
          const originalPhone = coachData.assistantCoachPhone;
          const formattedPhone = formatPhoneNumber(originalPhone);
          
          if (originalPhone !== formattedPhone) {
            coachData.assistantCoachPhone = formattedPhone;
            hasChanges = true;
            console.log(`✅ Team ${team.id} assistant coach: "${originalPhone}" → "${formattedPhone}"`);
          }
        }
        
        if (hasChanges) {
          await db
            .update(teams)
            .set({ coach: JSON.stringify(coachData) })
            .where(eq(teams.id, team.id));
          
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to process coach data for team ${team.id}: ${error}`);
        skippedCount++;
      }
    }

    console.log(`📊 Coach phones: ${updatedCount} updated, ${skippedCount} skipped`);
    return { updated: updatedCount, skipped: skippedCount };
  } catch (error) {
    console.error('❌ Error standardizing coach phone numbers:', error);
    return { updated: 0, skipped: 0, error: String(error) };
  }
}

/**
 * Standardize phone numbers in the players table
 */
async function standardizePlayerPhones() {
  console.log('\n📱 Standardizing phone numbers in players table...');
  
  try {
    // Get all players with phone numbers
    const playersWithPhones = await db
      .select()
      .from(players)
      .where(and(
        isNotNull(players.emergencyContactPhone),
        ne(players.emergencyContactPhone, '')
      ));

    console.log(`Found ${playersWithPhones.length} players with emergency contact phones`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const player of playersWithPhones) {
      const originalEmergencyPhone = player.emergencyContactPhone;
      const originalParentPhone = player.parentGuardianPhone;
      
      const formattedEmergencyPhone = formatPhoneNumber(originalEmergencyPhone);
      const formattedParentPhone = formatPhoneNumber(originalParentPhone);
      
      let hasChanges = false;
      const updates: any = {};
      
      if (originalEmergencyPhone !== formattedEmergencyPhone) {
        updates.emergencyContactPhone = formattedEmergencyPhone;
        hasChanges = true;
        console.log(`✅ Player ${player.id} emergency: "${originalEmergencyPhone}" → "${formattedEmergencyPhone}"`);
      }
      
      if (originalParentPhone && originalParentPhone !== formattedParentPhone) {
        updates.parentGuardianPhone = formattedParentPhone;
        hasChanges = true;
        console.log(`✅ Player ${player.id} parent: "${originalParentPhone}" → "${formattedParentPhone}"`);
      }
      
      if (hasChanges) {
        try {
          await db
            .update(players)
            .set(updates)
            .where(eq(players.id, player.id));
          
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to update player ${player.id}: ${error}`);
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`📊 Players table: ${updatedCount} updated, ${skippedCount} already formatted`);
    return { updated: updatedCount, skipped: skippedCount };
  } catch (error) {
    console.error('❌ Error standardizing player phone numbers:', error);
    return { updated: 0, skipped: 0, error: String(error) };
  }
}

/**
 * Main function to standardize all phone numbers
 */
async function main() {
  console.log('🚀 Starting phone number standardization...');
  console.log('📋 This will format all phone numbers to: (XXX) XXX-XXXX');
  
  const startTime = Date.now();
  
  try {
    // Run all standardization functions
    const userResults = await standardizeUserPhones();
    const teamManagerResults = await standardizeTeamManagerPhones();
    const coachResults = await standardizeCoachPhones();
    const playerResults = await standardizePlayerPhones();
    
    // Calculate totals
    const totalUpdated = userResults.updated + teamManagerResults.updated + coachResults.updated + playerResults.updated;
    const totalSkipped = userResults.skipped + teamManagerResults.skipped + coachResults.skipped + playerResults.skipped;
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 Phone number standardization completed!');
    console.log('📊 Summary:');
    console.log(`   • Total phone numbers updated: ${totalUpdated}`);
    console.log(`   • Total phone numbers already formatted: ${totalSkipped}`);
    console.log(`   • Execution time: ${duration} seconds`);
    
    if (userResults.error || teamManagerResults.error || coachResults.error || playerResults.error) {
      console.log('\n⚠️  Some errors occurred during processing - check logs above');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during phone number standardization:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);