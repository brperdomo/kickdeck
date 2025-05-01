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
import { ClubLogo } from "../clubs/ClubLogo";
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
            <SelectTrigger className="w-[220px] bg-white border-indigo-100 hover:border-indigo-200 shadow-sm">
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
            className="flex items-center bg-white hover:bg-gray-50 border-indigo-100 hover:border-indigo-200"
          >
            <Upload className="mr-2 h-4 w-4 text-indigo-600" />
            Import Teams
          </Button>
        </div>
      </div>

      <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
              <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team Name</TableHead>
              <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Age Group</TableHead>
              <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Bracket</TableHead>
              <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Manager</TableHead>
              <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Contact</TableHead>
              <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamsQuery.data?.map((team, index) => {
              // Construct the club logo URL if a club is associated
              let clubLogoUrl = null;
              if (team.clubName) {
                // We need to find the club logo URL - for this example we can use the ClubLogo component
                // that will show initials if no logo is found
                clubLogoUrl = `/uploads/club-logos/${team.id}.png`; // This is a placeholder, real data will use actual logo URLs
              }
              
              return (
                <TableRow 
                  key={team.id} 
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} 
                    hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors
                    ${team.bracketId === null ? "bg-amber-50/40 hover:bg-amber-50/80" : ""}
                  `}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Use the ClubLogo component */}
                      {team.clubName && (
                        <ClubLogo 
                          clubName={team.clubName} 
                          logoUrl={clubLogoUrl} 
                          size="md" 
                        />
                      )}
                      <span className="font-medium">{team.name}</span>
                      {team.clubName && (
                        <span className="text-xs text-gray-500 ml-1">({team.clubName})</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{team.ageGroup}</TableCell>
                  <TableCell>
                    {team.bracketId === null ? (
                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1 inline" />
                          Needs assignment
                        </span>
                      </div>
                    ) : team.bracketName ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {team.bracketName}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{team.managerName || '-'}</TableCell>
                  <TableCell>{team.managerEmail || team.managerPhone || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-indigo-50 hover:text-indigo-700 border-indigo-100"
                        onClick={() => setTeamToEdit(team)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTeamToDelete(team)}
                        className="hover:bg-red-50 text-red-600 hover:text-red-700 border-red-100"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {teamsQuery.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
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