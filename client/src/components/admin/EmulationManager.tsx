import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, User, UserCheck, LogOut, UserCog } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface Admin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface EmulationStatus {
  emulating: boolean;
  token?: string;
  emulatedAdmin?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles?: string[];
  };
}

export default function EmulationManager() {
  const queryClient = useQueryClient();
  const [emulationToken, setEmulationToken] = useState<string | null>(null);
  
  // Fetch available administrators that can be emulated
  const { data: adminsData, error: adminsError, isLoading: adminsLoading } = useQuery({
    queryKey: ['emulatable-admins'],
    queryFn: async () => {
      const response = await fetch('/api/admin/emulation/admins');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch emulatable administrators');
      }
      return response.json() as Promise<Admin[]>;
    }
  });

  // Check current emulation status
  const { data: statusData, error: statusError, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['emulation-status'],
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (emulationToken) {
        headers['x-emulation-token'] = emulationToken;
      }
      
      const response = await fetch('/api/admin/emulation/status', { 
        headers,
        cache: 'no-cache' // Ensure we don't get cached responses
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch emulation status');
      }
      
      return response.json() as Promise<EmulationStatus>;
    },
    refetchInterval: 300000, // Reduced to 5 minutes (was 15 seconds) to prevent disruptions during demos
    refetchOnWindowFocus: false // Disabled to prevent disruptions when window regains focus
  });

  // Start emulation mutation
  const startEmulationMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await fetch(`/api/admin/emulation/start/${adminId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start emulation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      try {
        console.log('Emulation started successfully with data:', data);
        
        // Set emulation token in localStorage
        if (data && data.token) {
          setEmulationToken(data.token);
          localStorage.setItem('emulationToken', data.token);
          
          // Set a session storage flag to prevent state loss on reload
          sessionStorage.setItem('emulationActive', 'true');
          sessionStorage.setItem('emulatedAdminName', `${data.emulatedAdmin.firstName} ${data.emulatedAdmin.lastName}`);
        }
        
        // First show toast before reload
        toast({
          title: 'Emulation Started',
          description: `You are now viewing the system as ${data.emulatedAdmin.firstName} ${data.emulatedAdmin.lastName}`,
        });
        
        // Wait a bit longer to ensure the token is properly saved
        setTimeout(() => {
          // Invalidate all queries to force refetch with new token
          queryClient.invalidateQueries();
          
          // Force refresh key queries
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
          queryClient.invalidateQueries({ queryKey: ['emulation-status'] });
          
          console.log('Emulation token stored in localStorage:', localStorage.getItem('emulationToken'));
          
          // Reload the page to ensure all components update properly
          // Ensure no duplicate slashes by using URL constructor
          const adminUrl = new URL('/admin', window.location.origin);
          window.location.href = adminUrl.toString();
        }, 1000);
      } catch (error) {
        console.error('Error in emulation success handler:', error);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Emulation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Stop emulation mutation
  const stopEmulationMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/admin/emulation/stop/${token}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop emulation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // First show toast before reload
      toast({
        title: 'Emulation Stopped',
        description: 'You are now viewing the system as yourself',
      });
      
      // Clear emulation token
      setEmulationToken(null);
      localStorage.removeItem('emulationToken');
      
      // Wait a brief moment to ensure the toast is displayed
      setTimeout(() => {
        // Refresh all queries to reflect actual user data
        queryClient.invalidateQueries();
        
        // Force refresh the user data after removing emulation
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
        
        // Reload the page to ensure all components update properly
        window.location.reload();
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Stopping Emulation',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Check if there's a saved emulation token in localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('emulationToken');
    if (savedToken) {
      setEmulationToken(savedToken);
    }
  }, []);

  // Handle starting emulation
  const handleStartEmulation = (adminId: number) => {
    startEmulationMutation.mutate(adminId);
  };

  // Handle stopping emulation
  const handleStopEmulation = () => {
    if (statusData?.token) {
      stopEmulationMutation.mutate(statusData.token);
    }
  };

  if (adminsError || statusError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {(adminsError as Error)?.message || (statusError as Error)?.message || 'An error occurred loading the emulation manager'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full overflow-hidden border border-border/40 shadow-lg">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 flex gap-4">
        <div className="rounded-full bg-white/10 p-3 h-fit">
          <UserCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-white text-xl font-semibold mb-1">User Emulation Console</h3>
          <p className="text-indigo-100 opacity-90 text-sm">
            Emulate other administrators to test their perspective and permissions
          </p>
        </div>
      </div>
      <CardContent className="pt-6">
        {statusData?.emulating ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-800 to-violet-900 rounded-lg p-4 shadow-lg text-white border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-full">
                  <User className="h-5 w-5 text-purple-200" />
                </div>
                <h3 className="text-lg font-semibold text-purple-100">Emulation Mode Active</h3>
              </div>
              
              <div className="rounded-md bg-purple-500/10 p-3 border border-purple-500/20 mb-4">
                <p className="mb-2 text-purple-100">
                  You are currently viewing the system as{' '}
                  <span className="font-semibold text-white">
                    {statusData.emulatedAdmin?.firstName} {statusData.emulatedAdmin?.lastName}
                  </span>
                </p>
                <p className="text-sm text-purple-200 mb-3">
                  {statusData.emulatedAdmin?.email}
                </p>
                
                {statusData.emulatedAdmin?.roles && statusData.emulatedAdmin.roles.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-purple-300 font-medium mb-2">Active roles</p>
                    <div className="flex flex-wrap gap-1">
                      {statusData.emulatedAdmin.roles.map((role) => {
                        let badgeClass = "capitalize";
                        
                        // Apply different colors based on role type with more modern gradient styling
                        if (role === 'tournament_admin') {
                          badgeClass += " bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm";
                        } else if (role === 'score_admin') {
                          badgeClass += " bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm";
                        } else if (role === 'finance_admin') {
                          badgeClass += " bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm";
                        }
                        
                        return (
                          <Badge key={role} className={badgeClass}>
                            {role.replace('_', ' ')}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleStopEmulation}
                className="w-fit bg-purple-100 hover:bg-white text-purple-900 hover:text-purple-950 shadow-sm transition-all duration-200"
                disabled={stopEmulationMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {stopEmulationMutation.isPending ? 'Exiting...' : 'Exit Emulation Mode'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {adminsLoading ? (
              <p>Loading available administrators...</p>
            ) : adminsData && adminsData.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select an administrator to emulate:
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {adminsData.map((admin) => (
                    <Card key={admin.id} className="flex flex-col overflow-hidden border border-border/40 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                      <div className="bg-gradient-to-r from-slate-100 to-gray-50 dark:from-slate-950 dark:to-gray-900 px-4 py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            {admin.firstName} {admin.lastName}
                            <CardDescription className="text-xs mt-0.5">
                              {admin.email}
                            </CardDescription>
                          </div>
                        </CardTitle>
                      </div>
                      <CardContent className="flex-1 pt-4">
                        <div className="flex flex-wrap gap-1 mb-4">
                          {admin.roles.map((role) => {
                            let badgeClass = "capitalize";
                            
                            // Apply different colors based on role type with the same modern gradient styling
                            if (role === 'tournament_admin') {
                              badgeClass += " bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm";
                            } else if (role === 'score_admin') {
                              badgeClass += " bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm";
                            } else if (role === 'finance_admin') {
                              badgeClass += " bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm";
                            }
                            
                            return (
                              <Badge key={role} className={badgeClass}>
                                {role.replace('_', ' ')}
                              </Badge>
                            );
                          })}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartEmulation(admin.id)}
                          disabled={startEmulationMutation.isPending}
                          className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-sm"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          {startEmulationMutation.isPending && startEmulationMutation.variables === admin.id
                            ? 'Starting...'
                            : 'Emulate User'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900 dark:to-slate-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="flex gap-3 items-center mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-medium">No Administrators Available</h3>
                </div>
                <p className="text-muted-foreground">
                  There are no administrators available for emulation. Only super admins can emulate other administrators.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}