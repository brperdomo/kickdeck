import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups, eventAgeGroupFees, eventFees, eventSettings } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sql } from 'drizzle-orm/sql';

const router = Router();

// Update event endpoint
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id);
    const eventData = req.body;

    // Convert seasonalScopeId to number or null
    const seasonalScopeId = eventData.seasonalScopeId ? 
      Number(eventData.seasonalScopeId) : null;
    console.log('Updating event with seasonalScopeId:', seasonalScopeId);

    // If there's a seasonalScopeId, we need to fetch its age groups and copy them
    if (seasonalScopeId) {
      try {
        // First, fetch the age groups from the seasonal scope
        const scopeAgeGroups = await db.query.ageGroupSettings.findMany({
          where: eq(ageGroupSettings.seasonalScopeId, seasonalScopeId)
        });

        console.log(`Found ${scopeAgeGroups.length} age groups in seasonal scope ${seasonalScopeId}`);

        // For each age group in the scope, create a corresponding event age group
        if (scopeAgeGroups.length > 0) {
          const eventAgeGroupsToInsert = scopeAgeGroups.map(ag => ({
            eventId: eventId,
            ageGroup: ag.ageGroup,
            birthYear: ag.birthYear,
            gender: ag.gender,
            divisionCode: ag.divisionCode,
            fieldSize: "Standard", // Default value, adjust as needed
            projectedTeams: 8, // Default value, adjust as needed
            createdAt: new Date().toISOString(),
            birth_date_start: new Date(ag.minBirthYear, 0, 1).toISOString().split('T')[0]
          }));

          // Insert the age groups
          await db.insert(eventAgeGroups).values(eventAgeGroupsToInsert);
          console.log(`Successfully copied ${eventAgeGroupsToInsert.length} age groups from scope to event ${eventId}`);
        }
      } catch (error) {
        console.error('Error copying age groups from seasonal scope:', error);
      }
    }

    // Update the event in the database
    const event = await db.query.events.findFirst({where: eq(events.id, eventId)})
    if (!event) {
      res.status(404).json({error: "Event not found"})
      return
    }
    await db.update(events)
      .set({
        name: eventData.name,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        registrationStartDate: eventData.registrationStartDate,
        registrationEndDate: eventData.registrationEndDate,
        description: eventData.description,
        location: eventData.location,
        status: eventData.status,
      })
      .where(eq(events.id, eventId));

    // Store the seasonalScopeId in the event settings table since events table doesn't have this column
    if (seasonalScopeId) {
      try {
        await db.insert(eventSettings).values({
          eventId: eventId,
          settingKey: 'seasonalScopeId',
          settingValue: seasonalScopeId.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`Successfully saved seasonalScopeId ${seasonalScopeId} in event settings for event ${eventId}`);
      } catch (error) {
        console.error('Error saving seasonalScopeId to event settings:', error);
      }
    }

    res.json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ 
      error: "Failed to update event", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Added route to fetch age groups with deduplication
router.get('/api/admin/events/:eventId/age-groups', async (req, res) => { //Assumed another endpoint exists
  try {
    const eventId = req.params.eventId;

    // Use a direct SQL query to ensure we get only the distinct age groups
    const ageGroups = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId))
      .orderBy(eventAgeGroups.gender, eventAgeGroups.ageGroup);

    // Create unique groups based on division code or gender-ageGroup combination
    const uniqueMap = new Map();
    const uniqueGroups = [];

    // If we have no age groups but this is an API call for an existing event,
    // we should return standard age groups as a fallback
    if (ageGroups.length === 0) {
      // Define standard age groups directly instead of importing (which might be failing)
      const PREDEFINED_AGE_GROUPS = [
        { ageGroup: 'U4', birthYear: 2021, gender: 'Boys', divisionCode: 'B2021' },
        { ageGroup: 'U4', birthYear: 2021, gender: 'Girls', divisionCode: 'G2021' },
        { ageGroup: 'U5', birthYear: 2020, gender: 'Boys', divisionCode: 'B2020' },
        { ageGroup: 'U5', birthYear: 2020, gender: 'Girls', divisionCode: 'G2020' },
        { ageGroup: 'U6', birthYear: 2019, gender: 'Boys', divisionCode: 'B2019' },
        { ageGroup: 'U6', birthYear: 2019, gender: 'Girls', divisionCode: 'G2019' },
        { ageGroup: 'U7', birthYear: 2018, gender: 'Boys', divisionCode: 'B2018' },
        { ageGroup: 'U7', birthYear: 2018, gender: 'Girls', divisionCode: 'G2018' },
        { ageGroup: 'U8', birthYear: 2017, gender: 'Boys', divisionCode: 'B2017' },
        { ageGroup: 'U8', birthYear: 2017, gender: 'Girls', divisionCode: 'G2017' },
        { ageGroup: 'U9', birthYear: 2016, gender: 'Boys', divisionCode: 'B2016' },
        { ageGroup: 'U9', birthYear: 2016, gender: 'Girls', divisionCode: 'G2016' },
        { ageGroup: 'U10', birthYear: 2015, gender: 'Boys', divisionCode: 'B2015' },
        { ageGroup: 'U10', birthYear: 2015, gender: 'Girls', divisionCode: 'G2015' },
        { ageGroup: 'U11', birthYear: 2014, gender: 'Boys', divisionCode: 'B2014' },
        { ageGroup: 'U11', birthYear: 2014, gender: 'Girls', divisionCode: 'G2014' },
        { ageGroup: 'U12', birthYear: 2013, gender: 'Boys', divisionCode: 'B2013' },
        { ageGroup: 'U12', birthYear: 2013, gender: 'Girls', divisionCode: 'G2013' },
        { ageGroup: 'U13', birthYear: 2012, gender: 'Boys', divisionCode: 'B2012' },
        { ageGroup: 'U13', birthYear: 2012, gender: 'Girls', divisionCode: 'G2012' },
        { ageGroup: 'U14', birthYear: 2011, gender: 'Boys', divisionCode: 'B2011' },
        { ageGroup: 'U14', birthYear: 2011, gender: 'Girls', divisionCode: 'G2011' },
        { ageGroup: 'U15', birthYear: 2010, gender: 'Boys', divisionCode: 'B2010' },
        { ageGroup: 'U15', birthYear: 2010, gender: 'Girls', divisionCode: 'G2010' },
        { ageGroup: 'U16', birthYear: 2009, gender: 'Boys', divisionCode: 'B2009' },
        { ageGroup: 'U16', birthYear: 2009, gender: 'Girls', divisionCode: 'G2009' },
        { ageGroup: 'U17', birthYear: 2008, gender: 'Boys', divisionCode: 'B2008' },
        { ageGroup: 'U17', birthYear: 2008, gender: 'Girls', divisionCode: 'G2008' },
        { ageGroup: 'U18', birthYear: 2007, gender: 'Boys', divisionCode: 'B2007' },
        { ageGroup: 'U18', birthYear: 2007, gender: 'Girls', divisionCode: 'G2007' },
        { ageGroup: 'U19', birthYear: 2006, gender: 'Boys', divisionCode: 'B2006' },
        { ageGroup: 'U19', birthYear: 2006, gender: 'Girls', divisionCode: 'G2006' },
      ];

      for (const group of PREDEFINED_AGE_GROUPS) {
        const key = group.divisionCode;
        uniqueGroups.push({
          id: null, // Will be assigned when saved
          eventId,
          ageGroup: group.ageGroup,
          gender: group.gender,
          divisionCode: group.divisionCode,
          birthDateStart: null,
          birthDateEnd: null,
          fieldSize: group.ageGroup.startsWith('U') ? 
            (parseInt(group.ageGroup.substring(1)) <= 7 ? '4v4' : 
             parseInt(group.ageGroup.substring(1)) <= 10 ? '7v7' : 
             parseInt(group.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11',
          projectedTeams: 0,
          createdAt: new Date().toISOString(),
          selected: true, //Added this line
        });
      }

      console.log(`No age groups found. Returning ${uniqueGroups.length} standard age groups as fallback`);
      return res.json(uniqueGroups);
    }

    for (const group of ageGroups) {
      // Ensure every group has a division code
      const divisionCode = group.divisionCode || `${group.gender.charAt(0)}${group.birthYear || ''}`;
      const key = divisionCode;

      if (!uniqueMap.has(key)) {
        // Create a simplified version of the group with standard field size
        const simplifiedGroup = {
          ...group,
          fieldSize: group.fieldSize || null, // Keep original field size if present
          selected: true, // Mark as selected since it's an existing group
        };
        uniqueMap.set(key, simplifiedGroup);
        uniqueGroups.push(simplifiedGroup);
      }
    }

    // When editing an event, we want to show ALL age groups including standard ones not initially selected
    // Define standard age groups directly instead of importing (which might be failing)
    const PREDEFINED_AGE_GROUPS = [
      { ageGroup: 'U4', birthYear: 2021, gender: 'Boys', divisionCode: 'B2021' },
      { ageGroup: 'U4', birthYear: 2021, gender: 'Girls', divisionCode: 'G2021' },
      { ageGroup: 'U5', birthYear: 2020, gender: 'Boys', divisionCode: 'B2020' },
      { ageGroup: 'U5', birthYear: 2020, gender: 'Girls', divisionCode: 'G2020' },
      { ageGroup: 'U6', birthYear: 2019, gender: 'Boys', divisionCode: 'B2019' },
      { ageGroup: 'U6', birthYear: 2019, gender: 'Girls', divisionCode: 'G2019' },
      { ageGroup: 'U7', birthYear: 2018, gender: 'Boys', divisionCode: 'B2018' },
      { ageGroup: 'U7', birthYear: 2018, gender: 'Girls', divisionCode: 'G2018' },
      { ageGroup: 'U8', birthYear: 2017, gender: 'Boys', divisionCode: 'B2017' },
      { ageGroup: 'U8', birthYear: 2017, gender: 'Girls', divisionCode: 'G2017' },
      { ageGroup: 'U9', birthYear: 2016, gender: 'Boys', divisionCode: 'B2016' },
      { ageGroup: 'U9', birthYear: 2016, gender: 'Girls', divisionCode: 'G2016' },
      { ageGroup: 'U10', birthYear: 2015, gender: 'Boys', divisionCode: 'B2015' },
      { ageGroup: 'U10', birthYear: 2015, gender: 'Girls', divisionCode: 'G2015' },
      { ageGroup: 'U11', birthYear: 2014, gender: 'Boys', divisionCode: 'B2014' },
      { ageGroup: 'U11', birthYear: 2014, gender: 'Girls', divisionCode: 'G2014' },
      { ageGroup: 'U12', birthYear: 2013, gender: 'Boys', divisionCode: 'B2013' },
      { ageGroup: 'U12', birthYear: 2013, gender: 'Girls', divisionCode: 'G2013' },
      { ageGroup: 'U13', birthYear: 2012, gender: 'Boys', divisionCode: 'B2012' },
      { ageGroup: 'U13', birthYear: 2012, gender: 'Girls', divisionCode: 'G2012' },
      { ageGroup: 'U14', birthYear: 2011, gender: 'Boys', divisionCode: 'B2011' },
      { ageGroup: 'U14', birthYear: 2011, gender: 'Girls', divisionCode: 'G2011' },
      { ageGroup: 'U15', birthYear: 2010, gender: 'Boys', divisionCode: 'B2010' },
      { ageGroup: 'U15', birthYear: 2010, gender: 'Girls', divisionCode: 'G2010' },
      { ageGroup: 'U16', birthYear: 2009, gender: 'Boys', divisionCode: 'B2009' },
      { ageGroup: 'U16', birthYear: 2009, gender: 'Girls', divisionCode: 'G2009' },
      { ageGroup: 'U17', birthYear: 2008, gender: 'Boys', divisionCode: 'B2008' },
      { ageGroup: 'U17', birthYear: 2008, gender: 'Girls', divisionCode: 'G2008' },
      { ageGroup: 'U18', birthYear: 2007, gender: 'Boys', divisionCode: 'B2007' },
      { ageGroup: 'U18', birthYear: 2007, gender: 'Girls', divisionCode: 'G2007' },
      { ageGroup: 'U19', birthYear: 2006, gender: 'Boys', divisionCode: 'B2006' },
      { ageGroup: 'U19', birthYear: 2006, gender: 'Girls', divisionCode: 'G2006' },
    ];

    // Make sure all standard age groups are included in the response
    for (const stdGroup of PREDEFINED_AGE_GROUPS) {
      const key = stdGroup.divisionCode;
      if (!uniqueMap.has(key)) {
        // Add standard age group if not already present
        const fieldSize = stdGroup.ageGroup.startsWith('U') ? 
          (parseInt(stdGroup.ageGroup.substring(1)) <= 7 ? '4v4' : 
           parseInt(stdGroup.ageGroup.substring(1)) <= 10 ? '7v7' : 
           parseInt(stdGroup.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11';

        uniqueGroups.push({
          id: null,
          eventId,
          ageGroup: stdGroup.ageGroup,
          gender: stdGroup.gender,
          divisionCode: stdGroup.divisionCode,
          birthDateStart: null,
          birthDateEnd: null,
          fieldSize: fieldSize,
          projectedTeams: 0,
          createdAt: new Date().toISOString(),
          selected: false, // Not initially selected
        });
      }
    }

    // If we still have no age groups after deduplication, return standard age groups
    if (uniqueGroups.length === 0) {
      // Define standard age groups directly
      const PREDEFINED_AGE_GROUPS = [
        { ageGroup: 'U4', birthYear: 2021, gender: 'Boys', divisionCode: 'B2021' },
        { ageGroup: 'U4', birthYear: 2021, gender: 'Girls', divisionCode: 'G2021' },
        { ageGroup: 'U5', birthYear: 2020, gender: 'Boys', divisionCode: 'B2020' },
        { ageGroup: 'U5', birthYear: 2020, gender: 'Girls', divisionCode: 'G2020' },
        { ageGroup: 'U6', birthYear: 2019, gender: 'Boys', divisionCode: 'B2019' },
        { ageGroup: 'U6', birthYear: 2019, gender: 'Girls', divisionCode: 'G2019' },
        { ageGroup: 'U7', birthYear: 2018, gender: 'Boys', divisionCode: 'B2018' },
        { ageGroup: 'U7', birthYear: 2018, gender: 'Girls', divisionCode: 'G2018' },
        { ageGroup: 'U8', birthYear: 2017, gender: 'Boys', divisionCode: 'B2017' },
        { ageGroup: 'U8', birthYear: 2017, gender: 'Girls', divisionCode: 'G2017' },
        { ageGroup: 'U9', birthYear: 2016, gender: 'Boys', divisionCode: 'B2016' },
        { ageGroup: 'U9', birthYear: 2016, gender: 'Girls', divisionCode: 'G2016' },
        { ageGroup: 'U10', birthYear: 2015, gender: 'Boys', divisionCode: 'B2015' },
        { ageGroup: 'U10', birthYear: 2015, gender: 'Girls', divisionCode: 'G2015' },
        { ageGroup: 'U11', birthYear: 2014, gender: 'Boys', divisionCode: 'B2014' },
        { ageGroup: 'U11', birthYear: 2014, gender: 'Girls', divisionCode: 'G2014' },
        { ageGroup: 'U12', birthYear: 2013, gender: 'Boys', divisionCode: 'B2013' },
        { ageGroup: 'U12', birthYear: 2013, gender: 'Girls', divisionCode: 'G2013' }
      ];

      for (const group of PREDEFINED_AGE_GROUPS) {
        const fieldSize = group.ageGroup.startsWith('U') ? 
          (parseInt(group.ageGroup.substring(1)) <= 7 ? '4v4' : 
           parseInt(group.ageGroup.substring(1)) <= 10 ? '7v7' : 
           parseInt(group.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11';

        uniqueGroups.push({
          id: null,
          eventId,
          ageGroup: group.ageGroup,
          gender: group.gender,
          divisionCode: group.divisionCode,
          birthDateStart: null,
          birthDateEnd: null,
          fieldSize: fieldSize,
          projectedTeams: 0,
          createdAt: new Date().toISOString(),
          selected: false, // Not initially selected
        });
      }

      console.log(`No age groups found. Added ${uniqueGroups.length} standard age groups as fallback`);
    }

    console.log(`Fetched ${ageGroups.length} age groups for event ${eventId}`);
    console.log(`Returning ${uniqueGroups.length} unique age groups after deduplication or adding standard groups`);

    res.json(uniqueGroups);
  } catch (error) {
    console.error('Error fetching age groups:', error);
    res.status(500).json({ error: 'Failed to fetch age groups' });
  }
});


router.get('/:id/age-groups', async (req, res) => {
  const eventId = req.params.id;
  try {
    // Fetch age groups from the database
    let results = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId),
    });

    console.log(`Fetched ${results.length} age groups for event ${eventId}`);

    if (results.length === 0) {
      // If no age groups found, check if event has a seasonal scope ID in settings
      const settingResult = await db.query.eventSettings.findFirst({
        where: and(
          eq(eventSettings.eventId, eventId),
          eq(eventSettings.settingKey, 'seasonalScopeId')
        )
      });

      if (settingResult) {
        const seasonalScopeId = parseInt(settingResult.settingValue);
        console.log(`No age groups found, using seasonal scope ${seasonalScopeId} as fallback`);

        // Fetch age groups from the seasonal scope
        const scopeAgeGroups = await db.query.ageGroupSettings.findMany({
          where: eq(ageGroupSettings.seasonalScopeId, seasonalScopeId)
        });

        // If no age groups are already in the event, create them from the seasonal scope
        if (scopeAgeGroups.length > 0 && results.length === 0) {
          console.log(`Creating ${scopeAgeGroups.length} age groups from seasonal scope ${seasonalScopeId}`);

          // Insert the age groups into the database for this event
          for (const group of scopeAgeGroups) {
            await db.insert(eventAgeGroups).values({
              eventId,
              ageGroup: group.ageGroup,
              birthYear: group.birthYear,
              gender: group.gender,
              fieldSize: "11v11", // Default value
              projectedTeams: 8, // Default value
              seasonalScopeId: group.seasonalScopeId,
              divisionCode: group.divisionCode,
              createdAt: new Date().toISOString(),
            });
          }

          // Fetch the newly created age groups
          results = await db.query.eventAgeGroups.findMany({
            where: eq(eventAgeGroups.eventId, eventId)
          });
          console.log(`Created and fetched ${results.length} age groups for event ${eventId}`);
        }
      }
    }

    // Remove duplicate age groups with the same ageGroup and gender
    const uniqueAgeGroups = results.reduce((acc, curr) => {
      const key = `${curr.ageGroup}-${curr.gender}`;
      if (!acc.some(item => `${item.ageGroup}-${item.gender}` === key)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    console.log(`Returning ${uniqueAgeGroups.length} unique age groups after deduplication`);

    // Mark all age groups as selected for display in the form
    const ageGroupsWithSelected = uniqueAgeGroups.map(group => ({
      ...group,
      selected: true
    }));

    res.json(ageGroupsWithSelected);
  } catch (error) {
    console.error('Error fetching age groups:', error);
    res.status(500).json({ error: 'Failed to fetch age groups' });
  }
});

// Update fee endpoint
router.patch('/fees/:feeId', async (req, res) => {
  try {
    const feeId = req.params.feeId;
    const { name, amount, beginDate, endDate, accountingCodeId } = req.body;

    console.log("Updating fee:", feeId, "with data:", JSON.stringify(req.body));

    // Parse dates properly
    let parsedBeginDate = null;
    let parsedEndDate = null;

    if (beginDate) {
      parsedBeginDate = new Date(beginDate);
      // Check if valid date
      parsedBeginDate = isNaN(parsedBeginDate.getTime()) ? null : parsedBeginDate;
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      // Check if valid date
      parsedEndDate = isNaN(parsedEndDate.getTime()) ? null : parsedEndDate;
    }

    const updatedFee = await db.update(eventFees)
      .set({ 
        name, 
        amount: Number(amount), // Ensure amount is a number
        beginDate: parsedBeginDate, 
        endDate: parsedEndDate,
        accountingCodeId: accountingCodeId || null
      })
      .where(eq(eventFees.id, parseInt(feeId)))
      .returning();

    console.log("Fee updated successfully:", updatedFee[0]);
    res.json(updatedFee[0]);
  } catch (error) {
    console.error("Error updating fee:", error);
    res.status(500).json({ 
      error: "Failed to update fee", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Handle fee assignments
router.post('/fee-assignments', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const { feeId, assignments } = req.body;

    console.log("Received fee assignment request:", { eventId, feeId, assignments });

    if (!feeId || !assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete existing assignments for this fee
      await tx
        .delete(eventAgeGroupFees)
        .where(eq(eventAgeGroupFees.feeId, feeId));

      // Create new assignments
      for (const assignment of assignments) {
        await tx.insert(eventAgeGroupFees).values({
          ageGroupId: assignment.ageGroupId,
          feeId: feeId
        });
      }
    });

    return res.status(200).json({ message: 'Fee assignments updated successfully' });
  } catch (error) {
    console.error('Error updating fee assignments:', error);
    return res.status(500).json({ error: 'Failed to update fee assignments', details: error.message });
  }
});

export default router;