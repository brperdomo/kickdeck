import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function LogoutHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const performLogout = async () => {
      console.log('LogoutHandler: Starting complete logout process');
      
      try {
        // 1. Call the logout API endpoint
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/logout?t=${timestamp}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Cache-Bust': timestamp.toString()
          }
        });
        
        console.log('LogoutHandler: API logout response received', res.status);
        
        // 2. Clear React Query cache
        queryClient.clear();
        queryClient.setQueryData(['/api/user'], null);
        queryClient.removeQueries({ queryKey: ['/api/user'] });
        
        // 3. Clear browser storage
        localStorage.clear();
        sessionStorage.clear();
        
        // 4. Clear all cookies related to the app
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        
        console.log('LogoutHandler: All client data cleared');
        
        // 5. Force a complete page reload and redirect to auth page
        window.location.href = '/auth';
      } catch (error) {
        console.error('LogoutHandler: Error during logout process', error);
        // If any error occurs, still force the redirect
        window.location.href = '/auth';
      }
    };

    // Execute the logout process
    performLogout();
  }, [queryClient]);

  // Render a loading state while logout is processing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">Logging out...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we securely log you out.</p>
      </div>
    </div>
  );
}