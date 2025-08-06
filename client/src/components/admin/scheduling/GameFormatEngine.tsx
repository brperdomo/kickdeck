import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Clock, Users, MapPin, Save, Copy, Trash2, CheckCircle, FileText, RotateCcw } from 'lucide-react';
import { FormatTemplateManager } from '@/components/admin/templates/FormatTemplateManager';

interface FlightFormatData {
  flightId: number; // Individual flight/bracket ID
  flightName: string;
  ageGroup: string;
  gender: string;
  teamCount: number; // Teams in this individual flight
  bracketCount: number; // Always 1 for individual flights
  bracketIds: number[]; // Array containing just this flight's ID
  ageGroupFieldSize?: string; // Field size from age group settings (7v7, 9v9, 11v11)
  currentFormat?: GameFormat;
  level: string; // Flight level like "top_flight", "middle_flight"
  displayName: string; // Full display like "U17 Boys - Nike Elite A"
}

interface MatchupTemplate {
  id: number;
  name: string;
  teamCount: number;
  description: string;
  bracketStructure: any; // JSON array defining team pairings
  gameCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GameFormat {
  id?: number;
  gameLength: number; // 30, 35, 40 minute halves
  fieldSize: string; // 7v7, 9v9, 11v11
  bufferTime: number; // minutes between games
  restPeriod: number; // minimum rest between team games
  maxGamesPerDay: number;
  templateName?: string;
  matchupTemplateId?: number;
  bracketStructure?: BracketStructure; // Tournament format based on team count
}

interface BracketStructure {
  type: 'round_robin_final' | 'cross_flight_play' | 'dual_flight_championship';
  teamCount: number;
  flightConfiguration?: {
    flightA: number; // teams in flight A
    flightB: number; // teams in flight B
  };
  gameDistribution: {
    saturday: number;
    sunday: number;
    total: number;
  };
  playoffStructure: {
    hasPlayoffs: boolean;
    finalsDay: 'saturday' | 'sunday';
    qualificationMethod: 'top_points' | 'cross_flight_top';
  };
  description: string;
}

interface FormatTemplate {
  id: number;
  name: string;
  description: string;
  gameLength: number;
  fieldSize: string;
  bufferTime: number;
  restPeriod: number;
  maxGamesPerDay: number;
  bracketStructure?: BracketStructure;
}

interface GameFormatEngineProps {
  eventId: string;
}

export function GameFormatEngine({ eventId }: GameFormatEngineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<{ [flightId: number]: number }>({});
  const [customFormats, setCustomFormats] = useState<{ [flightId: number]: GameFormat }>({});
  const [editingFlight, setEditingFlight] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("needs-config");

  // Generate bracket structure based on team count
  const generateBracketStructure = (teamCount: number): BracketStructure => {
    if (teamCount === 4) {
      return {
        type: 'round_robin_final',
        teamCount: 4,
        gameDistribution: { saturday: 2, sunday: 1, total: 7 },
        playoffStructure: { 
          hasPlayoffs: true, 
          finalsDay: 'sunday',
          qualificationMethod: 'top_points'
        },
        description: '4 teams round-robin (3 games each) + Final between top 2 teams. 2 games Saturday, 1 game + Final Sunday.'
      };
    } else if (teamCount === 6) {
      return {
        type: 'cross_flight_play',
        teamCount: 6,
        flightConfiguration: { flightA: 3, flightB: 3 },
        gameDistribution: { saturday: 2, sunday: 2, total: 10 },
        playoffStructure: { 
          hasPlayoffs: true, 
          finalsDay: 'sunday',
          qualificationMethod: 'cross_flight_top'
        },
        description: 'Flight A (3 teams) vs Flight B (3 teams). Each team plays all teams from opposite flight (3 games each) + Final between flight winners.'
      };
    } else if (teamCount === 8) {
      return {
        type: 'dual_flight_championship',
        teamCount: 8,
        flightConfiguration: { flightA: 4, flightB: 4 },
        gameDistribution: { saturday: 4, sunday: 2, total: 14 },
        playoffStructure: { 
          hasPlayoffs: true, 
          finalsDay: 'sunday',
          qualificationMethod: 'top_points'
        },
        description: 'Two 4-team round-robin flights. Each flight plays internally (3 games per team) + Championship between flight winners.'
      };
    } else {
      // Default to single elimination for other counts
      return {
        type: 'round_robin_final',
        teamCount,
        gameDistribution: { saturday: Math.floor(teamCount / 2), sunday: Math.ceil(teamCount / 3), total: teamCount + 1 },
        playoffStructure: { 
          hasPlayoffs: true, 
          finalsDay: 'sunday',
          qualificationMethod: 'top_points'
        },
        description: `${teamCount} team tournament with playoffs (format to be optimized)`
      };
    }
  };

  // Fetch flights ready for format configuration
  const { data: flightData, isLoading } = useQuery({
    queryKey: ['flight-formats', eventId],
    queryFn: async (): Promise<FlightFormatData[]> => {
      console.log(`[Frontend] Fetching flight formats for event ${eventId}`);
      const response = await fetch(`/api/admin/events/${eventId}/flight-formats`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch flight format data');
      const data = await response.json();
      console.log(`[Frontend] Received ${data.length} flights, configured: ${data.filter((f: any) => f.currentFormat).length}, unconfigured: ${data.filter((f: any) => !f.currentFormat).length}`);
      return data;
    },
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true
  });

  // Fetch format templates
  const { data: templates } = useQuery({
    queryKey: ['format-templates'],
    queryFn: async (): Promise<FormatTemplate[]> => {
      const response = await fetch('/api/admin/format-templates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch format templates');
      return response.json();
    }
  });

  // Fetch matchup templates
  const { data: matchupTemplates = [] } = useQuery({
    queryKey: ['matchup-templates'],
    queryFn: async (): Promise<MatchupTemplate[]> => {
      const response = await fetch('/api/admin/matchup-templates', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.warn('Failed to fetch matchup templates from API, using fallback data');
        // Fallback to mock data if API fails
        return [
          {
            id: 1,
            name: "4-Team Single Bracket",
            teamCount: 4,
            description: "4 teams in single bracket: 6 pool games + 1 final (1st vs 2nd in points)",
            bracketStructure: [["A1", "A2"], ["A3", "A4"], ["A1", "A3"], ["A2", "A4"], ["A1", "A4"], ["A2", "A3"], ["TBD", "TBD"]],
            gameCount: 7,
            isActive: true,
            createdAt: "2025-08-06",
            updatedAt: "2025-08-06"
          },
          {
            id: 2,
            name: "6-Team Crossover Brackets",
            teamCount: 6,
            description: "6 teams in 2 brackets of 3 (crossover): 9 pool games + 1 final (1st vs 2nd in points)",
            bracketStructure: [["A1", "B1"], ["A2", "B2"], ["A3", "B3"], ["A1", "B2"], ["A2", "B3"], ["A3", "B1"], ["A1", "B3"], ["A2", "B1"], ["A3", "B2"], ["TBD", "TBD"]],
            gameCount: 10,
            isActive: true,
            createdAt: "2025-08-06", 
            updatedAt: "2025-08-06"
          },
          {
            id: 3,
            name: "8-Team Dual Brackets", 
            teamCount: 8,
            description: "8 teams in 2 brackets of 4: 12 pool games + 1 final (1st from A vs 1st from B)",
            bracketStructure: [["A1", "A2"], ["B1", "B2"], ["A3", "A4"], ["B3", "B4"], ["A1", "A3"], ["B1", "B3"], ["A2", "A4"], ["B2", "B4"], ["A1", "A4"], ["B1", "B4"], ["A2", "A3"], ["B2", "B3"], ["TBD", "TBD"]],
            gameCount: 13,
            isActive: true,
            createdAt: "2025-08-06",
            updatedAt: "2025-08-06"
          }
        ];
      }
      
      const data = await response.json();
      // Map database fields to frontend interface
      return data.map((template: any) => ({
        id: template.id,
        name: template.name,
        teamCount: template.teamCount,
        description: template.description,
        bracketStructure: template.matchupPattern || template.bracketStructure,
        gameCount: template.totalGames,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }));
    }
  });

  // Auto-initialize custom formats for unconfigured flights and update active tab
  useEffect(() => {
    if (flightData) {
      const configured = flightData.filter(f => f.currentFormat);
      const unconfigured = flightData.filter(f => !f.currentFormat);
      
      // Auto-initialize custom formats for unconfigured flights
      const newCustomFormats: { [flightId: number]: GameFormat } = {};
      unconfigured.forEach(flight => {
        if (!customFormats[flight.flightId]) {
          const defaultFieldSize = flight.ageGroupFieldSize || '9v9';
          newCustomFormats[flight.flightId] = {
            gameLength: 35,
            fieldSize: defaultFieldSize,
            bufferTime: 10,
            restPeriod: 90,
            maxGamesPerDay: 3
          };
        }
      });
      
      if (Object.keys(newCustomFormats).length > 0) {
        setCustomFormats(prev => ({ ...prev, ...newCustomFormats }));
      }
      
      // If we have configured flights and no unconfigured, show configured tab
      if (configured.length > 0 && unconfigured.length === 0) {
        setActiveTab("configured");
      } else if (configured.length > 0 && activeTab === "needs-config" && unconfigured.length === 0) {
        setActiveTab("configured");
      }
    }
  }, [flightData, activeTab]);

  // Save format configuration
  const saveFormatMutation = useMutation({
    mutationFn: async ({ flightId, format, bracketIds }: { flightId: number; format: GameFormat; bracketIds?: number[] }) => {
      console.log('Saving format for flight:', flightId, 'applying to brackets:', bracketIds, 'with data:', format);
      const requestBody = {
        ...format,
        bracketIds: bracketIds || [flightId] // Include bracket IDs for flight-wide application
      };
      
      const response = await fetch(`/api/admin/events/${eventId}/flights/${flightId}/format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save format configuration' }));
        console.error('Save format error:', errorData);
        throw new Error(errorData.error || 'Failed to save format configuration');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('Format saved successfully:', data);
      toast({
        title: "Format Saved",
        description: "Game format configuration has been saved successfully"
      });
      // Force refetch of flight data to update UI
      console.log(`[Frontend] Invalidating and refetching flight-formats for event ${eventId}`);
      queryClient.invalidateQueries({ queryKey: ['flight-formats', eventId] });
      await queryClient.refetchQueries({ queryKey: ['flight-formats', eventId] });
      setEditingFlight(null);
      // Clear the custom format since it's now saved
      setCustomFormats(prev => {
        const updated = { ...prev };
        delete updated[data.flightId || Object.keys(prev)[0]];
        return updated;
      });
      // Switch to configured tab to show the newly saved format
      setActiveTab("configured");
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Lock all formats and proceed to bracket creation
  const lockFormatsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-formats/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Lock formats error:', errorData);
        const error = new Error(errorData.error || 'Failed to lock formats') as any;
        error.response = { json: () => Promise.resolve(errorData) };
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Formats Locked",
        description: "Game formats are locked and ready for bracket creation"
      });
      queryClient.invalidateQueries({ queryKey: ['flight-formats', eventId] });
    },
    onError: async (error: any) => {
      try {
        const errorResponse = await error.response?.json();
        const errorMsg = errorResponse?.error || error.message;
        
        if (errorResponse?.unconfiguredFlights && errorResponse.unconfiguredFlights.length > 0) {
          toast({
            title: "Partial Configuration Note",
            description: `Some flights still need configuration: ${errorResponse.unconfiguredFlights.join(', ')}. Bracket creation will proceed for configured flights only.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Lock Failed",
            description: errorMsg,
            variant: "destructive"
          });
        }
      } catch {
        toast({
          title: "Lock Failed",
          description: "Failed to lock formats. Please ensure all flights are configured.",
          variant: "destructive"
        });
      }
    }
  });

  // Reset format mutation
  const resetFormatMutation = useMutation({
    mutationFn: async (flightId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/flights/${flightId}/format`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to reset flight format');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-formats', eventId] });
      toast({
        title: "Format Reset",
        description: "Flight format has been reset to 'Needs Configuration' status."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset format",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleTemplateApply = (flightId: number, templateId: number) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      const flight = flightData?.find(f => f.flightId === flightId);
      const bracketStructure = flight ? generateBracketStructure(flight.teamCount) : undefined;
      
      const format: GameFormat = {
        gameLength: template.gameLength,
        fieldSize: template.fieldSize,
        bufferTime: template.bufferTime,
        restPeriod: template.restPeriod,
        maxGamesPerDay: template.maxGamesPerDay,
        templateName: template.name,
        bracketStructure
      };
      setCustomFormats(prev => ({ ...prev, [flightId]: format }));
      setSelectedTemplate(prev => ({ ...prev, [flightId]: templateId }));
    }
  };

  const applyRecommendedFormat = (flightId: number, bracketStructure: BracketStructure) => {
    // Apply default format with the recommended bracket structure
    const flight = flightData?.find(f => f.flightId === flightId);
    const defaultFieldSize = flight?.ageGroupFieldSize || '9v9'; // Use age group field size as default
    
    setCustomFormats(prev => ({
      ...prev,
      [flightId]: {
        gameLength: 35, // Default 35-minute halves
        fieldSize: defaultFieldSize, // Use age group's field size
        bufferTime: 10,
        restPeriod: 90,
        maxGamesPerDay: 3,
        templateName: `${bracketStructure.teamCount}-Team ${bracketStructure.type.replace(/_/g, ' ')}`,
        bracketStructure
      }
    }));
    
    toast({
      title: "Format Applied",
      description: `${bracketStructure.type.replace(/_/g, ' ')} format applied for ${bracketStructure.teamCount} teams`
    });
  };

  const handleCustomFormatChange = (flightId: number, field: keyof GameFormat, value: string | number) => {
    setCustomFormats(prev => ({
      ...prev,
      [flightId]: {
        ...prev[flightId],
        [field]: value,
        templateName: undefined // Clear template name when customizing
      }
    }));
    setSelectedTemplate(prev => ({ ...prev, [flightId]: 0 })); // Clear template selection
  };

  const handleSaveFormat = (flightId: number) => {
    const format = customFormats[flightId];
    const flight = flightData?.find(f => f.flightId === flightId);
    if (format && flight) {
      saveFormatMutation.mutate({ 
        flightId, 
        format, 
        bracketIds: flight.bracketIds // Apply to all brackets in this flight
      });
    }
  };

  const getFormatBadge = (format: GameFormat | undefined) => {
    if (!format) return <Badge variant="outline" className="text-slate-400">Not Configured</Badge>;
    
    return (
      <div className="flex gap-1 flex-wrap">
        <Badge variant="default" className="bg-blue-600 text-white">{format.fieldSize}</Badge>
        <Badge variant="secondary" className="bg-slate-600 text-slate-200">{format.gameLength}min games</Badge>
        {format.templateName && (
          <Badge variant="outline" className="border-slate-500 text-slate-300">{format.templateName}</Badge>
        )}
        {format.bracketStructure && (
          <Badge variant="outline" className="border-green-500 text-green-300">
            {format.bracketStructure.teamCount} teams
          </Badge>
        )}
      </div>
    );
  };

  const unconfiguredFlights = flightData?.filter(f => !f.currentFormat) || [];
  const configuredFlights = flightData?.filter(f => f.currentFormat) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Game Format Engine</h2>
          <p className="text-slate-300">
            Configure game formats for each flight before bracket creation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => lockFormatsMutation.mutate()}
            disabled={configuredFlights.length === 0 || lockFormatsMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Lock Formats & Proceed to Bracket Creation
          </Button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{configuredFlights.length}</p>
                <p className="text-sm text-slate-300">Configured Flights</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">{unconfiguredFlights.length}</p>
                <p className="text-sm text-slate-300">Needs Configuration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-600 bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{flightData?.reduce((sum, f) => sum + (Number(f.teamCount) || 0), 0) || 0}</p>
                <p className="text-sm text-slate-300">Total Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Format Configuration */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800 border-slate-600">
          <TabsTrigger value="needs-config" className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Needs Configuration ({unconfiguredFlights.length})
          </TabsTrigger>
          <TabsTrigger value="configured" className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Configured ({configuredFlights.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-slate-200 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
            <Copy className="h-4 w-4 mr-2" />
            Format Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="needs-config" className="space-y-4">
          {unconfiguredFlights.length === 0 ? (
            <Card className="border-slate-600 bg-slate-800">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">All Flights Configured</h3>
                <p className="text-slate-300">
                  All flights have game format configurations. Ready to proceed to tournament bracket creation.
                </p>
              </CardContent>
            </Card>
          ) : (
            unconfiguredFlights.map((flight) => (
              <Card key={flight.flightId} className="border-slate-600 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">{flight.displayName || `${flight.ageGroup} ${flight.gender} - ${flight.flightName}`}</CardTitle>
                  <CardDescription className="text-slate-300">
                    {flight.teamCount} teams across {flight.bracketCount} bracket{flight.bracketCount !== 1 ? 's' : ''} • Configure once, applies to all brackets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Custom Configuration - Always Visible */}
                    <div className="border border-slate-600 rounded-lg p-4 space-y-4 bg-slate-700/50">
                      <h4 className="font-semibold text-white">Game Format Configuration</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Game Length */}
                          <div className="space-y-2">
                            <Label className="text-slate-200">Game Length (minute halves)</Label>
                            <Select
                              value={customFormats[flight.flightId]?.gameLength?.toString() || ""}
                              onValueChange={(value) => handleCustomFormatChange(flight.flightId, 'gameLength', parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select length" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="35">35 minutes</SelectItem>
                                <SelectItem value="40">40 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Field Size */}
                          <div className="space-y-2">
                            <Label className="text-slate-200">Field Size</Label>
                            <Select
                              value={customFormats[flight.flightId]?.fieldSize || ""}
                              onValueChange={(value) => handleCustomFormatChange(flight.flightId, 'fieldSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7v7">7v7</SelectItem>
                                <SelectItem value="9v9">9v9</SelectItem>
                                <SelectItem value="11v11">11v11</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Buffer Time */}
                          <div className="space-y-2">
                            <Label className="text-slate-200">Buffer Time (minutes)</Label>
                            <Input
                              type="number"
                              min="5"
                              max="30"
                              value={customFormats[flight.flightId]?.bufferTime || ""}
                              onChange={(e) => handleCustomFormatChange(flight.flightId, 'bufferTime', parseInt(e.target.value))}
                              placeholder="10"
                            />
                          </div>

                          {/* Rest Period */}
                          <div className="space-y-2">
                            <Label className="text-slate-200">Rest Period (minutes)</Label>
                            <Input
                              type="number"
                              min="30"
                              max="300"
                              value={customFormats[flight.flightId]?.restPeriod || ""}
                              onChange={(e) => handleCustomFormatChange(flight.flightId, 'restPeriod', parseInt(e.target.value))}
                              placeholder="90"
                            />
                          </div>

                          {/* Max Games Per Day */}
                          <div className="space-y-2">
                            <Label className="text-slate-200">Max Games Per Day</Label>
                            <Input
                              type="number"
                              min="1"
                              max="8"
                              value={customFormats[flight.flightId]?.maxGamesPerDay || ""}
                              onChange={(e) => handleCustomFormatChange(flight.flightId, 'maxGamesPerDay', parseInt(e.target.value))}
                              placeholder="3"
                            />
                          </div>
                        </div>

                        {/* Matchup Template Selection */}
                        <div className="space-y-3 border-t border-slate-600 pt-4">
                          <Label className="text-slate-200">Matchup Template</Label>
                          <p className="text-sm text-slate-400">
                            Define how teams are paired up and what games are generated based on {flight.teamCount} teams
                          </p>
                          
                          <div className="space-y-3">
                            {/* Compatible Templates for this Team Count */}
                            {matchupTemplates
                              .filter(template => template.teamCount === flight.teamCount)
                              .map((template) => (
                                <div 
                                  key={template.id}
                                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                    customFormats[flight.flightId]?.matchupTemplateId === template.id 
                                      ? 'border-blue-500 bg-blue-900/20' 
                                      : 'border-slate-600 hover:border-slate-500'
                                  }`}
                                  onClick={() => handleCustomFormatChange(flight.flightId, 'matchupTemplateId', template.id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className="font-semibold text-white">{template.name}</h5>
                                      <p className="text-sm text-slate-300 mt-1">{template.description}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2">
                                      {template.gameCount} games
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            }
                            
                            {/* If no templates match team count */}
                            {matchupTemplates.filter(template => template.teamCount === flight.teamCount).length === 0 && (
                              <div className="border border-yellow-600/30 rounded-lg p-4 bg-yellow-900/20">
                                <p className="text-yellow-200 text-sm">
                                  No predefined matchup templates available for {flight.teamCount} teams. 
                                  The system will use standard round-robin or elimination formats during scheduling.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveFormat(flight.flightId)}
                            disabled={!customFormats[flight.flightId] || saveFormatMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Format
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingFlight(null);
                              setCustomFormats(prev => {
                                const updated = { ...prev };
                                delete updated[flight.flightId];
                                return updated;
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="configured" className="space-y-4">
          {configuredFlights.map((flight) => (
            <Card key={flight.flightId} className="border-slate-600 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{flight.displayName || `${flight.ageGroup} ${flight.gender} - ${flight.flightName}`}</CardTitle>
                <CardDescription className="text-slate-300">
                  {flight.teamCount} teams across {flight.bracketCount} bracket{flight.bracketCount !== 1 ? 's' : ''} • Format configured for all brackets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Format Configuration */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-200">Game Format</h4>
                      {getFormatBadge(flight.currentFormat)}
                    </div>
                    <div className="text-sm text-slate-400">
                      {flight.currentFormat?.restPeriod}min rest • {flight.currentFormat?.bufferTime}min buffer • Max {flight.currentFormat?.maxGamesPerDay} games/day
                    </div>
                  </div>

                  {/* Tournament Structure */}
                  {flight.currentFormat?.bracketStructure && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-200">Tournament Structure</h4>
                      <div className="border border-slate-600 rounded-lg p-3 bg-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-200 font-medium">
                            {flight.currentFormat.bracketStructure.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <Badge variant="outline" className="border-blue-400 text-blue-200">
                            {flight.currentFormat.bracketStructure.gameDistribution.total} games
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">
                          {flight.currentFormat.bracketStructure.description}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Saturday:</span>
                            <span className="text-white">{flight.currentFormat.bracketStructure.gameDistribution.saturday} games</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Sunday:</span>
                            <span className="text-white">{flight.currentFormat.bracketStructure.gameDistribution.sunday} games</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingFlight(flight.flightId);
                      setCustomFormats(prev => ({
                        ...prev,
                        [flight.flightId]: flight.currentFormat!
                      }));
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Format
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                    onClick={() => {
                      if (confirm('Are you sure you want to reset this flight to "Needs Configuration" status? This will remove the current format and require reconfiguration.')) {
                        resetFormatMutation.mutate(flight.flightId);
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Format
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates?.map((template) => (
              <Card key={template.id} className="border-slate-600 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">{template.name}</CardTitle>
                  <CardDescription className="text-slate-300">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-200">Field Size:</span>
                      <p className="text-slate-300">{template.fieldSize}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">Game Length:</span>
                      <p className="text-slate-300">{template.gameLength} minute halves</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">Rest Period:</span>
                      <p className="text-slate-300">{template.restPeriod} minutes</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">Max Games/Day:</span>
                      <p className="text-slate-300">{template.maxGamesPerDay}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <FormatTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}