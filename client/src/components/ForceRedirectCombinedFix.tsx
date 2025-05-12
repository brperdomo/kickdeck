import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { ExtendedUser, isUserAdmin } from '@/types/user';

/**
 * ForceRedirectCombinedFix
 * 
 * This is a last-resort component to fix redirection issues.
 * It uses multiple methods to force a redirect to the appropriate dashboard.
 */
export function ForceRedirectCombinedFix() {
  const { user, isLoading } = useAuth();
  // Cast user to ExtendedUser for type safety
  const extendedUser = user as ExtendedUser | null;
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [redirectMethod, setRedirectMethod] = useState('Initializing');
  const [forceBackToLogin, setForceBackToLogin] = useState(false);
  const [debugState, setDebugState] = useState<{
    apiCheckComplete: boolean;
    hookCheckComplete: boolean;
    [key: string]: boolean | string | number | undefined; // Allow for additional properties
  }>({
    apiCheckComplete: false,
    hookCheckComplete: false
  });

  // For troubleshooting the authentication state
  useEffect(() => {
    console.log("Current auth state:", {
      userFromHook: !!user,
      userDetails: user ? { id: user.id, email: user.email, isAdmin: user.isAdmin } : 'No user',
      isLoading,
      redirectAttempts,
      redirectMethod,
      forceBackToLogin,
      cachedAuthData: queryClient.getQueryData(['/api/user'])
    });
  }, [user, isLoading, redirectAttempts, redirectMethod, forceBackToLogin]);

  // Make a direct API call to verify user data - highest priority check
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
        
        setDebugState((prev) => ({ ...prev, apiCheckComplete: true }));
        
        if (response.ok) {
          const userData = await response.json();
          console.log("ForceRedirectCombinedFix: Direct API call success:", userData);
          
          if (userData && userData.id) {
            // Update the query cache with the latest user data
            queryClient.setQueryData(['/api/user'], userData);
            
            // Cast to our ExtendedUser type for type safety
            const extUserData = userData as ExtendedUser;
            
            // Check if the user has admin privileges using our helper function
            const isAdmin = isUserAdmin(extUserData);
            
            const targetPath = isAdmin ? '/admin/dashboard' : '/dashboard';
            
            console.log(`ForceRedirectCombinedFix: Direct API verification successful, user is ${isAdmin ? 'admin' : 'regular'}`);
            console.log(`ForceRedirectCombinedFix: Redirecting to ${targetPath}`);
            
            // Use direct navigation with a small delay
            setTimeout(() => {
              window.location.href = targetPath;
            }, 250);
            
            // Don't do anything else, we're redirecting
            return;
          } else {
            console.log("ForceRedirectCombinedFix: User data is empty or invalid from direct API call");
            setForceBackToLogin(true);
          }
        } else {
          console.log("ForceRedirectCombinedFix: Direct API call failed with status:", response.status);
          if (response.status === 401) {
            // Force a refresh of the auth state in useAuth hook
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            setForceBackToLogin(true);
          }
        }
      } catch (error) {
        console.error("ForceRedirectCombinedFix: Error during direct API call:", error);
        setForceBackToLogin(true);
      }
    };

    // Execute the verification
    verifyUser();
  }, []);

  // Manual login form submission as a last resort
  const tryManualLogin = async () => {
    try {
      // Only try this as a last resort after multiple failures
      if (redirectAttempts < 3) return;
      
      console.log("ForceRedirectCombinedFix: Attempting emergency manual login redirect");
      setRedirectMethod('Emergency Manual Login Redirect');
      
      // Try to trigger login page with a special flag
      window.location.href = '/auth?auth_emergency=true';
    } catch (e) {
      console.error("Error in emergency login redirect:", e);
    }
  };

  // Handle redirect back to login if needed
  useEffect(() => {
    if (forceBackToLogin) {
      console.log("ForceRedirectCombinedFix: Forcing back to login page");
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    }
  }, [forceBackToLogin]);

  // Fallback redirect based on useAuth hook data
  useEffect(() => {
    // Skip if we're loading, forcing back to login already, or API check isn't done yet
    if (isLoading || forceBackToLogin || !debugState.apiCheckComplete) return;
    
    setDebugState((prev: typeof debugState) => ({ ...prev, hookCheckComplete: true }));
    
    if (!extendedUser) {
      console.log("ForceRedirectCombinedFix: No user found in useAuth hook");
      setRedirectAttempts(prev => prev + 1);
      
      // Only force back to login if we've tried multiple times
      if (redirectAttempts >= 2) {
        setForceBackToLogin(true);
      }
      
      return;
    }

    // Set a timestamp for debugging
    const timestamp = new Date().toISOString();
    const redirectId = Math.random().toString(36).substring(2, 10);
    
    // Check if user has admin privileges using our helper function
    const isAdmin = isUserAdmin(extendedUser);
    
    console.log(`FORCE REDIRECT [${redirectId}] [${timestamp}]: User role from useAuth: ${isAdmin ? 'admin' : 'regular'}`);

    // Determine the appropriate dashboard
    const targetPath = isAdmin ? '/admin/dashboard' : '/dashboard';
    
    // Attempt redirect - use window.location.href for a hard redirect
    setRedirectMethod('useAuth Hook Redirect');
    console.log(`FORCE REDIRECT [${redirectId}]: Attempting redirect via useAuth hook to ${targetPath}`);
    
    setTimeout(() => {
      window.location.href = targetPath;
    }, 250);
  }, [extendedUser, isLoading, forceBackToLogin, redirectAttempts, debugState.apiCheckComplete]);

  // Use the tryManualLogin for emergencies
  useEffect(() => {
    if (redirectAttempts >= 3) {
      tryManualLogin();
    }
    
    // Add detailed diagnostics when redirects are failing
    if (redirectAttempts >= 2) {
      console.log("ForceRedirectCombinedFix: Multiple redirect attempts, logging diagnostic info");
      
      // Log detailed diagnostics for debugging
      console.error("Redirection diagnostics:", {
        timestamp: new Date().toISOString(),
        redirectAttempts,
        debugState,
        authQueryData: queryClient.getQueryData(['/api/user']),
        currentUser: user ? {
          id: user.id,
          email: user.email,
          hasIsAdmin: 'isAdmin' in user,
          isAdmin: user.isAdmin,
          hasRoles: 'roles' in user && Array.isArray(user.roles),
          roleCount: 'roles' in user && Array.isArray(user.roles) ? user.roles.length : 0
        } : 'No user data'
      });
    }
  }, [redirectAttempts, user, debugState]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-medium mb-2">Redirecting to dashboard...</h2>
      <div className="bg-accent/50 p-4 rounded-md max-w-md text-center">
        <p className="text-sm text-muted-foreground mb-1">Method: {redirectMethod}</p>
        <p className="text-sm text-muted-foreground mb-3">Attempts: {redirectAttempts + 1}</p>
        
        {redirectAttempts >= 2 && (
          <div className="mt-3 text-sm">
            <p>Having trouble redirecting you to the right dashboard.</p>
            
            {extendedUser ? (
              <div className="mt-2 mb-3 text-xs">
                <p>According to our records, you are a{isUserAdmin(extendedUser) ? 'n admin' : ' regular'} user.</p>
                <p>Please select the appropriate dashboard below:</p>
              </div>
            ) : (
              <div className="mt-2 mb-3 text-xs">
                <p>We couldn't detect your user role. Please try one of the following options:</p>
              </div>
            )}
            
            <div className="mt-2 space-x-2">
              <button 
                onClick={() => window.location.href = '/auth'} 
                className="bg-primary text-white px-3 py-1 rounded text-xs">
                Back to Login
              </button>
              <button 
                onClick={() => window.location.href = '/admin/dashboard'} 
                className={`${extendedUser && isUserAdmin(extendedUser) ? 'bg-green-500 text-white' : 'bg-secondary'} px-3 py-1 rounded text-xs`}>
                Admin Dashboard
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className={`${extendedUser && !isUserAdmin(extendedUser) ? 'bg-green-500 text-white' : 'bg-secondary'} px-3 py-1 rounded text-xs`}>
                Member Dashboard
              </button>
            </div>
          </div>
        )}
        
        {debugState.apiCheckComplete && (
          <div className="mt-2 text-xs text-green-500">API check complete</div>
        )}
      </div>
    </div>
  );
}