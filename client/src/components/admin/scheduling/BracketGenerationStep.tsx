import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Trophy, Users, Target, Zap, Info } from 'lucide-react';

interface BracketGenerationStepProps {
  eventId: string;
  onComplete: (data: any) => void;
}

interface Flight {
  id: number;
  name: string;
  ageGroupId: number;
  ageGroup: string;
  gender: string;
  teamCount: number;
  maxTeams: number;
}

interface BracketType {
  id: string;
  name: string;
  description: string;
  minTeams: number;
  maxTeams: number;
  gamesPerTeam: string;
}

const BRACKET_TYPES: BracketType[] = [
  {
    id: 'round_robin',
    name: 'Round Robin',
    description: 'Every team plays every other team once',
    minTeams: 3,
    maxTeams: 8,
    gamesPerTeam: 'n-1 games'
  },
  {
    id: 'single_elimination',
    name: 'Single Elimination',
    description: 'Tournament bracket with single elimination',
    minTeams: 4,
    maxTeams: 32,
    gamesPerTeam: 'log₂(n) avg'
  },
  {
    id: 'double_elimination',
    name: 'Double Elimination',
    description: 'Teams get second chance in losers bracket',
    minTeams: 4,
    maxTeams: 16,
    gamesPerTeam: '2×log₂(n) avg'
  },
  {
    id: 'pool_play',
    name: 'Pool Play + Playoffs',
    description: 'Group stage followed by knockout rounds',
    minTeams: 6,
    maxTeams: 24,
    gamesPerTeam: '4-6 games'
  }
];

