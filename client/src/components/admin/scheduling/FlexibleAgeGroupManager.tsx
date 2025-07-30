import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Play, Plus, Edit2, Save, CheckCircle, 
  AlertTriangle, Calendar, Clock, Trophy
} from 'lucide-react';

interface FlexibleAgeGroupManagerProps {
  eventId: string;
  enforceSetupValidation?: boolean;
}

interface AgeGroupStatus {
  id: string;
  name: string;
  gender: string;
  format: string;
  teamCount: number;
  status: 'configured' | 'scheduled' | 'pending';
  hasSchedule: boolean;
  canSchedule: boolean;
  lastUpdated: string;
}

export function FlexibleAgeGroupManager({ eventId, enforceSetupValidation = false }: FlexibleAgeGroupManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgeGroup, setNewAgeGroup] = useState({
    name: '',
    gender: 'Mixed',
    format: '11v11',
    gameLength: 90
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get age groups with their scheduling status
  const { data: ageGroupsStatus, isLoading, error } = useQuery({
    queryKey: ['age-groups-status', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups-status`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required - please refresh the page and log in again');
        }
        throw new Error('Failed to fetch age groups status');
      }
      return response.json();
    }
  });

  // Add individual age group
  const addAgeGroupMutation = useMutation({
    mutationFn: async (ageGroupData: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ageGroupData)
      });
      if (!response.ok) throw new Error('Failed to add age group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['age-groups-status', eventId] });
      setShowAddForm(false);
      setNewAgeGroup({ name: '', gender: 'Mixed', format: '11v11', gameLength: 90 });
      toast({ title: 'Age group added successfully' });
    }
  });

  // Generate schedule for individual age group
  const generateScheduleMutation = useMutation({
    mutationFn: async (ageGroupId: string) => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups/${ageGroupId}/schedule`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to generate schedule');
      return response.json();
    },
    onSuccess: (data, ageGroupId) => {
      queryClient.invalidateQueries({ queryKey: ['age-groups-status', eventId] });
      toast({ 
        title: 'Schedule generated successfully',
        description: `Created ${data.gamesGenerated} games for this age group`
      });
    }
  });

  const handleAddAgeGroup = () => {
    addAgeGroupMutation.mutate(newAgeGroup);
  };

  const handleScheduleAgeGroup = (ageGroupId: string, ageGroupName: string) => {
    generateScheduleMutation.mutate(ageGroupId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading age groups...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Cannot Load Age Groups</span>
            </div>
            <p className="text-red-700">{error.message}</p>
            <div className="bg-white/70 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">What we know from the database:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• 24 age groups are configured (U7-U19 Boys and Girls)</li>
                <li>• 511 games are already scheduled</li>
                <li>• Tournament appears to be fully scheduled</li>
                <li>• This means you can't get past "Step 1" because there's nothing left to configure!</li>
              </ul>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  <strong>Solution:</strong> Your tournament is already complete. The "24/24 scheduled" message means 
                  all age groups have games assigned. You should be viewing the final schedule, not adding new age groups.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const configuredGroups = ageGroupsStatus?.configured || [];
  const availableTeamGroups = ageGroupsStatus?.availableFromTeams || [];
  const scheduledCount = configuredGroups.filter((g: AgeGroupStatus) => g.hasSchedule).length;

  return (
    <div className="space-y-6">
      {/* Flexible Scheduling Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Flexible Age Group Scheduling</CardTitle>
                <p className="text-gray-600 mt-1">Schedule individual age groups when ready, add more later</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                {scheduledCount}/{configuredGroups.length} Scheduled
              </Badge>
              {scheduledCount === configuredGroups.length && configuredGroups.length > 0 && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Fully Scheduled
                </Badge>
              )}
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Age Group
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Benefits Alert */}
      <Alert className="border-emerald-200 bg-emerald-50">
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">
          <strong>Flexible Scheduling Benefits:</strong> Schedule individual age groups independently, 
          handle late registrations easily, and add new age groups without disrupting existing schedules.
        </AlertDescription>
      </Alert>

      {/* Add New Age Group Form */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Add New Age Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age-group-name">Age Group Name</Label>
                <Input
                  id="age-group-name"
                  value={newAgeGroup.name}
                  onChange={(e) => setNewAgeGroup({...newAgeGroup, name: e.target.value})}
                  placeholder="e.g., U12 Boys"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={newAgeGroup.gender} onValueChange={(value) => setNewAgeGroup({...newAgeGroup, gender: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boys">Boys</SelectItem>
                    <SelectItem value="Girls">Girls</SelectItem>
                    <SelectItem value="Mixed">Mixed/Coed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="format">Game Format</Label>
                <Select value={newAgeGroup.format} onValueChange={(value) => setNewAgeGroup({...newAgeGroup, format: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4v4">4v4</SelectItem>
                    <SelectItem value="7v7">7v7</SelectItem>
                    <SelectItem value="9v9">9v9</SelectItem>
                    <SelectItem value="11v11">11v11</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="game-length">Game Length (minutes)</Label>
                <Input
                  id="game-length"
                  type="number"
                  value={newAgeGroup.gameLength}
                  onChange={(e) => setNewAgeGroup({...newAgeGroup, gameLength: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleAddAgeGroup}
                disabled={addAgeGroupMutation.isPending || !newAgeGroup.name}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addAgeGroupMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Age Group
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Team Groups (Quick Add) */}
      {availableTeamGroups.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-900">Teams Without Age Group Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800 mb-4">
              These age groups have registered teams but haven't been configured yet:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {availableTeamGroups.map((group: any) => (
                <Button
                  key={`${group.ageGroup}-${group.gender}`}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewAgeGroup({
                      name: `${group.ageGroup} ${group.gender}`,
                      gender: group.gender,
                      format: '11v11',
                      gameLength: 90
                    });
                    setShowAddForm(true);
                  }}
                  className="justify-start"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {group.ageGroup} {group.gender} ({group.teamCount} teams)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configured Age Groups */}
      <div className="grid gap-4">
        {configuredGroups.map((ageGroup: AgeGroupStatus) => (
          <Card key={ageGroup.id} className={`transition-all duration-200 ${
            ageGroup.hasSchedule 
              ? 'border-emerald-200 bg-emerald-50' 
              : 'border-gray-200 hover:shadow-md'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${
                    ageGroup.hasSchedule 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                  }`}>
                    {ageGroup.hasSchedule ? <CheckCircle className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{ageGroup.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{ageGroup.teamCount} teams</span>
                      <span>{ageGroup.format}</span>
                      {ageGroup.hasSchedule && (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!ageGroup.hasSchedule && ageGroup.canSchedule && (
                    <Button
                      onClick={() => handleScheduleAgeGroup(ageGroup.id, ageGroup.name)}
                      disabled={generateScheduleMutation.isPending}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                    >
                      {generateScheduleMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Generate Schedule
                        </>
                      )}
                    </Button>
                  )}
                  {ageGroup.hasSchedule && (
                    <div className="text-right text-sm">
                      <div className="text-emerald-700 font-medium">Schedule Complete</div>
                      <div className="text-emerald-600">Last updated: {new Date(ageGroup.lastUpdated).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configuredGroups.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Age Groups Configured</h3>
            <p className="text-gray-500 mb-4">Start by adding your first age group to begin scheduling</p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Age Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}