import { Router } from 'express';
import { db } from '@db';
import { eq, and } from 'drizzle-orm';
import { 
  eventBrackets, 
  teams
} from '@db/schema';

const router = Router();

// Subdivide a bracket into multiple brackets
router.post('/events/:eventId/flights/:flightId/subdivide', async (req, res) => {
  const { eventId, flightId } = req.params;
  const { bracketCount, namingPattern, redistributeTeams } = req.body;

  console.log(`Starting bracket subdivision for bracket ${flightId}:`, {
    bracketCount,
    namingPattern,
    redistributeTeams
  });

  try {
    const eventIdStr = eventId;
    const bracketIdNum = parseInt(flightId); // This is actually a bracket ID from the frontend

    // Get the original bracket
    const originalBracket = await db.query.eventBrackets.findFirst({
      where: and(
        eq(eventBrackets.id, bracketIdNum),
        eq(eventBrackets.eventId, eventIdStr)
      )
    });

    if (!originalBracket) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

    // Get teams currently assigned to this bracket
    const assignedTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.bracketId, bracketIdNum),
        eq(teams.eventId, eventIdStr)
      )
    });

    console.log(`Found ${assignedTeams.length} teams assigned to bracket ${bracketIdNum}`);

    // Check if bracket has enough teams for subdivision
    if (assignedTeams.length < bracketCount * 2) {
      return res.status(400).json({ 
        error: `Cannot create ${bracketCount} brackets with only ${assignedTeams.length} teams (minimum 2 teams per bracket required)` 
      });
    }

    // Create new brackets
    const createdBrackets = [];
    const teamsPerBracket = Math.floor(assignedTeams.length / bracketCount);
    const remainingTeams = assignedTeams.length % bracketCount;

    for (let i = 0; i < bracketCount; i++) {
      let bracketName = originalBracket.name;
      
      // Apply naming pattern
      if (namingPattern === 'letters') {
        bracketName = i === 0 ? `${originalBracket.name} A` : `${originalBracket.name} ${String.fromCharCode(65 + i)}`;
      } else if (namingPattern === 'numbers') {
        bracketName = `${originalBracket.name} ${i + 1}`;
      } else if (namingPattern !== 'none') {
        bracketName = `${originalBracket.name} Bracket ${i + 1}`;
      }

      // Create the new bracket
      const [newBracket] = await db.insert(eventBrackets).values({
        eventId: eventIdStr,
        ageGroupId: originalBracket.ageGroupId,
        name: bracketName,
        description: `Subdivided from ${originalBracket.name}`,
        level: originalBracket.level,
        eligibility: originalBracket.eligibility,
        sortOrder: originalBracket.sortOrder + i + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning();

      createdBrackets.push(newBracket);
      console.log(`Created bracket ${i + 1}: ${bracketName} (ID: ${newBracket.id})`);
    }

    // Redistribute teams if requested
    if (redistributeTeams && assignedTeams.length > 0) {
      // Redistribute teams across new brackets
      let teamIndex = 0;
      for (let i = 0; i < createdBrackets.length; i++) {
        const bracket = createdBrackets[i];
        const teamsForThisBracket = teamsPerBracket + (i < remainingTeams ? 1 : 0);
        
        for (let j = 0; j < teamsForThisBracket && teamIndex < assignedTeams.length; j++) {
          const team = assignedTeams[teamIndex];
          
          // Update team's bracket assignment
          await db.update(teams)
            .set({
              bracketId: bracket.id,
              seedRanking: j + 1 // Sequential seeding within bracket
            })
            .where(eq(teams.id, team.id));

          console.log(`Assigned team ${team.id} to bracket ${bracket.id} with seed ${j + 1}`);
          teamIndex++;
        }
      }
    }

    console.log(`Successfully subdivided bracket ${bracketIdNum} into ${bracketCount} brackets`);

    res.json({
      success: true,
      message: `Bracket subdivided into ${bracketCount} brackets successfully`,
      totalBrackets: bracketCount,
      brackets: createdBrackets.map(b => ({
        id: b.id,
        name: b.name,
        ageGroupId: b.ageGroupId
      }))
    });

  } catch (error) {
    console.error('Error subdividing bracket:', error);
    res.status(500).json({ 
      error: 'Failed to subdivide bracket',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get subdivision info for a bracket
router.get('/events/:eventId/flights/:flightId/subdivision-info', async (req, res) => {
  const { eventId, flightId } = req.params;

  try {
    const eventIdStr = eventId;
    const bracketIdNum = parseInt(flightId); // This is actually a bracket ID from the frontend

    // Get bracket info
    const bracket = await db.query.eventBrackets.findFirst({
      where: and(
        eq(eventBrackets.id, bracketIdNum),
        eq(eventBrackets.eventId, eventIdStr)
      )
    });

    if (!bracket) {
      return res.status(404).json({ error: 'Bracket not found' });
    }

    // Get assigned teams count
    const assignedTeams = await db.query.teams.findMany({
      where: and(
        eq(teams.bracketId, bracketIdNum),
        eq(teams.eventId, eventIdStr)
      )
    });

    // Get existing subdivided brackets (brackets with similar names)
    const existingSubdivisions = await db.query.eventBrackets.findMany({
      where: and(
        eq(eventBrackets.ageGroupId, bracket.ageGroupId),
        eq(eventBrackets.eventId, eventIdStr)
      )
    });

    const maxPossibleBrackets = Math.floor(assignedTeams.length / 2); // At least 2 teams per bracket

    res.json({
      flight: {
        id: bracket.id,
        name: bracket.name,
        teamCount: assignedTeams.length
      },
      existingBrackets: existingSubdivisions.length,
      maxPossibleBrackets,
      canSubdivide: assignedTeams.length >= 4
    });

  } catch (error) {
    console.error('Error getting subdivision info:', error);
    res.status(500).json({ 
      error: 'Failed to get subdivision info',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;