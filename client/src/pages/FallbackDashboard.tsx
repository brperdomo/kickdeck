import React from 'react';

/**
 * Ultra simple fallback dashboard with minimal requirements
 * to serve as a replacement for broken dashboards
 */
export default function FallbackDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">Welcome</h2>
          <p className="text-gray-600">
            This is a simplified dashboard view. The full dashboard is currently being repaired.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-medium mb-2">Events</h3>
            <p className="text-sm text-gray-500">View and manage events</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-medium mb-2">Teams</h3>
            <p className="text-sm text-gray-500">View team registrations</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-medium mb-2">Settings</h3>
            <p className="text-sm text-gray-500">Manage account settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}