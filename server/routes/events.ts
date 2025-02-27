// Assuming necessary imports like 'app', 'db', 'events', 'eventAgeGroups', 'seasonalScopes', 'eq' are present.  Also assuming a 'processAgeGroups' function exists as described in the thinking section.


async function processAgeGroups(ageGroups, seasonalScopeId) {
  const processedAgeGroups = await Promise.all(ageGroups.map(async (ageGroup) => {
    //Removed birth_date_start processing
    return ageGroup;
  }));
  return processedAgeGroups;
}


app.patch('/api/admin/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;

    // Process age groups to ensure birth_date_start is set
    const processedAgeGroups = await processAgeGroups(
      eventData.ageGroups || [],
      eventData.seasonalScopeId
    );

    // Replace the age groups in the request with the processed ones
    eventData.ageGroups = processedAgeGroups;

    // Begin a transaction
    const result = await db.transaction(async (tx) => {
      // Update event
      const updatedEvent = await tx
        .update(events)
        .set({
          name: eventData.name,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          timezone: eventData.timezone,
          applicationDeadline: eventData.applicationDeadline,
          details: eventData.details,
          agreement: eventData.agreement,
          refundPolicy: eventData.refundPolicy,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, eventId))
        .returning();

      // Get existing age groups for comparison
      const existingAgeGroups = await tx
        .select()
        .from(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId));

      // Compare and update or insert age groups
      for (const group of eventData.ageGroups) {
        const existingGroup = existingAgeGroups.find(
          (g) => g.ageGroup === group.ageGroup && g.birthYear === group.birthYear && g.gender === group.gender
        );

        // Update existing group
        if (existingGroup) {
          const updatedGroup = await tx
            .update(eventAgeGroups)
            .set({
              projectedTeams: group.projectedTeams,
              ageGroup: group.ageGroup,
              birthYear: group.birthYear,
              gender: group.gender,
              fieldSize: group.fieldSize,
              scoringRule: group.scoringRule,
              amountDue: group.amountDue || null,
              //birth_date_start: group.birth_date_start, //removed
            })
            .where(eq(eventAgeGroups.id, existingGroup.id))
            .returning();
        }
        // Create if it doesn't exist
        else {
          await tx.insert(eventAgeGroups).values({
            eventId: eventId,
            ageGroup: group.ageGroup,
            birthYear: group.birthYear,
            gender: group.gender,
            fieldSize: group.fieldSize,
            projectedTeams: group.projectedTeams,
            scoringRule: group.scoringRule,
            amountDue: group.amountDue || null,
            //birth_date_start: group.birth_date_start, //removed
          });
        }
      }
      return updatedEvent;
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});