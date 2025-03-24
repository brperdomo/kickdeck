import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export function FloatingEmulationButton() {
  const [emulationToken, setEmulationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmulating, setIsEmulating] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for emulation token on mount and window focus
  useEffect(() => {
    const checkEmulationStatus = async () => {
      try {
        console.log('Checking emulation status');
        
        // Get token from localStorage
        const token = localStorage.getItem('emulationToken');
        
        // If no token exists, we're definitely not emulating
        if (!token) {
          console.log('No emulation token found in localStorage');
          setEmulationToken(null);
          setIsEmulating(false);
          return;
        }

        console.log(`Found emulation token: ${token.substring(0, 5)}...`);
        
        // Verify if the token is valid by checking emulation status
        const response = await fetch('/api/admin/emulation/status', {
          headers: {
            'X-Emulation-Token': token,
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Emulation status response:', data);
          
          if (data && data.emulating === true) {
            console.log('Active emulation detected');
            setEmulationToken(token);
            setIsEmulating(true);
            
            // Check for emulated admin name in sessionStorage
            const emulatedName = sessionStorage.getItem('emulatedAdminName');
            if (emulatedName) {
              console.log(`Emulating ${emulatedName}`);
            }
          } else {
            console.log('Token exists but emulation not active');
            // Token exists but is invalid - clean it up
            localStorage.removeItem('emulationToken');
            sessionStorage.removeItem('emulationActive');
            sessionStorage.removeItem('emulatedAdminName');
            setEmulationToken(null);
            setIsEmulating(false);
          }
        } else {
          console.log('Error response when checking emulation status');
          // Token is invalid - clean it up
          localStorage.removeItem('emulationToken');
          sessionStorage.removeItem('emulationActive');
          sessionStorage.removeItem('emulatedAdminName');
          setEmulationToken(null);
          setIsEmulating(false);
        }
      } catch (error) {
        console.error("Error checking emulation status:", error);
      }
    };

    // Active flag to prevent excessive checks
    const isEmulationActive = sessionStorage.getItem('emulationActive') === 'true';
    
    if (isEmulationActive || checkCount < 5) {
      checkEmulationStatus();
      setCheckCount(prev => prev + 1);
    }

    // Setup interval for continued checking (every 10 seconds)
    const intervalId = setInterval(checkEmulationStatus, 10000);

    // Setup focus event for checking when tab regains focus
    const handleFocus = () => {
      checkEmulationStatus();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkCount]);

  const handleStopEmulation = async () => {
    if (!emulationToken) return;

    setIsLoading(true);
    try {
      console.log('Stopping emulation');
      
      // Show toast first
      toast({
        title: 'Emulation Stopped',
        description: 'You are now viewing the system as yourself',
      });

      const response = await fetch(`/api/admin/emulation/stop/${emulationToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
      });

      // Always clean up the client storage
      localStorage.removeItem('emulationToken');
      sessionStorage.removeItem('emulationActive');
      sessionStorage.removeItem('emulatedAdminName');
      setEmulationToken(null);
      setIsEmulating(false);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error stopping emulation:", errorData);
      } else {
        console.log('Emulation stopped successfully');
      }

      // Wait a brief moment to ensure the toast is displayed
      setTimeout(() => {
        // Force refresh all queries with the new identity
        queryClient.invalidateQueries();
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
        queryClient.invalidateQueries({ queryKey: ['emulation-status'] });
        
        console.log('Local storage after stop:', localStorage.getItem('emulationToken'));

        // Reload the page to ensure UI updates properly
        window.location.href = window.location.origin + '/admin';
      }, 1000);
    } catch (error) {
      toast({
        title: 'Emulation Reset',
        description: 'Emulation mode has been reset due to an error',
        variant: 'destructive',
      });
      console.error("Error in emulation stop handler:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show the button if we're actually emulating
  if (!isEmulating) return null;
  
  const emulatedName = sessionStorage.getItem('emulatedAdminName');

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={handleStopEmulation}
        size="lg"
        className="shadow-lg bg-red-600 hover:bg-red-700 text-white"
        disabled={isLoading}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoading ? 'Exiting...' : emulatedName 
          ? `Exit Emulation (${emulatedName})` 
          : 'Exit Emulation Mode'}
      </Button>
    </div>
  );
}