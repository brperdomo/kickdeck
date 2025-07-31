import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Users, Trophy, RefreshCw, Edit3, Plus, 
  AlertTriangle, CheckCircle, Clock, Save, Trash2,
  GripVertical, ArrowUpDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Team {
  id: number;
  name: string;
  clubName?: string;
  coach?: string;
  seedRanking: number;
  status: string;
}

interface AgeGroup {
  id: string;
  name: string;
  gender: string;
  format: string;
  teamCount: number;
  hasSchedule: boolean;
  canSchedule: boolean;
  status: string;
  teams?: Team[];
  gameCount?: number;
  lastScheduled?: string;
}

interface AgeGroupManagementPanelProps {
  eventId: string;
}

export default function AgeGroupManagementPanel({ eventId }: AgeGroupManagementPanelProps) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('');
  const [editingAgeGroup, setEditingAgeGroup] = useState<AgeGroup | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch age groups with scheduling status
  const { data: ageGroups, isLoading: ageGroupsLoading } = useQuery({
    queryKey: ['age-groups-management', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups-status`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch age groups');
      const data = await response.json();
      return data.configured || [];
    }
  });

  // Fetch teams for selected age group
  const { data: ageGroupTeams, isLoading: teamsLoading } = useQuery({
    queryKey: ['age-group-teams', eventId, selectedAgeGroup],
    queryFn: async () => {
      if (!selectedAgeGroup) return [];
      const response = await fetch(`/api/admin/events/${eventId}/age-groups/${selectedAgeGroup}/teams`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    enabled: !!selectedAgeGroup
  });

  useEffect(() => {
    if (ageGroupTeams) {
      setTeams(ageGroupTeams.map((team: any, index: number) => ({
        ...team,
        seedRanking: team.seedRanking || index + 1
      })));
      setHasUnsavedChanges(false);
    }
  }, [ageGroupTeams]);

  // Update seeding mutation
  const updateSeedingMutation = useMutation({
    mutationFn: async ({ ageGroupId, teams }: { ageGroupId: string; teams: Team[] }) => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups/${ageGroupId}/seeding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teams })
      });
      if (!response.ok) throw new Error('Failed to update team seeding');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-group-teams', eventId, selectedAgeGroup] });
      setHasUnsavedChanges(false);
      toast({ title: 'Team seeding updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update seeding', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Regenerate schedule mutation
  const regenerateScheduleMutation = useMutation({
    mutationFn: async (ageGroupId: string) => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups/${ageGroupId}/regenerate-schedule`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to regenerate schedule');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['age-groups-management', eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-calendar', eventId, 'schedule-calendar'] });
      toast({ 
        title: 'Schedule regenerated successfully',
        description: `Generated ${data.gamesGenerated} games with updated seeding`
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to regenerate schedule', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (ageGroupId: string) => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups/${ageGroupId}/schedule`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-groups-management', eventId] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-calendar', eventId, 'schedule-calendar'] });
      setShowDeleteConfirm(null);
      toast({ title: 'Schedule deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete schedule', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newTeams = Array.from(teams);
    const [reorderedTeam] = newTeams.splice(result.source.index, 1);
    newTeams.splice(result.destination.index, 0, reorderedTeam);

    // Update seed rankings based on new order
    const updatedTeams = newTeams.map((team, index) => ({
      ...team,
      seedRanking: index + 1
    }));

    setTeams(updatedTeams);
    setHasUnsavedChanges(true);
  };

  const handleSaveSeeding = () => {
    if (selectedAgeGroup) {
      updateSeedingMutation.mutate({ ageGroupId: selectedAgeGroup, teams });
    }
  };

  const handleRegenerateSchedule = (ageGroupId: string) => {
    regenerateScheduleMutation.mutate(ageGroupId);
  };

  const handleDeleteSchedule = (ageGroupId: string) => {
    deleteScheduleMutation.mutate(ageGroupId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800 border-green-200';
      case 'configured': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (ageGroupsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading age group management...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scheduledAgeGroups = ageGroups?.filter((ag: AgeGroup) => ag.hasSchedule) || [];
  const configuredAgeGroups = ageGroups?.filter((ag: AgeGroup) => !ag.hasSchedule && ag.teamCount > 0) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Age Group Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit team seedings and regenerate schedules for existing age groups
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scheduled" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scheduled" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Scheduled ({scheduledAgeGroups.length})
              </TabsTrigger>
              <TabsTrigger value="configured" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ready to Schedule ({configuredAgeGroups.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="space-y-4">
              {scheduledAgeGroups.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No age groups have been scheduled yet. Use the Quick Schedule Generator to create schedules.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {scheduledAgeGroups.map((ageGroup: AgeGroup) => (
                    <Card key={ageGroup.id} className="border-green-200 bg-green-50/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(ageGroup.status)}>
                              {ageGroup.status}
                            </Badge>
                            <div>
                              <h3 className="font-semibold">{ageGroup.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {ageGroup.teamCount} teams • {ageGroup.format} format
                                {ageGroup.gameCount && ` • ${ageGroup.gameCount} games`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedAgeGroup(ageGroup.id)}
                                >
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Edit Seeding
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Team Seeding - {ageGroup.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {teamsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                  ) : (
                                    <>
                                      <Alert>
                                        <ArrowUpDown className="h-4 w-4" />
                                        <AlertDescription>
                                          Drag teams to reorder their seeding. Changes will affect future schedule regeneration.
                                        </AlertDescription>
                                      </Alert>
                                      
                                      <DragDropContext onDragEnd={handleDragEnd}>
                                        <Droppable droppableId="teams">
                                          {(provided) => (
                                            <div
                                              {...provided.droppableProps}
                                              ref={provided.innerRef}
                                              className="space-y-2"
                                            >
                                              {teams.map((team, index) => (
                                                <Draggable
                                                  key={team.id}
                                                  draggableId={team.id.toString()}
                                                  index={index}
                                                >
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                                                        snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'bg-white'
                                                      }`}
                                                    >
                                                      <div
                                                        {...provided.dragHandleProps}
                                                        className="cursor-grab active:cursor-grabbing"
                                                      >
                                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                                      </div>
                                                      <Badge variant="outline" className="w-8 h-6 flex items-center justify-center">
                                                        {team.seedRanking}
                                                      </Badge>
                                                      <div className="flex-1">
                                                        <div className="font-medium">{team.name}</div>
                                                        {team.clubName && (
                                                          <div className="text-sm text-muted-foreground">{team.clubName}</div>
                                                        )}
                                                      </div>
                                                      <Badge 
                                                        variant={team.status === 'approved' ? 'default' : 'secondary'}
                                                        className="text-xs"
                                                      >
                                                        {team.status}
                                                      </Badge>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              ))}
                                              {provided.placeholder}
                                            </div>
                                          )}
                                        </Droppable>
                                      </DragDropContext>

                                      <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="text-sm text-muted-foreground">
                                          {hasUnsavedChanges && (
                                            <span className="text-orange-600 font-medium">
                                              You have unsaved changes
                                            </span>
                                          )}
                                        </div>
                                        <Button 
                                          onClick={handleSaveSeeding}
                                          disabled={!hasUnsavedChanges || updateSeedingMutation.isPending}
                                        >
                                          <Save className="h-4 w-4 mr-1" />
                                          Save Seeding
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              onClick={() => handleRegenerateSchedule(ageGroup.id)}
                              disabled={regenerateScheduleMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <RefreshCw className={`h-4 w-4 mr-1 ${regenerateScheduleMutation.isPending ? 'animate-spin' : ''}`} />
                              Regenerate Schedule
                            </Button>
                            
                            <Button 
                              variant="destructive"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(ageGroup.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Schedule
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="configured" className="space-y-4">
              {configuredAgeGroups.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No age groups are ready for scheduling. Configure age groups and register teams first.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {configuredAgeGroups.map((ageGroup: AgeGroup) => (
                    <Card key={ageGroup.id} className="border-blue-200 bg-blue-50/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(ageGroup.status)}>
                              {ageGroup.status}
                            </Badge>
                            <div>
                              <h3 className="font-semibold">{ageGroup.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {ageGroup.teamCount} teams • {ageGroup.format} format • Ready to schedule
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedAgeGroup(ageGroup.id)}
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  View Teams
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Teams in {ageGroup.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {teamsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {teams.map((team, index) => (
                                        <div key={team.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                                          <Badge variant="outline" className="w-8 h-6 flex items-center justify-center">
                                            {index + 1}
                                          </Badge>
                                          <div className="flex-1">
                                            <div className="font-medium">{team.name}</div>
                                            {team.clubName && (
                                              <div className="text-sm text-muted-foreground">{team.clubName}</div>
                                            )}
                                          </div>
                                          <Badge 
                                            variant={team.status === 'approved' ? 'default' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {team.status}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Schedule?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will permanently delete all games for this age group. This action cannot be undone.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteSchedule(showDeleteConfirm)}
                  disabled={deleteScheduleMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}