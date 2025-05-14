import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

// Ultra emergency admin access component with no dependencies on any app infrastructure
export default function EmergencyAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [adminContent, setAdminContent] = useState<React.ReactNode>(null);
  const [emergencyUser, setEmergencyUser] = useState<any>(null);
  
  // First try to check if user is already logged in via multiple methods
  useEffect(() => {
    const checkAuth = async () => {
      console.log("EmergencyAdmin: Checking authentication status...");
      
      try {
        // Method 1: Check emergency storage first (fastest)
        const storedUser = localStorage.getItem('emergency_admin_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("EmergencyAdmin: Found stored emergency user", parsedUser);
            
            if (parsedUser && parsedUser.isAdmin) {
              setEmergencyUser(parsedUser);
              setIsLoggedIn(true);
              
              // Load admin dashboard component with the stored user
              try {
                const AdminDashboard = (await import('./admin-dashboard')).default;
                setAdminContent(<AdminDashboard initialView="events" />);
                setIsLoading(false);
                return; // Exit early if we have a valid stored user
              } catch (err) {
                console.error("Failed to load admin dashboard component:", err);
                setError("Could not load admin dashboard component. Please try again.");
              }
            }
          } catch (parseErr) {
            console.error("Error parsing stored user:", parseErr);
            localStorage.removeItem('emergency_admin_user');
          }
        }
        
        // Method 2: Check for session-based authentication via API
        console.log("EmergencyAdmin: Checking API authentication status...");
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("EmergencyAdmin: Got user data from API", userData);
          
          if (userData && userData.isAdmin) {
            setIsLoggedIn(true);
            
            // Store for future emergency access
            localStorage.setItem('emergency_admin_user', JSON.stringify(userData));
            
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
          console.log("EmergencyAdmin: API authentication check failed with status", response.status);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Add admin auth fix script to DOM
    const script = document.createElement('script');
    script.src = '/admin-auth-fix.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script when component unmounts
      document.body.removeChild(script);
    };
  }, []);
  
  // Handle manual login attempt with fallbacks for emergencies
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // First try standard login
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
        console.log("Login successful:", userData);
        
        if (userData && userData.isAdmin) {
          // Store for emergency access
          localStorage.setItem('emergency_admin_user', JSON.stringify(userData));
          
          // Set session storage markers
          sessionStorage.setItem('user_authenticated', 'true');
          sessionStorage.setItem('user_is_admin', 'true');
          sessionStorage.setItem('admin_login_time', Date.now().toString());
          sessionStorage.setItem('admin_direct_access', 'true');
          
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
        <div className="fixed top-4 left-4 z-50 p-2 bg-black/70 rounded text-white text-xs">
          <p className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" />
            Emergency Admin Mode
          </p>
          {emergencyUser && (
            <p className="text-gray-300 mt-1">{emergencyUser.email}</p>
          )}
        </div>
        {adminContent}
      </div>
    );
  }
  
  // Not logged in - show login form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Emergency Admin Access</h1>
        <p className="text-gray-500 text-center mb-6">Direct access bypassing normal authentication flow</p>
        
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
              'Emergency Login'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a
            href="/auth"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Return to normal login
          </a>
        </div>
      </div>
    </div>
  );
}