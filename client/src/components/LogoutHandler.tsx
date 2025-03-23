import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function LogoutHandler() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Register a global unhandled rejection handler specifically for the logout process
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection during logout:', event.reason);
      event.preventDefault(); // Prevents the default error handling
      
      // Proceed with logout cleanup anyway
      cleanupAndRedirect();
    };

    // Add the event listener
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup function to remove the event listener
    const cleanup = () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };

    // Function to handle client-side cleanup and redirect
    const cleanupAndRedirect = () => {
      if (isRedirecting) return; // Prevent multiple executions
      setIsRedirecting(true);
      
      try {
        // 1. Clear React Query cache
        queryClient.clear();
        queryClient.setQueryData(['/api/user'], null);
        queryClient.removeQueries();
        
        // 2. Clear browser storage
        localStorage.clear();
        sessionStorage.clear();
        
        // 3. Clear all cookies related to the app
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        
        console.log('LogoutHandler: All client data cleared');
        
        // 4. Force a complete page reload to reset the entire React app state
        setTimeout(() => {
          window.location.replace('/auth');
        }, 500);
      } catch (error) {
        console.error('Final cleanup error:', error);
        // Last resort redirect
        window.location.href = '/auth';
      }
    };

    const performLogout = async () => {
      console.log('LogoutHandler: Starting complete logout process');
      
      try {
        // 1. Call the logout API endpoint with timeouts and retries
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/logout?t=${timestamp}`, {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Cache-Bust': timestamp.toString()
          }
        });
        
        clearTimeout(timeoutId);
        
        console.log('LogoutHandler: API logout response received', res.status);
        
        // Proceed with client-side cleanup regardless of server response
        cleanupAndRedirect();
      } catch (error) {
        console.error('LogoutHandler: Error during logout process:', error);
        
        if (error instanceof DOMException && error.name === 'AbortError') {
          setErrorMessage('Server request timed out, proceeding with logout...');
        } else {
          setErrorMessage('Error during logout, proceeding anyway...');
        }
        
        // Still proceed with client-side cleanup
        cleanupAndRedirect();
      }
    };

    // Execute the logout process
    performLogout();

    // Return cleanup function
    return cleanup;
  }, [queryClient, isRedirecting]);

  // Render a loading state while logout is processing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Logging out...</p>
        {errorMessage ? (
          <p className="text-sm text-amber-500 mt-2">{errorMessage}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">Please wait while we securely log you out.</p>
        )}
      </div>
    </div>
  );
}