{/* This file likely contains additional code for sidebar navigation and other components.  Only the change specified in the provided snippet is included. */}

const emailTemplatesButton = (
    <Button
      variant={activeSettingsView === 'emailTemplates' ? 'secondary' : 'ghost'}
      className="w-full justify-start"
      onClick={() => {
        setActiveView('settings');
        setActiveSettingsView('emailTemplates');
      }}
    >
      <Mail className="mr-2 h-4 w-4" />
      Email Templates
    </Button>
  );

{/* Email Templates moved to Settings > General */}