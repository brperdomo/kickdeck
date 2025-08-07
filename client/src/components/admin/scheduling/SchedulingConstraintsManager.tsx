import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface ScheduleConstraints {
  id?: number;
  eventId: number;
  maxGamesPerTeamPerDay: number;
  maxHoursSpreadPerTeam: number;
  minRestTimeBetweenGames: number;
  allowBackToBackGames: boolean;
  maxHoursPerFieldPerDay: number;
  enforceFieldCompatibility: boolean;
  prioritizeEvenScheduling: boolean;
  allowEveningGames: boolean;
  earliestGameTime: string;
  latestGameTime: string;
  minRestBeforePlayoffs: number;
  allowPlayoffBackToBack: boolean;
  isActive: boolean;
}

interface SchedulingConstraintsManagerProps {
  eventId: number;
}

export function SchedulingConstraintsManager({ eventId }: SchedulingConstraintsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current constraints
  const constraintsQuery = useQuery({
    queryKey: ['/api/admin/events', eventId, 'game-metadata'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/game-metadata`);
      if (!response.ok) throw new Error('Failed to fetch constraints');
      const data = await response.json();
      return data.constraints;
    }
  });

  const [constraints, setConstraints] = useState<ScheduleConstraints>({
    eventId,
    maxGamesPerTeamPerDay: 2,
    maxHoursSpreadPerTeam: 8,
    minRestTimeBetweenGames: 90,
    allowBackToBackGames: false,
    maxHoursPerFieldPerDay: 12,
    enforceFieldCompatibility: true,
    prioritizeEvenScheduling: true,
    allowEveningGames: true,
    earliestGameTime: '08:00',
    latestGameTime: '20:00',
    minRestBeforePlayoffs: 120,
    allowPlayoffBackToBack: false,
    isActive: true
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (constraintsQuery.data) {
      setConstraints(prev => ({ ...prev, ...constraintsQuery.data }));
    }
  }, [constraintsQuery.data]);

  // Save constraints mutation
  const saveConstraintsMutation = useMutation({
    mutationFn: async (updatedConstraints: ScheduleConstraints) => {
      const response = await fetch(`/api/admin/events/${eventId}/schedule-constraints`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConstraints),
      });
      if (!response.ok) throw new Error('Failed to save constraints');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Constraints Updated",
        description: "Scheduling constraints have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events', eventId, 'game-metadata'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save scheduling constraints.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    saveConstraintsMutation.mutate(constraints);
  };

  const updateConstraint = (key: keyof ScheduleConstraints, value: any) => {
    setConstraints(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white text-lg">Scheduling Constraints</CardTitle>
            <p className="text-slate-400 text-sm">Configure rest periods, games per day limits, and tournament rules</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Constraints */}
        <div className="space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Constraints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxGamesPerDay" className="text-slate-300">
                Max Games Per Team Per Day
              </Label>
              <Input
                id="maxGamesPerDay"
                type="number"
                min="1"
                max="5"
                value={constraints.maxGamesPerTeamPerDay}
                onChange={(e) => updateConstraint('maxGamesPerTeamPerDay', parseInt(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">Recommended: 2 games maximum to prevent player fatigue</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minRestTime" className="text-slate-300">
                Minimum Rest Between Games (minutes)
              </Label>
              <Input
                id="minRestTime"
                type="number"
                min="30"
                max="180"
                step="15"
                value={constraints.minRestTimeBetweenGames}
                onChange={(e) => updateConstraint('minRestTimeBetweenGames', parseInt(e.target.value))}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">Standard: 90 minutes for proper warm-up and recovery</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="space-y-1">
              <Label className="text-slate-300">Allow Back-to-Back Games</Label>
              <p className="text-xs text-slate-400">Teams can play games in consecutive time slots</p>
            </div>
            <Switch
              checked={constraints.allowBackToBackGames}
              onCheckedChange={(checked) => updateConstraint('allowBackToBackGames', checked)}
            />
          </div>
        </div>

        {/* Time Constraints */}
        <div className="space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Operating Hours
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="earliestTime" className="text-slate-300">
                Earliest Game Time
              </Label>
              <Input
                id="earliestTime"
                type="time"
                value={constraints.earliestGameTime}
                onChange={(e) => updateConstraint('earliestGameTime', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latestTime" className="text-slate-300">
                Latest Game Time
              </Label>
              <Input
                id="latestTime"
                type="time"
                value={constraints.latestGameTime}
                onChange={(e) => updateConstraint('latestGameTime', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="space-y-1">
              <Label className="text-slate-300">Allow Evening Games</Label>
              <p className="text-xs text-slate-400">Games can be scheduled after sunset (requires field lighting)</p>
            </div>
            <Switch
              checked={constraints.allowEveningGames}
              onCheckedChange={(checked) => updateConstraint('allowEveningGames', checked)}
            />
          </div>
        </div>

        {/* Field Constraints */}
        <div className="space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Field Management
          </h3>
          <div className="space-y-2">
            <Label htmlFor="maxFieldHours" className="text-slate-300">
              Max Hours Per Field Per Day
            </Label>
            <Input
              id="maxFieldHours"
              type="number"
              min="8"
              max="16"
              value={constraints.maxHoursPerFieldPerDay}
              onChange={(e) => updateConstraint('maxHoursPerFieldPerDay', parseInt(e.target.value))}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="space-y-1">
              <Label className="text-slate-300">Enforce Field Compatibility</Label>
              <p className="text-xs text-slate-400">Match field sizes to age group requirements (7v7, 9v9, 11v11)</p>
            </div>
            <Switch
              checked={constraints.enforceFieldCompatibility}
              onCheckedChange={(checked) => updateConstraint('enforceFieldCompatibility', checked)}
            />
          </div>
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="space-y-1">
            <p className="text-sm text-slate-300">Current Configuration</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-600">
                Max {constraints.maxGamesPerTeamPerDay} games/day
              </Badge>
              <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-600">
                {constraints.minRestTimeBetweenGames}min rest
              </Badge>
              <Badge variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-600">
                {constraints.earliestGameTime} - {constraints.latestGameTime}
              </Badge>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saveConstraintsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saveConstraintsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}