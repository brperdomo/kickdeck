import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, UserPlus, Trash2, Edit, ShieldCheck, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Admin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface EventAdmin {
  id: number;
  userId: number;
  eventId: string;
  role: string;
  permissions: Record<string, boolean>;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  roles: string[];
}

type AdminRole = 'owner' | 'admin' | 'moderator';

// Define permission types for event admins
const EVENT_PERMISSION_GROUPS = {
  general: ['view_event', 'edit_event', 'view_dashboard'],
  participants: ['view_teams', 'manage_teams', 'view_players', 'manage_players'],
  schedule: ['view_schedule', 'manage_schedule', 'manage_fields'],
  finance: ['view_finances', 'manage_payments', 'issue_refunds'],
  communication: ['send_emails', 'manage_notifications'],
};

// Create a flat list of all permissions
const ALL_EVENT_PERMISSIONS = Object.values(EVENT_PERMISSION_GROUPS).flat();

// Default permissions by role
const DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  owner: ALL_EVENT_PERMISSIONS,
  admin: ['view_event', 'view_dashboard', 'view_teams', 'view_players', 'view_schedule', 'view_finances', 'send_emails'],
  moderator: ['view_event', 'view_dashboard', 'view_teams', 'view_players', 'view_schedule']
};

interface EventAdminModalProps {
  eventId: string | number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminToEdit?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  } | null;
  onSave?: () => void;
}

