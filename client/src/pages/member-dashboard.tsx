import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Calendar, Users, CheckCircle, Clock, AlertCircle, Edit, Mail, User, UserCheck, Plus } from 'lucide-react';
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
  managerName?: string;
  managerPhone?: string;
  coach?: string; // JSON string containing coach data
  createdAt: string;
  playerCount: number;
  needsRoster: boolean;
  eventName?: string;
  ageGroup?: string;
}

interface TeamRegistration {
  id: number;
  teamName: string;
  eventName: string;
  ageGroup: string;
  registrationDate: string;
  status: string;
  amountPaid: number;
  managerEmail?: string;
  managerName?: string;
  managerPhone?: string;
  coach?: string;
  headCoachName?: string;
  headCoachEmail?: string;
  headCoachPhone?: string;
  submitterEmail?: string;
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
  const [editingTeam, setEditingTeam] = useState<TeamRegistration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [managerForm, setManagerForm] = useState({
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    coachName: '',
    coachEmail: '',
    coachPhone: ''
  });
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

  // Fetch all team registrations for this user
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/admin/members/me/registrations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/members/me/registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      const data = await response.json();
      return data.registrations as TeamRegistration[];
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

  // Update team contact information mutation
  const updateTeamContactsMutation = useMutation({
    mutationFn: async ({ teamId, contacts }: { teamId: number; contacts: typeof managerForm }) => {
      const response = await fetch(`/api/member-teams/${teamId}/contacts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contacts),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update team contacts');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Team contacts updated',
        description: data.message || 'Team manager and coach information has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/members/me/registrations'] });
      setIsEditDialogOpen(false);
      setEditingTeam(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEditTeamContacts = (team: TeamRegistration) => {
    setEditingTeam(team);
    
    // Use individual head coach fields if available, otherwise parse coach JSON data
    let coachData = { 
      name: team.headCoachName || '', 
      email: team.headCoachEmail || '', 
      phone: team.headCoachPhone || '' 
    };
    
    // If individual fields are empty but coach JSON exists, parse it
    if (!coachData.name && !coachData.email && !coachData.phone && team.coach) {
      try {
        const parsedCoach = JSON.parse(team.coach);
        coachData = {
          name: parsedCoach.headCoachName || parsedCoach.name || '',
          email: parsedCoach.headCoachEmail || parsedCoach.email || '',
          phone: parsedCoach.headCoachPhone || parsedCoach.phone || ''
        };
      } catch (e) {
        console.error('Error parsing coach data:', e);
      }
    }

    setManagerForm({
      managerName: team.managerName || '',
      managerEmail: team.managerEmail || '',
      managerPhone: team.managerPhone || '',
      coachName: coachData.name,
      coachEmail: coachData.email,
      coachPhone: coachData.phone
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveContacts = () => {
    if (!editingTeam) return;
    
    updateTeamContactsMutation.mutate({
      teamId: editingTeam.id,
      contacts: managerForm
    });
  };

  if (teamsLoading || registrationsLoading) {
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
          Manage your team registrations, upload rosters, and update team contacts.
        </p>
      </div>

      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registrations" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Team Registrations
          </TabsTrigger>
          <TabsTrigger value="roster-uploads" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Roster Uploads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-6">
          <div className="grid gap-6">
            {!registrations || registrations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No team registrations found</h3>
                  <p className="text-muted-foreground text-center">
                    You haven't registered any teams yet or don't have access to any team registrations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              registrations.map((registration) => (
                <Card key={registration.id} className="w-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {registration.teamName}
                          <Badge variant={registration.status === 'approved' ? 'default' : 'secondary'}>
                            {registration.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {registration.eventName} • {registration.ageGroup}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTeamContacts(registration)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Contacts
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Team Manager
                        </h4>
                        <div className="pl-6 space-y-1">
                          <p><strong>Name:</strong> {registration.managerName || 'Not provided'}</p>
                          <p><strong>Email:</strong> {registration.managerEmail || 'Not provided'}</p>
                          <p><strong>Phone:</strong> {registration.managerPhone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Head Coach
                        </h4>
                        <div className="pl-6 space-y-1">
                          {registration.headCoachName || registration.headCoachEmail || registration.headCoachPhone ? (
                            <>
                              <p><strong>Name:</strong> {registration.headCoachName || 'Not provided'}</p>
                              <p><strong>Email:</strong> {registration.headCoachEmail || 'Not provided'}</p>
                              <p><strong>Phone:</strong> {registration.headCoachPhone || 'Not provided'}</p>
                            </>
                          ) : registration.coach ? (() => {
                            try {
                              const coachData = JSON.parse(registration.coach);
                              return (
                                <>
                                  <p><strong>Name:</strong> {coachData.headCoachName || coachData.name || 'Not provided'}</p>
                                  <p><strong>Email:</strong> {coachData.headCoachEmail || coachData.email || 'Not provided'}</p>
                                  <p><strong>Phone:</strong> {coachData.headCoachPhone || coachData.phone || 'Not provided'}</p>
                                </>
                              );
                            } catch (e) {
                              return <p>Coach information available</p>;
                            }
                          })() : (
                            <p>No coach information provided</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Registered: {new Date(registration.registrationDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>Submitted by: {registration.submitterEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Amount: ${(registration.amountPaid / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="roster-uploads" className="space-y-6">

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
        </TabsContent>
      </Tabs>

      {/* Edit Team Contacts Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Team Contacts</DialogTitle>
            <DialogDescription>
              Update the manager and coach information for {editingTeam?.teamName}. 
              If you enter an email that doesn't exist, we'll create a new account and send a welcome email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Team Manager
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="managerName">Manager Name</Label>
                  <Input
                    id="managerName"
                    value={managerForm.managerName}
                    onChange={(e) => setManagerForm({ ...managerForm, managerName: e.target.value })}
                    placeholder="Enter manager name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerPhone">Manager Phone</Label>
                  <Input
                    id="managerPhone"
                    value={managerForm.managerPhone}
                    onChange={(e) => setManagerForm({ ...managerForm, managerPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerEmail">Manager Email *</Label>
                <Input
                  id="managerEmail"
                  type="email"
                  value={managerForm.managerEmail}
                  onChange={(e) => setManagerForm({ ...managerForm, managerEmail: e.target.value })}
                  placeholder="manager@example.com"
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Head Coach
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coachName">Coach Name</Label>
                  <Input
                    id="coachName"
                    value={managerForm.coachName}
                    onChange={(e) => setManagerForm({ ...managerForm, coachName: e.target.value })}
                    placeholder="Enter coach name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coachPhone">Coach Phone</Label>
                  <Input
                    id="coachPhone"
                    value={managerForm.coachPhone}
                    onChange={(e) => setManagerForm({ ...managerForm, coachPhone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coachEmail">Coach Email</Label>
                <Input
                  id="coachEmail"
                  type="email"
                  value={managerForm.coachEmail}
                  onChange={(e) => setManagerForm({ ...managerForm, coachEmail: e.target.value })}
                  placeholder="coach@example.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveContacts}
              disabled={updateTeamContactsMutation.isPending || !managerForm.managerEmail}
            >
              {updateTeamContactsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Update Contacts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}