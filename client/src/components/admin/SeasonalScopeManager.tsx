import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SeasonalScope {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  ageGroups: AgeGroup[];
}

interface AgeGroup {
  id: number;
  ageGroup: string;
  birthYear: number;
  gender: string;
  divisionCode: string;
}

export function SeasonalScopeManager() {
  const [scopeToDelete, setScopeToDelete] = useState<SeasonalScope | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scopes, isLoading, error } = useQuery<SeasonalScope[]>({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json();
    },
  });

  const handleDeleteClick = async (scope: SeasonalScope) => {
    try {
      // Check if scope is in use first
      const response = await fetch(`/api/admin/seasonal-scopes/${scope.id}/in-use`);
      const data = await response.json();

      if (data.inUse) {
        toast({
          title: "Cannot Delete",
          description: data.message,
          variant: "destructive",
        });
        return;
      }

      // If not in use, show confirmation dialog
      setScopeToDelete(scope);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error checking scope usage:', error);
      toast({
        title: "Error",
        description: "Failed to check if seasonal scope can be deleted",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!scopeToDelete) return;

    try {
      const response = await fetch(`/api/admin/seasonal-scopes/${scopeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete seasonal scope');
      }

      toast({
        title: "Success",
        description: "Seasonal scope deleted successfully",
      });

      // Invalidate and refetch
      await queryClient.invalidateQueries(['/api/admin/seasonal-scopes']);
    } catch (error) {
      console.error('Error deleting scope:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete seasonal scope",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setScopeToDelete(null);
    }
  };

  if (isLoading) return <div>Loading seasonal scopes...</div>;
  if (error) return <div>Error loading seasonal scopes</div>;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Years</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Age Groups</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scopes?.map((scope) => (
            <TableRow key={scope.id}>
              <TableCell className="font-medium">{scope.name}</TableCell>
              <TableCell>{scope.startYear}-{scope.endYear}</TableCell>
              <TableCell>
                <Badge variant={scope.isActive ? "default" : "secondary"}>
                  {scope.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{scope.ageGroups.length} groups</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(scope)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the seasonal scope "{scopeToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