export default function EventAdminModal({ 
  eventId, 
  open, 
  onOpenChange, 
  adminToEdit, 
  onSave 
}: EventAdminModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>('admin');
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  
  // Set default permissions when role changes
  useEffect(() => {
    if (!editingAdminId) {
      const defaultPerms = DEFAULT_PERMISSIONS[adminRole];
      const permMap: Record<string, boolean> = {};
      ALL_EVENT_PERMISSIONS.forEach(perm => {
        permMap[perm] = defaultPerms.includes(perm);
      });
      setSelectedPermissions(permMap);
    }
  }, [adminRole, editingAdminId]);
  
  // Fetch event administrators
  const { data: eventAdmins, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['event-admins', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/administrators`);
      if (!response.ok) throw new Error('Failed to fetch event administrators');
      return response.json() as Promise<EventAdmin[]>;
    },
    enabled: open
  });

  // Fetch available administrators (admins who aren't assigned to this event yet)
  const { data: availableAdmins, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['available-admins', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/available-admins?eventId=${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch available administrators');
      return response.json() as Promise<Admin[]>;
    },
    enabled: open
  });

  // Add administrator to event mutation
  const addAdminMutation = useMutation({
    mutationFn: async (data: { userId: number; role: string; permissions: Record<string, boolean> }) => {
      const response = await fetch(`/api/admin/events/${eventId}/administrators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add administrator');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refetch data after successful addition
      queryClient.invalidateQueries({ queryKey: ['event-admins', eventId] });
      queryClient.invalidateQueries({ queryKey: ['available-admins', eventId] });
      toast({
        title: "Administrator Added",
        description: "Administrator has been added to this event.",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Administrator",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update administrator role mutation
  const updateAdminMutation = useMutation({
    mutationFn: async ({ adminId, data }: { adminId: number; data: { role: string; permissions?: Record<string, boolean> } }) => {
      const response = await fetch(`/api/admin/events/${eventId}/administrators/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update administrator');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-admins', eventId] });
      toast({
        title: "Administrator Updated",
        description: "Administrator roles have been updated.",
      });
      setPermissionsModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Administrator",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Remove administrator mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/administrators/${adminId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove administrator');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-admins', eventId] });
      queryClient.invalidateQueries({ queryKey: ['available-admins', eventId] });
      toast({
        title: "Administrator Removed",
        description: "Administrator has been removed from this event.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Remove Administrator",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reset form after adding admin
  const resetForm = () => {
    setSelectedAdmin(null);
    setAdminRole('admin');
  };

  // Handle adding an administrator
  const handleAddAdmin = () => {
    if (!selectedAdmin) {
      toast({
        title: "Administrator Required",
        description: "Please select an administrator to add.",
        variant: "destructive",
      });
      return;
    }

    addAdminMutation.mutate({
      userId: selectedAdmin.id,
      role: adminRole,
      permissions: selectedPermissions
    });
  };

  // Handle updating an administrator's role
  const handleUpdateAdmin = (eventAdmin: EventAdmin, role: AdminRole) => {
    updateAdminMutation.mutate({
      adminId: eventAdmin.id,
      data: {
        role
      }
    });
  };

  // Handle removing an administrator
  const handleRemoveAdmin = (adminId: number) => {
    if (confirm("Are you sure you want to remove this administrator from the event?")) {
      removeAdminMutation.mutate(adminId);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-500';
      case 'admin':
        return 'bg-green-500';
      case 'moderator':
        return 'bg-yellow-500';
      default:
        return '';
    }
  };



  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Event Administrators</DialogTitle>
            <DialogDescription>
              Manage administrators for this event. Assigned administrators will have access to manage aspects of this event.
            </DialogDescription>
          </DialogHeader>

          {/* Add Administrator Form */}
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium mb-3">Add Administrator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-select">Select Administrator</Label>
                <Select
                  onValueChange={(value) => {
                    const admin = availableAdmins?.find(a => a.id === parseInt(value));
                    setSelectedAdmin(admin || null);
                  }}
                  value={selectedAdmin ? String(selectedAdmin.id) : ""}
                >
                  <SelectTrigger id="admin-select" className="w-full">
                    <SelectValue placeholder="Select an administrator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Administrators</SelectLabel>
                      {isLoadingAvailable && <div className="p-2 text-center">Loading...</div>}
                      {!isLoadingAvailable && availableAdmins?.length === 0 && (
                        <div className="p-2 text-center">No available administrators</div>
                      )}
                      {availableAdmins?.map((admin) => (
                        <SelectItem key={admin.id} value={String(admin.id)}>
                          {admin.firstName} {admin.lastName} ({admin.email})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role-select">Role</Label>
                <Select
                  onValueChange={(value) => setAdminRole(value as AdminRole)}
                  value={adminRole}
                >
                  <SelectTrigger id="role-select" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleAddAdmin}
                disabled={addAdminMutation.isLoading || !selectedAdmin}
              >
                {addAdminMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Administrator
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Current Administrators Table */}
          <div>
            <h3 className="text-lg font-medium mb-3">Current Administrators</h3>
            {isLoadingAdmins ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2">Loading administrators...</p>
              </div>
            ) : eventAdmins && eventAdmins.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          {admin.user.firstName} {admin.user.lastName}
                        </TableCell>
                        <TableCell>{admin.user.email}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={admin.role}
                            onValueChange={(value) => 
                              handleUpdateAdmin(admin, value as AdminRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <Badge className={`${getRoleBadgeColor(admin.role)} text-white`}>
                                {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon" 
                              onClick={() => {
                                setEditingAdminId(admin.id);
                                setSelectedPermissions(admin.permissions || {});
                                setPermissionsModalOpen(true);
                              }}
                              title="Edit Permissions"
                            >
                              <Settings className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAdmin(admin.id)}
                              disabled={removeAdminMutation.isLoading}
                              title="Remove Administrator"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center border rounded-md">
                <ShieldCheck className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No administrators assigned to this event yet.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Permissions Management Dialog */}
      <Dialog open={permissionsModalOpen} onOpenChange={setPermissionsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Configure specific permissions for this administrator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">Permission Groups</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the permissions you want to grant to this administrator.
              </p>
              
              <Accordion type="multiple" className="w-full">
                {Object.entries(EVENT_PERMISSION_GROUPS).map(([groupName, permissionList]) => (
                  <AccordionItem key={groupName} value={groupName}>
                    <AccordionTrigger className="text-base">
                      {groupName.charAt(0).toUpperCase() + groupName.slice(1)} Permissions
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {/* Ensure permissions is treated as an array */}
                        {Array.isArray(permissionList) && permissionList.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox 
                              id={permission}
                              checked={selectedPermissions[permission] || false}
                              onCheckedChange={(checked) => {
                                setSelectedPermissions({
                                  ...selectedPermissions,
                                  [permission]: !!checked
                                });
                              }}
                            />
                            <Label htmlFor={permission} className="cursor-pointer">
                              {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setPermissionsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingAdminId) {
                  updateAdminMutation.mutate({
                    adminId: editingAdminId,
                    data: {
                      role: eventAdmins?.find(admin => admin.id === editingAdminId)?.role || 'admin',
                      permissions: selectedPermissions
                    }
                  });
                }
              }}
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}