import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Users, Check, X, ArrowRight } from 'lucide-react';

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
  gender: string;
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
      elite: 'bg-yellow-500 text-white',
      premier: 'bg-blue-500 text-white', 
      classic: 'bg-green-500 text-white',
      intermediate: 'bg-gray-500 text-white'
    };
    return (
      <Badge className={colors[level as keyof typeof colors] || colors.intermediate}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading flight data...</div>;
  }

  const totalTeamsWithoutSelection = flightData?.reduce((sum, group) => sum + group.teamsWithoutSelection.length, 0) || 0;
  const totalTeamsWithSelection = flightData?.reduce((sum, group) => sum + group.teamsWithSelection.length, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Overview */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flight Review Dashboard</h2>
          <p className="text-muted-foreground">
            Review team flight selections and organize flights before scheduling
          </p>
        </div>
        <div className="flex gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{totalTeamsWithSelection}</div>
              <div className="text-sm text-muted-foreground">Teams with Flight Selection</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-600">{totalTeamsWithoutSelection}</div>
              <div className="text-sm text-muted-foreground">Teams Need Assignment</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={handleBulkAssign}
          disabled={Object.keys(selectedFlight).length === 0 || assignTeamsMutation.isPending}
        >
          Assign Selected Teams ({Object.keys(selectedFlight).length})
        </Button>
        <Button 
          variant="outline"
          onClick={() => lockFlightsMutation.mutate()}
          disabled={totalTeamsWithoutSelection > 0 || lockFlightsMutation.isPending}
        >
          Lock Flights & Proceed to Scheduling
        </Button>
      </div>

      {/* Flight Review by Age Group */}
      <Tabs defaultValue="needs-assignment" className="w-full">
        <TabsList>
          <TabsTrigger value="needs-assignment">
            <AlertCircle className="h-4 w-4 mr-2" />
            Needs Assignment ({totalTeamsWithoutSelection})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            <Check className="h-4 w-4 mr-2" />
            Already Assigned ({totalTeamsWithSelection})
          </TabsTrigger>
          <TabsTrigger value="all-groups">
            <Users className="h-4 w-4 mr-2" />
            All Age Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="needs-assignment" className="space-y-4">
          {flightData?.filter(group => group.teamsWithoutSelection.length > 0).map((group) => (
            <Card key={`${group.ageGroup}-${group.gender}`}>
              <CardHeader>
                <CardTitle>{group.ageGroup} {group.gender}</CardTitle>
                <CardDescription>
                  {group.teamsWithoutSelection.length} teams need flight assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Available Flights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <h4 className="col-span-full font-medium">Available Flights:</h4>
                    {group.availableFlights.map((flight) => (
                      <div key={flight.id} className="flex items-center gap-2 p-2 border rounded">
                        {getFlightLevelBadge(flight.level)}
                        <span className="font-medium">{flight.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Teams Needing Assignment */}
                  <div className="grid gap-2">
                    {group.teamsWithoutSelection.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{team.name}</span>
                          <Badge variant="outline" className="ml-2">{team.status}</Badge>
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
                                  {flight.name}
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
            <Card key={`${group.ageGroup}-${group.gender}`}>
              <CardHeader>
                <CardTitle>{group.ageGroup} {group.gender}</CardTitle>
                <CardDescription>
                  {group.teamsWithSelection.length} teams already assigned to flights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {group.teamsWithSelection.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 border rounded bg-green-50">
                      <div>
                        <span className="font-medium">{team.name}</span>
                        <Badge variant="outline" className="ml-2">{team.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600 text-white">
                          {team.selectedBracketName}
                        </Badge>
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all-groups" className="space-y-4">
          {flightData?.map((group) => (
            <Card key={`${group.ageGroup}-${group.gender}`}>
              <CardHeader>
                <CardTitle>{group.ageGroup} {group.gender}</CardTitle>
                <CardDescription>
                  {group.totalTeams} total teams | {group.teamsWithSelection.length} assigned | {group.teamsWithoutSelection.length} unassigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Flight Options: {group.availableFlights.map(f => f.name).join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={group.teamsWithoutSelection.length === 0 ? "default" : "destructive"}>
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