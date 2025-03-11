// Handle seasonal scope selection
  const handleScopeSelect = (scopeId: number) => {
    console.log('Selected seasonal scope ID:', scopeId);
    setEventData((prev) => ({
      ...prev,
      seasonalScopeId: scopeId
    }));
  };