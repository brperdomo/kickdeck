import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Ultra emergency admin access component with no dependencies on any app infrastructure
export default function EmergencyAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [adminContent, setAdminContent] = useState<React.ReactNode>(null);
  
  // First try to check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.isAdmin) {
            setIsLoggedIn(true);
            
            // Load admin dashboard component
            try {
              const AdminDashboard = (await import('./admin-dashboard')).default;
              setAdminContent(<AdminDashboard initialView="events" />);
            } catch (err) {
              console.error("Failed to load admin dashboard component:", err);
              setError("Could not load admin dashboard component. Please try again.");
            }
          } else {
            setError("You do not have admin privileges.");
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Handle manual login attempt
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.isAdmin) {
          setIsLoggedIn(true);
          
          // Load admin dashboard component
          try {
            const AdminDashboard = (await import('./admin-dashboard')).default;
            setAdminContent(<AdminDashboard initialView="events" />);
          } catch (err) {
            console.error("Failed to load admin dashboard component:", err);
            setError("Could not load admin dashboard component. Please try again.");
          }
        } else {
          setError("You do not have admin privileges.");
        }
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Login request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Emergency Admin Access</h1>
        <p className="text-gray-600">Please wait while we verify your access...</p>
      </div>
    );
  }
  
  // Logged in - render admin dashboard
  if (isLoggedIn && adminContent) {
    return (
      <div className="emergency-admin-wrapper">
        {adminContent}
      </div>
    );
  }
  
  // Not logged in - show login form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Emergency Admin Access</h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-2 text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <a
            href="/auth"
            className="text-sm text-primary hover:underline"
          >
            Return to normal login
          </a>
        </div>
      </div>
    </div>
  );
}