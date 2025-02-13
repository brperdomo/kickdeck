import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Eye } from "lucide-react";
import { z } from "zod";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AgeGroupSettings {
  id: number;
  seasonalScopeId: number;
  ageGroup: string;
  birthYear: number;
  gender: string;
  divisionCode: string;
  minBirthYear: number;
  maxBirthYear: number;
  createdAt: string;
  updatedAt: string;
}

interface SeasonalScope {
  id?: number;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  ageGroups: AgeGroupSettings[];
}

export function SeasonalScopeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStartYear, setSelectedStartYear] = useState<string>("");
  const [selectedEndYear, setSelectedEndYear] = useState<string>("");
  const [scopeName, setScopeName] = useState<string>("");
  const [ageGroupMappings, setAgeGroupMappings] = useState<AgeGroupSettings[]>([]);
  const [scopeToDelete, setScopeToDelete] = useState<SeasonalScope | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewingScope, setViewingScope] = useState<SeasonalScope | null>(null);

  // Query to fetch all seasonal scopes
  const scopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      return response.json() as Promise<SeasonalScope[]>;
    }
  });

  // Mutation to create a new seasonal scope
  const createScopeMutation = useMutation({
    mutationFn: async (data: SeasonalScope) => {
      const response = await fetch('/api/admin/seasonal-scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create seasonal scope');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seasonal-scopes'] });
      toast({
        title: "Success",
        description: "Seasonal scope created successfully",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create seasonal scope",
        variant: "destructive"
      });
    }
  });

  const handleDeleteClick = (scope: SeasonalScope) => {
    setScopeToDelete(scope);
    setDeleteDialogOpen(true);
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
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/seasonal-scopes'] });
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

  const resetForm = () => {
    setSelectedStartYear("");
    setSelectedEndYear("");
    setScopeName("");
    setAgeGroupMappings([]);
  };

  const handleEndYearChange = (endYear: string) => {
    setSelectedEndYear(endYear);
    if (endYear) {
      const year = parseInt(endYear);
      const initialMappings: AgeGroupSettings[] = [];

      // Generate age groups (U4 to U18)
      for (let i = 4; i <= 18; i++) {
        const birthYear = year - i;
        const ageGroup = `U${i}`;

        // Add boys division
        const boysDivisionCode = `B${birthYear}`;
        initialMappings.push({
          id: 0,
          seasonalScopeId: 0,
          ageGroup,
          birthYear,
          gender: 'Boys',
          divisionCode: boysDivisionCode,
          minBirthYear: birthYear,
          maxBirthYear: birthYear,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Add girls division
        const girlsDivisionCode = `G${birthYear}`;
        initialMappings.push({
          id: 0,
          seasonalScopeId: 0,
          ageGroup,
          birthYear,
          gender: 'Girls',
          divisionCode: girlsDivisionCode,
          minBirthYear: birthYear,
          maxBirthYear: birthYear,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Sort by birth year (descending) and gender
      const sortedMappings = initialMappings.sort((a, b) => {
        const yearDiff = b.birthYear - a.birthYear;
        if (yearDiff !== 0) return yearDiff;
        return a.gender.localeCompare(b.gender);
      });

      setAgeGroupMappings(sortedMappings);
    }
  };

  const handleSubmit = async () => {
    try {
      const seasonalScope: SeasonalScope = {
        name: scopeName,
        startYear: parseInt(selectedStartYear),
        endYear: parseInt(selectedEndYear),
        isActive: true,
        ageGroups: ageGroupMappings
      };

      await createScopeMutation.mutateAsync(seasonalScope);
    } catch (error) {
      console.error('Error creating seasonal scope:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create seasonal scope",
        variant: "destructive"
      });
    }
  };

  const isValidAgeGroup = (group: any): group is AgeGroupSettings => {
    return group &&
      typeof group.divisionCode === 'string' &&
      typeof group.birthYear === 'number' &&
      typeof group.ageGroup === 'string' &&
      typeof group.gender === 'string';
  };

  const handleViewDetails = (scope: SeasonalScope) => {
    setViewingScope(scope);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonal Scope Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={scopeName}
                onChange={(e) => setScopeName(e.target.value)}
                placeholder="2024-2025 Season"
              />
            </div>
            <div>
              <Label>Start Year</Label>
              <Input
                type="number"
                value={selectedStartYear}
                onChange={(e) => setSelectedStartYear(e.target.value)}
                placeholder="2024"
              />
            </div>
            <div>
              <Label>End Year</Label>
              <Input
                type="number"
                value={selectedEndYear}
                onChange={(e) => handleEndYearChange(e.target.value)}
                placeholder="2025"
              />
            </div>
          </div>

          {ageGroupMappings.length > 0 && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Birth Year</TableHead>
                      <TableHead>Division Code</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Gender</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroupMappings.map((mapping) => (
                      <TableRow key={`${mapping.gender}-${mapping.birthYear}`}>
                        <TableCell>{mapping.birthYear}</TableCell>
                        <TableCell>{mapping.divisionCode}</TableCell>
                        <TableCell>{mapping.ageGroup}</TableCell>
                        <TableCell>{mapping.gender}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full mt-4"
            disabled={createScopeMutation.isPending}
          >
            {createScopeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Scope
              </>
            )}
          </Button>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Existing Seasonal Scopes</h3>
            {scopesQuery.isLoading ? (
              <p>Loading...</p>
            ) : scopesQuery.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No seasonal scopes created yet.</p>
            ) : (
              <div className="space-y-2">
                {scopesQuery.data?.map((scope: SeasonalScope) => (
                  <Card key={scope.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{scope.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {scope.startYear} - {scope.endYear}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={scope.isActive ? "default" : "secondary"}>
                          {scope.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(scope)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(scope)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

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

          <Dialog open={!!viewingScope} onOpenChange={(open) => !open && setViewingScope(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {viewingScope?.name} ({viewingScope?.startYear}-{viewingScope?.endYear})
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 overflow-y-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Division Code</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Birth Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingScope?.ageGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.ageGroup}</TableCell>
                        <TableCell>{group.divisionCode}</TableCell>
                        <TableCell>{group.gender}</TableCell>
                        <TableCell>{group.birthYear}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewingScope(null)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}