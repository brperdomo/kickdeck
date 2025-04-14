import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define types
type Bracket = {
  id: number;
  eventId: string;
  ageGroupId: number;
  name: string;
  description: string | null;
  level: string; // 'beginner', 'intermediate', 'advanced', 'elite'
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// Form schema
const bracketSchema = z.object({
  name: z.string().min(1, "Bracket name is required"),
  description: z.string().optional().nullable(),
  level: z.string().min(1, "Level is required"),
});

type BracketFormValues = z.infer<typeof bracketSchema>;

export function BracketManager({ ageGroupId }: { ageGroupId: number }) {
  const { id: eventId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBracket, setEditingBracket] = useState<Bracket | null>(null);
  const [deletingBracketId, setDeletingBracketId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Initialize form
  const form = useForm<BracketFormValues>({
    resolver: zodResolver(bracketSchema),
    defaultValues: {
      name: "",
      description: "",
      level: "intermediate",
    },
  });

  // Query to fetch brackets for this age group
  const {
    data: brackets,
    isLoading,
    isError,
    error,
  } = useQuery<Bracket[]>({
    queryKey: ["brackets", eventId, ageGroupId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets`);
      return data;
    },
  });

  // Mutation to create/update a bracket
  const bracketMutation = useMutation({
    mutationFn: async (data: BracketFormValues) => {
      if (editingBracket) {
        // Update existing bracket
        return axios.put(
          `/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets/${editingBracket.id}`,
          data
        );
      } else {
        // Create new bracket
        return axios.post(
          `/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets`,
          data
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", eventId, ageGroupId] });
      toast({
        title: editingBracket ? "Bracket Updated" : "Bracket Created",
        description: editingBracket
          ? "The bracket has been updated successfully."
          : "A new bracket has been created successfully.",
      });
      setIsDialogOpen(false);
      setEditingBracket(null);
      form.reset();
    },
    onError: (error) => {
      console.error("Error saving bracket:", error);
      toast({
        title: "Error",
        description: "Failed to save the bracket. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a bracket
  const deleteBracketMutation = useMutation({
    mutationFn: async (bracketId: number) => {
      return axios.delete(
        `/api/admin/events/${eventId}/age-groups/${ageGroupId}/brackets/${bracketId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brackets", eventId, ageGroupId] });
      toast({
        title: "Bracket Deleted",
        description: "The bracket has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setDeletingBracketId(null);
    },
    onError: (error) => {
      console.error("Error deleting bracket:", error);
      toast({
        title: "Error",
        description: "Failed to delete the bracket. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle opening dialog for new bracket
  const handleAddBracket = () => {
    form.reset({
      name: "",
      description: "",
      level: "intermediate",
    });
    setEditingBracket(null);
    setIsDialogOpen(true);
  };

  // Handle opening dialog for editing a bracket
  const handleEditBracket = (bracket: Bracket) => {
    form.reset({
      name: bracket.name,
      description: bracket.description || "",
      level: bracket.level,
    });
    setEditingBracket(bracket);
    setIsDialogOpen(true);
  };

  // Handle delete confirmation dialog
  const handleDeleteConfirmation = (bracketId: number) => {
    setDeletingBracketId(bracketId);
    setIsDeleteDialogOpen(true);
  };

  // Submit handler for the form
  const onSubmit = async (data: BracketFormValues) => {
    bracketMutation.mutate(data);
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading brackets...</span>
      </div>
    );
  }

  // Display error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading brackets</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Brackets</h3>
        <Button
          onClick={handleAddBracket}
          size="sm"
          className="flex items-center"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Bracket
        </Button>
      </div>

      {brackets && brackets.length > 0 ? (
        <Card>
          <CardContent className="p-0">
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
                {brackets.map((bracket) => (
                  <TableRow key={bracket.id}>
                    <TableCell className="font-medium">{bracket.name}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        bracket.level === 'beginner' ? 'bg-green-100 text-green-800' :
                        bracket.level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                        bracket.level === 'advanced' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bracket.level.charAt(0).toUpperCase() + bracket.level.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {bracket.description || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBracket(bracket)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConfirmation(bracket.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center p-8 bg-muted/50 rounded-md">
          <p className="text-muted-foreground">No brackets found for this age group.</p>
          <p className="text-sm mt-1">
            Create brackets to allow teams to select their skill level during registration.
          </p>
        </div>
      )}

      {/* Dialog for adding/editing brackets */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBracket ? "Edit Bracket" : "Add Bracket"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bracket Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gold Division" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the bracket that teams will select.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitive Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The competitive level for this bracket.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Bracket description (optional)"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional information about this bracket to help teams choose the right level.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={bracketMutation.isPending}>
                  {bracketMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for delete confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Bracket</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this bracket? This action cannot be undone.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Note: Deleting a bracket will remove it as an option for future team registrations,
              but existing teams that have selected this bracket will keep their selection.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingBracketId && deleteBracketMutation.mutate(deletingBracketId)}
              disabled={deleteBracketMutation.isPending}
            >
              {deleteBracketMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}