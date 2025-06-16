import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Calendar, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: number;
  name: string;
  eventId: string;
  ageGroupId: number;
  addRosterLater: boolean;
  initialRosterComplete: boolean;
  rosterUploadedAt: string | null;
  rosterUploadMethod: string | null;
  submitterEmail: string;
  managerEmail: string;
  createdAt: string;
  playerCount: number;
  needsRoster: boolean;
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  dateOfBirth: string;
  medicalNotes?: string;
  emergencyContactFirstName: string;
  emergencyContactLastName: string;
  emergencyContactPhone: string;
}

export default function MemberDashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingTeamId, setUploadingTeamId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teams that need roster uploads
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/member-roster/my-teams'],
    queryFn: async () => {
      const response = await fetch('/api/member-roster/my-teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      return data.teams as Team[];
    },
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
        throw new Error(error.details || error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Roster uploaded successfully',
        description: `${data.count} players added to the team.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/member-roster/my-teams'] });
      setSelectedFile(null);
      setUploadingTeamId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploadingTeamId(null);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = (teamId: number) => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingTeamId(teamId);
    uploadRosterMutation.mutate({ teamId, file: selectedFile });
  };

  if (teamsLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Member Dashboard</h1>
        <p className="text-muted-foreground">
          Upload rosters for teams that were registered with the "add roster later" option.
        </p>
      </div>

      {!teams || teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All rosters complete!</h3>
            <p className="text-muted-foreground text-center">
              You don't have any teams that need roster uploads at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV Format Required:</strong> Your file should include columns for firstName, lastName, 
              jerseyNumber, dateOfBirth, medicalNotes, emergencyContactFirstName, emergencyContactLastName, 
              and emergencyContactPhone.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="w-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {team.name}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Roster Pending
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Registered on {new Date(team.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Current players: {team.playerCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Event ID: {team.eventId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Age Group: {team.ageGroupId}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          disabled={uploadingTeamId === team.id}
                          className="cursor-pointer"
                        />
                      </div>
                      <Button
                        onClick={() => handleUpload(team.id)}
                        disabled={!selectedFile || uploadingTeamId === team.id}
                        className="flex items-center gap-2"
                      >
                        {uploadingTeamId === team.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload Roster
                          </>
                        )}
                      </Button>
                    </div>

                    {selectedFile && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Selected file:</p>
                        <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}