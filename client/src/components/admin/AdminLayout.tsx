import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        {/* ... other routes */}
        <Route path="/admin/settings" element={<Navigate to="/admin/settings/general" replace />} />
        {/* Redirect old email templates path to general settings */}
        <Route path="/admin/email-templates" element={<Navigate to="/admin/settings/general?tab=emailTemplates" replace />} />
        <Route path="/admin/settings/general" element={<GeneralSettings />} />
        {/* ... other routes */}
      </Routes>
    </Router>
  );
}

function GeneralSettings() {
  return (
    <div>
      <h1>General Settings</h1>
      <h2>Email Templates</h2>
      {/* ... Email template configuration components */}
    </div>
  );
}

export default App;