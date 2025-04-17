import { useEffect } from 'react';
import { useLocation } from 'wouter';

// This is a redirect component to handle the special case of auth?logged_out=true
export default function AuthLoggedOut() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    console.log('Auth-logged-out page loaded, redirecting to /auth with sessionStorage logout message');
    // Set the logout message in sessionStorage
    sessionStorage.setItem('logout_message', 'You have been successfully logged out');
    
    // Redirect to the main auth page
    setLocation('/auth');
  }, [setLocation]);
  
  // Simple loading state while redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Redirecting...</p>
      </div>
    </div>
  );
}