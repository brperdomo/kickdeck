/**
 * Tournament Director Assignment Manager
 * 
 * Allows admins to assign Tournament Directors to specific events
 * and manage their access permissions.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TournamentDirector {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  assignedAt?: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

interface TournamentDirectorManagerProps {
  eventId: string;
}

export function TournamentDirectorManager({ eventId }: TournamentDirectorManagerProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all Tournament Directors
  const { data: allDirectors = [], isLoading: loadingAllDirectors } = useQuery({
    queryKey: ['/api/admin/tournament-directors'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tournament-directors');
      if (!response.ok) throw new Error('Failed to fetch tournament directors');
      return response.json();
    }
  });

  // Fetch assigned Tournament Directors for this event
  const { data: assignedDirectors = [], isLoading: loadingAssigned } = useQuery({
    queryKey: ['/api/admin/events', eventId, 'tournament-directors'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/tournament-directors`);
      if (!response.ok) throw new Error('Failed to fetch assigned directors');
      return response.json();
    }
  });

  // Assign Tournament Director mutation
  const assignDirectorMutation = useMutation({
    mutationFn: async (directorId: string) => {
      const response = await fetch(`/api/admin/events/${eventId}/tournament-directors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(directorId) })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign tournament director');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tournament Director Assigned',
        description: 'Tournament Director has been successfully assigned to this event.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'tournament-directors'] });
      setIsAssignDialogOpen(false);
      setSelectedDirectorId('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Assignment Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Remove Tournament Director mutation
  const removeDirectorMutation = useMutation({
    mutationFn: async (directorId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/tournament-directors/${directorId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove tournament director');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tournament Director Removed',
        description: 'Tournament Director has been removed from this event.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'tournament-directors'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Removal Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Get unassigned directors (those not already assigned to this event)
  const unassignedDirectors = allDirectors.filter(
    director => !assignedDirectors.some(assigned => assigned.id === director.id)
  );

  const handleAssign = () => {
    if (selectedDirectorId) {
      assignDirectorMutation.mutate(selectedDirectorId);
    }
  };

  const handleRemove = (directorId: number) => {
    if (confirm('Are you sure you want to remove this Tournament Director from this event?')) {
      removeDirectorMutation.mutate(directorId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tournament Directors
            </CardTitle>
            <CardDescription>
              Assign Tournament Directors to manage this event. They will only have access to this specific event.
            </CardDescription>
          </div>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Assign Director
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Tournament Director</DialogTitle>
                <DialogDescription>
                  Select a Tournament Director to assign to this event. They will gain access to manage only this event.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Select Tournament Director</label>
                  <Select value={selectedDirectorId} onValueChange={setSelectedDirectorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a Tournament Director" />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedDirectors.map(director => (
                        <SelectItem key={director.id} value={director.id.toString()}>
                          {director.firstName} {director.lastName} ({director.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {unassignedDirectors.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      All Tournament Directors are already assigned to this event.
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssign} 
                    disabled={!selectedDirectorId || assignDirectorMutation.isPending}
                  >
                    {assignDirectorMutation.isPending ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loadingAssigned ? (
          <p className="text-muted-foreground">Loading assigned Tournament Directors...</p>
        ) : assignedDirectors.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tournament Directors Assigned</h3>
            <p className="text-muted-foreground mb-4">
              Assign Tournament Directors to give them access to manage this specific event.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedDirectors.map(director => (
              <div 
                key={director.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {director.firstName} {director.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{director.email}</p>
                    {director.phone && (
                      <p className="text-sm text-muted-foreground">{director.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Tournament Director</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(director.id)}
                    disabled={removeDirectorMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {assignedDirectors.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Access Restrictions</h4>
            <p className="text-sm text-blue-700">
              Tournament Directors assigned to this event can only access this event's management features. 
              They cannot see other events or admin components.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}