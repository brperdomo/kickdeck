import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, Plus, Edit2, Trash2, ArrowUpDown, Target, 
  CheckCircle, Info, AlertTriangle, ChevronDown 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlightManagerProps {
  eventId: string;
  teamsData: any[];
  workflowData: any;
  onComplete: (data: any) => void;
  onError: (error: string) => void;
}

interface Flight {
  id: string;
  name: string;
  ageGroup: string;
  level: 'top_flight' | 'middle_flight' | 'bottom_flight' | 'other';
  description?: string;
  teams: any[];
  minTeams: number;
  maxTeams: number;
}

interface AgeGroupSummary {
  ageGroup: string;
  totalTeams: number;
  approvedTeams: number;
  suggestedFlights: number;
}

export function FlightManager({ eventId, teamsData, workflowData, onComplete, onError }: FlightManagerProps) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [autoFlightSuggestions, setAutoFlightSuggestions] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch age groups to get names
  const { data: ageGroupsData } = useQuery({
    queryKey: ['age-groups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/age-groups`);
      if (!response.ok) throw new Error('Failed to fetch age groups');
      return response.json();
    },
    enabled: !!eventId
  });

  // Debug: Log teams data structure to understand age group extraction
  console.log('FlightManager teamsData:', teamsData?.slice(0, 2));
  console.log('FlightManager ageGroupsData:', ageGroupsData?.slice(0, 5));
  
  // Enhanced gender-aware age group extraction
  const genderAwareAgeGroups = useMemo(() => {
    if (!ageGroupsData) return [];
    
    return ageGroupsData.map(ag => ({
      id: ag.id,
      name: ag.ageGroup,
      gender: ag.ageGroup.toLowerCase().includes('girls') || ag.ageGroup.toLowerCase().includes('girl') ? 'Girls' :
              ag.ageGroup.toLowerCase().includes('boys') || ag.ageGroup.toLowerCase().includes('boy') ? 'Boys' : 'Mixed',
      ageOnly: ag.ageGroup.replace(/[-\s]*(girls?|boys?)/gi, '').trim()
    }));
  }, [ageGroupsData]);
  
  // Extract unique age groups from teams data and map to names
  const extractedAgeGroups = useMemo(() => {
    if (!teamsData || !Array.isArray(teamsData) || !ageGroupsData) {
      return [];
    }
    
    // Extract unique age group IDs from teams (teams data structure: [{team: {...}}, ...])
    const ageGroupIds = teamsData
      .map(teamObj => teamObj.team?.ageGroupId)
      .filter(Boolean);
    
    console.log('Extracted age group IDs:', ageGroupIds);
    
    const uniqueAgeGroupIds = Array.from(new Set(ageGroupIds));
    
    // Map IDs to age group names
    const ageGroupsWithNames = uniqueAgeGroupIds
      .map(id => {
        const ageGroup = ageGroupsData.find(ag => ag.id === id);
        return ageGroup ? { id, name: ageGroup.ageGroup } : null;
      })
      .filter(Boolean);
    
    console.log('Age groups with names:', ageGroupsWithNames);
    
    return ageGroupsWithNames.map(ag => ag.name);
  }, [teamsData, ageGroupsData]);
  
  console.log('Final extracted age groups:', extractedAgeGroups);
  const uniqueAgeGroups = Array.from(new Set(extractedAgeGroups));

  // Group teams by age group for analysis
  const ageGroupSummary: AgeGroupSummary[] = useMemo(() => {
    if (!teamsData || !ageGroupsData) return [];
    
    return teamsData.reduce((acc: AgeGroupSummary[], teamObj) => {
      const team = teamObj.team;
      if (!team) return acc;
      
      // Find age group name by ID
      const ageGroupData = ageGroupsData.find(ag => ag.id === team.ageGroupId);
      const ageGroup = ageGroupData?.ageGroup || 'Unknown';
      
      const existing = acc.find(item => item.ageGroup === ageGroup);
      
      if (existing) {
        existing.totalTeams++;
        if (team.status === 'approved') existing.approvedTeams++;
      } else {
        acc.push({
          ageGroup,
          totalTeams: 1,
          approvedTeams: team.status === 'approved' ? 1 : 0,
          suggestedFlights: 0
        });
      }
      return acc;
    }, []);
  }, [teamsData, ageGroupsData]);

  // Calculate suggested flights based on team count
  useEffect(() => {
    const updatedSummary = ageGroupSummary.map(group => ({
      ...group,
      suggestedFlights: calculateSuggestedFlights(group.approvedTeams)
    }));
    
    // Generate auto-flight suggestions
    generateAutoFlightSuggestions(updatedSummary);
  }, [teamsData]);

  const calculateSuggestedFlights = (teamCount: number): number => {
    if (teamCount <= 8) return 1;
    if (teamCount <= 16) return 2;
    if (teamCount <= 24) return 3;
    return Math.ceil(teamCount / 8);
  };

  const generateAutoFlightSuggestions = (summary: AgeGroupSummary[]) => {
    const suggestions = summary.map(group => {
      const flightCount = group.suggestedFlights;
      const flightSuggestions = [];
      
      for (let i = 0; i < flightCount; i++) {
        const flightLevel = i === 0 ? 'top_flight' : 
                           i === flightCount - 1 ? 'bottom_flight' : 'middle_flight';
        
        flightSuggestions.push({
          name: `${group.ageGroup} Flight ${i + 1}`,
          ageGroup: group.ageGroup,
          level: flightLevel,
          description: `${getFlightLevelDescription(flightLevel)} for ${group.ageGroup}`,
          estimatedTeams: Math.ceil(group.approvedTeams / flightCount)
        });
      }
      
      return {
        ageGroup: group.ageGroup,
        totalTeams: group.approvedTeams,
        flights: flightSuggestions
      };
    });
    
    setAutoFlightSuggestions(suggestions);
  };

  const getFlightLevelDescription = (level: string): string => {
    switch (level) {
      case 'top_flight': return 'Highest competitive level';
      case 'middle_flight': return 'Intermediate competitive level';
      case 'bottom_flight': return 'Developmental level';
      default: return 'Custom level';
    }
  };

  const getFlightLevelBadge = (level: string) => {
    const colors = {
      top_flight: 'bg-gold-500 text-white',
      middle_flight: 'bg-blue-500 text-white',
      bottom_flight: 'bg-green-500 text-white',
      other: 'bg-gray-500 text-white'
    };
    
    const labels = {
      top_flight: 'Top Flight',
      middle_flight: 'Middle Flight',
      bottom_flight: 'Bottom Flight',
      other: 'Other'
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  const createFlight = (flightData: Partial<Flight>) => {
    const newFlight: Flight = {
      id: `flight_${Date.now()}`,
      name: flightData.name || '',
      ageGroup: flightData.ageGroup || '',
      level: flightData.level || 'middle_flight',
      description: flightData.description || '',
      teams: [],
      minTeams: 4,
      maxTeams: 8,
      ...flightData
    };
    
    setFlights(prev => [...prev, newFlight]);
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Flight Created",
      description: `${newFlight.name} has been created successfully.`
    });
  };

  const updateFlight = (flightData: Partial<Flight>) => {
    if (!editingFlight) return;

    setFlights(prev => prev.map(flight => 
      flight.id === editingFlight.id 
        ? {
            ...flight,
            name: flightData.name || flight.name,
            ageGroup: flightData.ageGroup || flight.ageGroup,
            level: flightData.level || flight.level,
            description: flightData.description || flight.description,
            minTeams: flightData.minTeams || flight.minTeams,
            maxTeams: flightData.maxTeams || flight.maxTeams
          }
        : flight
    ));
    
    setIsEditDialogOpen(false);
    setEditingFlight(null);
    
    toast({
      title: "Flight Updated",
      description: `${flightData.name} has been updated successfully.`
    });
  };

  const applyAutoSuggestions = () => {
    const newFlights: Flight[] = [];
    
    autoFlightSuggestions.forEach(ageGroupSuggestion => {
      ageGroupSuggestion.flights.forEach((flight: any, index: number) => {
        newFlights.push({
          id: `flight_${ageGroupSuggestion.ageGroup}_${index + 1}`,
          name: flight.name,
          ageGroup: flight.ageGroup,
          level: flight.level,
          description: flight.description,
          teams: [],
          minTeams: 4,
          maxTeams: 8
        });
      });
    });
    
    setFlights(newFlights);
    
    toast({
      title: "Auto-Flights Applied",
      description: `Created ${newFlights.length} flights based on team analysis.`
    });
  };

  const assignTeamToFlight = (teamId: number, flightId: string) => {
    const teamObj = teamsData.find(t => t.team?.id === teamId);
    if (!teamObj) return;

    setFlights(prev => prev.map(flight => {
      if (flight.id === flightId) {
        return {
          ...flight,
          teams: [...flight.teams.filter(t => t.id !== teamId), teamObj.team]
        };
      } else {
        return {
          ...flight,
          teams: flight.teams.filter(t => t.id !== teamId)
        };
      }
    }));
  };

  const removeTeamFromFlight = (teamId: number, flightId: string) => {
    setFlights(prev => prev.map(flight => 
      flight.id === flightId 
        ? { ...flight, teams: flight.teams.filter(t => t.id !== teamId) }
        : flight
    ));
  };

  const getUnassignedTeams = () => {
    const assignedTeamIds = flights.flatMap(flight => flight.teams.map(t => t.id));
    return teamsData
      .filter(teamObj => 
        teamObj.team?.status === 'approved' && !assignedTeamIds.includes(teamObj.team.id)
      )
      .map(teamObj => teamObj.team);
  };

  // Get unassigned teams for a specific age group
  const getUnassignedTeamsForAgeGroup = (targetAgeGroup: string) => {
    const assignedTeamIds = flights.flatMap(flight => flight.teams.map(t => t.id));
    return teamsData
      .filter(teamObj => {
        if (!teamObj.team || teamObj.team.status !== 'approved') return false;
        if (assignedTeamIds.includes(teamObj.team.id)) return false;
        
        // Find the age group name for this team
        const ageGroupData = ageGroupsData?.find(ag => ag.id === teamObj.team.ageGroupId);
        const teamAgeGroup = ageGroupData?.ageGroup || '';
        
        return teamAgeGroup === targetAgeGroup;
      })
      .map(teamObj => teamObj.team);
  };

  const validateFlights = (): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const unassignedTeams = getUnassignedTeams();
    
    // Don't require ALL teams to be assigned - this is optional
    if (unassignedTeams.length > 0) {
      warnings.push(`${unassignedTeams.length} approved teams are not assigned to any flight`);
    }
    
    flights.forEach(flight => {
      if (flight.teams.length < flight.minTeams) {
        errors.push(`${flight.name} has only ${flight.teams.length} teams (minimum: ${flight.minTeams})`);
      }
      if (flight.teams.length > flight.maxTeams) {
        errors.push(`${flight.name} has ${flight.teams.length} teams (maximum: ${flight.maxTeams})`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleComplete = () => {
    const validation = validateFlights();
    
    if (!validation.isValid) {
      onError(`Flight validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    const flightData = {
      flights: flights.map(flight => ({
        ...flight,
        teamIds: flight.teams.map(t => t.id)
      })),
      summary: {
        totalFlights: flights.length,
        totalTeamsAssigned: flights.reduce((sum, flight) => sum + flight.teams.length, 0),
        ageGroups: Array.from(new Set(flights.map(f => f.ageGroup)))
      }
    };
    
    onComplete(flightData);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Age Group Analysis with Gender Split */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/30 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
        <CardHeader className="bg-gradient-to-r from-slate-50/50 to-purple-50/50">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
              <Info className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold">
              Age Group Analysis
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(() => {
            // Separate age groups by gender
            const boysGroups = ageGroupSummary.filter(group => {
              const genderInfo = genderAwareAgeGroups.find((g) => g.name === group.ageGroup);
              return genderInfo?.gender === 'Boys';
            });
            
            const girlsGroups = ageGroupSummary.filter(group => {
              const genderInfo = genderAwareAgeGroups.find((g) => g.name === group.ageGroup);
              return genderInfo?.gender === 'Girls';
            });
            
            const mixedGroups = ageGroupSummary.filter(group => {
              const genderInfo = genderAwareAgeGroups.find((g) => g.name === group.ageGroup);
              return genderInfo?.gender !== 'Boys' && genderInfo?.gender !== 'Girls';
            });

            return (
              <>
                {/* Boys Section */}
                {boysGroups.length > 0 && (
                  <Collapsible defaultOpen={true}>
                    <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 border border-blue-200 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <span className="font-semibold text-blue-800">Boys Age Groups</span>
                        <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                          {boysGroups.length} groups
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-blue-600 ml-auto" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {boysGroups.map((group) => (
                          <div key={group.ageGroup} className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-lg shadow-blue-100/50 hover:shadow-blue-200/70 transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-blue-900">{group.ageGroup}</h3>
                              <Badge className="text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 shadow-sm">
                                Boys
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700">Total Teams:</span>
                                <span className="font-bold text-blue-900">{group.totalTeams}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700">Approved:</span>
                                <span className="font-bold text-green-600">{group.approvedTeams}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-blue-700">Suggested Flights:</span>
                                <span className="font-bold text-blue-600">{group.suggestedFlights}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Girls Section */}
                {girlsGroups.length > 0 && (
                  <Collapsible defaultOpen={true}>
                    <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 border border-purple-200 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                        <span className="font-semibold text-purple-800">Girls Age Groups</span>
                        <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                          {girlsGroups.length} groups
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-purple-600 ml-auto" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {girlsGroups.map((group) => (
                          <div key={group.ageGroup} className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg shadow-purple-100/50 hover:shadow-purple-200/70 transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-purple-900">{group.ageGroup}</h3>
                              <Badge className="text-xs font-semibold text-purple-700 bg-gradient-to-r from-purple-100 to-purple-200 border-purple-300 shadow-sm">
                                Girls
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-purple-700">Total Teams:</span>
                                <span className="font-bold text-purple-900">{group.totalTeams}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-purple-700">Approved:</span>
                                <span className="font-bold text-green-600">{group.approvedTeams}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-purple-700">Suggested Flights:</span>
                                <span className="font-bold text-purple-600">{group.suggestedFlights}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Mixed/Other Groups Section */}
                {mixedGroups.length > 0 && (
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 border border-slate-200 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                        <span className="font-semibold text-slate-800">Mixed/Other Groups</span>
                        <Badge variant="secondary" className="bg-slate-200 text-slate-800">
                          {mixedGroups.length} groups
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-600 ml-auto" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mixedGroups.map((group) => (
                          <div key={group.ageGroup} className="p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 shadow-lg shadow-slate-100/50 hover:shadow-slate-200/70 transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-slate-900">{group.ageGroup}</h3>
                              <Badge className="text-xs font-semibold text-slate-700 bg-gradient-to-r from-slate-100 to-slate-200 border-slate-300 shadow-sm">
                                Mixed
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-700">Total Teams:</span>
                                <span className="font-bold text-slate-900">{group.totalTeams}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-700">Approved:</span>
                                <span className="font-bold text-green-600">{group.approvedTeams}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-700">Suggested Flights:</span>
                                <span className="font-bold text-slate-600">{group.suggestedFlights}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Auto-Suggestions */}
      {autoFlightSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Flight Suggestions
              </CardTitle>
              <Button onClick={applyAutoSuggestions} variant="outline">
                Apply All Suggestions
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {autoFlightSuggestions.map(suggestion => (
                <div key={suggestion.ageGroup} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">
                    {suggestion.ageGroup} ({suggestion.totalTeams} teams)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {suggestion.flights.map((flight: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{flight.name}</div>
                        <div className="text-gray-600">{flight.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ~{flight.estimatedTeams} teams
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Flight Management
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flight
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Flight</DialogTitle>
                </DialogHeader>
                <CreateFlightForm
                  ageGroups={uniqueAgeGroups}
                  onSubmit={createFlight}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            
            {/* Edit Flight Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Flight</DialogTitle>
                </DialogHeader>
                {editingFlight && (
                  <EditFlightForm
                    flight={editingFlight}
                    ageGroups={uniqueAgeGroups}
                    onSubmit={updateFlight}
                    onCancel={() => {
                      setIsEditDialogOpen(false);
                      setEditingFlight(null);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {flights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No flights created yet. Use AI suggestions or create manually.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map(flight => (
                <FlightCard 
                  key={flight.id}
                  flight={flight}
                  availableTeams={getUnassignedTeamsForAgeGroup(flight.ageGroup)}
                  onAssignTeam={assignTeamToFlight}
                  onRemoveTeam={removeTeamFromFlight}
                  onEditFlight={(flight) => {
                    setEditingFlight(flight);
                    setIsEditDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation & Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Flight Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <FlightValidation 
            flights={flights}
            unassignedTeams={getUnassignedTeams()}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Supporting components
function CreateFlightForm({ ageGroups, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: '',
    ageGroup: '',
    level: 'middle_flight',
    description: '',
    minTeams: 4,
    maxTeams: 8
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Flight Name</Label>
        <Input 
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., 2014 Boys Flight 1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="ageGroup">Age Group</Label>
        <Select 
          value={formData.ageGroup} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, ageGroup: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            {ageGroups.map((group: string) => (
              <SelectItem key={group} value={group}>{group}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="level">Flight Level</Label>
        <Select 
          value={formData.level} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, level: value as any }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top_flight">Top Flight</SelectItem>
            <SelectItem value="middle_flight">Middle Flight</SelectItem>
            <SelectItem value="bottom_flight">Bottom Flight</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea 
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Additional details about this flight..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minTeams">Minimum Teams</Label>
          <Input 
            id="minTeams"
            type="number"
            value={formData.minTeams}
            onChange={(e) => setFormData(prev => ({ ...prev, minTeams: parseInt(e.target.value) }))}
            min="2"
            max="12"
          />
        </div>
        <div>
          <Label htmlFor="maxTeams">Maximum Teams</Label>
          <Input 
            id="maxTeams"
            type="number"
            value={formData.maxTeams}
            onChange={(e) => setFormData(prev => ({ ...prev, maxTeams: parseInt(e.target.value) }))}
            min="4"
            max="16"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit">Create Flight</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function FlightCard({ flight, availableTeams, onAssignTeam, onRemoveTeam, onEditFlight }: any) {
  const getFlightLevelBadge = (level: string) => {
    const colors = {
      top_flight: 'bg-amber-500 text-white',
      middle_flight: 'bg-blue-500 text-white',
      bottom_flight: 'bg-green-500 text-white',
      other: 'bg-gray-500 text-white'
    };
    
    const labels = {
      top_flight: 'Top Flight',
      middle_flight: 'Middle Flight',
      bottom_flight: 'Bottom Flight',
      other: 'Other'
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-lg">{flight.name}</h3>
          <p className="text-sm text-gray-600">{flight.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {getFlightLevelBadge(flight.level)}
          <Badge variant="outline">
            {flight.teams.length}/{flight.maxTeams} teams
          </Badge>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onEditFlight && onEditFlight(flight)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Assigned Teams */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Assigned Teams ({flight.teams.length})</h4>
        {flight.teams.length === 0 ? (
          <p className="text-sm text-gray-500">No teams assigned yet</p>
        ) : (
          <div className="space-y-2">
            {flight.teams.map((team: any) => (
              <div key={team.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{team.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({team.clubName})</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onRemoveTeam(team.id, flight.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Assignment */}
      {availableTeams.length > 0 && (
        <div>
          <Label htmlFor={`assign-${flight.id}`}>Assign Team</Label>
          <Select onValueChange={(value) => onAssignTeam(parseInt(value), flight.id)}>
            <SelectTrigger>
              <SelectValue placeholder="Select team to assign" />
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map((team: any) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name} ({team.clubName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function FlightValidation({ flights, unassignedTeams, onComplete }: any) {
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  // Move unassigned teams to warnings instead of blocking errors
  if (unassignedTeams.length > 0) {
    validation.warnings.push(`${unassignedTeams.length} approved teams are not assigned to any flight`);
  }

  flights.forEach((flight: Flight) => {
    if (flight.teams.length < flight.minTeams) {
      validation.isValid = false;
      validation.errors.push(`${flight.name} has only ${flight.teams.length} teams (minimum: ${flight.minTeams})`);
    }
    if (flight.teams.length > flight.maxTeams) {
      validation.warnings.push(`${flight.name} has ${flight.teams.length} teams (maximum: ${flight.maxTeams})`);
    }
  });

  return (
    <div className="space-y-4">
      {validation.errors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Errors found:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Warnings:</strong>
            <ul className="mt-2 ml-4 list-disc">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All flights are properly configured and ready for bracket creation.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {flights.length} flights created • {flights.reduce((sum: number, f: Flight) => sum + f.teams.length, 0)} teams assigned
        </div>
        <Button 
          onClick={onComplete}
          disabled={!validation.isValid}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Flight Setup
        </Button>
      </div>
    </div>
  );
}

function EditFlightForm({ flight, ageGroups, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: flight.name,
    ageGroup: flight.ageGroup,
    level: flight.level,
    description: flight.description || '',
    minTeams: flight.minTeams,
    maxTeams: flight.maxTeams
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="editName">Flight Name</Label>
        <Input 
          id="editName"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., 2014 Boys Flight 1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="editAgeGroup">Age Group</Label>
        <Select value={formData.ageGroup} onValueChange={(value) => setFormData(prev => ({ ...prev, ageGroup: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            {ageGroups.map((ag: string) => (
              <SelectItem key={ag} value={ag}>{ag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="editLevel">Flight Level</Label>
        <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top_flight">Top Flight</SelectItem>
            <SelectItem value="middle_flight">Middle Flight</SelectItem>
            <SelectItem value="bottom_flight">Bottom Flight</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="editDescription">Description (Optional)</Label>
        <Textarea 
          id="editDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Additional details about this flight"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="editMinTeams">Minimum Teams</Label>
          <Input 
            id="editMinTeams"
            type="number"
            value={formData.minTeams}
            onChange={(e) => setFormData(prev => ({ ...prev, minTeams: parseInt(e.target.value) }))}
            min="2"
            max="12"
          />
        </div>
        <div>
          <Label htmlFor="editMaxTeams">Maximum Teams</Label>
          <Input 
            id="editMaxTeams"
            type="number"
            value={formData.maxTeams}
            onChange={(e) => setFormData(prev => ({ ...prev, maxTeams: parseInt(e.target.value) }))}
            min="4"
            max="16"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit">Update Flight</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}