
import { Router } from 'express';
import { db } from '@db';
import { eventAgeGroups } from '@db/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Add an endpoint to clean up age groups
router.post('/cleanup/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // First, get all existing age groups
    const allAgeGroups = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));
    
    console.log(`Found ${allAgeGroups.length} age groups for event ${eventId}`);
    
    // Create a map to track unique age groups
    const uniqueGroups = new Map();
    const keptGroups = [];
    const deletedGroupIds = [];
    
    // First pass - identify unique groups to keep (one per division code)
    for (const group of allAgeGroups) {
      // Always use division code format for consistent keys
      // If not present, generate it based on gender and birth year or age group
      let key;
      if (group.divisionCode) {
        key = group.divisionCode;
      } else if (group.birthYear) {
        key = `${group.gender.charAt(0)}${group.birthYear}`;
      } else if (group.ageGroup && group.ageGroup.startsWith('U') && group.ageGroup.length > 1) {
        // Extract year from U10, U11, etc.
        const year = parseInt(group.ageGroup.substring(1));
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - year;
        key = `${group.gender.charAt(0)}${birthYear}`;
      } else {
        // Fallback
        key = `${group.gender}-${group.ageGroup}`;
      }
      
      if (!uniqueGroups.has(key)) {
        // Keep this group
        uniqueGroups.set(key, group);
        keptGroups.push(group);
      } else {
        // Mark for deletion
        deletedGroupIds.push(group.id);
      }
    }
    
    // Delete duplicate groups
    if (deletedGroupIds.length > 0) {
      const deleted = await db.transaction(async (tx) => {
        // First, update any references from teams
        for (const keptGroup of keptGroups) {
          const matchingDuplicates = allAgeGroups.filter(g => {
            if (keptGroup.divisionCode && g.divisionCode) {
              // If both have division codes, use that for matching
              return g.divisionCode === keptGroup.divisionCode && g.id !== keptGroup.id;
            } else {
              // Fall back to gender and age group matching
              return g.gender === keptGroup.gender && 
                     g.ageGroup === keptGroup.ageGroup && 
                     g.id !== keptGroup.id;
            }
          });
          
          for (const duplicate of matchingDuplicates) {
            // Update teams to use the kept group ID instead
            await tx.execute(sql`
              UPDATE teams 
              SET age_group_id = ${keptGroup.id} 
              WHERE age_group_id = ${duplicate.id}
            `);
          }
        }
        
        // Now delete the duplicate age groups
        return await tx
          .delete(eventAgeGroups)
          .where(sql`id = ANY(${deletedGroupIds})`)
          .returning({ id: eventAgeGroups.id });
      });
      
      console.log(`Deleted ${deleted.length} duplicate age groups`);
    }
    
    res.json({
      message: "Age groups cleaned up successfully",
      totalBefore: allAgeGroups.length,
      totalAfter: keptGroups.length,
      deletedCount: deletedGroupIds.length
    });
  } catch (error) {
    console.error('Error cleaning up age groups:', error);
    res.status(500).json({ error: "Failed to clean up age groups" });
  }
});

export default router;
