import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BracketSelector } from "../registration/BracketSelector";
import { formatPhoneNumber } from "@/utils/phone-formatter";

// Define a proper schema to handle coach data structure
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  headCoachName: z.string().optional(),
  headCoachEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  headCoachPhone: z.string().optional(),
  assistantCoachName: z.string().optional(),
  assistantCoachEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  assistantCoachPhone: z.string().optional(),
  clubName: z.string().optional(),
  managerName: z.string().optional(),
  managerPhone: z.string().optional(),
  managerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  ageGroupId: z.string().optional(),
  bracketId: z.number().nullable().optional(),
  gender: z.enum(["Boys", "Girls"]).optional(),
  status: z.enum(["registered", "approved", "rejected", "paid", "withdrawn", "refunded", "waitlisted"]).optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: {
    id: number;
    name: string;
    coach?: string;
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;
    coachData?: {
      headCoachName?: string;
      headCoachEmail?: string;
      headCoachPhone?: string;
      assistantCoachName?: string;
      assistantCoachEmail?: string;
      assistantCoachPhone?: string;
    };
    clubName?: string;
    eventId?: string;
    ageGroupId?: number;
    ageGroup?: {
      id: number;
      ageGroup: string;
      gender: string;
      fieldSize?: string;
      divisionCode?: string;
    };
    event?: {
      id: number;
      name: string;
      startDate?: string;
      endDate?: string;
    };
    bracketId?: number | null;
    status?: string;
  };
}

