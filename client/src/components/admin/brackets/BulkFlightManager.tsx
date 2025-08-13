import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

type AgeGroup = {
  id: number;
  eventId: string;
  ageGroup: string;
  gender: string;
  divisionCode: string;
  isSelected?: boolean;
};

type BracketTemplate = {
  name: string;
  description: string;
};

export function BulkFlightManager() {
  const { id: eventId } = useParams<{ id: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [bracketTemplates, setBracketTemplates] = useState<BracketTemplate[]>([
    { name: "", description: "" }
  ]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch all age groups for this event
  const {
    data: fetchedAgeGroups,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["event-age-groups", eventId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/events/${eventId}/age-groups`);
      return data;
    },
    enabled: !!eventId
  });
  
  // Set age groups with selection state when data is available
  useEffect(() => {
    if (fetchedAgeGroups) {
      // Add isSelected property to each age group
      const ageGroupsWithSelection = fetchedAgeGroups.map((ag: AgeGroup) => ({
        ...ag,
        isSelected: false
      }));
      setAgeGroups(ageGroupsWithSelection);
    }
  }, [fetchedAgeGroups]);

  // Create brackets in bulk mutation
  const createBracketsMutation = useMutation({
    mutationFn: async ({ 
      ageGroupIds, 
      brackets, 
      replaceExisting 
    }: { 
      ageGroupIds: number[]; 
      brackets: BracketTemplate[]; 
      replaceExisting: boolean 
    }) => {
      const response = await axios.post(`/api/admin/events/${eventId}/bulk-brackets`, {
        ageGroupIds,
        brackets,
        replaceExisting
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Created ${data.createdBrackets.length} brackets across ${ageGroups.filter(ag => ag.isSelected).length} age groups`);
      queryClient.invalidateQueries({ queryKey: ["brackets"] });
      
      // Show errors if any
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error: any) => {
          toast.error(error.message);
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create brackets: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  // Add a new bracket template
  const addBracketTemplate = () => {
    setBracketTemplates([...bracketTemplates, { name: "", description: "" }]);
  };

  // Remove a bracket template
  const removeBracketTemplate = (index: number) => {
    if (bracketTemplates.length > 1) {
      const updatedTemplates = [...bracketTemplates];
      updatedTemplates.splice(index, 1);
      setBracketTemplates(updatedTemplates);
    } else {
      toast.error("You must have at least one bracket template");
    }
  };

  // Update a bracket template
  const updateBracketTemplate = (index: number, field: keyof BracketTemplate, value: string) => {
    const updatedTemplates = [...bracketTemplates];
    updatedTemplates[index] = { ...updatedTemplates[index], [field]: value };
    setBracketTemplates(updatedTemplates);
  };

  // Toggle selection of an age group
  const toggleAgeGroupSelection = (id: number) => {
    const updatedAgeGroups = ageGroups.map(ag => 
      ag.id === id ? { ...ag, isSelected: !ag.isSelected } : ag
    );
    setAgeGroups(updatedAgeGroups);
    
    // Update selectAll state
    const allSelected = updatedAgeGroups.every(ag => ag.isSelected);
    setSelectAll(allSelected);
  };

  // Toggle select all age groups
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const updatedAgeGroups = ageGroups.map(ag => ({ 
      ...ag, 
      isSelected: newSelectAll 
    }));
    setAgeGroups(updatedAgeGroups);
  };

  // Reset the form
  const resetForm = () => {
    setBracketTemplates([{ name: "", description: "" }]);
    setReplaceExisting(false);
    
    // Reset all age group selections
    const resetAgeGroups = ageGroups.map(ag => ({ ...ag, isSelected: false }));
    setAgeGroups(resetAgeGroups);
    setSelectAll(false);
  };

  // Submit the form
  const handleSubmit = () => {
    // Validation
    const selectedAgeGroups = ageGroups.filter(ag => ag.isSelected);
    if (selectedAgeGroups.length === 0) {
      toast.error("You must select at least one age group");
      return;
    }

    // Validate bracket templates
    const validTemplates = bracketTemplates.every(template => template.name.trim() !== "");
    if (!validTemplates) {
      toast.error("All bracket templates must have a name");
      return;
    }

    // Execute the bulk creation
    createBracketsMutation.mutate({
      ageGroupIds: selectedAgeGroups.map(ag => ag.id),
      brackets: bracketTemplates,
      replaceExisting
    });
  };

  // Get the display name for the age group - use original gender values
  const getAgeGroupDisplayName = (ageGroup: AgeGroup) => {
    return `${ageGroup.gender} ${ageGroup.ageGroup}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading age groups...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading age groups</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!ageGroups || ageGroups.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Age Groups Found</AlertTitle>
        <AlertDescription>
          You need to add age groups to your event before you can manage brackets.
          Please go to the "Age Groups" tab to add age groups first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Bulk Flight Management</CardTitle>
        <CardDescription>
          Create and manage flights for multiple age groups at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-4">Create Flights in Bulk</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Flights in Bulk</DialogTitle>
              <DialogDescription>
                Define flight templates and apply them to multiple age groups at once
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Bracket templates section */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Bracket Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Create bracket templates to apply to selected age groups
                </p>
                
                <div className="space-y-4 mt-2">
                  {bracketTemplates.map((template, index) => (
                    <div key={index} className="grid gap-2 border p-3 rounded-md relative">
                      <div className="flex items-start justify-between">
                        <div className="grid gap-2 flex-1">
                          <Label htmlFor={`template-name-${index}`}>Bracket Name</Label>
                          <Input
                            id={`template-name-${index}`}
                            value={template.name}
                            onChange={(e) => updateBracketTemplate(index, "name", e.target.value)}
                            placeholder="e.g., Premier, Elite, Classic"
                          />
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 mt-6"
                          onClick={() => removeBracketTemplate(index)}
                          disabled={bracketTemplates.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor={`template-desc-${index}`}>Description (Optional)</Label>
                        <Textarea
                          id={`template-desc-${index}`}
                          value={template.description}
                          onChange={(e) => updateBracketTemplate(index, "description", e.target.value)}
                          placeholder="Describe this bracket level..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addBracketTemplate}
                    className="mt-2"
                    type="button"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Another Bracket
                  </Button>
                </div>
              </div>
              
              {/* Age group selection section */}
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-medium">Select Age Groups</h3>
                <p className="text-sm text-muted-foreground">
                  Select age groups where these brackets should be created
                </p>
                
                <div className="border rounded-md p-2 mt-2">
                  <div className="flex items-center p-2 border-b">
                    <Checkbox 
                      id="select-all" 
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all" className="ml-2 font-medium flex-1">
                      Select All Age Groups
                    </Label>
                  </div>
                  
                  <ScrollArea className="h-[200px] mt-2">
                    <div className="space-y-2 p-2">
                      {ageGroups.map((ageGroup) => (
                        <div key={ageGroup.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`ag-${ageGroup.id}`}
                            checked={ageGroup.isSelected}
                            onCheckedChange={() => toggleAgeGroupSelection(ageGroup.id)}
                          />
                          <Label htmlFor={`ag-${ageGroup.id}`} className="flex-1">
                            {getAgeGroupDisplayName(ageGroup)} - {ageGroup.divisionCode}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* Replace existing option */}
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox 
                  id="replace-existing" 
                  checked={replaceExisting}
                  onCheckedChange={(checked) => setReplaceExisting(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="replace-existing">
                    Replace existing brackets
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Warning: This will remove all existing brackets for the selected age groups!
                    This action will fail if teams are already assigned to these brackets.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Reset</Button>
              <Button 
                onClick={handleSubmit}
                disabled={createBracketsMutation.isPending}
              >
                {createBracketsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Brackets
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Summary table showing age groups and bracket counts */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">
            This table shows the current brackets for each age group.
          </p>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Division Code</TableHead>
                  <TableHead className="text-right">Number of Brackets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ageGroups.map((ageGroup) => (
                  <AgeGroupBracketRow 
                    key={ageGroup.id} 
                    ageGroup={ageGroup} 
                    eventId={eventId} 
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to fetch and display bracket count for an age group
function AgeGroupBracketRow({ ageGroup, eventId }: { ageGroup: AgeGroup, eventId?: string }) {
  // Fetch brackets for this age group
  const { data: brackets, isLoading } = useQuery({
    queryKey: ["brackets", ageGroup.id, eventId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/admin/events/${eventId}/age-groups/${ageGroup.id}/brackets`
      );
      return data;
    },
    enabled: !!ageGroup.id && !!eventId,
  });

  // Get the display name for the age group
  const getAgeGroupDisplayName = (ageGroup: AgeGroup) => {
    return `${ageGroup.gender} ${ageGroup.ageGroup}`;
  };

  return (
    <TableRow>
      <TableCell>{getAgeGroupDisplayName(ageGroup)}</TableCell>
      <TableCell>{ageGroup.divisionCode}</TableCell>
      <TableCell className="text-right">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
        ) : (
          brackets?.length || 0
        )}
      </TableCell>
    </TableRow>
  );
}