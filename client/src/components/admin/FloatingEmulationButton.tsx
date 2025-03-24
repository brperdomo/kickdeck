import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle, Users } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export function FloatingEmulationButton() {
  const [emulationToken, setEmulationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmulating, setIsEmulating] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [emulatedRoles, setEmulatedRoles] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // To prevent unnecessary renders, we'll maintain the last checked token
  const lastCheckedTokenRef = useRef<string | null>(null);
  
  // Check for emulation token on mount and window focus
  useEffect(() => {
    // This function will handle emulation status checking
    const checkEmulationStatus = async () => {
      // Get token from localStorage
      const token = localStorage.getItem('emulationToken');
      
      // If no token exists, we're definitely not emulating
      if (!token) {
        console.log('No emulation token found in localStorage');
        // Only update state if needed
        if (emulationToken !== null || isEmulating !== false) {
          setEmulationToken(null);
          setIsEmulating(false);
          setEmulatedRoles([]);
        }
        return;
      }
      
      // Skip if we're already emulating with this token and have checked it
      if (isEmulating && emulationToken === token && lastCheckedTokenRef.current === token) {
        return;
      }

      console.log('Checking emulation status');
      
      try {
        console.log(`Found emulation token: ${token.substring(0, 5)}...`);
        lastCheckedTokenRef.current = token;
        
        // Create an AbortController with timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Verify if the token is valid by checking emulation status
        const response = await fetch('/api/admin/emulation/status', {
          headers: {
            'X-Emulation-Token': token,
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
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

            // Check for emulated roles
            if (data.roles && Array.isArray(data.roles)) {
              setEmulatedRoles(data.roles);
              // Store roles in sessionStorage for other components
              sessionStorage.setItem('emulatedRoles', JSON.stringify(data.roles));
            } else {
              // Try to get roles from sessionStorage if not in API response
              const storedRoles = sessionStorage.getItem('emulatedRoles');
              if (storedRoles) {
                try {
                  const parsedRoles = JSON.parse(storedRoles);
                  setEmulatedRoles(Array.isArray(parsedRoles) ? parsedRoles : []);
                } catch (e) {
                  console.error('Error parsing stored roles:', e);
                  setEmulatedRoles([]);
                }
              }
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

    // Only set up the interval if we don't already know we're emulating
    // This prevents excessive API calls once we've determined status
    let intervalId: NodeJS.Timeout | null = null;
    if (!isEmulating) {
      // Setup interval for continued checking (every 30 seconds instead of 10)
      intervalId = setInterval(checkEmulationStatus, 30000);
    }

    // Setup focus event for checking when tab regains focus
    // But only if we aren't already emulating
    const handleFocus = () => {
      // Only check status on focus if we're not already emulating
      if (!isEmulating) {
        checkEmulationStatus();
      }
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkCount, isEmulating, emulationToken]);

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
      sessionStorage.removeItem('emulatedRoles');
      setEmulationToken(null);
      setIsEmulating(false);
      setEmulatedRoles([]);

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

  // Function to get badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'tournament_admin':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'score_admin':
        return 'bg-green-500 hover:bg-green-600';
      case 'finance_admin':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Function to get formatted role name
  const getFormattedRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="lg"
            className="shadow-lg bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? 'Exiting...' : emulatedName 
              ? `Emulating: ${emulatedName}` 
              : 'Emulation Mode'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Emulating Admin User</h4>
            <div className="text-xs text-muted-foreground">
              You are currently viewing the system as {emulatedName || 'another administrator'}
            </div>
            
            {emulatedRoles.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">Active Roles:</p>
                <div className="flex flex-wrap gap-1">
                  {emulatedRoles.map((role) => (
                    <Badge key={role} className={`${getRoleBadgeColor(role)}`}>
                      {getFormattedRoleName(role)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-2 mt-2 border-t">
              <Button 
                onClick={handleStopEmulation}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoading ? 'Exiting...' : 'Exit Emulation Mode'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}