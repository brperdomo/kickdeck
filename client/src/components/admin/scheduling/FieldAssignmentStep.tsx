import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { MapPin, Users, Target, Zap, Info, Building } from 'lucide-react';

interface FieldAssignmentStepProps {
  eventId: string;
  onComplete: (data: any) => void;
}

interface Field {
  id: number;
  name: string;
  fieldSize: string;
  surface: string;
  capacity: number;
  isActive: boolean;
  assignedGames: number;
}

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  scheduledTime: string;
  requiredFieldSize: string;
  fieldId?: number;
  fieldName?: string;
}

export function FieldAssignmentStep({ eventId, onComplete }: FieldAssignmentStepProps) {
  const queryClient = useQueryClient();

  // Fetch available fields
  const { data: fields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['fields', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    }
  });

  // Fetch scheduled games
  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['scheduled-games', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/games?scheduled=true`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch scheduled games');
      return response.json();
    }
  });

  // Assign fields mutation
  const assignFieldsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to assign fields');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-games', eventId] });
      toast({ 
        title: 'Fields assigned successfully',
        description: `Assigned ${data.assignedGames} games to ${data.fieldsUsed} fields`
      });
    }
  });

  // Optimize field assignments mutation
  const optimizeFieldsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/fields/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to optimize field assignments');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-games', eventId] });
      toast({ 
        title: 'Field assignments optimized',
        description: `Improved utilization by ${data.utilizationImprovement}% across ${data.fieldsOptimized} fields`
      });
    }
  });

  const handleAssignFields = () => {
    assignFieldsMutation.mutate();
  };

  const handleOptimizeFields = () => {
    optimizeFieldsMutation.mutate();
  };

  const handleComplete = () => {
    const assignedGames = games?.filter((g: Game) => g.fieldId).length || 0;
    
    if (assignedGames === 0) {
      toast({ 
        title: 'No field assignments',
        description: 'Please assign fields to games before proceeding',
        variant: 'destructive'
      });
      return;
    }

    onComplete({
      totalGames: games?.length || 0,
      assignedGames,
      fieldsUsed: new Set(games?.map((g: Game) => g.fieldId).filter(Boolean)).size
    });
  };

  const calculateFieldStats = () => {
    if (!fields || !games) return { totalFields: 0, fieldsUsed: 0, utilizationRate: 0 };
    
    const totalFields = fields.length;
    const fieldsUsed = new Set(games.map((g: Game) => g.fieldId).filter(Boolean)).size;
    const utilizationRate = totalFields > 0 ? (fieldsUsed / totalFields) * 100 : 0;
    
    return { totalFields, fieldsUsed, utilizationRate };
  };

  const getFieldSizeDistribution = () => {
    if (!fields) return {};
    
    return fields.reduce((acc: {[key: string]: number}, field: Field) => {
      acc[field.fieldSize] = (acc[field.fieldSize] || 0) + 1;
      return acc;
    }, {});
  };

  const getAssignmentStats = () => {
    if (!games) return { assigned: 0, unassigned: 0, conflicts: 0 };
    
    const assigned = games.filter((g: Game) => g.fieldId).length;
    const unassigned = games.length - assigned;
    
    // Calculate potential conflicts (same field, overlapping times)
    const fieldTimeSlots = new Map();
    let conflicts = 0;
    
    games.forEach((game: Game) => {
      if (game.fieldId && game.scheduledTime) {
        const key = `${game.fieldId}-${game.scheduledTime}`;
        if (fieldTimeSlots.has(key)) {
          conflicts++;
        } else {
          fieldTimeSlots.set(key, true);
        }
      }
    });
    
    return { assigned, unassigned, conflicts };
  };

  if (fieldsLoading || gamesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading field assignment interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!games || games.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No scheduled games found. Please complete Game Scheduling (Step 4) before assigning fields.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const fieldStats = calculateFieldStats();
  const fieldSizeDistribution = getFieldSizeDistribution();
  const assignmentStats = getAssignmentStats();

  return (
    <div className="space-y-6">
      {/* Step Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Step 5: Field Assignment & Resource Allocation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Assign games to specific fields with intelligent capacity analysis, surface preferences, and conflict detection.
          </p>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{games?.length || 0}</div>
              <div className="text-sm text-gray-500">Scheduled Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{assignmentStats.assigned}</div>
              <div className="text-sm text-gray-500">Fields Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{fieldStats.fieldsUsed}</div>
              <div className="text-sm text-gray-500">Fields Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{fieldStats.totalFields}</div>
              <div className="text-sm text-gray-500">Available Fields</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Assignment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Intelligent Field Assignment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Automatically assign games to optimal fields based on size requirements, capacity, and scheduling conflicts.
            </p>
            
            <div className="flex space-x-4">
              <Button 
                onClick={handleAssignFields}
                disabled={assignFieldsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {assignFieldsMutation.isPending ? 'Assigning...' : 'Auto-Assign Fields'}
              </Button>
              
              <Button 
                onClick={handleOptimizeFields}
                disabled={optimizeFieldsMutation.isPending || assignmentStats.assigned === 0}
                variant="outline"
                size="lg"
              >
                {optimizeFieldsMutation.isPending ? 'Optimizing...' : 'Optimize Assignments'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Capacity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Field Capacity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(fieldSizeDistribution).map(([size, count]) => (
                <div key={size} className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{count as number}</div>
                  <div className="text-xs text-blue-700">{size} Fields</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Field Utilization</span>
                <span className="text-sm text-gray-600">{Math.round(fieldStats.utilizationRate)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${fieldStats.utilizationRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{assignmentStats.assigned}</div>
              <div className="text-sm text-green-700">Assigned Games</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{assignmentStats.unassigned}</div>
              <div className="text-sm text-yellow-700">Unassigned Games</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{assignmentStats.conflicts}</div>
              <div className="text-sm text-red-700">Potential Conflicts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Overview */}
      {fields && fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field: Field) => {
                const assignedGames = games?.filter((g: Game) => g.fieldId === field.id).length || 0;
                
                return (
                  <Card key={field.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{field.name}</h4>
                          <Badge variant={assignedGames > 0 ? "default" : "outline"}>
                            {assignedGames} games
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {field.fieldSize} • {field.surface}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Capacity: {field.capacity} players
                        </div>
                        
                        {assignedGames > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-600 h-1 rounded-full"
                                style={{ width: `${Math.min((assignedGames / 10) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Assignments Preview */}
      {assignmentStats.assigned > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Field Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {games
                ?.filter((game: Game) => game.fieldId)
                .slice(0, 8)
                .map((game: Game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">
                        {game.homeTeam} vs {game.awayTeam}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(game.scheduledTime).toLocaleString('en-US', {
                          weekday: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="flex items-center space-x-2">
                        <Building className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium">{game.fieldName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {game.requiredFieldSize}
                      </Badge>
                    </div>
                  </div>
                ))}
              
              {assignmentStats.assigned > 8 && (
                <div className="text-center text-gray-500 text-sm py-2">
                  ... and {assignmentStats.assigned - 8} more assigned games
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Field Assignment Complete</h3>
              <p className="text-green-700 text-sm">
                {assignmentStats.assigned} games assigned to {fieldStats.fieldsUsed} fields with optimal resource allocation.
              </p>
            </div>
            <Button 
              onClick={handleComplete}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Schedule Publication
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}