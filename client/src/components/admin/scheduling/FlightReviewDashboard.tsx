import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { Download, FileDown, RefreshCw, Users } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  status: string;
  selectedBracketName: string | null;
  bracketId: number | null;
}

interface Flight {
  id: number;
  name: string;
  level: string;
}

interface FlightGroup {
  ageGroup: string;
  gender: string;
  birthYear?: string;
  displayName?: string;
  totalTeams: number;
  teamsWithSelection: Team[];
  teamsWithoutSelection: Team[];
  availableFlights: Flight[];
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
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-review`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch flight data');
      return await response.json() as FlightGroup[];
    }
  });

  // Bulk assign teams mutation
  const assignTeamsMutation = useMutation({
    mutationFn: async (assignments: { teamId: number; flightId: number }[]) => {
      const response = await fetch(`/api/admin/events/${eventId}/teams/bulk-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignments })
      });
      if (!response.ok) throw new Error('Failed to assign teams');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Flight Assignments Updated",
        description: "Teams have been successfully assigned to flights"
      });
      setSelectedFlight({});
      setEditingTeamId(null);
      queryClient.invalidateQueries({ queryKey: ['flight-review', eventId] });
    }
  });

  // Handle bulk assignment
  const handleBulkAssign = () => {
    const assignments = Object.entries(selectedFlight).map(([teamId, flightId]) => ({
      teamId: parseInt(teamId),
      flightId
    }));
    assignTeamsMutation.mutate(assignments);
  };

  // Handle individual team flight selection
  const handleTeamFlightChange = (teamId: number, flightId: string) => {
    setSelectedFlight(prev => ({
      ...prev,
      [teamId]: parseInt(flightId)
    }));
  };

  // Start editing a team
  const handleEditTeam = (teamId: number, currentFlightId: number | null) => {
    setEditingTeamId(teamId);
    if (currentFlightId) {
      setSelectedFlight({ [teamId]: currentFlightId });
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setSelectedFlight({});
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!flightData) return;

    const csvData = [];
    csvData.push(['Age Group', 'Gender', 'Team Name', 'Flight Assignment', 'Status']);

    flightData.forEach(group => {
      // Teams with flight assignments
      group.teamsWithSelection.forEach(team => {
        csvData.push([
          group.ageGroup,
          group.gender,
          team.name,
          team.selectedBracketName || 'Unknown',
          'Assigned'
        ]);
      });

      // Teams without flight assignments
      group.teamsWithoutSelection.forEach(team => {
        csvData.push([
          group.ageGroup,
          group.gender,
          team.name,
          'Unassigned',
          'Needs Assignment'
        ]);
      });
    });

    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `flight-assignments-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: "Flight assignments exported to CSV file",
    });
  };

  // Export to PDF with improved structure and formatting
  const exportToPDF = async () => {
    if (!flightData) return;

    // Fetch event details for proper tournament identification
    let eventDetails = null;
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        eventDetails = await response.json();
      }
    } catch (error) {
      console.log('Could not fetch event details for PDF');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Tournament Header with proper identification
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const tournamentTitle = eventDetails?.name || 'Tournament Flight Assignments';
    doc.text(tournamentTitle, margin, y);
    y += 15;

    // Event details
    if (eventDetails) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      if (eventDetails.start_date) {
        const startDate = new Date(eventDetails.start_date).toLocaleDateString();
        const endDate = eventDetails.end_date ? new Date(eventDetails.end_date).toLocaleDateString() : null;
        const dateRange = endDate && startDate !== endDate ? `${startDate} - ${endDate}` : startDate;
        doc.text(`Dates: ${dateRange}`, margin, y);
        y += 8;
      }
      
      // Extract venue from details if available
      if (eventDetails.details && eventDetails.details.includes('Galway Downs')) {
        doc.text(`Venue: Galway Downs Soccer Complex`, margin, y);
        y += 8;
      }
      
      y += 5;
    }

    // Generation timestamp
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, y);
    y += 20;

    // Summary Statistics with better formatting
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tournament Summary', margin, y);
    y += 12;
    
    const totalAssigned = flightData.reduce((sum, group) => sum + group.teamsWithSelection.length, 0);
    const totalUnassigned = flightData.reduce((sum, group) => sum + group.teamsWithoutSelection.length, 0);
    const totalTeams = totalAssigned + totalUnassigned;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Teams Registered: ${totalTeams}`, margin + 5, y);
    y += 8;
    doc.text(`Teams Assigned to Flights: ${totalAssigned}`, margin + 5, y);
    y += 8;
    doc.text(`Teams Pending Assignment: ${totalUnassigned}`, margin + 5, y);
    y += 25;

    // Age Group > Flights > Teams structure
    flightData.forEach((group) => {
      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 80) {
        doc.addPage();
        y = margin;
      }

      // Age Group Header with better formatting
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const ageGroupTitle = `${group.ageGroup} ${group.gender}`;
      doc.text(ageGroupTitle, margin, y);
      y += 15;

      // Group teams by flight for proper structure
      const teamsByFlight = new Map<string, string[]>();
      
      // Add teams with flight assignments
      group.teamsWithSelection.forEach(team => {
        const flightName = team.selectedBracketName || 'Unknown Flight';
        if (!teamsByFlight.has(flightName)) {
          teamsByFlight.set(flightName, []);
        }
        teamsByFlight.get(flightName)!.push(team.name);
      });

      // Add unassigned teams
      if (group.teamsWithoutSelection.length > 0) {
        teamsByFlight.set('! Unassigned Teams', group.teamsWithoutSelection.map(t => t.name));
      }

      // Display flights and their teams
      if (teamsByFlight.size > 0) {
        Array.from(teamsByFlight.entries()).forEach(([flightName, teams]) => {
          // Flight name
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          const isUnassigned = flightName.includes('Unassigned');
          if (isUnassigned) {
            doc.setTextColor(200, 50, 50); // Red color for unassigned
          } else {
            doc.setTextColor(0, 0, 0); // Black for assigned
          }
          doc.text(`• ${flightName} (${teams.length} teams)`, margin + 10, y);
          y += 10;

          // Teams in this flight
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0); // Reset to black
          
          teams.forEach((teamName, index) => {
            // Use simple bullet points instead of tree characters for better PDF compatibility
            const prefix = '  - ';
            
            // Wrap long team names
            if (teamName.length > 60) {
              const wrapped = teamName.substring(0, 57) + '...';
              doc.text(`${prefix}${wrapped}`, margin + 15, y);
            } else {
              doc.text(`${prefix}${teamName}`, margin + 15, y);
            }
            y += 7;
          });
          
          y += 5; // Space between flights
        });
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120); // Gray text
        doc.text('No teams registered for this age group', margin + 10, y);
        y += 10;
      }
      
      y += 15; // Space between age groups
    });

    // Save the PDF
    doc.save(`flight-assignments-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Export Successful",
      description: "Flight assignments exported to PDF file",
    });
  };

  // Helper function to get flight level from name
  const getFlightLevel = (flightName: string): string => {
    if (flightName.toLowerCase().includes('elite')) return 'Elite';
    if (flightName.toLowerCase().includes('premier')) return 'Premier';  
    if (flightName.toLowerCase().includes('classic')) return 'Classic';
    return 'Standard';
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
      <div className="flex gap-4 flex-wrap">
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
        
        {editingTeamId && (
          <Button 
            onClick={handleCancelEdit}
            variant="outline"
            className="border-slate-600 text-slate-200 hover:bg-slate-700"
          >
            Cancel Edit
          </Button>
        )}
        
        <Button 
          onClick={exportToCSV}
          variant="outline"
          className="border-slate-600 text-slate-200 hover:bg-slate-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        
        <Button 
          onClick={exportToPDF}
          variant="outline"
          className="border-slate-600 text-slate-200 hover:bg-slate-700"
        >
          <FileDown className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['flight-review', eventId] })}
          variant="outline"
          className="border-slate-600 text-slate-200 hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Flight Review Content */}
      <Tabs defaultValue="need-assignment" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
          <TabsTrigger value="need-assignment" className="data-[state=active]:bg-slate-700">
            Teams Needing Assignment ({totalTeamsWithoutSelection})
          </TabsTrigger>
          <TabsTrigger value="assigned" className="data-[state=active]:bg-slate-700">
            Assigned Teams ({totalTeamsWithSelection})
          </TabsTrigger>
          <TabsTrigger value="all-groups" className="data-[state=active]:bg-slate-700">
            All Age Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="need-assignment" className="space-y-4">
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
                <div className="space-y-3">
                  {group.teamsWithoutSelection.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-200">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select 
                          value={selectedFlight[team.id]?.toString() || ""} 
                          onValueChange={(value) => handleTeamFlightChange(team.id, value)}
                        >
                          <SelectTrigger className="w-48 bg-slate-600 border-slate-500 text-white">
                            <SelectValue placeholder="Select flight..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {group.availableFlights.map((flight) => (
                              <SelectItem key={flight.id} value={flight.id.toString()}>
                                <div className="flex items-center gap-2">
                                  {getFlightLevelBadge(flight.level)}
                                  <span>{formatFlightName(flight.name)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          {(() => {
            // Group all assigned teams by flight type/level
            const teamsByFlightType = new Map<string, Array<{
              team: Team;
              group: FlightGroup;
              flightLevel: string;
            }>>();

            // Collect all teams from all groups and organize by flight type
            flightData?.forEach(group => {
              group.teamsWithSelection.forEach(team => {
                const flightLevel = getFlightLevel(team.selectedBracketName || '');
                if (!teamsByFlightType.has(flightLevel)) {
                  teamsByFlightType.set(flightLevel, []);
                }
                teamsByFlightType.get(flightLevel)!.push({
                  team,
                  group,
                  flightLevel
                });
              });
            });

            // Sort flight types by priority: Elite -> Premier -> Classic -> Others
            const flightTypePriority = { 'Elite': 1, 'Premier': 2, 'Classic': 3 };
            const sortedFlightTypes = Array.from(teamsByFlightType.keys()).sort((a, b) => {
              const priorityA = flightTypePriority[a as keyof typeof flightTypePriority] || 999;
              const priorityB = flightTypePriority[b as keyof typeof flightTypePriority] || 999;
              return priorityA - priorityB;
            });

            return sortedFlightTypes.map(flightType => {
              const teamsInFlight = teamsByFlightType.get(flightType) || [];
              
              return (
                <Card key={flightType} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFlightLevelBadge(flightType.toLowerCase())}
                        <div>
                          <CardTitle className="text-white">
                            Nike {flightType} Teams
                          </CardTitle>
                          <CardDescription className="text-slate-300">
                            {teamsInFlight.length} teams assigned to {flightType} flights
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        <Users className="h-3 w-3 mr-1" />
                        {teamsInFlight.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamsInFlight.map(({ team, group }) => (
                        <div key={team.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-slate-200">{team.name}</span>
                              <span className="text-xs text-slate-400">
                                {group.displayName || `${group.ageGroup} ${group.gender}${group.birthYear ? ` - [${group.birthYear}]` : ''}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {editingTeamId === team.id ? (
                              <Select 
                                value={selectedFlight[team.id]?.toString() || team.bracketId?.toString() || ""} 
                                onValueChange={(value) => handleTeamFlightChange(team.id, value)}
                              >
                                <SelectTrigger className="w-48 bg-slate-600 border-slate-500 text-white">
                                  <SelectValue placeholder="Select flight..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                  {group.availableFlights.map((flight) => (
                                    <SelectItem key={flight.id} value={flight.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        {getFlightLevelBadge(flight.level)}
                                        <span>{formatFlightName(flight.name)}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <>
                                <span className="text-slate-300 text-sm">{team.selectedBracketName}</span>
                                <Button
                                  onClick={() => handleEditTeam(team.id, team.bracketId)}
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-600 text-slate-200 hover:bg-slate-600"
                                >
                                  Edit
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
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