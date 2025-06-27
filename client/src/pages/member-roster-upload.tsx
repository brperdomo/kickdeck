import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Users, Calendar, AlertCircle, CheckCircle, Download } from "lucide-react";
import { format } from "date-fns";

interface Team {
  id: number;
  name: string;
  eventName: string | null;
  eventId: string;
  ageGroupName: string | null;
  ageGroupId: number;
  createdAt: string;
  initialRosterComplete: boolean;
  rosterUploadedAt: string | null;
  rosterUploadMethod: string | null;
  playerCount: number;
  needsRoster: boolean;
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
    },
  });

  // Roster upload mutation
  const uploadRosterMutation = useMutation({
    mutationFn: async ({ teamId, file }: { teamId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/member-roster/teams/${teamId}/roster`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Upload Successful",
        description: `Roster uploaded successfully for team ID ${variables.teamId}`,
      });
      
      // Clear the selected file for this team
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[variables.teamId];
        return updated;
      });
      
      // Refresh teams data
      queryClient.invalidateQueries({ queryKey: ['/api/member-roster/my-teams'] });
      setUploadingTeamId(null);
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingTeamId(null);
    },
  });

  // Get players for a specific team
  const { data: playersData } = useQuery({
    queryKey: ['/api/member-roster/teams', expandedTeam, 'players'],
    queryFn: async () => {
      if (!expandedTeam) return null;
      const response = await fetch(`/api/member-roster/teams/${expandedTeam}/players`);
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }
      return response.json();
    },
    enabled: !!expandedTeam,
  });

  const teams = teamsData?.teams || [];
  const teamsNeedingRoster = teams.filter((team: Team) => team.needsRoster);
  const teamsWithRoster = teams.filter((team: Team) => !team.needsRoster);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, teamId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
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

  const downloadTemplate = () => {
    // Create a downloadable CSV template
    window.open('/api/member-roster/template', '_blank');
  };

  if (teamsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your teams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roster Upload</h1>
          <p className="text-muted-foreground mt-1">
            Upload player rosters for teams registered with "Add Roster Later" option
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download CSV Template
        </Button>
      </div>

      {/* CSV Format Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Format Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Your CSV file should have the following columns (header row required):</p>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              First Name,Last Name,Date of Birth,Jersey Number,Medical Notes,Emergency Contact First Name,Emergency Contact Last Name,Emergency Contact Phone
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Required columns:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• First Name - Player's first name</li>
                  <li>• Last Name - Player's last name</li>
                  <li>• Date of Birth - Format: YYYY-MM-DD</li>
                  <li>• Emergency Contact First Name</li>
                  <li>• Emergency Contact Last Name</li>
                  <li>• Emergency Contact Phone</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Optional columns:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Jersey Number - Player's jersey number</li>
                  <li>• Medical Notes - Any medical conditions or allergies</li>
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
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <CardDescription>
                          {team.eventName || 'Unknown Event'} • {team.ageGroupName || 'Unknown Age Group'}
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
                          Registered: {team.createdAt ? format(new Date(team.createdAt), 'MMM d, yyyy') : 'Unknown'}
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
                              Upload roster for {team.name}
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
                            {selectedFiles[team.id] && (
                              <p className="text-xs text-muted-foreground mt-1">
                                File: {selectedFiles[team.id].name} ({(selectedFiles[team.id].size / 1024).toFixed(1)} KB)
                              </p>
                            )}
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All Rosters Complete</h3>
              <p className="text-muted-foreground">
                You don't have any teams that need roster uploads.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams With Complete Rosters */}
      {teamsWithRoster.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Teams with Complete Rosters ({teamsWithRoster.length})
          </h2>
          <div className="grid gap-4">
            {teamsWithRoster.map((team: Team) => (
              <Card key={team.id} className="border-green-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>
                        {team.eventName || 'Unknown Event'} • {team.ageGroupName || 'Unknown Age Group'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Roster Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Registered: {team.createdAt ? format(new Date(team.createdAt), 'MMM d, yyyy') : 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Players: {team.playerCount}
                    </div>
                    {team.rosterUploadedAt && (
                      <div className="flex items-center gap-1">
                        <Upload className="h-4 w-4" />
                        Uploaded: {format(new Date(team.rosterUploadedAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}