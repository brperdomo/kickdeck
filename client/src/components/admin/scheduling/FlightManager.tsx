import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { 
  Users, Plus, Edit2, Trash2, ArrowUpDown, Target, 
  CheckCircle, Info, AlertTriangle 
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

  // Group teams by age group for analysis
  const ageGroupSummary: AgeGroupSummary[] = teamsData.reduce((acc: AgeGroupSummary[], team) => {
    const ageGroup = team.ageGroup || 'Unknown';
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
    const team = teamsData.find(t => t.id === teamId);
    if (!team) return;

    setFlights(prev => prev.map(flight => {
      if (flight.id === flightId) {
        return {
          ...flight,
          teams: [...flight.teams.filter(t => t.id !== teamId), team]
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
    return teamsData.filter(team => 
      team.status === 'approved' && !assignedTeamIds.includes(team.id)
    );
  };

  const validateFlights = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const unassignedTeams = getUnassignedTeams();
    
    if (unassignedTeams.length > 0) {
      errors.push(`${unassignedTeams.length} approved teams are not assigned to any flight`);
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
      errors
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
    <div className="space-y-6">
      {/* Age Group Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Age Group Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ageGroupSummary.map(group => (
              <div key={group.ageGroup} className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">{group.ageGroup}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Teams:</span>
                    <span className="font-medium">{group.totalTeams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <span className="font-medium text-green-600">{group.approvedTeams}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suggested Flights:</span>
                    <span className="font-medium text-blue-600">{group.suggestedFlights}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                  ageGroups={Array.from(new Set(teamsData.map(t => t.ageGroup)))}
                  onSubmit={createFlight}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
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
                  availableTeams={getUnassignedTeams()}
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

function FlightCard({ flight, availableTeams, onAssignTeam, onRemoveTeam }: any) {
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
            onClick={() => onEditFlight?.(flight)}
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

  if (unassignedTeams.length > 0) {
    validation.isValid = false;
    validation.errors.push(`${unassignedTeams.length} approved teams are not assigned to any flight`);
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