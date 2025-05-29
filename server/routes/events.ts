import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups, eventSettings, teams, tournamentGroups, eventAdministrators, eventFees, eventComplexes, eventAgeGroupFees } from '@db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { sortAgeGroups } from '../lib/ageGroupSorter';

const router = Router();

// Add POST route to create events
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    console.log('Creating event with data:', eventData);

    // Create the event first
    const [event] = await db.insert(events).values({
      name: eventData.name,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      applicationDeadline: eventData.applicationDeadline,
      timezone: eventData.timezone,
      details: eventData.details,
      agreement: eventData.agreement,
      refundPolicy: eventData.refundPolicy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      applicationsReceived: 0,
      teamsAccepted: 0,
      isArchived: false
    }).returning();

    // Convert seasonalScopeId to number
    const seasonalScopeId = eventData.seasonalScopeId ?
      Number(eventData.seasonalScopeId) : null;
    console.log('Using seasonalScopeId:', seasonalScopeId);

    // Save the seasonal scope ID in event settings
    if (seasonalScopeId) {
      await db.insert(eventSettings).values({
        eventId: event.id.toString(), // Store as string since eventId column is text
        settingKey: 'seasonalScopeId',
        settingValue: seasonalScopeId.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`Saved seasonalScopeId ${seasonalScopeId} for event ${event.id}`);

      // Fetch age groups from seasonal scope
      const scopeAgeGroups = await db.query.ageGroupSettings.findMany({
        where: eq(ageGroupSettings.seasonalScopeId, seasonalScopeId)
      });

      console.log(`Retrieved ${scopeAgeGroups.length} age groups from scope ${seasonalScopeId}`);

      // Convert scope age groups to event age groups
      if (scopeAgeGroups.length > 0) {
        const ageGroupsToInsert = scopeAgeGroups.map(ag => ({
          eventId: event.id.toString(), // Store as string since eventId column is text
          ageGroup: ag.ageGroup,
          birthYear: ag.birthYear,
          gender: ag.gender,
          divisionCode: ag.divisionCode,
          fieldSize: ag.ageGroup.startsWith('U') ?
            (parseInt(ag.ageGroup.substring(1)) <= 7 ? '4v4' :
              parseInt(ag.ageGroup.substring(1)) <= 10 ? '7v7' :
                parseInt(ag.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11',
          projectedTeams: 8,
          createdAt: new Date().toISOString(),
          birthDateStart: new Date(ag.birthYear, 0, 1).toISOString().split('T')[0],
          birthDateEnd: new Date(ag.birthYear, 11, 31).toISOString().split('T')[0]
        }));

        // Insert the age groups
        await db.insert(eventAgeGroups).values(ageGroupsToInsert);
        console.log(`Successfully created ${ageGroupsToInsert.length} age groups for event ${event.id}`);
      }
    }

    res.status(201).json({
      message: "Event created successfully",
      event: {
        ...event,
        seasonalScopeId
      }
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      error: "Failed to create event",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update event endpoint
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = parseInt(id);
    const eventData = req.body;

    console.log('Updating event with data:', eventData);

    // Convert seasonalScopeId to number or null
    const seasonalScopeId = eventData.seasonalScopeId ?
      Number(eventData.seasonalScopeId) : null;
    console.log('Using seasonalScopeId:', seasonalScopeId);

    // Update the event in the database first
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    await db.update(events)
      .set({
        name: eventData.name,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        applicationDeadline: eventData.applicationDeadline,
        timezone: eventData.timezone,
        details: eventData.details,
        agreement: eventData.agreement,
        refundPolicy: eventData.refundPolicy
      })
      .where(eq(events.id, eventId));

    // If there's a seasonalScopeId, handle the scope and age groups
    if (seasonalScopeId) {
      console.log(`Setting seasonalScopeId ${seasonalScopeId} for event ${eventId}`);

      // Check if seasonal scope setting already exists
      const existingScopeSetting = await db.query.eventSettings.findFirst({
        where: and(
          eq(eventSettings.eventId, eventId),
          eq(eventSettings.settingKey, 'seasonalScopeId')
        )
      });

      if (existingScopeSetting) {
        // Update existing setting
        await db.update(eventSettings)
          .set({
            settingValue: seasonalScopeId.toString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(eventSettings.id, existingScopeSetting.id));
        console.log(`Updated existing seasonalScopeId setting for event ${eventId}`);
      } else {
        // Insert new setting
        await db.insert(eventSettings).values({
          eventId: eventId,
          settingKey: 'seasonalScopeId',
          settingValue: seasonalScopeId.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`Created new seasonalScopeId setting for event ${eventId}`);
      }

      // DISABLED: Never delete age groups to prevent constraint violations
      // Age group eligibility is managed through the separate eligibility table
      console.log('Age group deletion disabled - eligibility managed separately');

      // Fetch the age groups from the seasonal scope
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
          fieldSize: ag.ageGroup.startsWith('U') ?
            (parseInt(ag.ageGroup.substring(1)) <= 7 ? '4v4' :
              parseInt(ag.ageGroup.substring(1)) <= 10 ? '7v7' :
                parseInt(ag.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11',
          projectedTeams: 8,
          createdAt: new Date().toISOString(),
          birthDateStart: new Date(ag.birthYear, 0, 1).toISOString().split('T')[0],
          birthDateEnd: new Date(ag.birthYear, 11, 31).toISOString().split('T')[0]
        }));

        // Insert the age groups
        await db.insert(eventAgeGroups).values(eventAgeGroupsToInsert);
        console.log(`Successfully copied ${eventAgeGroupsToInsert.length} age groups from scope to event ${eventId}`);
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

// Get event age groups endpoint
router.get('/:id/age-groups', async (req, res) => {
  const eventId = req.params.id; // Keep as string since eventId is text in eventAgeGroups
  console.log(`Fetching age groups for event: ${eventId}`);

  try {
    // Get age groups directly associated with the event
    let ageGroups = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId)
    });

    console.log(`Found ${ageGroups.length} age groups directly associated with event`);

    // If no age groups found, check the seasonal scope
    if (ageGroups.length === 0) {
      // Get the seasonal scope ID from event settings
      const scopeSetting = await db.query.eventSettings.findFirst({
        where: eq(eventSettings.eventId, eventId)
      });

      if (scopeSetting) {
        const seasonalScopeId = parseInt(scopeSetting.settingValue);
        console.log(`No age groups found in event, checking seasonal scope: ${seasonalScopeId}`);

        // Get age groups from the seasonal scope
        const scopeAgeGroups = await db.query.ageGroupSettings.findMany({
          where: eq(ageGroupSettings.seasonalScopeId, seasonalScopeId)
        });

        if (scopeAgeGroups.length > 0) {
          console.log(`Found ${scopeAgeGroups.length} age groups in seasonal scope ${seasonalScopeId}`);

          // Convert scope age groups to event age groups format
          const ageGroupsToInsert = scopeAgeGroups.map(ag => ({
            eventId,  // Already a string
            ageGroup: ag.ageGroup,
            birthYear: ag.birthYear,
            gender: ag.gender,
            divisionCode: ag.divisionCode,
            fieldSize: ag.ageGroup.startsWith('U') ?
              (parseInt(ag.ageGroup.substring(1)) <= 7 ? '4v4' :
                parseInt(ag.ageGroup.substring(1)) <= 10 ? '7v7' :
                  parseInt(ag.ageGroup.substring(1)) <= 12 ? '9v9' : '11v11') : '11v11', // U13 and up (including U19) use 11v11
            projectedTeams: 8,
            createdAt: new Date().toISOString(),
            birthDateStart: new Date(ag.birthYear, 0, 1).toISOString().split('T')[0],
            birthDateEnd: new Date(ag.birthYear, 11, 31).toISOString().split('T')[0]
          }));

          // Insert the age groups
          await db.insert(eventAgeGroups).values(ageGroupsToInsert);
          ageGroups = ageGroupsToInsert;
          console.log(`Created ${ageGroups.length} age groups from seasonal scope`);
        }
      }
    }

    // Fetch age group eligibility settings from the separate eligibility table
    // Import the table if it hasn't been imported yet
    let eventAgeGroupEligibility;
    try {
      // Try to import the module dynamically
      const { eventAgeGroupEligibility: importedTable } = await import('../../db/schema-updates.js');
      eventAgeGroupEligibility = importedTable;
    } catch (error) {
      console.warn('Could not import eventAgeGroupEligibility from schema-updates.js:', error);
      // Fallback to using the isEligible field from eventAgeGroups
    }

    // Get eligibility settings if the table was successfully imported
    let eligibilityMap = new Map();
    
    if (eventAgeGroupEligibility) {
      try {
        const eligibilitySettings = await db
          .select()
          .from(eventAgeGroupEligibility)
          .where(eq(eventAgeGroupEligibility.eventId, parseInt(eventId)));
        
        console.log(`Found ${eligibilitySettings.length} eligibility settings records for event ${eventId}`);
        
        // Create a map of ageGroupId -> isEligible
        for (const setting of eligibilitySettings) {
          // The ageGroupId in the eligibility table is a composite ID like "male-2014-U11"
          // We need to match this with our age groups
          const compositeId = setting.ageGroupId;
          eligibilityMap.set(compositeId, setting.isEligible);
        }
      } catch (error) {
        console.error('Error fetching eligibility settings:', error);
      }
    }

    // Deduplicate based on division code before returning
    const uniqueGroups = [];
    const uniqueMap = new Map();
    
    for (const group of ageGroups) {
      // Use division code or create a key from gender and age group
      const divisionCode = group.divisionCode || `${group.gender.charAt(0)}${group.ageGroup.replace(/\D/g, '')}`;
      const key = divisionCode;
      
      // Create a composite ID to match against eligibility settings
      const compositeId = `${group.gender.toLowerCase()}-${group.birthYear}-${group.ageGroup}`;
      
      // Determine if this age group is eligible
      // First check the eligibility settings table, then fall back to the age group's isEligible field
      const isEligible = eligibilityMap.has(compositeId) 
        ? eligibilityMap.get(compositeId) 
        : (group.isEligible === undefined ? true : Boolean(group.isEligible));
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        uniqueGroups.push({
          ...group,
          isEligible: isEligible, // Set the eligibility based on our determination
          selected: true
        });
      }
    }

    // Filter out ineligible age groups for the public-facing endpoints
    const eligibleGroups = uniqueGroups.filter(group => group.isEligible !== false);
    
    // Sort age groups in logical order (U4, U5, U6, etc.) grouped by gender
    const sortedEligibleGroups = eligibleGroups.sort((a, b) => {
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
    
    console.log(`Deduplicated to ${uniqueGroups.length} unique age groups (${sortedEligibleGroups.length} eligible and sorted) from ${ageGroups.length} for event ${eventId}`);
    
    // Only return eligible age groups for the public event registration page
    res.json(sortedEligibleGroups);
  } catch (error) {
    console.error('Error fetching age groups:', error);
    res.status(500).json({ error: 'Failed to fetch age groups' });
  }
});

// Added route to fetch age groups with deduplication
router.get('/api/admin/events/:eventId/age-groups', async (req, res) => {
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

    // DISABLED: No longer add standard age groups as fallback
    // This was bypassing eligibility filtering
    if (false && ageGroups.length === 0) {
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
          id: null,
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
          selected: true,
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
          fieldSize: group.fieldSize || null,
          selected: true,
        };
        uniqueMap.set(key, simplifiedGroup);
        uniqueGroups.push(simplifiedGroup);
      }
    }

    // DISABLED: No longer add predefined age groups for editing
    // This was bypassing eligibility filtering
    if (false) {
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

    // Fetch eligibility settings for this event using direct SQL query
    const eligibilityResult = await db.execute(sql`
      SELECT age_group_id, is_eligible 
      FROM event_age_group_eligibility 
      WHERE event_id = ${eventId}::text
    `);

    const eligibilitySettings = eligibilityResult.rows || [];
    console.log(`Found ${eligibilitySettings.length} eligibility settings for event ${eventId}`);

    // Create eligibility map for quick lookup
    const eligibilityMap = new Map();
    for (const setting of eligibilitySettings) {
      const ageGroup = ageGroups.find(ag => ag.id === setting.age_group_id);
      if (ageGroup) {
        const key = ageGroup.divisionCode;
        eligibilityMap.set(key, setting.is_eligible);
        console.log(`Eligibility for ${key}: ${setting.is_eligible}`);
      }
    }

    } // End of disabled block
    
    // DISABLED: No longer add standard age groups based on eligibility
    // This was causing complexity and bypassing the main eligibility filtering
    if (false) {
    for (const stdGroup of []) {
      const key = stdGroup.divisionCode;
      if (!uniqueMap.has(key)) {
        // Check if this age group is eligible
        const isEligible = eligibilityMap.has(key) 
          ? eligibilityMap.get(key) 
          : false; // Default to ineligible for missing standard groups
        
        // Only add if eligible
        if (isEligible !== false) {
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
            selected: false,
            isEligible: isEligible
          });
          console.log(`✓ Added eligible standard age group: ${stdGroup.ageGroup} ${stdGroup.gender}`);
        } else {
          console.log(`✗ Skipped ineligible standard age group: ${stdGroup.ageGroup} ${stdGroup.gender}`);
        }
      }
    }

    // DISABLED: No longer add standard age groups as fallback
    // This was bypassing eligibility filtering
    if (false && uniqueGroups.length === 0) {
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
          selected: false,
        });
      }

      console.log(`No age groups found. Added ${uniqueGroups.length} standard age groups as fallback`);
    }

    console.log(`Fetched ${ageGroups.length} age groups for event ${eventId}`);
    
    // Apply unified sorting to ensure consistent order (U4, U5, U6, etc.)
    const sortedGroups = sortAgeGroups(uniqueGroups);
    console.log(`Returning ${sortedGroups.length} age groups in proper order: ${sortedGroups.slice(0, 6).map(g => `${g.ageGroup}-${g.gender}`).join(', ')}...`);

    res.json(sortedGroups);
  } catch (error) {
    console.error('Error fetching age groups:', error);
    res.status(500).json({ error: 'Failed to fetch age groups' });
  }
});

