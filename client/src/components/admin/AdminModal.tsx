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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Base schema without password
const baseSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

// Create schema includes password
const createSchema = baseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Edit schema excludes password
const editSchema = baseSchema;

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

const ROLES = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Full system access and overrides all other roles",
  },
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

export function AdminModal({ open, onOpenChange, admin }: AdminModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailExists, setEmailExists] = useState(false);

  const form = useForm<CreateFormValues | EditFormValues>({
    resolver: zodResolver(admin ? editSchema : createSchema),
    defaultValues: admin
      ? {
          email: admin.email || "",
          firstName: admin.firstName || "",
          lastName: admin.lastName || "",
          roles: admin.roles || [],
        }
      : {
          email: "",
          firstName: "",
          lastName: "",
          password: "",
          roles: [],
        },
  });

  // Reset form when admin prop changes
  useEffect(() => {
    if (admin) {
      form.reset({
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        roles: admin.roles,
      });
    } else {
      form.reset({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        roles: [],
      });
    }
  }, [admin, form]);

  // Check email existence
  const checkEmail = async (email: string) => {
    try {
      // Always clear existing error first
      form.clearErrors("email");
      
      // Skip check if editing and email is unchanged
      if (admin && email === admin.email) {
        setEmailExists(false);
        return; 
      }
      
      const response = await fetch(`/api/admin/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      console.log("Email check response:", data);
      
      // Only set error if it's actually a duplicate
      setEmailExists(data.exists);
      if (data.exists) {
        form.setError("email", { message: "This email is already registered" });
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailExists(false);
    }
  };

  // Create/Update admin mutation
  const adminMutation = useMutation({
    mutationFn: async (values: CreateFormValues | EditFormValues) => {
      console.log('Submitting admin mutation:', {
        id: admin?.id,
        isUpdate: !!admin,
        values
      });

      const url = admin ? `/api/admin/administrators/${admin.id}` : "/api/admin/administrators";
      const method = admin ? "PATCH" : "POST";

      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (!response.ok) {
          throw new Error(data.error || data.details || "Failed to save administrator");
        }

        return data;
      } catch (error) {
        console.error('Admin mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Use the same query key as in the admin dashboard to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/admin/administrators'] });
      toast({
        title: "Success",
        description: admin ? "Administrator updated successfully" : "Administrator created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Admin mutation error:", error);
      toast({
        title: admin ? "Error Updating Administrator" : "Error Creating Administrator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateFormValues | EditFormValues) => {
    try {
      // Skip email check when simply updating the same admin with same email
      const isUpdatingSameEmail = admin && data.email === admin.email;
      
      if (emailExists && !isUpdatingSameEmail) {
        form.setError("email", { message: "This email is already registered" });
        return;
      }
      
      // If we're here, we can proceed with the mutation
      console.log("Submitting form with data:", data);
      await adminMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const toggleRole = (roleId: string) => {
    const currentRoles = form.getValues("roles");
    const isSuperAdmin = roleId === "super_admin";

    let newRoles: string[];
    if (isSuperAdmin) {
      newRoles = currentRoles.includes(roleId) ? [] : [roleId];
    } else {
      if (currentRoles.includes("super_admin")) {
        newRoles = [roleId];
      } else {
        newRoles = currentRoles.includes(roleId)
          ? currentRoles.filter((r) => r !== roleId)
          : [...currentRoles, roleId];
      }
    }

    form.setValue("roles", newRoles, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{admin ? "Edit Administrator" : "Add New Administrator"}</DialogTitle>
          <DialogDescription>
            {admin
              ? "Update administrator information and roles."
              : "Create a new administrator by filling out the information below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        checkEmail(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!admin && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimum 8 characters"
                        {...field}
                      />
                    </FormControl>
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
                  <FormLabel>Roles</FormLabel>
                  <div className="space-y-2">
                    {ROLES.map((role) => {
                      const isSelected = form.watch("roles").includes(role.id);
                      const isSuperAdmin = form.watch("roles").includes("super_admin");
                      const isDisabled = isSuperAdmin && role.id !== "super_admin";

                      return (
                        <div
                          key={role.id}
                          onClick={() => !isDisabled && toggleRole(role.id)}
                          className={`
                            p-4 rounded-lg border transition-colors cursor-pointer
                            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
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
              <Button type="submit" disabled={
                adminMutation.isPending || 
                (emailExists && (!admin || form.getValues("email") !== admin.email))
              }>
                {adminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {admin ? "Update Administrator" : "Create Administrator"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}