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
  const { user } = useAuth();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [redirectMethod, setRedirectMethod] = useState('Initializing');

  useEffect(() => {
    if (!user) {
      console.log("ForceRedirectCombinedFix: No user found, redirecting to login");
      // Redirect to login
      window.location.href = '/auth';
      return;
    }

    // Set a timestamp for debugging
    const timestamp = new Date().toISOString();
    const redirectId = Math.random().toString(36).substring(2, 10);
    console.log(`FORCE REDIRECT [${redirectId}] [${timestamp}]: User role detected: ${user.isAdmin ? 'admin' : 'regular'}`);

    // Determine the appropriate dashboard
    const targetPath = user.isAdmin ? '/admin/dashboard' : '/dashboard';
    
    // First redirect attempt - use window.location.href for a hard redirect
    setRedirectMethod('Hard Redirect (window.location.href)');
    console.log(`FORCE REDIRECT [${redirectId}]: Attempting hard redirect to ${targetPath}`);
    
    // Use a small timeout to ensure React has finished its current update cycle
    setTimeout(() => {
      window.location.href = targetPath;
      
      // In case the first redirect fails (should never happen), try again with a different method
      setTimeout(() => {
        // If we're still here after 1 second, the first redirect failed
        setRedirectMethod('Window Replace Redirect (window.location.replace)');
        setRedirectAttempts(prev => prev + 1);
        console.log(`FORCE REDIRECT [${redirectId}]: Attempting alternate redirect method (replace) to ${targetPath}`);
        window.location.replace(targetPath);
      }, 1000);
    }, 100);
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-medium mb-2">Redirecting to dashboard...</h2>
      <p className="text-sm text-muted-foreground mb-1">Method: {redirectMethod}</p>
      <p className="text-sm text-muted-foreground">Attempts: {redirectAttempts + 1}</p>
    </div>
  );
}