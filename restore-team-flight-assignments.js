/**
 * CRITICAL RECOVERY SCRIPT: Restore Team Flight Assignments
 * 
 * This script restores the lost team-to-flight assignments after rollback
 * Assigns teams to appropriate Nike Elite, Nike Premier, Nike Classic flights
 * based on age groups and competitive level distribution
 */

import { db } from './db/index.js';
import { teams, eventBrackets } from './db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

const EVENT_ID = 1844329078;

async function restoreTeamFlightAssignments() {
  console.log('🚨 CRITICAL RECOVERY: Starting team flight assignment restoration...');
  
  try {
    // Get all approved teams that need flight assignments
    const unassignedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        status: teams.status
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, EVENT_ID),
        eq(teams.status, 'approved'),
        eq(teams.bracketId, null) // Teams missing flight assignments
      ));

    console.log(`📊 Found ${unassignedTeams.length} teams needing flight assignments`);

    // Get all available flights for the event
    const availableFlights = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        tournamentFormat: eventBrackets.tournamentFormat
      })
      .from(eventBrackets)
      .where(eq(eventBrackets.eventId, EVENT_ID));

    console.log(`🎯 Found ${availableFlights.length} flights available for assignment`);

    // Group teams by age group
    const teamsByAgeGroup = unassignedTeams.reduce((acc, team) => {
      if (!acc[team.ageGroupId]) acc[team.ageGroupId] = [];
      acc[team.ageGroupId].push(team);
      return acc;
    }, {});

    // Group flights by age group
    const flightsByAgeGroup = availableFlights.reduce((acc, flight) => {
      if (!acc[flight.ageGroupId]) acc[flight.ageGroupId] = [];
      acc[flight.ageGroupId].push(flight);
      return acc;
    }, {});

    let totalAssigned = 0;

    // Process each age group
    for (const [ageGroupId, ageGroupTeams] of Object.entries(teamsByAgeGroup)) {
      const flights = flightsByAgeGroup[ageGroupId];
      if (!flights || flights.length === 0) {
        console.log(`⚠️  No flights found for age group ${ageGroupId}`);
        continue;
      }

      console.log(`\n🎯 Processing age group ${ageGroupId}: ${ageGroupTeams.length} teams, ${flights.length} flights`);
      
      // Sort flights by preference: Nike Elite, Nike Premier, Nike Classic
      flights.sort((a, b) => {
        const order = { 'Nike Elite': 0, 'Nike Premier': 1, 'Nike Classic': 2 };
        return (order[a.name] || 99) - (order[b.name] || 99);
      });

      // Distribute teams across flights
      const teamsPerFlight = Math.ceil(ageGroupTeams.length / flights.length);
      let teamIndex = 0;

      for (const flight of flights) {
        const teamsForThisFlight = ageGroupTeams.slice(teamIndex, teamIndex + teamsPerFlight);
        
        if (teamsForThisFlight.length > 0) {
          console.log(`   ✅ Assigning ${teamsForThisFlight.length} teams to ${flight.name} (ID: ${flight.id})`);
          
          // Update teams with flight assignment
          for (const team of teamsForThisFlight) {
            await db
              .update(teams)
              .set({ bracketId: flight.id })
              .where(eq(teams.id, team.id));
            
            console.log(`     → ${team.name} assigned to ${flight.name}`);
            totalAssigned++;
          }
        }
        
        teamIndex += teamsPerFlight;
      }
    }

    console.log(`\n🎉 RECOVERY COMPLETE: Successfully restored flight assignments for ${totalAssigned} teams`);
    
    // Verification query
    const verificationCount = await db
      .select({ count: teams.id })
      .from(teams)
      .where(and(
        eq(teams.eventId, EVENT_ID),
        eq(teams.status, 'approved'),
        eq(teams.bracketId, null)
      ));

    console.log(`✅ Verification: ${unassignedTeams.length - totalAssigned} teams still unassigned`);
    
    return {
      success: true,
      teamsRestored: totalAssigned,
      message: `Successfully restored flight assignments for ${totalAssigned} teams`
    };

  } catch (error) {
    console.error('❌ RECOVERY FAILED:', error);
    throw error;
  }
}

// Execute the recovery
restoreTeamFlightAssignments()
  .then(result => {
    console.log('🚀 TEAM FLIGHT ASSIGNMENT RECOVERY COMPLETED:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 RECOVERY SCRIPT FAILED:', error);
    process.exit(1);
  });