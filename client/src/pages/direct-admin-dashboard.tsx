// This is a simplified version of AdminDashboard for direct testing
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function DirectAdminDashboard() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('DirectAdminDashboard mounted with user:', user);
    
    // Log browser information to help diagnose any compatibility issues
    console.log('Browser information:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-6">Direct Admin Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        {user ? (
          <div className="space-y-2">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Is Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <p>No user data available</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Simple Actions</h2>
          <div className="space-y-3">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" 
              onClick={() => alert('Button clicked')}
            >
              Test Button
            </button>
            
            <div>
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => window.location.href = '/admin-direct'}
              >
                Reload Admin Direct
              </button>
            </div>
            
            <div>
              <button 
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostics</h2>
          <div className="space-y-2">
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}