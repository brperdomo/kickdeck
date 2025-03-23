import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, XIcon, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Permission {
  permission: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

interface RoleWithPermissions extends Role {
  permissions: string[];
}

interface PermissionGroup {
  [key: string]: string[];
}

const RolePermissionsManager = () => {
  const [activeRole, setActiveRole] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<{[key: number]: string[]}>({});
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Query to fetch all roles and their permissions
  const { data: rolesData, isLoading: isRolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/roles');
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      return response.json();
    }
  });
  
  // Query to fetch detailed permissions for a specific role when selected
  const { data: roleDetail, isLoading: isRoleDetailLoading, error: roleDetailError } = useQuery({
    queryKey: ['role', activeRole],
    queryFn: async () => {
      if (!activeRole) return null;
      
      const response = await fetch(`/api/admin/roles/${activeRole}`);
      if (!response.ok) {
        throw new Error('Failed to fetch role details');
      }
      return response.json();
    },
    enabled: !!activeRole,
    onSuccess: (data) => {
      if (data && !selectedPermissions[data.id]) {
        setSelectedPermissions((prev) => ({
          ...prev,
          [data.id]: [...data.permissions]
        }));
      }
    }
  });
  
  // Mutation to update a role's permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: number, permissions: string[] }) => {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update permissions');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', activeRole] });
      toast({
        title: "Permissions Updated",
        description: "Role permissions have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to reset a role's permissions to defaults
  const resetPermissionsMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset permissions');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', activeRole] });
      
      // Update local state with the reset permissions
      if (activeRole && data.permissions) {
        setSelectedPermissions((prev) => ({
          ...prev,
          [activeRole]: [...data.permissions]
        }));
      }
      
      toast({
        title: "Permissions Reset",
        description: "Role permissions have been reset to defaults.",
      });
      
      setResetConfirmOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
      setResetConfirmOpen(false);
    }
  });
  
  const handleRoleSelect = (roleId: number) => {
    setActiveRole(roleId);
  };
  
  const handlePermissionToggle = (permission: string, checked: boolean) => {
    if (!activeRole) return;
    
    setSelectedPermissions((prev) => {
      const current = prev[activeRole] || [];
      
      if (checked) {
        return {
          ...prev,
          [activeRole]: [...current, permission]
        };
      } else {
        return {
          ...prev,
          [activeRole]: current.filter(p => p !== permission)
        };
      }
    });
  };
  
  const handleGroupToggle = (groupPermissions: string[], groupChecked: boolean) => {
    if (!activeRole) return;
    
    setSelectedPermissions((prev) => {
      const current = prev[activeRole] || [];
      
      if (groupChecked) {
        // Add all permissions in the group that aren't already included
        const newPermissions = [...current];
        groupPermissions.forEach(permission => {
          if (!newPermissions.includes(permission)) {
            newPermissions.push(permission);
          }
        });
        return {
          ...prev,
          [activeRole]: newPermissions
        };
      } else {
        // Remove all permissions in the group
        return {
          ...prev,
          [activeRole]: current.filter(p => !groupPermissions.includes(p))
        };
      }
    });
  };
  
  const handleSavePermissions = () => {
    if (!activeRole) return;
    
    updatePermissionsMutation.mutate({
      roleId: activeRole,
      permissions: selectedPermissions[activeRole] || []
    });
  };
  
  const handleResetPermissions = () => {
    if (!activeRole) return;
    resetPermissionsMutation.mutate(activeRole);
  };
  
  // Determine if any changes have been made to the current role's permissions
  const hasChanges = () => {
    if (!activeRole || !roleDetail) return false;
    
    const currentPermissions = selectedPermissions[activeRole] || [];
    const originalPermissions = roleDetail.permissions || [];
    
    if (currentPermissions.length !== originalPermissions.length) return true;
    
    return !currentPermissions.every(p => originalPermissions.includes(p)) ||
           !originalPermissions.every(p => currentPermissions.includes(p));
  };
  
  // Calculate if a group is fully or partially checked
  const getGroupCheckState = (groupPermissions: string[]) => {
    if (!activeRole) return false;
    
    const current = selectedPermissions[activeRole] || [];
    const includedCount = groupPermissions.filter(p => current.includes(p)).length;
    
    if (includedCount === 0) return false;
    if (includedCount === groupPermissions.length) return true;
    return 'indeterminate';
  };
  
  // Check if loading or error
  if (isRolesLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Loading role information...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (rolesError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription className="text-red-500">
            Error loading roles. Please try again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {rolesError instanceof Error ? rolesError.message : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
        <CardDescription>
          Configure permissions for each administrative role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={rolesData?.roles?.[0]?.id?.toString()} onValueChange={(value) => handleRoleSelect(parseInt(value))}>
          <TabsList className="mb-4">
            {rolesData?.roles?.map((role: Role) => (
              <TabsTrigger key={role.id} value={role.id.toString()} className="capitalize">
                {role.name.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {rolesData?.roles?.map((role: Role) => (
            <TabsContent key={role.id} value={role.id.toString()}>
              <div className="mb-4">
                <h3 className="text-lg font-medium capitalize">{role.name.replace('_', ' ')}</h3>
                <p className="text-sm text-muted-foreground">
                  {role.description || `Permissions for ${role.name.replace('_', ' ')} role.`}
                </p>
              </div>
              
              {isRoleDetailLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : roleDetailError ? (
                <p className="text-sm text-red-500">
                  {roleDetailError instanceof Error ? roleDetailError.message : 'Error loading role details'}
                </p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {roleDetail && Object.entries(roleDetail.permissionGroups).map(([group, permissions]) => (
                    <AccordionItem key={group} value={group}>
                      <AccordionTrigger className="flex items-center">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`group-${group}`}
                            checked={getGroupCheckState(permissions as string[])}
                            onCheckedChange={(checked) => handleGroupToggle(permissions as string[], checked === true)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="capitalize">{group.toLowerCase()}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-6 space-y-2 mt-2">
                          {(permissions as string[]).map((permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <Checkbox 
                                id={permission}
                                checked={selectedPermissions[activeRole!]?.includes(permission) || false}
                                onCheckedChange={(checked) => handlePermissionToggle(permission, checked === true)}
                              />
                              <label htmlFor={permission} className="text-sm capitalize cursor-pointer">
                                {permission.split('.')[1]}
                              </label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!activeRole}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Permissions</DialogTitle>
              <DialogDescription>
                Are you sure you want to reset this role's permissions to their default values? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={handleResetPermissions}
                disabled={resetPermissionsMutation.isPending}
              >
                {resetPermissionsMutation.isPending ? "Resetting..." : "Reset Permissions"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button 
          onClick={handleSavePermissions}
          disabled={!hasChanges() || updatePermissionsMutation.isPending}
        >
          {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RolePermissionsManager;