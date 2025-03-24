import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Schema for admin selection
const adminSelectionSchema = z.object({
  adminId: z.string().min(1, "You must select an administrator"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

type AdminSelectionFormValues = z.infer<typeof adminSelectionSchema>;

interface EventAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminToEdit?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  } | null;
  eventId?: string | number;
  onSave: () => void;
}

const ROLES = [
  {
    id: "tournament_admin",
    name: "Tournament Admin",
    description: "Manage tournaments and events",
  },
  {
    id: "score_admin",
    name: "Score Admin",
    description: "Manage scores and results",
  },
  {
    id: "finance_admin",
    name: "Finance Admin",
    description: "Manage financial aspects",
  },
];

export function EventAdminModal({ 
  open, 
  onOpenChange, 
  adminToEdit, 
  eventId,
  onSave 
}: EventAdminModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  
  // Fetch available administrators (that aren't already assigned to this event)
  const { data: availableAdmins, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['available-admins', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/available-admins?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available administrators');
      }
      return response.json();
    },
    enabled: open && !adminToEdit,
  });

  const form = useForm<AdminSelectionFormValues>({
    resolver: zodResolver(adminSelectionSchema),
    defaultValues: adminToEdit
      ? {
          adminId: adminToEdit.id,
          roles: adminToEdit.roles || [],
        }
      : {
          adminId: "",
          roles: [],
        },
  });

  // Reset form when modal props change
  useEffect(() => {
    if (adminToEdit) {
      form.reset({
        adminId: adminToEdit.id,
        roles: adminToEdit.roles || [],
      });
      setSelectedAdmin(adminToEdit.id);
    } else {
      form.reset({
        adminId: "",
        roles: [],
      });
      setSelectedAdmin("");
    }
  }, [adminToEdit, form, open]);

  // Create/Update event administrator mutation
  const adminMutation = useMutation({
    mutationFn: async (values: AdminSelectionFormValues) => {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const url = adminToEdit 
        ? `/api/admin/events/${eventId}/administrators/${adminToEdit.id}` 
        : `/api/admin/events/${eventId}/administrators`;
      
      const method = adminToEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save administrator");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh event administrators
      queryClient.invalidateQueries(['event-administrators', eventId]);
      toast({
        title: "Success",
        description: adminToEdit 
          ? "Administrator updated successfully" 
          : "Administrator added to event successfully",
      });
      onSave();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AdminSelectionFormValues) => {
    try {
      await adminMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const toggleRole = (roleId: string) => {
    const currentRoles = form.getValues("roles");
    
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((r) => r !== roleId)
      : [...currentRoles, roleId];
    
    form.setValue("roles", newRoles, { shouldValidate: true });
  };

  const handleAdminSelect = (adminId: string) => {
    setSelectedAdmin(adminId);
    form.setValue("adminId", adminId, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {adminToEdit ? "Edit Event Administrator" : "Add Administrator to Event"}
          </DialogTitle>
          <DialogDescription>
            {adminToEdit
              ? "Update administrator permissions for this event."
              : "Select an administrator to add to this event and assign their roles."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!adminToEdit && (
              <FormField
                control={form.control}
                name="adminId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Administrator</FormLabel>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {isLoadingAdmins ? (
                        <div className="flex items-center justify-center h-20">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : availableAdmins?.length > 0 ? (
                        availableAdmins.map((admin: any) => (
                          <div
                            key={admin.id}
                            onClick={() => handleAdminSelect(admin.id)}
                            className={`
                              p-4 rounded-lg border transition-colors cursor-pointer
                              ${selectedAdmin === admin.id ? "border-primary bg-primary/5" : "hover:bg-accent"}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {admin.firstName} {admin.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {admin.email}
                                </p>
                              </div>
                              {selectedAdmin === admin.id && (
                                <Badge variant="secondary">Selected</Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 text-muted-foreground">
                          No administrators available to add to this event.
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="roles"
              render={() => (
                <FormItem>
                  <FormLabel>Roles for this Event</FormLabel>
                  <div className="space-y-2">
                    {ROLES.map((role) => {
                      const isSelected = form.watch("roles").includes(role.id);

                      return (
                        <div
                          key={role.id}
                          onClick={() => toggleRole(role.id)}
                          className={`
                            p-4 rounded-lg border transition-colors cursor-pointer
                            ${isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{role.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {role.description}
                              </p>
                            </div>
                            {isSelected && (
                              <Badge variant="secondary">Selected</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adminMutation.isPending}>
                {adminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {adminToEdit ? "Update Roles" : "Add to Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}