
// Inside your PATCH or PUT route for updating events (or where age groups are being created/updated)

// When processing event age groups, ensure birth_date_start is properly set
const processedAgeGroups = eventData.ageGroups.map(ageGroup => {
  // Get the end year from the seasonal scope if available
  const endYear = eventData.seasonalScopeId ? 
    await db.select().from(seasonalScopes)
      .where(eq(seasonalScopes.id, eventData.seasonalScopeId))
      .then(scopes => scopes[0]?.endYear || new Date().getFullYear())
    : new Date().getFullYear();
    
  return {
    ...ageGroup,
    birth_date_start: `${endYear}-01-01` // Set birth_date_start to January 1st of the end year
  };
});

// Then use processedAgeGroups instead of eventData.ageGroups in your insert or update operations
