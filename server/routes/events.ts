import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups, eventAgeGroupFees, eventFees } from '@db/schema';
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

    // Update the event in the database
    await db.update(events)
      .set({
        name: eventData.name,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        registrationStartDate: eventData.registrationStartDate,
        registrationEndDate: eventData.registrationEndDate,
        description: eventData.description,
        location: eventData.location,
        seasonalScopeId: seasonalScopeId,
        status: eventData.status,
      })
      .where(eq(events.id, eventId));

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
app.get('/api/admin/events/:eventId/age-groups', isAdmin, async (req, res) => {
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
      // Import predefined age groups and return them all
      const { PREDEFINED_AGE_GROUPS } = require('../../client/src/components/forms/event-form-types');

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
    const { PREDEFINED_AGE_GROUPS } = require('../../client/src/components/forms/event-form-types');

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

    console.log(`Fetched ${ageGroups.length} age groups for event ${eventId}`);
    console.log(`Returning ${uniqueGroups.length} unique age groups after deduplication by division code and adding standard groups`);

    res.json(uniqueGroups);
  } catch (error) {
    console.error('Error fetching age groups:', error);
    res.status(500).json({ error: 'Failed to fetch age groups' });
  }
});

export default router;