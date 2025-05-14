import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// Basic direct login page without any complex hooks or redirects
export default function DirectLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Direct login call
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
          // Store session values
          sessionStorage.setItem('user_authenticated', 'true');
          sessionStorage.setItem('user_is_admin', 'true');
          sessionStorage.setItem('admin_login_time', Date.now().toString());
          
          // Go directly to admin dashboard
          window.location.href = '/admin-dashboard';
        } else {
          // Not an admin user
          window.location.href = '/dashboard';
        }
      } else {
        setError("Login failed. Please check your credentials and try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred while trying to log in. Please try again.");
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Direct Admin Login</h1>
        <p className="text-gray-500 text-center mb-6">Login directly to admin dashboard</p>
        
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
        
        <div className="mt-6 text-center">
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