export function TeamModal({ isOpen, onClose, team }: TeamModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGender, setSelectedGender] = useState<string>(""); 
  
  // Fetch age groups for this event if we have an eventId
  const ageGroupsQuery = useQuery({
    queryKey: ['/api/admin/events/age-groups', team?.eventId],
    queryFn: async () => {
      if (!team?.eventId) return [];

      const response = await fetch(`/api/admin/events/${team.eventId}/age-groups`);

      if (!response.ok) {
        throw new Error('Failed to fetch age groups');
      }

      return response.json();
    },
    enabled: !!team?.eventId,
    staleTime: 30000, // Cache for 30 seconds
  });
  
  // State to track the selected age group for brackets query
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string | null>(
    team?.ageGroupId ? String(team.ageGroupId) : null
  );
  
  // Fetch brackets for the selected age group
  const bracketsQuery = useQuery({
    queryKey: ['/api/brackets', team?.eventId, selectedAgeGroupId],
    queryFn: async () => {
      if (!team?.eventId || !selectedAgeGroupId) return [];
      
      console.log(`Fetching brackets for event ${team.eventId} and age group ${selectedAgeGroupId}`);
      const response = await fetch(`/api/brackets?eventId=${team.eventId}&ageGroupId=${selectedAgeGroupId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch brackets');
      }
      
      return response.json();
    },
    enabled: !!team?.eventId && !!selectedAgeGroupId,
  });
  
  // Parse coach data if it's a string
  const parseCoachData = () => {
    if (!team?.coach) return {};
    
    try {
      if (typeof team.coach === 'string') {
        return JSON.parse(team.coach);
      }
      return team.coach;
    } catch (e) {
      console.error("Error parsing coach data:", e);
      return {};
    }
  };
  
  const coachData = team?.coachData || parseCoachData();
  
  // Initialize the form with the team schema and default values
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team?.name || "",
      managerName: team?.managerName || "",
      managerPhone: team?.managerPhone || "",
      managerEmail: team?.managerEmail || "",
      headCoachName: coachData.headCoachName || "",
      headCoachEmail: coachData.headCoachEmail || "",
      headCoachPhone: coachData.headCoachPhone || "",
      assistantCoachName: coachData.assistantCoachName || "",
      assistantCoachEmail: coachData.assistantCoachEmail || "",
      assistantCoachPhone: coachData.assistantCoachPhone || "",
      clubName: team?.clubName || "",
      ageGroupId: team?.ageGroupId ? String(team.ageGroupId) : "",
      bracketId: team?.bracketId || null,
      gender: (team?.ageGroup?.gender as "Boys" | "Girls") || undefined,
      status: (team?.status as any) || "registered",
    },
  });

  // Reset form when team changes
  useEffect(() => {
    if (team && ageGroupsQuery.data) {
      const coachData = team.coachData || parseCoachData();
      
      // Find the current team's gender from age groups
      const currentAgeGroup = ageGroupsQuery.data.find((ag: any) => ag.id === team.ageGroupId);
      const currentGender = currentAgeGroup?.gender || team?.ageGroup?.gender || "";
      
      form.reset({
        name: team.name || "",
        managerName: team.managerName || "",
        managerPhone: team.managerPhone || "",
        managerEmail: team.managerEmail || "",
        headCoachName: coachData.headCoachName || "",
        headCoachEmail: coachData.headCoachEmail || "",
        headCoachPhone: coachData.headCoachPhone || "",
        assistantCoachName: coachData.assistantCoachName || "",
        assistantCoachEmail: coachData.assistantCoachEmail || "",
        assistantCoachPhone: coachData.assistantCoachPhone || "",
        clubName: team.clubName || "",
        ageGroupId: team.ageGroupId ? String(team.ageGroupId) : "",
        bracketId: team.bracketId || null,
        gender: currentGender as "Boys" | "Girls",
        status: team.status as any || "registered",
      });
      
      // Initialize the age group ID and gender for bracket fetching
      if (team.ageGroupId) {
        setSelectedAgeGroupId(String(team.ageGroupId));
      }
      if (currentGender) {
        setSelectedGender(currentGender);
      }
    }
  }, [team, form, ageGroupsQuery.data]);
  
  // Watch for age group changes and update the selected age group for bracket fetching
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'ageGroupId' && value.ageGroupId) {
        console.log(`Age group changed to ${value.ageGroupId}, updating selectedAgeGroupId`);
        setSelectedAgeGroupId(value.ageGroupId);
        
        // Reset the bracket selection when age group changes
        form.setValue('bracketId', null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const updateTeamMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      // Create the coach data object
      const coachData = {
        headCoachName: data.headCoachName,
        headCoachEmail: data.headCoachEmail,
        headCoachPhone: data.headCoachPhone,
        assistantCoachName: data.assistantCoachName,
        assistantCoachEmail: data.assistantCoachEmail,
        assistantCoachPhone: data.assistantCoachPhone,
      };
      
      // Convert coach data to JSON string
      const coach = JSON.stringify(coachData);
      
      // Prepare the payload with the correct structure
      const payload = {
        name: data.name,
        coach: coach,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerEmail: data.managerEmail,
        clubName: data.clubName,
        ageGroupId: data.ageGroupId ? parseInt(data.ageGroupId) : undefined,
        bracketId: data.bracketId || null,
        status: data.status,
        skipEmail: true, // Silent status change - no emails sent
      };
      
      console.log("Sending PATCH request to /api/admin/teams/" + team?.id, payload);
      
      const response = await fetch(`/api/admin/teams/${team?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText = "Failed to update team: " + response.status;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || errorText;
        } catch (parseError) {
          // If the response isn't JSON, use response.text() instead
          try {
            errorText = await response.text();
          } catch (textError) {
            console.error("Error parsing error response:", textError);
          }
        }
        console.error("Error updating team:", errorText);
        throw new Error(errorText);
      }

      const responseData = await response.json();
      console.log("Update succeeded, response:", responseData);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      // Also invalidate the specific team query
      if (team?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/teams/${team.id}`] });
      }
      // Invalidate flight-review data to sync with Master Schedule
      if (team?.eventId) {
        queryClient.invalidateQueries({ queryKey: ['flight-review', team.eventId.toString()] });
      }
      // Invalidate any age group or bracket related queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['age-groups'] });
      queryClient.invalidateQueries({ queryKey: ['brackets'] });
      
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamFormValues) => {
    console.log("Submitting form with data:", data);
    updateTeamMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Manager Information</h3>
                <FormField
                  control={form.control}
                  name="managerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="managerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel" 
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          placeholder="(555) 123-4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="managerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Head Coach Information</h3>
                <FormField
                  control={form.control}
                  name="headCoachName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Coach Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="headCoachPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Coach Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel" 
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          placeholder="(555) 123-4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="headCoachEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Coach Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Assistant Coach Information</h3>
                <FormField
                  control={form.control}
                  name="assistantCoachName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistant Coach Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assistantCoachPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistant Coach Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel" 
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          placeholder="(555) 123-4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assistantCoachEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistant Coach Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Team Organization</h3>
                
                {/* Current Registration Information - Read Only Display */}
                {team && (
                  <div className="bg-muted/30 rounded-md p-4 border">
                    <h4 className="font-medium mb-3">Current Registration Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Event:</span>
                        <div>{team.event?.name || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Age Group:</span>
                        <div>{team.ageGroup?.ageGroup || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Division:</span>
                        <div>{team.ageGroup?.divisionCode || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Gender:</span>
                        <div>{team.ageGroup?.gender || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="clubName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club/Organization Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedGender(value);
                          // Clear age group selection when gender changes
                          form.setValue("ageGroupId", "");
                          form.setValue("bracketId", null);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Boys">Boys</SelectItem>
                          <SelectItem value="Girls">Girls</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageGroupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedAgeGroupId(value); // Update the age group for brackets query
                        }}
                        disabled={ageGroupsQuery.isLoading || !team?.eventId || !selectedGender}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedGender ? "Select age group" : "Select gender first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ageGroupsQuery.isLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading age groups...
                            </SelectItem>
                          ) : ageGroupsQuery.isError ? (
                            <SelectItem value="error" disabled>
                              Error loading age groups
                            </SelectItem>
                          ) : ageGroupsQuery.data?.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No age groups available
                            </SelectItem>
                          ) : (
                            ageGroupsQuery.data?.filter((ageGroup: any) => 
                              ageGroup.isEligible !== false && 
                              (!selectedGender || ageGroup.gender === selectedGender)
                            ).map((ageGroup: any) => (
                              <SelectItem key={ageGroup.id} value={String(ageGroup.id)}>
                                {ageGroup.ageGroup} ({ageGroup.gender})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Bracket Selector */}
                <FormField
                  control={form.control}
                  name="bracketId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bracket Selection</FormLabel>
                      {bracketsQuery.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading brackets...</span>
                        </div>
                      ) : bracketsQuery.isError ? (
                        <div className="text-sm text-destructive">
                          Error loading brackets
                        </div>
                      ) : bracketsQuery.data?.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No brackets available for this age group
                        </div>
                      ) : (
                        <FormControl>
                          <BracketSelector
                            brackets={bracketsQuery.data || []}
                            value={field.value ?? null}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Team Status Section */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Team Status Management</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Silent Status Change:</strong> Changing the team status here will not send emails or trigger payment processing. Use this for administrative adjustments only.
                </p>
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="registered">Registered (Pending Review)</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="waitlisted">Waitlisted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTeamMutation.isPending}>
                {updateTeamMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
