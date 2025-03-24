import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, Users } from 'lucide-react';
import EmulationManager from './EmulationManager';
import { useQuery } from '@tanstack/react-query';

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

export default function FloatingEmulationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [emulationToken, setEmulationToken] = useState<string | null>(null);
  
  // Check current emulation status
  const { data: statusData, refetch } = useQuery({
    queryKey: ['emulation-status'],
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (emulationToken) {
        headers['x-emulation-token'] = emulationToken;
      }
      
      const response = await fetch('/api/admin/emulation/status', { 
        headers,
        // Add cache busting to ensure we get the latest data
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch emulation status');
      }
      return response.json() as Promise<EmulationStatus>;
    },
    refetchInterval: 10000, // Refresh more frequently (every 10 seconds)
    refetchOnWindowFocus: true, // Refresh when window gets focus
    staleTime: 5000 // Data becomes stale after 5 seconds
  });

  // Check if there's a saved emulation token in localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('emulationToken');
    if (savedToken) {
      setEmulationToken(savedToken);
    }
    
    // Set up an interval to check for emulation status changes
    const intervalId = setInterval(() => {
      refetch();
    }, 5000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refetch]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {statusData?.emulating ? (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {statusData.emulatedAdmin?.roles && statusData.emulatedAdmin.roles.length > 0 && (
              <div className="bg-destructive text-white text-xs px-3 py-1 rounded-full shadow-md">
                Emulating: {statusData.emulatedAdmin.roles.map(r => r.replace('_', ' ')).join(', ')}
              </div>
            )}
            <Button 
              className="rounded-full shadow-lg animate-pulse"
              size="icon"
              variant="destructive"
            >
              <UserCheck className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button 
            className="fixed bottom-6 right-6 rounded-full shadow-lg z-50"
            size="icon"
            variant="secondary"
          >
            <Users className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <EmulationManager />
      </DialogContent>
    </Dialog>
  );
}