export function BracketGenerationStep({ eventId, onComplete }: BracketGenerationStepProps) {
  const [selectedBracketTypes, setSelectedBracketTypes] = useState<{[key: number]: string}>({});
  const queryClient = useQueryClient();

  // Fetch flights from previous step
  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ['flights', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flights`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch flights');
      return response.json();
    }
  });

  // Fetch existing brackets
  const { data: brackets, isLoading: bracketsLoading } = useQuery({
    queryKey: ['brackets', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/brackets`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch brackets');
      return response.json();
    }
  });

  // Generate brackets mutation
  const generateBracketsMutation = useMutation({
    mutationFn: async (bracketData: any) => {
      const response = await fetch(`/api/admin/events/${eventId}/brackets/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bracketData)
      });
      if (!response.ok) throw new Error('Failed to generate brackets');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brackets', eventId] });
      toast({ 
        title: 'Brackets generated successfully',
        description: `Created ${data.bracketsGenerated} brackets with optimal competitive structure`
      });
    }
  });

  // Auto-generate all brackets
  const autoGenerateAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/brackets/auto-generate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to auto-generate brackets');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brackets', eventId] });
      toast({ 
        title: 'All brackets generated',
        description: `Generated ${data.bracketsCreated} brackets with intelligent format selection`
      });
    }
  });

  const getRecommendedBracketType = (teamCount: number): BracketType => {
    if (teamCount <= 4) return BRACKET_TYPES.find(b => b.id === 'round_robin')!;
    if (teamCount <= 8) return BRACKET_TYPES.find(b => b.id === 'round_robin')!;
    if (teamCount <= 16) return BRACKET_TYPES.find(b => b.id === 'single_elimination')!;
    return BRACKET_TYPES.find(b => b.id === 'pool_play')!;
  };

  const handleBracketTypeChange = (flightId: number, bracketType: string) => {
    setSelectedBracketTypes(prev => ({
      ...prev,
      [flightId]: bracketType
    }));
  };

  const handleGenerateBrackets = () => {
    const bracketConfigs = flights?.map((flight: Flight) => ({
      flightId: flight.id,
      bracketType: selectedBracketTypes[flight.id] || getRecommendedBracketType(flight.teamCount).id
    }));

    generateBracketsMutation.mutate({ brackets: bracketConfigs });
  };

  const handleAutoGenerateAll = () => {
    autoGenerateAllMutation.mutate();
  };

  const handleComplete = () => {
    if (!brackets || brackets.length === 0) {
      toast({ 
        title: 'No brackets generated',
        description: 'Please generate brackets before proceeding to the next step',
        variant: 'destructive'
      });
      return;
    }

    onComplete({
      brackets: brackets,
      totalBrackets: brackets.length,
      flightsCovered: flights?.length || 0
    });
  };

  if (flightsLoading || bracketsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading bracket generation interface...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!flights || flights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No flights found. Please complete Flight Creation (Step 3) before generating brackets.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Step 4: Bracket Generation & Seeding</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Generate tournament brackets with intelligent seeding algorithms and competitive balance optimization for each flight.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{flights?.length || 0}</div>
              <div className="text-sm text-gray-500">Flights Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{brackets?.length || 0}</div>
              <div className="text-sm text-gray-500">Brackets Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {flights?.reduce((sum: number, f: Flight) => sum + f.teamCount, 0) || 0}
              </div>
              <div className="text-sm text-gray-500">Total Teams</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Intelligent Bracket Generation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Automatically generate optimal bracket formats for all flights based on team counts and competitive balance.
            </p>
            
            <Button 
              onClick={handleAutoGenerateAll}
              disabled={autoGenerateAllMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
              size="lg"
            >
              {autoGenerateAllMutation.isPending ? 'Generating...' : 'Auto-Generate All Brackets'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Bracket Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manual Bracket Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flights?.map((flight: Flight) => {
              const recommendedType = getRecommendedBracketType(flight.teamCount);
              const selectedType = selectedBracketTypes[flight.id] || recommendedType.id;
              const selectedBracketType = BRACKET_TYPES.find(b => b.id === selectedType);
              
              return (
                <div key={flight.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{flight.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge variant="outline">{flight.teamCount} teams</Badge>
                        <span>•</span>
                        <span>{flight.ageGroup} {flight.gender}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Select
                        value={selectedType}
                        onValueChange={(value) => handleBracketTypeChange(flight.id, value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BRACKET_TYPES
                            .filter(bt => flight.teamCount >= bt.minTeams && flight.teamCount <= bt.maxTeams)
                            .map(bracketType => (
                              <SelectItem key={bracketType.id} value={bracketType.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{bracketType.name}</span>
                                  {bracketType.id === recommendedType.id && (
                                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedBracketType && (
                        <div className="text-xs text-gray-500 max-w-48">
                          {selectedBracketType.description} • {selectedBracketType.gamesPerTeam}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            <Button 
              onClick={handleGenerateBrackets}
              disabled={generateBracketsMutation.isPending}
              className="w-full"
              size="lg"
            >
              {generateBracketsMutation.isPending ? 'Generating...' : 'Generate Custom Brackets'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Brackets Overview */}
      {brackets && brackets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated Brackets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brackets.map((bracket: any) => (
                <Card key={bracket.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{bracket.name}</h4>
                      <div className="text-sm text-gray-600">
                        Format: {bracket.bracketType?.replace('_', ' ') || 'Standard'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bracket.teamCount} teams • {bracket.estimatedGames} games
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bracket Format Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bracket Format Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRACKET_TYPES.map(bracketType => (
              <div key={bracketType.id} className="border rounded-lg p-3 space-y-2">
                <div className="font-semibold">{bracketType.name}</div>
                <div className="text-sm text-gray-600">{bracketType.description}</div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{bracketType.minTeams}-{bracketType.maxTeams} teams</span>
                  <span>{bracketType.gamesPerTeam}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Completion */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Bracket Generation Complete</h3>
              <p className="text-green-700 text-sm">
                {brackets?.length || 0} brackets generated with optimal competitive structure.
              </p>
            </div>
            <Button 
              onClick={handleComplete}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Game Scheduling
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}