import { Router } from 'express';
import { db } from '@db';
import { eventAgeGroups, eventSettings, seasonalScopes, ageGroupSettings } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Enhanced age groups status endpoint with seasonal scope information
router.get('/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`📊 Fetching enhanced age groups status for event ${eventId}...`);

    // Get age groups with seasonal scope information
    const ageGroups = await db
      .select({
        id: eventAgeGroups.id,
        eventId: eventAgeGroups.eventId,
        ageGroup: eventAgeGroups.ageGroup,
        birthYear: eventAgeGroups.birthYear,
        gender: eventAgeGroups.gender,
        divisionCode: eventAgeGroups.divisionCode,
        fieldSize: eventAgeGroups.fieldSize,
        isEligible: eventAgeGroups.isEligible,
        projectedTeams: eventAgeGroups.projectedTeams,
        seasonalScopeId: eventAgeGroups.seasonalScopeId,
        seasonalScopeName: seasonalScopes.name,
        seasonalScopeStartYear: seasonalScopes.startYear,
        seasonalScopeEndYear: seasonalScopes.endYear
      })
      .from(eventAgeGroups)
      .leftJoin(seasonalScopes, eq(eventAgeGroups.seasonalScopeId, seasonalScopes.id))
      .where(eq(eventAgeGroups.eventId, eventId));

    // Get event's seasonal scope setting
    const scopeSetting = await db.query.eventSettings.findFirst({
      where: and(
        eq(eventSettings.eventId, eventId),
        eq(eventSettings.settingKey, 'seasonalScopeId')
      )
    });

    // Get the scope name if setting exists
    let eventScopeName = 'Unknown';
    if (scopeSetting) {
      const eventScope = await db.query.seasonalScopes.findFirst({
        where: eq(seasonalScopes.id, parseInt(scopeSetting.settingValue))
      });
      eventScopeName = eventScope?.name || 'Unknown';
    }

    console.log(`Found ${ageGroups.length} age groups for event ${eventId}`);
    console.log(`Event seasonal scope: ${eventScopeName}`);

    res.json({
      success: true,
      eventId,
      ageGroups,
      eventScopeName,
      scopeSetting: scopeSetting ? {
        seasonalScopeId: parseInt(scopeSetting.settingValue),
        scopeName: eventScopeName
      } : null,
      summary: {
        totalAgeGroups: ageGroups.length,
        withBirthYear: ageGroups.filter(ag => ag.birthYear).length,
        withDivisionCode: ageGroups.filter(ag => ag.divisionCode).length,
        withSeasonalScope: ageGroups.filter(ag => ag.seasonalScopeId).length,
        eligible: ageGroups.filter(ag => ag.isEligible).length
      }
    });

  } catch (error) {
    console.error('Error fetching age groups status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch age groups status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;