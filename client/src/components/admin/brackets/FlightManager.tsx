import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Loader2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Utility function to format flight names
const formatFlightName = (level: string | undefined | null): string => {
  if (!level) return 'Not specified';
  
  switch (level) {
    case 'top_flight':
      return 'Top Flight';
    case 'middle_flight':
      return 'Middle Flight';
    case 'bottom_flight':
      return 'Bottom Flight';
    case 'other':
      return 'Other';
    default:
      // Handle legacy values
      return level.charAt(0).toUpperCase() + level.slice(1);
  }
};

// Define type for a bracket
type Bracket = {
  id: number;
  event_id: number;
  age_group_id: number;
  name: string;
  description: string | null;
  level: string;
  eligibility: string | null;
  created_at: string;
  updated_at: string;
};

// Type for the form data
type BracketFormData = {
  name: string;
  description: string;
  level: string;
  eligibility: string;
};

// Component props
interface FlightManagerProps {
  ageGroupId: number;
  eventId?: string; // Add eventId prop
}

export function FlightManager({ ageGroupId, eventId }: FlightManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null);
  const [formData, setFormData] = useState<BracketFormData>({
    name: "",
    description: "",
    level: "middle_flight",
    eligibility: "",
  });

  const queryClient = useQueryClient();

  // Fetch brackets for this age group
  const {
    data: brackets = [], // Initialize with empty array to prevent map errors
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["brackets", ageGroupId, eventId],
    queryFn: async () => {
      // Use admin endpoint when eventId is provided, otherwise fallback to public endpoint
      const endpoint = eventId 
        ? `/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets`
        : `/api/age-groups/${ageGroupId}/brackets`;
      
      const { data } = await axios.get(endpoint);
      return data;
    },
    enabled: !!ageGroupId,
  });

  // Create bracket mutation
  const createBracketMutation = useMutation({
    mutationFn: async (data: BracketFormData) => {
      const response = await axios.post(`/api/admin/events/${eventId}/brackets`, {
        ...data,
        ageGroupId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", ageGroupId, eventId] });
      toast.success("Bracket created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create bracket: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Update bracket mutation
  const updateBracketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BracketFormData }) => {
      const response = await axios.put(`/api/admin/events/${eventId}/brackets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", ageGroupId, eventId] });
      toast.success("Bracket updated successfully");
      setIsEditDialogOpen(false);
      setSelectedBracket(null);
    },
    onError: (error) => {
      toast.error(`Failed to update bracket: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Delete bracket mutation
  const deleteBracketMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/admin/events/${eventId}/brackets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", ageGroupId, eventId] });
      toast.success("Bracket deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedBracket(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete bracket: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBracketMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBracket) {
      updateBracketMutation.mutate({ id: selectedBracket.id, data: formData });
    }
  };

  const handleDelete = () => {
    if (selectedBracket) {
      deleteBracketMutation.mutate(selectedBracket.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      level: "middle_flight",
      eligibility: "",
    });
  };

  const openEditDialog = (bracket: Bracket) => {
    setSelectedBracket(bracket);
    setFormData({
      name: bracket.name,
      description: bracket.description || "",
      level: bracket.level,
      eligibility: bracket.eligibility || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (bracket: Bracket) => {
    setSelectedBracket(bracket);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading brackets...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 border border-destructive rounded bg-destructive/10 text-destructive">
        <p>Failed to load brackets. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Brackets</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Bracket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Bracket</DialogTitle>
              <DialogDescription>
                Add a new bracket for this age group. Teams will be able to select from these brackets during registration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Gold Division"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="level" className="text-sm font-medium">Skill Level</label>
                <Select
                  name="level"
                  value={formData.level}
                  onValueChange={(value) => handleSelectChange("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top_flight">Top Flight</SelectItem>
                    <SelectItem value="middle_flight">Middle Flight</SelectItem>
                    <SelectItem value="bottom_flight">Bottom Flight</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the skill level and expectations for this bracket"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="eligibility" className="text-sm font-medium">Eligibility (Optional)</label>
                <Textarea
                  id="eligibility"
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleInputChange}
                  placeholder="Any specific eligibility requirements"
                  rows={2}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBracketMutation.isPending}>
                  {createBracketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Bracket
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {brackets && brackets.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brackets.map((bracket: Bracket) => (
              <TableRow key={bracket.id}>
                <TableCell className="font-medium">{bracket.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatFlightName(bracket.level)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {bracket.description || "No description"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(bracket)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(bracket)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-4">
              <p className="text-muted-foreground">No brackets created yet.</p>
              <p className="text-muted-foreground text-sm">
                Create brackets to allow teams to select their competitive level during registration.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Bracket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Bracket</DialogTitle>
            <DialogDescription>
              Update the bracket information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-level" className="text-sm font-medium">Skill Level</label>
              <Select
                name="level"
                value={formData.level}
                onValueChange={(value) => handleSelectChange("level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top_flight">Top Flight</SelectItem>
                  <SelectItem value="middle_flight">Middle Flight</SelectItem>
                  <SelectItem value="bottom_flight">Bottom Flight</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-eligibility" className="text-sm font-medium">Eligibility (Optional)</label>
              <Textarea
                id="edit-eligibility"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleInputChange}
                rows={2}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBracketMutation.isPending}>
                {updateBracketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the bracket "{selectedBracket?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleteBracketMutation.isPending}
            >
              {deleteBracketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}