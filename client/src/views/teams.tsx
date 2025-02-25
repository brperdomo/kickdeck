import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function TeamsView() {
  const { toast } = useToast();
  const teamsQuery = useQuery({
    queryKey: ['/api/admin/teams'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/teams');
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch teams');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch teams",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teams</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>
      <Card className="p-6">
        {teamsQuery.isLoading ? (
          <p className="text-center text-muted-foreground">Loading teams...</p>
        ) : teamsQuery.isError ? (
          <p className="text-center text-destructive">Error loading teams. Please try again later.</p>
        ) : teamsQuery.data?.length === 0 ? (
          <p className="text-center text-muted-foreground">No teams available</p>
        ) : (
          <div className="text-center">
            {teamsQuery.data.length} teams found
          </div>
        )}
      </Card>
    </div>
  );
}