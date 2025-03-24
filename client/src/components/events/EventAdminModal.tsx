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
import { Loader2, UserPlus, Trash2, Edit, ShieldCheck } from "lucide-react";
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
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  roles: string[];
}

type AdminRole = 'owner' | 'admin' | 'moderator';

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
    mutationFn: async (data: { userId: number; role: string; adminType: string }) => {
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
    mutationFn: async ({ adminId, data }: { adminId: number; data: { role: string; adminType: string } }) => {
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
    setAdminType('tournament_admin');
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
      adminType: adminType
    });
  };

  // Handle updating an administrator's role
  const handleUpdateAdmin = (eventAdmin: EventAdmin, role: AdminRole, type: AdminType) => {
    updateAdminMutation.mutate({
      adminId: eventAdmin.id,
      data: {
        role,
        adminType: type
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

  // Get admin type badge color
  const getAdminTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'super_admin':
        return 'bg-purple-500';
      case 'tournament_admin':
        return 'bg-indigo-500';
      case 'score_admin':
        return 'bg-orange-500';
      case 'finance_admin':
        return 'bg-cyan-500';
      default:
        return '';
    }
  };

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <Label htmlFor="type-select">Admin Type</Label>
              <Select
                onValueChange={(value) => setAdminType(value as AdminType)}
                value={adminType}
              >
                <SelectTrigger id="type-select" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tournament_admin">Tournament Admin</SelectItem>
                  <SelectItem value="score_admin">Score Admin</SelectItem>
                  <SelectItem value="finance_admin">Finance Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
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
                    <TableHead>Admin Type</TableHead>
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
                            handleUpdateAdmin(admin, value as AdminRole, admin.adminType as AdminType)
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
                      <TableCell>
                        <Select
                          defaultValue={admin.adminType}
                          onValueChange={(value) => 
                            handleUpdateAdmin(admin, admin.role as AdminRole, value as AdminType)
                          }
                        >
                          <SelectTrigger className="w-48">
                            <Badge className={`${getAdminTypeBadgeColor(admin.adminType)} text-white`}>
                              {admin.adminType
                                .split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tournament_admin">Tournament Admin</SelectItem>
                            <SelectItem value="score_admin">Score Admin</SelectItem>
                            <SelectItem value="finance_admin">Finance Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAdmin(admin.id)}
                          disabled={removeAdminMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
  );
}