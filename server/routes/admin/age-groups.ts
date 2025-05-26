import { Router } from 'express';
import { db } from '@db';
import { eventAgeGroups } from '@db/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Add an endpoint to fetch age groups with proper type safety
interface AgeGroup {
  id: number;
  eventId: string;
  ageGroup: string;
  gender: string;
  birthYear: number | null;
  divisionCode: string | null;
}

// Get age groups for an event
router.get('/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    console.log(`Fetching age groups for event ${eventId}`);

    const groups = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    console.log(`Fetched ${groups.length} age groups for event ${eventId}`);
    
    // Deduplicate age groups based on division code or gender+ageGroup
    const uniqueGroups = [];
    const uniqueMap = new Map();
    
    for (const group of groups) {
      // Create a unique key based on division code or gender+ageGroup
      let key = '';
      
      // First check if the group has a division code
      if (group.divisionCode) {
        key = group.divisionCode;
      } else {
        // If not, use gender + ageGroup as a fallback
        key = `${group.gender}-${group.ageGroup}`;
      }
      
      // Use consistent deduplication logic for all age groups including U8
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        
        // Ensure this age group record always has the division code set
        if (!group.divisionCode) {
          if (group.gender === 'Boys') {
            group.divisionCode = group.ageGroup === 'U8' ? 'B2017' : 
                                 group.ageGroup === 'U7' ? 'B2018' :
                                 group.ageGroup === 'U6' ? 'B2019' :
                                 `B${new Date().getFullYear() - parseInt(group.ageGroup.substring(1))}`;
          } else if (group.gender === 'Girls') {
            group.divisionCode = group.ageGroup === 'U8' ? 'G2017' : 
                                 group.ageGroup === 'U7' ? 'G2018' :
                                 group.ageGroup === 'U6' ? 'G2019' :
                                 `G${new Date().getFullYear() - parseInt(group.ageGroup.substring(1))}`;
          }
        }
        
        uniqueGroups.push(group);
      }
    }
    
    // Sort age groups in logical order (U4, U5, U6, etc.) grouped by gender
    const sortedGroups = uniqueGroups.sort((a, b) => {
      // First sort by gender (Boys first, then Girls)
      if (a.gender !== b.gender) {
        return a.gender === 'Boys' ? -1 : 1;
      }
      
      // Then sort by age group number (U4, U5, U6, etc.)
      const getAgeNumber = (ageGroup: string) => {
        if (ageGroup.startsWith('U')) {
          return parseInt(ageGroup.substring(1));
        }
        return 999; // Put non-U groups at the end
      };
      
      return getAgeNumber(a.ageGroup) - getAgeNumber(b.ageGroup);
    });

    console.log(`Returning ${sortedGroups.length} unique age groups after deduplication and sorting`);
    console.log('Age groups order:', sortedGroups.map(g => `${g.ageGroup}-${g.gender}`).join(', '));
    res.json(sortedGroups);
  } catch (error) {
    console.error('Error fetching age groups:', error);
    res.status(500).json({ error: "Failed to fetch age groups" });
  }
});

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
    const uniqueGroups = new Map<string, typeof allAgeGroups[0]>();
    const keptGroups: typeof allAgeGroups[0][] = [];
    const deletedGroupIds: number[] = [];

    // First pass - identify unique groups to keep
    for (const group of allAgeGroups) {
      // Always use division code format for consistent keys
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
        // Keep this group and ensure it has a division code
        if (!group.divisionCode) {
          group.divisionCode = key;
        }
        uniqueGroups.set(key, group);
        keptGroups.push(group);
      } else {
        deletedGroupIds.push(group.id);
      }
    }

    // Delete duplicate groups
    if (deletedGroupIds.length > 0) {
      await db.transaction(async (tx) => {
        // First, update any references from teams
        for (const keptGroup of keptGroups) {
          const matchingDuplicates = allAgeGroups.filter(g => {
            if (keptGroup.divisionCode && g.divisionCode) {
              return g.divisionCode === keptGroup.divisionCode && g.id !== keptGroup.id;
            } else {
              return g.gender === keptGroup.gender && 
                     g.ageGroup === keptGroup.ageGroup && 
                     g.id !== keptGroup.id;
            }
          });

          for (const duplicate of matchingDuplicates) {
            await tx.execute(sql`
              UPDATE teams 
              SET age_group_id = ${keptGroup.id} 
              WHERE age_group_id = ${duplicate.id}
            `);
          }
        }

        // Now delete the duplicate age groups
        await tx
          .delete(eventAgeGroups)
          .where(sql`id = ANY(${deletedGroupIds})`);
      });

      console.log(`Deleted ${deletedGroupIds.length} duplicate age groups`);
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