import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LogoutRedirector } from '@/components/LogoutRedirector';

export default function LogoutPage() {
  const { logoutMutation } = useAuth();
  
  useEffect(() => {
    // Call the API to logout on the server side
    const performLogout = async () => {
      try {
        await logoutMutation.mutateAsync();
        console.log("Server session cleared successfully");
      } catch (error) {
        console.error("Error during server logout:", error);
        // Even if server logout fails, we'll still redirect to login
      }
    };
    
    performLogout();
  }, [logoutMutation]);

  return <LogoutRedirector />;
}