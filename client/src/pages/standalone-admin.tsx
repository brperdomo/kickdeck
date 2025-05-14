import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Standalone Admin Dashboard
 * 
 * This is a completely standalone version of the admin dashboard that doesn't 
 * use any of the application's authentication hooks or routing infrastructure.
 */
export default function StandaloneAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // On mount, check authentication
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("StandaloneAdmin: Fetching user data");
        
        // Use direct API call with credentials
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        // Handle API response
        if (response.ok) {
          const userData = await response.json();
          console.log("StandaloneAdmin: User data fetched successfully", userData);
          
          // Store user data
          setUser(userData);
          
          // Store auth info in session storage as backup
          sessionStorage.setItem('user_authenticated', 'true');
          sessionStorage.setItem('user_is_admin', userData.isAdmin ? 'true' : 'false');
          
          // Verify admin status
          if (!userData.isAdmin) {
            console.log("StandaloneAdmin: User is not an admin, redirecting");
            window.location.href = '/dashboard';
            return;
          }
          
          // Load the admin dashboard by dynamically importing
          try {
            const AdminDashboardModule = await import('./admin-dashboard');
            
            // Success - dashboard module loaded
            setIsLoading(false);
          } catch (err) {
            console.error("StandaloneAdmin: Failed to load admin dashboard module", err);
            setError("Failed to load admin dashboard. Please try again.");
          }
        } else {
          console.log("StandaloneAdmin: Failed to fetch user data, redirecting to login");
          window.location.href = '/auth';
        }
      } catch (err) {
        console.error("StandaloneAdmin: Error fetching user data", err);
        setError("Authentication error. Please try logging in again.");
      }
    };
    
    // Run the fetch
    fetchUserData();
  }, []);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading admin dashboard...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  
  // Once loaded, asynchronously import and render the admin dashboard
  const AdminDashboard = require('./admin-dashboard').default;
  return <AdminDashboard initialView="events" />;
}