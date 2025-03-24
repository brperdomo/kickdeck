import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, User, UserCheck, LogOut } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    refetchInterval: 15000, // Refresh more frequently (every 15 seconds)
    refetchOnWindowFocus: true
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
      setEmulationToken(data.token);
      localStorage.setItem('emulationToken', data.token);
      
      // Refresh all queries to reflect emulated user data
      queryClient.invalidateQueries();
      
      // Force refresh the user data with proper query key that includes the token
      queryClient.invalidateQueries({ queryKey: ['user', data.token] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions', data.token] });
      
      // Reload the page to ensure all components update properly with the emulated user
      window.location.reload();
      
      toast({
        title: 'Emulation Started',
        description: `You are now viewing the system as ${data.emulatedAdmin.firstName} ${data.emulatedAdmin.lastName}`,
      });
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
      setEmulationToken(null);
      localStorage.removeItem('emulationToken');
      
      // Refresh all queries to reflect actual user data
      queryClient.invalidateQueries();
      
      // Force refresh the user data after removing emulation
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      
      // Reload the page to ensure all components update properly
      window.location.reload();
      
      toast({
        title: 'Emulation Stopped',
        description: 'You are now viewing the system as yourself',
      });
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Emulation</CardTitle>
        <CardDescription>
          Emulate other administrators to test their perspective and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusData?.emulating ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <User className="h-4 w-4" />
              <AlertTitle>Emulation Active</AlertTitle>
              <AlertDescription className="flex flex-col gap-4">
                <div>
                  <p className="mb-2">
                    You are currently viewing the system as{' '}
                    <strong>
                      {statusData.emulatedAdmin?.firstName} {statusData.emulatedAdmin?.lastName}
                    </strong>{' '}
                    ({statusData.emulatedAdmin?.email})
                  </p>
                  
                  {statusData.emulatedAdmin?.roles && statusData.emulatedAdmin.roles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Active roles:</p>
                      <div className="flex flex-wrap gap-1">
                        {statusData.emulatedAdmin.roles.map((role) => {
                          let badgeClass = "capitalize";
                          
                          // Apply different colors based on role type
                          if (role === 'tournament_admin') {
                            badgeClass += " bg-blue-100 text-blue-800 border-blue-300";
                          } else if (role === 'score_admin') {
                            badgeClass += " bg-green-100 text-green-800 border-green-300";
                          } else if (role === 'finance_admin') {
                            badgeClass += " bg-amber-100 text-amber-800 border-amber-300";
                          }
                          
                          return (
                            <Badge key={role} variant="outline" className={badgeClass}>
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
                  variant="secondary"
                  className="w-fit"
                  disabled={stopEmulationMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {stopEmulationMutation.isPending ? 'Exiting...' : 'Exit Emulation Mode'}
                </Button>
              </AlertDescription>
            </Alert>
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
                    <Card key={admin.id} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          {admin.firstName} {admin.lastName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {admin.email}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="flex flex-wrap gap-1 mb-4">
                          {admin.roles.map((role) => {
                            let badgeClass = "capitalize";
                            
                            // Apply different colors based on role type
                            if (role === 'tournament_admin') {
                              badgeClass += " bg-blue-100 text-blue-800 hover:bg-blue-200";
                            } else if (role === 'score_admin') {
                              badgeClass += " bg-green-100 text-green-800 hover:bg-green-200";
                            } else if (role === 'finance_admin') {
                              badgeClass += " bg-amber-100 text-amber-800 hover:bg-amber-200";
                            }
                            
                            return (
                              <Badge key={role} variant="outline" className={badgeClass}>
                                {role.replace('_', ' ')}
                              </Badge>
                            );
                          })}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartEmulation(admin.id)}
                          disabled={startEmulationMutation.isPending}
                          className="w-full"
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Administrators Available</AlertTitle>
                <AlertDescription>
                  There are no administrators available for emulation. Only super admins can emulate other administrators.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}