import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Edit, Eye, Save, X } from "lucide-react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const seasonalScopeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startYear: z.number().min(2000).max(2100),
  endYear: z.number().min(2000).max(2100),
});

export function SeasonalScopeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStartYear, setSelectedStartYear] = useState<string>("");
  const [selectedEndYear, setSelectedEndYear] = useState<string>("");
  const [scopeName, setScopeName] = useState<string>("");
  const [ageGroupMappings, setAgeGroupMappings] = useState<AgeGroupSettings[]>([]);
  const [editingScope, setEditingScope] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SeasonalScope>>({});
  const [viewingScope, setViewingScope] = useState<SeasonalScope | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Helper function to safely handle scope viewing
  const handleViewScope = (scope: SeasonalScope) => {
    console.log('Opening view modal for scope:', scope);
    setViewingScope(scope);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingScope(null);
  };

  const scopesQuery = useQuery({
    queryKey: ['/api/admin/seasonal-scopes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/seasonal-scopes');
      if (!response.ok) throw new Error('Failed to fetch seasonal scopes');
      const data = await response.json();
      console.log('Fetched seasonal scopes:', data);
      return data as SeasonalScope[];
    }
  });

  const createScopeMutation = useMutation({
    mutationFn: async (data: SeasonalScope) => {
      const response = await fetch('/api/admin/seasonal-scopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          startYear: data.startYear,
          endYear: data.endYear,
          isActive: true,
          ageGroups: data.ageGroups.map(group => ({
            ageGroup: group.ageGroup,
            birthYear: group.birthYear,
            gender: group.gender,
            divisionCode: group.divisionCode,
            minBirthYear: group.minBirthYear,
            maxBirthYear: group.maxBirthYear,
            seasonalScopeId: data.id || 0,
            id: group.id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          }))
        }),
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
        variant: "default"
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

  const updateScopeMutation = useMutation({
    mutationFn: async (data: { id: number; scope: Partial<SeasonalScope> }) => {
      const response = await fetch(`/api/admin/seasonal-scopes/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.scope),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update seasonal scope');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seasonal-scopes'] });
      toast({
        title: "Success",
        description: "Seasonal scope updated successfully",
        variant: "default"
      });
      setEditingScope(null);
      setEditForm({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update seasonal scope",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setSelectedStartYear("");
    setSelectedEndYear("");
    setScopeName("");
    setAgeGroupMappings([]);
  };

  const calculateAgeGroup = (birthYear: number, endYear: number) => {
    const age = endYear - birthYear;
    return `U${age}`;
  };

  const handleEndYearChange = (endYear: string) => {
    setSelectedEndYear(endYear);
    if (endYear) {
      const year = parseInt(endYear);
      const initialMappings: AgeGroupSettings[] = [];

      // Generate 15 years of age groups (U4 to U19)
      for (let i = 0; i < 15; i++) {
        const birthYear = year - (4 + i);
        const ageGroup = calculateAgeGroup(birthYear, year);

        // Add both boys and girls divisions
        initialMappings.push({
          id: 0,
          seasonalScopeId: 0,
          birthYear,
          ageGroup,
          gender: 'Boys',
          divisionCode: `B${birthYear}`,
          minBirthYear: birthYear,
          maxBirthYear: birthYear,
          createdAt: "",
          updatedAt: ""
        });
        initialMappings.push({
          id: 0,
          seasonalScopeId: 0,
          birthYear,
          ageGroup,
          gender: 'Girls',
          divisionCode: `G${birthYear}`,
          minBirthYear: birthYear,
          maxBirthYear: birthYear,
          createdAt: "",
          updatedAt: ""
        });
      }
      setAgeGroupMappings(initialMappings);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate the form data
      const validatedData = seasonalScopeSchema.parse({
        name: scopeName,
        startYear: parseInt(selectedStartYear),
        endYear: parseInt(selectedEndYear)
      });

      if (ageGroupMappings.length === 0) {
        throw new Error("Please generate age groups first");
      }

      await createScopeMutation.mutateAsync({
        name: validatedData.name,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
        isActive: true,
        ageGroups: ageGroupMappings
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create seasonal scope",
          variant: "destructive"
        });
      }
    }
  };

  const handleEdit = (scope: SeasonalScope) => {
    setEditingScope(scope.id ?? null);
    setEditForm({
      name: scope.name,
      startYear: scope.startYear,
      endYear: scope.endYear
    });
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateScopeMutation.mutateAsync({
        id,
        scope: editForm
      });
    } catch (error) {
      console.error('Failed to update scope:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingScope(null);
    setEditForm({});
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

          {selectedEndYear && (
            <Card className="mt-4">
              <CardContent className="p-4">
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
            {scopesQuery.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No seasonal scopes created yet.</p>
            ) : (
              <div className="space-y-2">
                {scopesQuery.data?.map((scope: SeasonalScope) => (
                  <Card key={scope.id} className="p-4">
                    {editingScope === scope.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Start Year</Label>
                            <Input
                              type="number"
                              value={editForm.startYear}
                              onChange={(e) => setEditForm({ ...editForm, startYear: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label>End Year</Label>
                            <Input
                              type="number"
                              value={editForm.endYear}
                              onChange={(e) => setEditForm({ ...editForm, endYear: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateScopeMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleUpdate(scope.id!)}
                            disabled={updateScopeMutation.isPending}
                          >
                            {updateScopeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{scope.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {scope.startYear} - {scope.endYear}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewScope(scope)} // Updated line
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(scope)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Updated View Modal */}
          <Dialog open={isViewModalOpen} onOpenChange={handleCloseViewModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              {viewingScope && (
                <>
                  <DialogHeader>
                    <DialogTitle>{viewingScope.name}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Start Year:</span>
                        <span className="ml-2 font-medium">{viewingScope.startYear}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">End Year:</span>
                        <span className="ml-2 font-medium">{viewingScope.endYear}</span>
                      </div>
                    </div>

                    {Array.isArray(viewingScope.ageGroups) && viewingScope.ageGroups.length > 0 ? (
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
                          {viewingScope.ageGroups
                            .sort((a, b) => {
                              if (a.birthYear !== b.birthYear) {
                                return b.birthYear - a.birthYear;
                              }
                              return a.gender.localeCompare(b.gender);
                            })
                            .map((group) => (
                              <TableRow key={`${group.gender}-${group.birthYear}-${group.id}`}>
                                <TableCell>{group.birthYear}</TableCell>
                                <TableCell>{group.divisionCode}</TableCell>
                                <TableCell>{group.ageGroup}</TableCell>
                                <TableCell>{group.gender}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No age groups found for this seasonal scope.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}