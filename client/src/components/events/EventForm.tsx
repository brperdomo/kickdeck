// Handle seasonal scope selection
  const handleScopeSelect = (scopeId: number) => {
    console.log('Selected seasonal scope ID:', scopeId);
    setEventData((prev) => ({
      ...prev,
      seasonalScopeId: scopeId
    }));
  };
  // Initialize the form with default values or existing event data if editing
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      seasonalScopeId: initialData.seasonalScopeId || null
    } : {
      isPublic: true,
      ageGroups: [],
      venue: { fields: [] },
      scoring: {},
      schedule: { days: [] },
      customFields: [],
      seasonalScopeId: null
    }
  });

  // Initialize selectedSeasonalScopeId if initialData has a seasonalScopeId
  React.useEffect(() => {
    if (initialData?.seasonalScopeId) {
      setSelectedSeasonalScopeId(initialData.seasonalScopeId);
    }
  }, [initialData]);

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