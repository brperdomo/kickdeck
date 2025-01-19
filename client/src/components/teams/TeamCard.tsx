import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamModal } from "./TeamModal";

interface Team {
  id: number;
  name: string;
  coach?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  ageGroup: string;
}

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/teams/${team.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold">{team.name}</h3>
            <p className="text-sm text-muted-foreground">Age Group: {team.ageGroup}</p>
            {team.coach && <p className="text-sm text-muted-foreground">Coach: {team.coach}</p>}
            {team.managerName && (
              <p className="text-sm text-muted-foreground">Manager: {team.managerName}</p>
            )}
            {team.managerEmail && (
              <p className="text-sm text-muted-foreground">Email: {team.managerEmail}</p>
            )}
            {team.managerPhone && (
              <p className="text-sm text-muted-foreground">Phone: {team.managerPhone}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span>Delete</span>
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team
              and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTeamMutation.mutate()}
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? (
                "Deleting..."
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TeamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        team={team}
      />
    </>
  );
}