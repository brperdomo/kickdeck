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
                    <TabsContent value="age-groups">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Age Groups</h3>
                    <InfoPopover>
                      <p>
                        {isEditMode ? 
                          "Age groups for this event are set based on the selected seasonal scope and cannot be modified." : 
                          "Select age groups for this event."}
                      </p>
                    </InfoPopover>
                  </div>

                  {/* Display the seasonal scope information */}
                  {seasonalScopes && selectedSeasonalScopeId && (
                    <div className="mb-4">
                      <Label>Seasonal Scope</Label>
                      <div className="p-2 mt-1 bg-muted rounded-md">
                        {seasonalScopes.find(scope => scope.id === selectedSeasonalScopeId)?.name || 
                        `Scope ID: ${selectedSeasonalScopeId}`}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isEditMode 
                          ? "Seasonal scope is fixed and cannot be changed after event creation" 
                          : "Seasonal scope determines available age groups"}
                      </p>
                    </div>
                  )}
                  
                  {/* Only show selector in create mode */}
                  {!isEditMode && !selectedSeasonalScopeId && seasonalScopes && (
                    <div className="mb-4">
                      <Label>Select Seasonal Scope</Label>
                      <SeasonalScopeSelector
                        selectedScopeId={selectedSeasonalScopeId}
                        onScopeSelect={(scopeId) => {
                          console.log('Scope selected in EventForm:', scopeId);
                          setSelectedSeasonalScopeId(scopeId);
                          
                          try {
                            // Find the selected scope
                            const selectedScope = seasonalScopes.find(scope => scope.id === scopeId);
                            if (selectedScope && selectedScope.ageGroups) {
                              console.log('Setting age groups from selected scope:', selectedScope.ageGroups);
                              // Set available age groups
                              setAvailableAgeGroups(selectedScope.ageGroups);
                              // Also update the form's seasonalScopeId field
                              form.setValue('seasonalScopeId', scopeId);
                            } else {
                              console.warn('Selected scope or age groups not found:', scopeId);
                            }
                          } catch (error) {
                            console.error('Error setting scope-related form values:', error);
                          }
                        }}
                        scopes={seasonalScopes}
                      />
                    </div>
                  )}

                  {/* Show seasonal scope selector only in create mode and only if needed */}
                  {!isEditMode && !selectedSeasonalScopeId && seasonalScopes && (
                    <SeasonalScopeSelector
                      selectedScopeId={selectedSeasonalScopeId}
                      onScopeSelect={(scopeId) => {
                        console.log('Scope selected in EventForm:', scopeId);
                        setSelectedSeasonalScopeId(scopeId);

                        try {
                          // Clear existing age group selections when scope changes
                          const selectedScope = seasonalScopes.find(scope => scope.id === scopeId);
                          if (selectedScope && selectedScope.ageGroups) {
                            console.log('Setting age groups from selected scope:', selectedScope.ageGroups);
                            // Auto-select all age groups from the scope
                            form.setValue('ageGroups', selectedScope.ageGroups);
                            // Also update the form's seasonalScopeId field
                            form.setValue('seasonalScopeId', scopeId);
                          } else {
                            console.warn('Selected scope or age groups not found:', scopeId);
                          }
                        } catch (error) {
                          console.error('Error setting scope-related form values:', error);
                        }
                      }}
                      scopes={seasonalScopes}
                    />
                  )}
                </div>
              </TabsContent>
                  )}

const handleSubmitForm = async (data: EventFormValues) => {
    setIsSaving(true);
    try {
      if (!data.name || !data.startDate || !data.endDate || !data.timezone) {
        throw new Error('Required fields are missing');
      }

      if (!selectedSeasonalScopeId) {
        console.warn('No seasonal scope selected, using default if available');
      }

      // Prepare age groups data with only the essential fields
      const preparedAgeGroups = (event.ageGroups || [])
        .map(group => ({
          ...group,
          projectedTeams: group.projectedTeams || 0,
          birthDateStart: `${group.birthYear}-01-01`,
          birthDateEnd: `${group.birthYear}-12-31`,
          amountDue: group.amountDue || 0,
          scoringRule: group.scoringRule || null
        }));

      // Ensure we have a valid seasonalScopeId
      const scopeId = selectedSeasonalScopeId || 
                      data.seasonalScopeId || 
                      defaultValues?.seasonalScopeId;

      console.log('Using seasonal scope ID for submission:', scopeId);

      const combinedData = {
        ...data,
        id: defaultValues?.id, // Make sure ID is included
        seasonalScopeId: scopeId, // Make sure seasonalScopeId is included
        ageGroups: preparedAgeGroups,
        scoringRules,
        settings,
        complexFieldSizes,
        selectedComplexIds,
        administrators: defaultValues?.administrators || [],
        branding: {
          primaryColor,
          secondaryColor,
          logoUrl: previewUrl || undefined,
        },
      };

      console.log("Submitting form data:", combinedData);
      await onSubmit(combinedData);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      // Handle error appropriately, e.g., display an error message to the user
      setIsSaving(false);
      // Optionally, you could set an error state here to display to the user
      // setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };
  <FormField
                    control={form.control}
                    name="ageGroups"
                    render={({ field }) => (
                      <FormItem>
                        <div className="border rounded-lg p-4 mt-4">
                          {!isEditMode && (
                            <div className="mb-4 flex items-center gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="select-all-age-groups"
                                  checked={selectedAgeGroupIds.length === availableAgeGroups.length && availableAgeGroups.length > 0}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedAgeGroupIds(availableAgeGroups.map(group => group.id));
                                      onAgeGroupsChange(availableAgeGroups);
                                    } else {
                                      setSelectedAgeGroupIds([]);
                                      onAgeGroupsChange([]);
                                    }
                                  }}
                                />
                                <Label htmlFor="select-all-age-groups">Select All</Label>
                              </div>
                            </div>
                          )}
                          {isEditMode && selectedSeasonalScopeId && (
                            <div className="space-y-4">
                              {availableAgeGroups.length === 0 ? (
                                <div className="text-center p-4 text-muted-foreground">
                                  Loading age groups for this event...
                                </div>
                              ) : (
                                <div className="border rounded-md overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Age Group</TableHead>
                                        <TableHead>Birth Year</TableHead>
                                        <TableHead>Gender</TableHead>
                                        <TableHead>Division Code</TableHead>
                                        <TableHead>Field Size</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {availableAgeGroups.map((group, index) => (
                                        <TableRow key={`${group.gender}-${group.birthYear}-${index}`}>
                                          <TableCell>{group.ageGroup}</TableCell>
                                          <TableCell>{group.birthYear}</TableCell>
                                          <TableCell>{group.gender}</TableCell>
                                          <TableCell>{group.divisionCode}</TableCell>
                                          <TableCell>{group.fieldSize}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground italic">
                                Age groups are automatically determined by the seasonal scope and cannot be modified in edit mode.
                              </p>
                            </div>
                          )}
                          {!isEditMode && availableAgeGroups.length === 0 && !selectedSeasonalScopeId && (
                            <div className="text-center p-4 text-muted-foreground">
                              Please select a seasonal scope first to see available age groups.
                            </div>
                          )}

                        </div>
                      </FormItem>
                    )}
                  />