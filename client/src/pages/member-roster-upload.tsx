import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Users, Calendar, AlertCircle, CheckCircle, Download, ArrowLeft, Home, User, Shield } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your teams...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Team Roster Upload</span>
        </div>

        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Team Roster Upload
                </h1>
                <p className="text-muted-foreground mt-1">
                  Upload player rosters for teams registered with "Add Roster Later" option
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2 bg-white/80">
              <Download className="h-4 w-4" />
              Download CSV Template
            </Button>
          </div>
        </div>

        {/* CSV Format Information */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileText className="h-5 w-5 text-blue-600" />
              CSV Format Requirements
            </CardTitle>
            <CardDescription>
              Download the template above or follow these formatting guidelines
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Your CSV file should have the following columns (header row required):</p>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-md border border-blue-200">
                <div className="font-mono text-xs overflow-x-auto">
                  <div className="whitespace-nowrap text-blue-800">
                    First Name,Last Name,Date of Birth,Jersey Number,Medical Notes,Emergency Contact First Name,Emergency Contact Last Name,Emergency Contact Phone
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Required columns:
                  </h4>
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <ul className="space-y-1 text-green-800">
                      <li>• First Name - Player's first name</li>
                      <li>• Last Name - Player's last name</li>
                      <li>• Date of Birth - Format: YYYY-MM-DD</li>
                      <li>• Emergency Contact First Name</li>
                      <li>• Emergency Contact Last Name</li>
                      <li>• Emergency Contact Phone</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Optional columns:
                  </h4>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <ul className="space-y-1 text-blue-800">
                      <li>• Jersey Number - Player's jersey number</li>
                      <li>• Medical Notes - Any medical conditions or allergies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Needing Roster */}
        {teamsNeedingRoster.length > 0 ? (
          <div className="space-y-6">
            <div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Teams Needing Roster Upload ({teamsNeedingRoster.length})
                  </span>
                </h2>
                <p className="text-muted-foreground">
                  These teams were registered with the "Add Roster Later" option and need player rosters uploaded.
                </p>
              </div>
              <div className="grid gap-4">
                {teamsNeedingRoster.map((team: Team) => (
                  <Card key={team.id} className="bg-white/60 backdrop-blur-sm border-orange-200 shadow-lg hover:shadow-xl transition-all duration-200">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-orange-900">{team.name}</CardTitle>
                          <CardDescription className="text-orange-700">
                            {team.eventName || 'Unknown Event'} • {team.ageGroupName || 'Unknown Age Group'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-orange-600 border-orange-600 bg-white">
                            <AlertCircle className="h-3 w-3 mr-1" />
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
                      
                      <div className="border-t border-orange-200 pt-4">
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-orange-900">
                            Upload roster for {team.name}
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer flex-1">
                              <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => handleFileChange(e, team.id)}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all text-sm bg-white">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                  <Upload className="h-4 w-4 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-orange-900">
                                    {selectedFiles[team.id] ? selectedFiles[team.id].name : "Choose CSV File"}
                                  </div>
                                  {!selectedFiles[team.id] && (
                                    <div className="text-xs text-orange-600 mt-1">
                                      Click to browse or drag and drop your roster file
                                    </div>
                                  )}
                                </div>
                              </div>
                            </label>
                            {selectedFiles[team.id] && (
                              <Button
                                onClick={() => handleUpload(team.id)}
                                disabled={uploadingTeamId === team.id}
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6"
                              >
                                {uploadingTeamId === team.id ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Uploading...
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Upload
                                  </div>
                                )}
                              </Button>
                            )}
                          </div>
                          {selectedFiles[team.id] && (
                            <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                              <p className="text-xs text-orange-800">
                                <strong>File:</strong> {selectedFiles[team.id].name} • 
                                <strong> Size:</strong> {(selectedFiles[team.id].size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          )}
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
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">All Rosters Complete</h3>
                <p className="text-green-700 max-w-md mx-auto">
                  Great job! You don't have any teams that need roster uploads. All your teams have their player rosters ready.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams With Complete Rosters */}
        {teamsWithRoster.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Teams with Complete Rosters ({teamsWithRoster.length})
                </span>
              </h2>
              <p className="text-muted-foreground">
                These teams have successfully uploaded their player rosters and are ready for tournament play.
              </p>
            </div>
            <div className="grid gap-4">
              {teamsWithRoster.map((team: Team) => (
                <Card key={team.id} className="bg-white/60 backdrop-blur-sm border-green-200 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-green-900">{team.name}</CardTitle>
                        <CardDescription className="text-green-700">
                          {team.eventName || 'Unknown Event'} • {team.ageGroupName || 'Unknown Age Group'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600 bg-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Roster Complete
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="p-1 bg-green-100 rounded">
                          <Calendar className="h-3 w-3" />
                        </div>
                        <span>Registered: {team.createdAt ? format(new Date(team.createdAt), 'MMM d, yyyy') : 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="p-1 bg-green-100 rounded">
                          <Users className="h-3 w-3" />
                        </div>
                        <span>Players: {team.playerCount}</span>
                      </div>
                      {team.rosterUploadedAt && (
                        <div className="flex items-center gap-2 text-green-700">
                          <div className="p-1 bg-green-100 rounded">
                            <Upload className="h-3 w-3" />
                          </div>
                          <span>Uploaded: {format(new Date(team.rosterUploadedAt), 'MMM d, yyyy')}</span>
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
    </div>
  );
}