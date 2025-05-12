import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

/**
 * ForceRedirectCombinedFix
 * 
 * This is a last-resort component to fix redirection issues.
 * It uses multiple methods to force a redirect to the appropriate dashboard.
 */
export function ForceRedirectCombinedFix() {
  const { user, isLoading } = useAuth();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [redirectMethod, setRedirectMethod] = useState('Initializing');
  const [forceBackToLogin, setForceBackToLogin] = useState(false);

  // Make a direct API call to verify user data
  useEffect(() => {
    // Directly fetch the user data for verification
    const verifyUser = async () => {
      try {
        console.log("ForceRedirectCombinedFix: Making direct API call to verify user");
        const response = await fetch('/api/user', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("ForceRedirectCombinedFix: Direct API call success:", userData);
          
          if (userData && userData.id) {
            // User is authenticated, perform direct redirect
            const isAdmin = userData.isAdmin === true;
            const targetPath = isAdmin ? '/admin/dashboard' : '/dashboard';
            
            console.log(`ForceRedirectCombinedFix: Direct API verification successful, user is ${isAdmin ? 'admin' : 'regular'}`);
            console.log(`ForceRedirectCombinedFix: Redirecting to ${targetPath}`);
            
            // Use direct navigation
            window.location.href = targetPath;
          } else {
            console.log("ForceRedirectCombinedFix: User data is empty or invalid from direct API call");
            setForceBackToLogin(true);
          }
        } else {
          console.log("ForceRedirectCombinedFix: Direct API call failed with status:", response.status);
          setForceBackToLogin(true);
        }
      } catch (error) {
        console.error("ForceRedirectCombinedFix: Error during direct API call:", error);
        setForceBackToLogin(true);
      }
    };

    // Execute the verification
    verifyUser();
  }, []);

  // Handle redirect back to login if needed
  useEffect(() => {
    if (forceBackToLogin) {
      console.log("ForceRedirectCombinedFix: Forcing back to login page");
      window.location.href = '/auth';
    }
  }, [forceBackToLogin]);

  // Fallback redirect based on useAuth hook data
  useEffect(() => {
    // Skip if we're loading or forcing back to login already
    if (isLoading || forceBackToLogin) return;
    
    if (!user) {
      console.log("ForceRedirectCombinedFix: No user found in useAuth hook");
      setForceBackToLogin(true);
      return;
    }

    // Set a timestamp for debugging
    const timestamp = new Date().toISOString();
    const redirectId = Math.random().toString(36).substring(2, 10);
    console.log(`FORCE REDIRECT [${redirectId}] [${timestamp}]: User role from useAuth: ${user.isAdmin ? 'admin' : 'regular'}`);

    // Determine the appropriate dashboard
    const targetPath = user.isAdmin ? '/admin/dashboard' : '/dashboard';
    
    // Attempt redirect - use window.location.href for a hard redirect
    setRedirectMethod('useAuth Hook Redirect');
    console.log(`FORCE REDIRECT [${redirectId}]: Attempting redirect via useAuth hook to ${targetPath}`);
    
    window.location.href = targetPath;
  }, [user, isLoading, forceBackToLogin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-medium mb-2">Redirecting to dashboard...</h2>
      <p className="text-sm text-muted-foreground mb-1">Method: {redirectMethod}</p>
      <p className="text-sm text-muted-foreground">Attempts: {redirectAttempts + 1}</p>
    </div>
  );
}