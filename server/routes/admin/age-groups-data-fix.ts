import { Router } from 'express';
import { db } from '@db';
import { eventAgeGroups, eventSettings, seasonalScopes, ageGroupSettings } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Fix ALL events missing age groups data
router.post('/fix-all-events', async (req, res) => {
  try {
    console.log(`🔧 Fixing age groups data for ALL events...`);

    // Get all events without seasonal scope settings
    const eventsWithoutScope = await db
      .select({ id: events.id, name: events.name })
      .from(events)
      .leftJoin(eventSettings, and(
        eq(eventSettings.eventId, events.id),
        eq(eventSettings.settingKey, 'seasonalScopeId')
      ))
      .where(and(
        eq(events.isArchived, false),
        eq(eventSettings.eventId, null) // No seasonal scope setting
      ));

    // Get the most recent seasonal scope
    const recentScope = await db.query.seasonalScopes.findFirst({
      orderBy: (scopes, { desc }) => [desc(scopes.id)]
    });

    if (!recentScope) {
      return res.json({
        success: false,
        message: 'No seasonal scope available'
      });
    }

    const results = [];
    
    for (const event of eventsWithoutScope) {
      console.log(`📅 Processing event: ${event.name} (ID: ${event.id})`);
      
      // Add seasonal scope setting
      await db.insert(eventSettings).values({
        eventId: event.id,
        settingKey: 'seasonalScopeId',
        settingValue: recentScope.id.toString()
      });

      // Check if event already has age groups
      const existingAgeGroups = await db.query.eventAgeGroups.findMany({
        where: eq(eventAgeGroups.eventId, event.id)
      });

      if (existingAgeGroups.length === 0) {
        // Get age groups from the seasonal scope
        const scopeAgeGroups = await db.query.ageGroupSettings.findMany({
          where: eq(ageGroupSettings.seasonalScopeId, recentScope.id)
        });

        if (scopeAgeGroups.length > 0) {
          // Convert scope age groups to event age groups format
          const ageGroupsToInsert = scopeAgeGroups.map(ag => ({
            eventId: event.id,
            ageGroup: ag.ageGroup,
            birthYear: ag.birthYear,
            gender: ag.gender,
            divisionCode: ag.divisionCode,
            seasonalScopeId: recentScope.id,
            fieldSize: (ag.ageGroup && typeof ag.ageGroup === 'string' && ag.ageGroup.startsWith('U')) ?
              (parseInt(ag.ageGroup.substring(1)) <= 7 ? '4v4' :
                parseInt(ag.ageGroup.substring(1)) <= 10 ? '7v7' :
                  parseInt(ag.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11',
            projectedTeams: 8,
            createdAt: new Date().toISOString(),
            birth_date_start: new Date(ag.birthYear, 0, 1).toISOString().split('T')[0],
            isEligible: true
          }));

          // Insert the age groups
          await db.insert(eventAgeGroups).values(ageGroupsToInsert);
          
          results.push({
            eventId: event.id,
            eventName: event.name,
            ageGroupsCreated: ageGroupsToInsert.length,
            status: 'created'
          });
        }
      } else {
        // Update existing age groups to have seasonal scope ID if missing
        let updated = 0;
        for (const ageGroup of existingAgeGroups) {
          if (!ageGroup.seasonalScopeId) {
            await db.update(eventAgeGroups)
              .set({ seasonalScopeId: recentScope.id })
              .where(eq(eventAgeGroups.id, ageGroup.id));
            updated++;
          }
        }
        
        results.push({
          eventId: event.id,
          eventName: event.name,
          ageGroupsUpdated: updated,
          existingGroups: existingAgeGroups.length,
          status: 'updated'
        });
      }
    }

    res.json({
      success: true,
      message: `Fixed ${eventsWithoutScope.length} events`,
      seasonalScopeName: recentScope.name,
      results
    });

  } catch (error) {
    console.error('Error fixing all events age groups data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix all events age groups data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fix missing age groups data for specific event
router.post('/fix-age-groups/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`🔧 Fixing age groups data for event ${eventId}...`);

    // Check if event has age groups
    const existingAgeGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId)
    });

    console.log(`Found ${existingAgeGroups.length} existing age groups`);

    // Check if event has seasonal scope setting
    let scopeSetting = await db.query.eventSettings.findFirst({
      where: and(
        eq(eventSettings.eventId, eventId),
        eq(eventSettings.settingKey, 'seasonalScopeId')
      )
    });

    if (!scopeSetting) {
      // Get the most recent seasonal scope
      const recentScope = await db.query.seasonalScopes.findFirst({
        orderBy: (scopes, { desc }) => [desc(scopes.id)]
      });

      if (recentScope) {
        console.log(`📅 Linking event to seasonal scope: ${recentScope.name} (ID: ${recentScope.id})`);
        
        // Create the setting
        await db.insert(eventSettings).values({
          eventId: eventId,
          settingKey: 'seasonalScopeId',
          settingValue: recentScope.id.toString()
        });

        scopeSetting = {
          eventId,
          settingKey: 'seasonalScopeId',
          settingValue: recentScope.id.toString()
        };
      }
    }

    if (scopeSetting && existingAgeGroups.length === 0) {
      const seasonalScopeId = parseInt(scopeSetting.settingValue);
      console.log(`🔄 Creating age groups from seasonal scope ${seasonalScopeId}...`);

      // Get age groups from the seasonal scope
      const scopeAgeGroups = await db.query.ageGroupSettings.findMany({
        where: eq(ageGroupSettings.seasonalScopeId, seasonalScopeId)
      });

      if (scopeAgeGroups.length > 0) {
        console.log(`Found ${scopeAgeGroups.length} age groups in seasonal scope`);

        // Convert scope age groups to event age groups format
        const ageGroupsToInsert = scopeAgeGroups.map(ag => ({
          eventId,
          ageGroup: ag.ageGroup,
          birthYear: ag.birthYear,
          gender: ag.gender,
          divisionCode: ag.divisionCode,
          seasonalScopeId: seasonalScopeId,
          fieldSize: (ag.ageGroup && typeof ag.ageGroup === 'string' && ag.ageGroup.startsWith('U')) ?
            (parseInt(ag.ageGroup.substring(1)) <= 7 ? '4v4' :
              parseInt(ag.ageGroup.substring(1)) <= 10 ? '7v7' :
                parseInt(ag.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11',
          projectedTeams: 8,
          createdAt: new Date().toISOString(),
          birth_date_start: new Date(ag.birthYear, 0, 1).toISOString().split('T')[0],
          isEligible: true
        }));

        // Insert the age groups
        await db.insert(eventAgeGroups).values(ageGroupsToInsert);
        console.log(`✅ Created ${ageGroupsToInsert.length} age groups from seasonal scope`);

        res.json({
          success: true,
          message: `Fixed age groups data - created ${ageGroupsToInsert.length} age groups`,
          seasonalScopeName: scopeSetting ? await getSeasonalScopeName(seasonalScopeId) : 'Unknown'
        });
      } else {
        res.json({
          success: false,
          message: 'No age groups found in seasonal scope'
        });
      }
    } else if (existingAgeGroups.length > 0) {
      // Update existing age groups to have seasonal scope ID if missing
      let updated = 0;
      if (scopeSetting) {
        const seasonalScopeId = parseInt(scopeSetting.settingValue);
        
        for (const ageGroup of existingAgeGroups) {
          if (!ageGroup.seasonalScopeId) {
            await db.update(eventAgeGroups)
              .set({ seasonalScopeId: seasonalScopeId })
              .where(eq(eventAgeGroups.id, ageGroup.id));
            updated++;
          }
        }
      }
      
      res.json({
        success: true,
        message: `Age groups already exist. Updated ${updated} records with seasonal scope linkage.`,
        existingGroups: existingAgeGroups.length
      });
    } else {
      res.json({
        success: false,
        message: 'No seasonal scope configured for this event'
      });
    }

  } catch (error) {
    console.error('Error fixing age groups data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix age groups data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function getSeasonalScopeName(scopeId: number): Promise<string> {
  try {
    const scope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, scopeId)
    });
    return scope?.name || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

export default router;