// Update GET /:id/edit endpoint to include seasonal scope ID
router.get('/:id/edit', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    console.log(`Fetching event data for edit: ${eventId}`);

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get the seasonal scope ID from event settings
    const scopeSetting = await db.query.eventSettings.findFirst({
      where: eq(eventSettings.eventId, eventId)
    });

    const seasonalScopeId = scopeSetting ? parseInt(scopeSetting.settingValue) : null;
    console.log(`Found seasonal scope ID for event: ${seasonalScopeId}`);

    // Also fetch the age groups count for verification
    const ageGroupsCount = await db.query.eventAgeGroups.findMany({
      where: eq(eventAgeGroups.eventId, eventId)
    });
    console.log(`Found ${ageGroupsCount.length} age groups for event ${eventId}`);

    res.json({
      ...event,
      seasonalScopeId
    });
  } catch (error) {
    console.error('Error fetching event for edit:', error);
    res.status(500).json({ error: 'Failed to fetch event data' });
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
        amount: Number(amount),
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
router.post('/:eventId/fee-assignments', async (req, res) => {
  try {
    console.log("Fee assignment request received with params:", req.params);
    console.log("Fee assignment request body:", req.body);

    const eventId = parseInt(req.params.eventId);
    const { feeId, assignments } = req.body;

    console.log("Processed fee assignment data:", { eventId, feeId, assignments });

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

// Add DELETE route for events
router.delete('/:id', async (req, res) =>{
  const eventId = req.params.id;
  console.log(`Starting event deletion for ID: ${eventId}`);

  try {
    await db.transaction(async (tx) => {
      // Delete related records in correct order to respect foreign key constraints

      // 1. Delete fee assignments first since they reference age groups
      try {
        // Get all age group IDs for this event
        const eventAgeGroupIds = await tx
          .select({ id: eventAgeGroups.id })
          .from(eventAgeGroups)
          .where(eq(eventAgeGroups.eventId, eventId));

        const ageGroupIds = eventAgeGroupIds.map(g => g.id);

        if (ageGroupIds.length > 0) {
          // Delete fee assignments for these age groups
          const deletedAssignments = await tx
            .delete(eventAgeGroupFees)
            .where(inArray(eventAgeGroupFees.ageGroupId, ageGroupIds))
            .returning();
          console.log(`Deleted ${deletedAssignments.length} fee assignments`);
        }
      } catch (error) {
        console.log('No fee assignments to delete or error:', error);
      }

      // 2. Delete teams since they reference tournament groups
      try {
        const deletedTeams = await tx.delete(teams)
          .where(eq(teams.eventId, eventId))
          .returning();
        console.log(`Deleted ${deletedTeams.length} teams`);
      } catch (error) {
        console.log('No teams to delete or error:', error);
      }

      // 3. Delete tournament groups
      try {
        const deletedGroups = await tx.delete(tournamentGroups)
          .where(eq(tournamentGroups.eventId, eventId))
          .returning();
        console.log(`Deleted ${deletedGroups.length} tournament groups`);
      } catch (error) {
        console.log('No tournament groups to delete or error:', error);
      }

      // 4. Delete age groups
      try {
        // DISABLED: Never delete age groups to prevent constraint violations
        // Age group eligibility is managed through the separate eligibility table
        console.log('Age group deletion disabled - eligibility managed separately');
      } catch (error) {
        console.log('No age groups to delete or error:', error);
      }

      // 5. Delete event settings
      try {
        const deletedSettings = await tx.delete(eventSettings)
          .where(eq(eventSettings.eventId, eventId))
          .returning();
        console.log(`Deleted ${deletedSettings.length} event settings`);
      } catch (error) {
        console.log('No settings to delete or error:', error);
      }

      // 6. Delete event administrators
      try {
        const deletedAdmins = await tx.delete(eventAdministrators)
          .where(eq(eventAdministrators.eventId, eventId))
          .returning();
        console.log(`Deleted ${deletedAdmins.length} event administrators`);
      } catch (error) {
        console.log('No administrators to delete or error:', error);
      }

      // 7. Delete event fees
      try {
        const deletedFees = await tx.delete(eventFees)
          .where(eq(eventFees.eventId, eventId))
          .returning();
        console.log(`Deleted ${deletedFees.length} event fees`);
      } catch (error) {
        console.log('No fees to delete or error:', error);
      }

      // 8. Delete event complexes
      try {
        const deletedComplexes = await tx.delete(eventComplexes)
          .where(eq(eventComplexes.eventId, eventId))
          .returning();
        console.log(`Deleted ${deletedComplexes.length} event complexes`);
      } catch (error) {
        console.log('No complexes to delete or error:', error);
      }

      // Finally delete the event itself
      const [deletedEvent] = await tx.delete(events)
        .where(eq(events.id, parseInt(eventId)))
        .returning();

      if (!deletedEvent) {
        throw new Error('Event not found');
      }

      console.log(`Successfully deleted event ${eventId}`);
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: 'Failed to delete event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;