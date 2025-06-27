import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Users, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Team {
  id: number;
  teamName: string;
  eventName: string;
  eventId: string;
  ageGroup: string;
  registeredAt: string;
  initialRosterComplete: boolean;
  rosterUploadedAt: string | null;
  rosterUploadMethod: string | null;
  playerCount: number;
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string | null;
  jerseyNumber: string | null;
}

export default function MemberRosterUpload() {
  const [selectedFiles, setSelectedFiles] = useState<{[teamId: number]: File}>({});
  const [uploadingTeamId, setUploadingTeamId] = useState<number | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's teams that need roster uploads
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/member-roster/my-teams'],
    queryFn: async () => {
      const response = await fetch('/api/member-roster/my-teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return response.json();
    }
  });

  const teams = teamsData?.teams || [];

  // Fetch players for a specific team
  const { data: teamPlayers } = useQuery({
    queryKey: ['/api/member-roster/teams', expandedTeam, 'players'],
    queryFn: async () => {
      if (!expandedTeam) return null;
      const response = await fetch(`/api/member-roster/teams/${expandedTeam}/players`);
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      return response.json();
    },
    enabled: !!expandedTeam
  });

  // Upload roster mutation
  const uploadRosterMutation = useMutation({
    mutationFn: async ({ teamId, file }: { teamId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/member-roster/teams/${teamId}/roster`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload roster');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Roster uploaded successfully! ${data.playersAdded} players added.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/member-roster/my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/member-roster/teams', variables.teamId, 'players'] });
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[variables.teamId];
        return updated;
      });
      setUploadingTeamId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingTeamId(null);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, teamId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(prev => ({ ...prev, [teamId]: file }));
    }
  };

  const handleUpload = (teamId: number) => {
    const file = selectedFiles[teamId];
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploadingTeamId(teamId);
    uploadRosterMutation.mutate({ teamId, file });
  };

  const toggleTeamExpansion = (teamId: number) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  if (teamsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading your teams...</div>
      </div>
    );
  }

  const teamsNeedingRoster = Array.isArray(teams) ? teams.filter((team: Team) => !team.initialRosterComplete) : [];
  const teamsWithRoster = Array.isArray(teams) ? teams.filter((team: Team) => team.initialRosterComplete) : [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Team Roster Management</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload player rosters for teams that were registered with the "add roster later" option. 
          CSV files should include columns: firstName, lastName, dateOfBirth, position (optional), jerseyNumber (optional).
        </p>
      </div>

      {/* CSV Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Format Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your CSV file should have the following columns (header row required):
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              firstName,lastName,dateOfBirth,position,jerseyNumber
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Required columns:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>firstName - Player's first name</li>
                  <li>lastName - Player's last name</li>
                  <li>dateOfBirth - Format: YYYY-MM-DD</li>
                </ul>
              </div>
              <div>
                <strong>Optional columns:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>position - Player position (e.g., Forward, Midfielder)</li>
                  <li>jerseyNumber - Player's jersey number</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Needing Roster */}
      {teamsNeedingRoster.length > 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              Teams Needing Roster Upload ({teamsNeedingRoster.length})
            </h2>
            <div className="grid gap-4">
              {teamsNeedingRoster.map((team: Team) => (
                <Card key={team.id} className="border-orange-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{team.teamName}</CardTitle>
                        <CardDescription>
                          {team.eventName} • {team.ageGroup}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Roster Required
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Registered: {team.registeredAt ? format(new Date(team.registeredAt), 'MMM d, yyyy') : 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Current Players: {team.playerCount}
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">
                              Upload roster for {team.teamName}
                            </label>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer flex-1">
                                <input
                                  type="file"
                                  accept=".csv"
                                  onChange={(e) => handleFileChange(e, team.id)}
                                  className="sr-only"
                                />
                                <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground text-sm">
                                  <Upload className="h-4 w-4" />
                                  {selectedFiles[team.id] ? selectedFiles[team.id].name : "Choose CSV File"}
                                </div>
                              </label>
                              {selectedFiles[team.id] && (
                                <Button
                                  onClick={() => handleUpload(team.id)}
                                  disabled={uploadingTeamId === team.id}
                                  size="sm"
                                >
                                  {uploadingTeamId === team.id ? "Uploading..." : "Upload"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            All your teams have complete rosters! No roster uploads are needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Teams With Complete Rosters */}
      {teamsWithRoster.length > 0 && (
        <div className="space-y-6">
          <Separator />
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Teams With Complete Rosters ({teamsWithRoster.length})
            </h2>
            <div className="grid gap-4">
              {teamsWithRoster.map((team: Team) => (
                <Card key={team.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{team.teamName}</CardTitle>
                        <CardDescription>
                          {team.eventName} • {team.ageGroup}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Roster Complete
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTeamExpansion(team.id)}
                        >
                          {expandedTeam === team.id ? "Hide Players" : "View Players"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Registered: {team.registeredAt ? format(new Date(team.registeredAt), 'MMM d, yyyy') : 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Players: {team.playerCount}
                        </div>
                        {team.rosterUploadedAt && (
                          <div className="flex items-center gap-1">
                            <Upload className="h-4 w-4" />
                            Roster uploaded: {team.rosterUploadedAt ? format(new Date(team.rosterUploadedAt), 'MMM d, yyyy') : 'Unknown'}
                          </div>
                        )}
                      </div>

                      {expandedTeam === team.id && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="font-medium mb-3">Team Roster</h4>
                          {teamPlayers?.length > 0 ? (
                            <div className="space-y-2">
                              {teamPlayers.map((player: Player, index: number) => (
                                <div
                                  key={player.id}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <div className="font-medium">
                                        {player.firstName} {player.lastName}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Born: {format(new Date(player.dateOfBirth), 'MMM d, yyyy')}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right text-sm">
                                    {player.position && (
                                      <div className="font-medium">{player.position}</div>
                                    )}
                                    {player.jerseyNumber && (
                                      <div className="text-muted-foreground">
                                        #{player.jerseyNumber}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No players found for this team.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}