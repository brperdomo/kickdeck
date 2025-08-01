import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Users, Check, X, ArrowRight, Edit3 } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  status: string;
  bracketId: number | null;
  selectedBracketName: string | null;
  ageGroup: string;
  gender: string;
}

interface FlightOption {
  id: number;
  name: string;
  description: string;
  level: string;
  ageGroupId: number;
}

interface FlightReviewData {
  ageGroup: string;
  birthYear?: number;
  gender: string;
  displayName?: string;
  teamsWithSelection: Team[];
  teamsWithoutSelection: Team[];
  availableFlights: FlightOption[];
  totalTeams: number;
}

interface FlightReviewDashboardProps {
  eventId: string;
}

export function FlightReviewDashboard({ eventId }: FlightReviewDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFlight, setSelectedFlight] = useState<{ [teamId: number]: number }>({});
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);

  // Fetch flight review data
  const { data: flightData, isLoading } = useQuery({
    queryKey: ['flight-review', eventId],
    queryFn: async (): Promise<FlightReviewData[]> => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-review`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch flight data');
      return response.json();
    }
  });

  // Bulk assign teams to flights
  const assignTeamsMutation = useMutation({
    mutationFn: async ({ assignments }: { assignments: { teamId: number; bracketId: number }[] }) => {
      const response = await fetch(`/api/admin/events/${eventId}/teams/bulk-flight-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignments })
      });
      if (!response.ok) throw new Error('Failed to assign teams to flights');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Teams Assigned",
        description: "Teams have been successfully assigned to flights"
      });
      queryClient.invalidateQueries({ queryKey: ['flight-review', eventId] });
      setSelectedFlight({});
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Lock flights for scheduling
  const lockFlightsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flights/lock`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to lock flights');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Flights Locked",
        description: "Flight assignments are now locked and ready for scheduling"
      });
      queryClient.invalidateQueries({ queryKey: ['flight-review', eventId] });
    }
  });

  const handleFlightSelection = (teamId: number, bracketId: number) => {
    setSelectedFlight(prev => ({
      ...prev,
      [teamId]: bracketId
    }));
  };

  const handleBulkAssign = () => {
    const assignments = Object.entries(selectedFlight).map(([teamId, bracketId]) => ({
      teamId: parseInt(teamId),
      bracketId
    }));
    
    if (assignments.length === 0) {
      toast({
        title: "No Assignments",
        description: "Please select flights for teams before assigning",
        variant: "destructive"
      });
      return;
    }

    assignTeamsMutation.mutate({ assignments });
  };

  const getFlightLevelBadge = (level: string) => {
    const colors = {
      elite: 'bg-amber-500 text-white border-amber-400',
      premier: 'bg-blue-500 text-white border-blue-400', 
      classic: 'bg-emerald-500 text-white border-emerald-400',
      intermediate: 'bg-slate-500 text-white border-slate-400',
      top_flight: 'bg-amber-500 text-white border-amber-400',
      middle_flight: 'bg-blue-500 text-white border-blue-400',
      bottom_flight: 'bg-emerald-500 text-white border-emerald-400'
    };
    
    const labels = {
      elite: 'Elite',
      premier: 'Premier', 
      classic: 'Classic',
      intermediate: 'Intermediate',
      top_flight: 'Top Flight',
      middle_flight: 'Middle Flight',
      bottom_flight: 'Bottom Flight'
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || colors.intermediate}>
        {labels[level as keyof typeof labels] || level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  // Helper function to format flight names properly
  const formatFlightName = (name: string) => {
    // Replace underscores with spaces and capitalize properly
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return <div className="flex justify-center p-8 text-slate-300">Loading flight data...</div>;
  }

  const totalTeamsWithoutSelection = flightData?.reduce((sum, group) => sum + group.teamsWithoutSelection.length, 0) || 0;
  const totalTeamsWithSelection = flightData?.reduce((sum, group) => sum + group.teamsWithSelection.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Overview */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Flight Review Dashboard</h2>
          <p className="text-slate-300">
            Review team flight selections and organize flights before scheduling
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-400">{totalTeamsWithSelection}</div>
              <div className="text-sm text-slate-300">Teams with Flight Selection</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-400">{totalTeamsWithoutSelection}</div>
              <div className="text-sm text-slate-300">Teams Need Assignment</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={handleBulkAssign}
          disabled={Object.keys(selectedFlight).length === 0 || assignTeamsMutation.isPending}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          {Object.keys(selectedFlight).length > 0 && editingTeamId ? 
            `Update Flight Assignment (${Object.keys(selectedFlight).length})` :
            `Assign Selected Teams (${Object.keys(selectedFlight).length})`
          }
        </Button>
        <Button 
          variant="outline"
          onClick={() => lockFlightsMutation.mutate()}
          disabled={totalTeamsWithoutSelection > 0 || lockFlightsMutation.isPending}
          className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500"
        >
          Lock Flights & Proceed to Scheduling
        </Button>
        {editingTeamId && (
          <Button 
            variant="secondary"
            onClick={() => {
              setEditingTeamId(null);
              setSelectedFlight({});
            }}
          >
            Cancel Reassignment
          </Button>
        )}
      </div>

      {/* Flight Review by Age Group */}
      <Tabs defaultValue="needs-assignment" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="needs-assignment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <AlertCircle className="h-4 w-4 mr-2" />
            Needs Assignment ({totalTeamsWithoutSelection})
          </TabsTrigger>
          <TabsTrigger value="assigned" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Edit3 className="h-4 w-4 mr-2" />
            Flight Reassignment ({totalTeamsWithSelection})
          </TabsTrigger>
          <TabsTrigger value="all-groups" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
            <Users className="h-4 w-4 mr-2" />
            All Age Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="needs-assignment" className="space-y-4">
          {flightData?.filter(group => group.teamsWithoutSelection.length > 0).map((group) => (
            <Card key={`${group.ageGroup}-${group.gender}`} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {group.displayName || `${group.ageGroup} ${group.gender}${group.birthYear ? ` - [${group.birthYear}]` : ''}`}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {group.teamsWithoutSelection.length} teams need flight assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Available Flights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <h4 className="col-span-full font-medium text-white">Available Flights:</h4>
                    {group.availableFlights.map((flight) => (
                      <div key={flight.id} className="flex items-center gap-2 p-2 border border-slate-600 rounded bg-slate-700">
                        {getFlightLevelBadge(flight.level)}
                        <span className="font-medium text-slate-200">{formatFlightName(flight.name)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Teams Needing Assignment */}
                  <div className="grid gap-2">
                    {group.teamsWithoutSelection.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 border border-slate-600 rounded bg-slate-700">
                        <div>
                          <span className="font-medium text-slate-200">{team.name}</span>
                          <Badge variant="outline" className="ml-2 border-slate-500 text-slate-300">{team.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedFlight[team.id]?.toString() || ""}
                            onValueChange={(value) => handleFlightSelection(team.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select flight" />
                            </SelectTrigger>
                            <SelectContent>
                              {group.availableFlights.map((flight) => (
                                <SelectItem key={flight.id} value={flight.id.toString()}>
                                  {formatFlightName(flight.name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          {flightData?.filter(group => group.teamsWithSelection.length > 0).map((group) => (
            <Card key={`${group.ageGroup}-${group.gender}`} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {group.displayName || `${group.ageGroup} ${group.gender}${group.birthYear ? ` - [${group.birthYear}]` : ''}`}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {group.teamsWithSelection.length} teams with flight assignments • Click edit icon to reassign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Available Flights for Reassignment */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <h4 className="col-span-full font-medium text-white">Available Flights for Reassignment:</h4>
                    {group.availableFlights.map((flight) => (
                      <div key={flight.id} className="flex items-center gap-2 p-2 border border-slate-600 rounded bg-slate-700">
                        {getFlightLevelBadge(flight.level)}
                        <span className="font-medium text-slate-200">{formatFlightName(flight.name)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Teams with Current Assignments */}
                  <div className="grid gap-2">
                    {group.teamsWithSelection.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 border border-slate-600 rounded bg-slate-700">
                        <div>
                          <span className="font-medium text-slate-200">{team.name}</span>
                          <Badge variant="outline" className="ml-2 border-slate-500 text-slate-300">{team.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingTeamId === team.id ? (
                            // Reassignment Mode
                            <div className="flex items-center gap-2">
                              <Select
                                value={selectedFlight[team.id]?.toString() || team.bracketId?.toString() || ""}
                                onValueChange={(value) => handleFlightSelection(team.id, parseInt(value))}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Select new flight" />
                                </SelectTrigger>
                                <SelectContent>
                                  {group.availableFlights.map((flight) => (
                                    <SelectItem key={flight.id} value={flight.id.toString()}>
                                      {formatFlightName(flight.name)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (selectedFlight[team.id]) {
                                    handleBulkAssign();
                                  }
                                  setEditingTeamId(null);
                                }}
                                disabled={!selectedFlight[team.id]}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTeamId(null);
                                  setSelectedFlight(prev => {
                                    const updated = { ...prev };
                                    delete updated[team.id];
                                    return updated;
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            // Display Mode
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-600 text-white">
                                {team.selectedBracketName ? formatFlightName(team.selectedBracketName) : 'Assigned'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingTeamId(team.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all-groups" className="space-y-4">
          {flightData?.map((group) => (
            <Card key={`${group.ageGroup}-${group.gender}`} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {group.displayName || `${group.ageGroup} ${group.gender}${group.birthYear ? ` - [${group.birthYear}]` : ''}`}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {group.totalTeams} total teams | {group.teamsWithSelection.length} assigned | {group.teamsWithoutSelection.length} unassigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">
                    Flight Options: {group.availableFlights.map(f => formatFlightName(f.name)).join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={group.teamsWithoutSelection.length === 0 ? "default" : "destructive"} 
                           className={group.teamsWithoutSelection.length === 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}>
                      {group.teamsWithoutSelection.length === 0 ? "Complete" : "Needs Work"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}