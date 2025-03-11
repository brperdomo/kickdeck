// Handle seasonal scope selection
  const handleScopeSelect = (scopeId: number) => {
    console.log('Selected seasonal scope ID:', scopeId);
    setEventData((prev) => ({
      ...prev,
      seasonalScopeId: scopeId
    }));
  };
{seasonalScopes && (
                    <SeasonalScopeSelector
                      selectedScopeId={selectedSeasonalScopeId}
                      onScopeSelect={(scopeId) => {
                        console.log('Scope selected in EventForm:', scopeId);
                        setSelectedSeasonalScopeId(scopeId);
                        // Clear existing age group selections when scope changes
                        const selectedScope = seasonalScopes.find(scope => scope.id === scopeId);
                        if (selectedScope) {
                          // Auto-select all age groups from the scope
                          form.setValue('ageGroups', selectedScope.ageGroups);
                          // Also update the form's seasonalScopeId field
                          form.setValue('seasonalScopeId', scopeId);
                        }
                      }}
                      scopes={seasonalScopes}
                    />
                  )}