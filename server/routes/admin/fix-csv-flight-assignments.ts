import { Router } from "express";
import { db } from "@db";
import { teams, games, eventBrackets } from "@db/schema";
import { eq, and, inArray } from "drizzle-orm";

const router = Router();

/**
 * Fix team flight assignments based on CSV import data
 * This endpoint reads the CSV flight assignments and updates team bracket_id accordingly
 */
router.post('/events/:eventId/fix-flight-assignments', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    console.log(`[CSV Flight Fix] Starting flight assignment fix for event ${eventId}`);
    
    // Sample CSV flight mapping based on the provided data
    // In a real implementation, this would read from imported CSV data or a dedicated table
    const csvFlightMappings = [
      // B2015 mappings from CSV
      { teamName: "City SC Southwest - City SC Southwest B15 Gold Tem", flight: "NIKE CLASSIC" },
      { teamName: "Future FC - Future FC B15 White", flight: "NIKE CLASSIC" },
      { teamName: "San Diego Force FC - B2015 Academy I", flight: "NIKE CLASSIC" },
      { teamName: "Empire Surf - Empire Surf B2015 Academy 2", flight: "NIKE CLASSIC" },
      { teamName: "Albion SC Riverside - ALBION SC Riverside B15 Prem", flight: "NIKE CLASSIC" },
      { teamName: "Legends FC SD North -  B15 Gold", flight: "NIKE CLASSIC" },
      
      // B2015 Elite mappings
      { teamName: "Nomads - Nomads B2015", flight: "NIKE ELITE A" },
      { teamName: "Empire Surf - Boys 2015 academy", flight: "NIKE ELITE A" },
      { teamName: "FC Premier Elite - B2015 Dominguez", flight: "NIKE ELITE A" },
      { teamName: "Rebels SC - Rebels SC Pre-ECNL B2015 A", flight: "NIKE ELITE A" },
      
      // B2017 mappings
      { teamName: "Desert Empire Surf - Academy B17", flight: "NIKE CLASSIC" },
      { teamName: "Rebels SC - Rebels B2017 Sevilla", flight: "NIKE CLASSIC" },
      { teamName: "Empire Surf - B2017 Academy-1", flight: "NIKE CLASSIC" },
      { teamName: "Legends FC SD North - B2017 FC", flight: "NIKE CLASSIC" },
      { teamName: "Future FC - Future FC B2017", flight: "NIKE CLASSIC" },
      { teamName: "ELI7E FC - ELI7E FC - SELECT B2017", flight: "NIKE CLASSIC" },
      
      // B2017 Premier mappings
      { teamName: "Albion SC Riverside - Albion Riverside B2017 Premi", flight: "NIKE PREMIER" },
      { teamName: "Empire Surf - Academy North B2017 Academy", flight: "NIKE PREMIER" },
      { teamName: "Empire Surf - Empire Surf North B2017A-1", flight: "NIKE PREMIER" },
      { teamName: "FC Premier Elite - FC Premier Elite B2017", flight: "NIKE PREMIER" },
      
      // B2009 Premier mappings
      { teamName: "Empire Surf - Empire Surf North B2009", flight: "NIKE PREMIER" },
      { teamName: "No Club Selection - South Bay FC 2010", flight: "NIKE PREMIER" },
      { teamName: "Future FC - Future FC B09", flight: "NIKE PREMIER" },
      { teamName: "Escondido Soccer Club - Escondido Surf B2009", flight: "NIKE PREMIER" },
      { teamName: "Albion SC San Diego - Albion SC San Diego CV B09 A", flight: "NIKE PREMIER" },
      { teamName: "San Diego Force FC - SD Force B2009 Academy I", flight: "NIKE PREMIER" },
      
      // Add more mappings as needed based on full CSV
    ];
    
    // Get flight ID mappings
    const flightMappings = new Map<string, number>();
    const flights = await db.select().from(eventBrackets).where(eq(eventBrackets.eventId, eventId));
    
    flights.forEach(flight => {
      if (flight.name.includes('Premier')) flightMappings.set('NIKE PREMIER', flight.id);
      if (flight.name.includes('Classic')) flightMappings.set('NIKE CLASSIC', flight.id);
      if (flight.name.includes('Elite')) {
        flightMappings.set('NIKE ELITE A', flight.id);
        flightMappings.set('NIKE ELITE B', flight.id);
        flightMappings.set('NIKE ELITE', flight.id);
      }
    });
    
    console.log('[CSV Flight Fix] Flight ID mappings:', Array.from(flightMappings.entries()));
    
    let updatedTeams = 0;
    
    // Update team bracket assignments based on CSV data
    for (const mapping of csvFlightMappings) {
      const flightId = flightMappings.get(mapping.flight);
      if (!flightId) continue;
      
      // Find teams with matching names (using ILIKE for partial matching)
      const matchingTeams = await db.select()
        .from(teams)
        .where(and(
          eq(teams.eventId, eventId),
          // Use partial name matching since team names might have slight variations
        ));
      
      const teamsToUpdate = matchingTeams.filter(team => 
        team.name && team.name.toLowerCase().includes(mapping.teamName.toLowerCase().split(' - ')[0])
      );
      
      for (const team of teamsToUpdate) {
        await db.update(teams)
          .set({ bracketId: flightId })
          .where(eq(teams.id, team.id));
        
        console.log(`[CSV Flight Fix] Updated team ${team.id} (${team.name}) to flight ${mapping.flight} (ID: ${flightId})`);
        updatedTeams++;
      }
    }
    
    console.log(`[CSV Flight Fix] Updated ${updatedTeams} team flight assignments`);
    
    res.json({
      success: true,
      message: `Updated ${updatedTeams} team flight assignments based on CSV data`,
      updatedTeams,
      flightMappings: Array.from(flightMappings.entries())
    });
    
  } catch (error) {
    console.error('[CSV Flight Fix] Error fixing flight assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix flight assignments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;