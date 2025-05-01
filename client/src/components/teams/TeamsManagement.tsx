import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Edit, Trash2, Upload, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TeamCsvUploader } from "./TeamCsvUploader";
import { TeamModal } from "./TeamModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Team {
  id: number;
  name: string;
  coach?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  ageGroup: string;
  ageGroupId?: number;
  bracketId?: number | null;
  bracketName?: string | null;
  clubName?: string;
}

interface AgeGroup {
  id: number;
  ageGroup: string;
  gender: string;
  divisionCode?: string;
}

interface TeamsManagementProps {
  eventId: number;
}

export function TeamsManagement({ eventId }: TeamsManagementProps) {
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>("all");
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [showCsvUploadDialog, setShowCsvUploadDialog] = useState(false);
  const { toast } = useToast();

  const ageGroupsQuery = useQuery<AgeGroup[]>({
    queryKey: [`/api/admin/events/${eventId}/age-groups`],
    enabled: !!eventId,
  });

  const teamsQuery = useQuery<Team[]>({
    queryKey: [`/api/admin/teams?eventId=${eventId}${selectedAgeGroupId !== "all" ? `&ageGroupId=${selectedAgeGroupId}` : ''}`],
    enabled: !!eventId,
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
      setTeamToDelete(null);
      teamsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  if (ageGroupsQuery.isLoading || teamsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ageGroupsQuery.error || teamsQuery.error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load teams data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={selectedAgeGroupId}
            onValueChange={setSelectedAgeGroupId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Age Groups</SelectItem>
              {ageGroupsQuery.data?.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.divisionCode ? `${group.divisionCode} - ${group.gender} ${group.ageGroup}` : `${group.gender} ${group.ageGroup}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCsvUploadDialog(true)}
            className="flex items-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Teams
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Bracket</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamsQuery.data?.map((team) => (
              <TableRow key={team.id} className={team.bracketId === null ? "bg-amber-50" : ""}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>{team.ageGroup}</TableCell>
                <TableCell>
                  {team.bracketId === null ? (
                    <div className="flex items-center">
                      <span className="text-amber-600 text-sm font-medium flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1 inline" />
                        Needs assignment
                      </span>
                    </div>
                  ) : team.bracketName ? (
                    team.bracketName
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{team.managerName || '-'}</TableCell>
                <TableCell>{team.managerEmail || team.managerPhone || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => setTeamToEdit(team)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTeamToDelete(team)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {teamsQuery.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No teams found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team
              "{teamToDelete?.name}" and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => teamToDelete && deleteTeamMutation.mutate(teamToDelete.id)}
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Use the TeamModal component for editing teams */}
      {teamToEdit && (
        <TeamModal 
          isOpen={!!teamToEdit} 
          onClose={() => setTeamToEdit(null)} 
          team={{
            id: teamToEdit.id,
            name: teamToEdit.name,
            coach: teamToEdit.coach,
            managerName: teamToEdit.managerName,
            managerPhone: teamToEdit.managerPhone,
            managerEmail: teamToEdit.managerEmail,
            eventId: String(eventId),
            ageGroupId: teamToEdit.ageGroupId,
            ageGroup: teamToEdit.ageGroup,
            bracketId: teamToEdit.bracketId,
            clubName: teamToEdit.clubName
          }} 
        />
      )}
      
      {/* CSV Import Dialog */}
      <Dialog open={showCsvUploadDialog} onOpenChange={setShowCsvUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Teams via CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with team information to bulk import teams into this event.
              All required fields must be included and age groups must match existing groups.
            </DialogDescription>
          </DialogHeader>
          
          <TeamCsvUploader 
            eventId={eventId} 
            onUploadSuccess={(teams) => {
              toast({
                title: "Upload Successful",
                description: `Added ${teams.length} teams to the event.`,
              });
              setShowCsvUploadDialog(false);
              teamsQuery.refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}