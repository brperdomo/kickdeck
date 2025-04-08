import { useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

/*
 * This component has been completely rewritten to avoid infinite render loops.
 * It now relies on sessionStorage for state rather than React state
 * to prevent issues with the RadixUI Popover component.
 */
export function FloatingEmulationButton() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for emulation on mount, doesn't depend on React state
  useEffect(() => {
    // Initial check - only runs once on mount
    checkEmulationStatus();

    // Setup interval for periodic checking (every 5 minutes instead of 30 seconds)
    // This prevents frequent refreshes during demos
    const intervalId = setInterval(checkEmulationStatus, 300000);
    
    // Don't check on focus to avoid interrupting demo flow
    // window.addEventListener('focus', checkEmulationStatus);
    
    return () => {
      clearInterval(intervalId);
      // window.removeEventListener('focus', checkEmulationStatus);
    };
  }, []);

  // Extracted function that checks emulation status
  const checkEmulationStatus = useCallback(async () => {
    // Get token from localStorage
    const token = localStorage.getItem('emulationToken');
    
    // If no token exists, clear any emulation state
    if (!token) {
      console.log('[Emulation] No token found, clearing state');
      sessionStorage.removeItem('emulationActive');
      sessionStorage.removeItem('emulatedAdminName');
      sessionStorage.removeItem('emulatedRoles');
      return;
    }
    
    try {
      console.log('[Emulation] Checking status with token');
      
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
        
        if (data && data.emulating === true) {
          // Mark as active
          sessionStorage.setItem('emulationActive', 'true');
          
          // Store emulated admin name if available
          if (data.emulatedAdmin && data.emulatedAdmin.firstName && data.emulatedAdmin.lastName) {
            const name = `${data.emulatedAdmin.firstName} ${data.emulatedAdmin.lastName}`;
            sessionStorage.setItem('emulatedAdminName', name);
          }
          
          // Store roles 
          if (data.roles && Array.isArray(data.roles)) {
            sessionStorage.setItem('emulatedRoles', JSON.stringify(data.roles));
          }
          
          // Force a re-render without state updates
          window.dispatchEvent(new Event('emulation-updated'));
        } else {
          // Not active, clean up
          cleanupEmulationState();
        }
      } else {
        // Error, clean up
        cleanupEmulationState();
      }
    } catch (error) {
      console.error("Error checking emulation status:", error);
    }
  }, []);

  // Cleans up emulation state without state updates
  const cleanupEmulationState = () => {
    localStorage.removeItem('emulationToken');
    sessionStorage.removeItem('emulationActive');
    sessionStorage.removeItem('emulatedAdminName');
    sessionStorage.removeItem('emulatedRoles');
    
    // Force a re-render without state updates
    window.dispatchEvent(new Event('emulation-updated'));
  };

  // Handle stopping emulation
  const handleStopEmulation = async () => {
    const token = localStorage.getItem('emulationToken');
    if (!token) return;

    try {
      // Show toast first
      toast({
        title: 'Emulation Stopped',
        description: 'You are now viewing the system as yourself',
      });

      const response = await fetch(`/api/admin/emulation/stop/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
      });

      // Always clean up the client storage
      cleanupEmulationState();

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error stopping emulation:", errorData);
      }

      // Wait a brief moment to ensure the toast is displayed
      setTimeout(() => {
        // Force refresh all queries with the new identity
        queryClient.invalidateQueries();
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
        queryClient.invalidateQueries({ queryKey: ['emulation-status'] });
        
        // Reload the page to ensure UI updates properly
        // Ensure no duplicate slashes by using URL constructor
        const adminUrl = new URL('/admin', window.location.origin);
        window.location.href = adminUrl.toString();
      }, 1000);
    } catch (error) {
      toast({
        title: 'Emulation Reset',
        description: 'Emulation mode has been reset due to an error',
        variant: 'destructive',
      });
      console.error("Error in emulation stop handler:", error);
      cleanupEmulationState();
    }
  };

  // Check if we're emulating directly from sessionStorage
  const isEmulating = sessionStorage.getItem('emulationActive') === 'true';
  
  // Only show the button if we're actually emulating
  if (!isEmulating) return null;
  
  const emulatedName = sessionStorage.getItem('emulatedAdminName');
  
  // Get roles from sessionStorage
  let emulatedRoles: string[] = [];
  try {
    const rolesString = sessionStorage.getItem('emulatedRoles');
    if (rolesString) {
      const parsedRoles = JSON.parse(rolesString);
      emulatedRoles = Array.isArray(parsedRoles) ? parsedRoles : [];
    }
  } catch (e) {
    console.error('Error parsing stored roles:', e);
  }

  // Function to get badge color based on role - using updated modern color scheme
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm';
      case 'tournament_admin':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm';
      case 'score_admin':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm';
      case 'finance_admin':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white shadow-sm';
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
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="lg"
            className="shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-6"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {emulatedName 
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
              >
                <LogOut className="mr-2 h-4 w-4" />
                Exit Emulation Mode
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}