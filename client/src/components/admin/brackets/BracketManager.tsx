import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, PlusCircle, Trash2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Bracket = {
  id: number;
  eventId: string;
  ageGroupId: number;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type AgeGroup = {
  id: number;
  eventId: string;
  ageGroup: string;
  gender: string;
  divisionCode: string;
};

export function BracketManager({ ageGroupId }: { ageGroupId: number }) {
  const { id: eventId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null);
  const [newBracket, setNewBracket] = useState({
    name: "",
    description: "",
    sortOrder: 0,
  });

  // Fetch age group details
  const { data: ageGroup, isLoading: isAgeGroupLoading } = useQuery<AgeGroup>({
    queryKey: ["age-groups", ageGroupId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/admin/events/${eventId}/age-groups/${ageGroupId}`
      );
      return data;
    },
    enabled: !!ageGroupId,
  });

  // Fetch brackets for the age group
  const {
    data: brackets,
    isLoading: isBracketsLoading,
    isError,
    error,
  } = useQuery<Bracket[]>({
    queryKey: ["brackets", eventId, ageGroupId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets`
      );
      return data;
    },
    enabled: !!eventId && !!ageGroupId,
  });

  // Create bracket mutation
  const createBracketMutation = useMutation({
    mutationFn: async (bracket: {
      name: string;
      description: string;
      sortOrder: number;
    }) => {
      const { data } = await axios.post(
        `/api/admin/events/${eventId}/brackets`,
        {
          ...bracket,
          ageGroupId,
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", eventId, ageGroupId] });
      toast({
        title: "Success",
        description: "Bracket created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewBracket({
        name: "",
        description: "",
        sortOrder: 0,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create bracket: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    },
  });

  // Update bracket mutation
  const updateBracketMutation = useMutation({
    mutationFn: async (bracket: {
      id: number;
      name: string;
      description: string;
      sortOrder: number;
    }) => {
      const { data } = await axios.put(
        `/api/admin/events/${eventId}/brackets/${bracket.id}`,
        {
          name: bracket.name,
          description: bracket.description,
          sortOrder: bracket.sortOrder,
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", eventId, ageGroupId] });
      toast({
        title: "Success",
        description: "Bracket updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedBracket(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update bracket: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    },
  });

  // Delete bracket mutation
  const deleteBracketMutation = useMutation({
    mutationFn: async (bracketId: number) => {
      const { data } = await axios.delete(
        `/api/admin/events/${eventId}/brackets/${bracketId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", eventId, ageGroupId] });
      toast({
        title: "Success",
        description: "Bracket deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete bracket: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    },
  });

  // Handle form submission for creating a new bracket
  const handleCreateBracket = (e: React.FormEvent) => {
    e.preventDefault();
    createBracketMutation.mutate(newBracket);
  };

  // Handle form submission for updating a bracket
  const handleUpdateBracket = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBracket) {
      updateBracketMutation.mutate({
        id: selectedBracket.id,
        name: selectedBracket.name,
        description: selectedBracket.description || "",
        sortOrder: selectedBracket.sortOrder,
      });
    }
  };

  // Handle opening the edit dialog
  const handleEditBracket = (bracket: Bracket) => {
    setSelectedBracket(bracket);
    setIsEditDialogOpen(true);
  };

  // Handle deleting a bracket with confirmation
  const handleDeleteBracket = (bracketId: number) => {
    if (window.confirm("Are you sure you want to delete this bracket? This cannot be undone.")) {
      deleteBracketMutation.mutate(bracketId);
    }
  };

  if (isAgeGroupLoading || isBracketsLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading brackets: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Brackets for {ageGroup?.ageGroup} {ageGroup?.gender}{" "}
          <Badge variant="outline">{ageGroup?.divisionCode}</Badge>
        </CardTitle>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Bracket
        </Button>
      </CardHeader>
      <CardContent>
        {brackets && brackets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brackets.map((bracket) => (
                <TableRow key={bracket.id}>
                  <TableCell className="font-medium">{bracket.name}</TableCell>
                  <TableCell>{bracket.description}</TableCell>
                  <TableCell>{bracket.sortOrder}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBracket(bracket)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBracket(bracket.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No brackets defined for this age group yet. Click "Add Bracket" to create one.
          </div>
        )}
      </CardContent>

      {/* Create Bracket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bracket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBracket}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bracket Name</Label>
                <Input
                  id="name"
                  value={newBracket.name}
                  onChange={(e) =>
                    setNewBracket({ ...newBracket, name: e.target.value })
                  }
                  placeholder="e.g., Elite, Premier, Select, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newBracket.description}
                  onChange={(e) =>
                    setNewBracket({
                      ...newBracket,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the skill level or qualification criteria for this bracket"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={newBracket.sortOrder}
                  onChange={(e) =>
                    setNewBracket({
                      ...newBracket,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  Lower numbers will appear first in selection lists
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBracketMutation.isPending}
              >
                {createBracketMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Bracket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Bracket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bracket</DialogTitle>
          </DialogHeader>
          {selectedBracket && (
            <form onSubmit={handleUpdateBracket}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Bracket Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedBracket.name}
                    onChange={(e) =>
                      setSelectedBracket({
                        ...selectedBracket,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Elite, Premier, Select, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={selectedBracket.description || ""}
                    onChange={(e) =>
                      setSelectedBracket({
                        ...selectedBracket,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the skill level or qualification criteria for this bracket"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sortOrder">Sort Order</Label>
                  <Input
                    id="edit-sortOrder"
                    type="number"
                    value={selectedBracket.sortOrder}
                    onChange={(e) =>
                      setSelectedBracket({
                        ...selectedBracket,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    Lower numbers will appear first in selection lists
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateBracketMutation.isPending}
                >
                  {updateBracketMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Bracket
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}