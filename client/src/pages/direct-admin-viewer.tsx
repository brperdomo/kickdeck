import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Emergency fallback component that uses none of the application's infrastructure
// This component is a last resort for accessing the admin dashboard when all else fails
export default function DirectAdminViewer() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [adminComponent, setAdminComponent] = useState<any>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check for auth through direct API call
        const userResponse = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (!userResponse.ok) {
          console.error("Failed to verify user authentication");
          window.location.href = '/auth';
          return;
        }
        
        // Got valid response, parse user data
        const userData = await userResponse.json();
        console.log("User data:", userData);
        
        // Verify admin status
        if (!userData.isAdmin) {
          console.error("User is not an admin");
          window.location.href = '/dashboard';
          return;
        }
        
        // Store user data and load admin component
        setUser(userData);
        
        // Directly load the actual admin component
        import('./admin-dashboard')
          .then((module) => {
            setAdminComponent(() => module.default);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error("Failed to load admin dashboard:", err);
            setError("Failed to load admin dashboard component");
          });
      } catch (err) {
        console.error("Error verifying auth:", err);
        setError("Authentication error");
      }
    };
    
    verifyAuth();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Loading Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Please wait while we prepare your dashboard...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Access Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 transition"
            >
              Return to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the admin component directly with initialView specified
  const AdminDashboard = adminComponent;
  return (
    <div className="emergency-admin-wrapper">
      <AdminDashboard initialView="events" />
    </div>
  );
}