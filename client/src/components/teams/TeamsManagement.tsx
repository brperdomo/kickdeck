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
import { Loader2, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface Team {
  id: number;
  name: string;
  coach?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  ageGroup: string;
}

interface AgeGroup {
  id: number;
  ageGroup: string;
  gender: string;
}

interface TeamsManagementProps {
  eventId: number;
}

export function TeamsManagement({ eventId }: TeamsManagementProps) {
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>("all");
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
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
                {`${group.ageGroup} ${group.gender}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamsQuery.data?.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>{team.ageGroup}</TableCell>
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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

      {/* TeamModal component will be implemented separately */}
      {teamToEdit && (
        <TeamModal
          team={teamToEdit}
          isOpen={!!teamToEdit}
          onClose={() => setTeamToEdit(null)}
        />
      )}
    </div>
  );
}