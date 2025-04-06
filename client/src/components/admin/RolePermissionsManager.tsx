import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckIcon, XIcon, RefreshCcw, Info, Shield, 
  Eye, Edit, Trash, Plus, Settings, PieChart, 
  DollarSign, Users, Calendar, Award, FileText 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

// Permission descriptions map for clearer UI labels
const permissionDescriptions: Record<string, string> = {
  'users.view': 'View user profiles and account information',
  'users.create': 'Create new user accounts',
  'users.edit': 'Edit existing user information',
  'users.delete': 'Delete user accounts',
  
  'events.view': 'View tournament and event details',
  'events.create': 'Create new tournaments and events',
  'events.edit': 'Edit existing tournament information',
  'events.delete': 'Delete tournaments and events',
  
  'teams.view': 'View team information and rosters',
  'teams.create': 'Create new teams',
  'teams.edit': 'Edit team information and rosters',
  'teams.delete': 'Delete teams from the system',
  
  'games.view': 'View game schedules and details',
  'games.create': 'Create new games and fixtures',
  'games.edit': 'Edit game details and schedules',
  'games.delete': 'Cancel and delete games',
  
  'scores.view': 'View game scores and results',
  'scores.create': 'Enter new game scores',
  'scores.edit': 'Edit existing game scores',
  'scores.delete': 'Delete score entries',
  
  'finances.view': 'View financial records and transactions',
  'finances.create': 'Create new financial records and transactions',
  'finances.edit': 'Edit financial records',
  'finances.delete': 'Delete financial records',
  'finances.approve': 'Approve financial transactions and refunds',
  
  'settings.view': 'View system settings',
  'settings.edit': 'Edit system settings',
  
  'reports.view': 'View reports and analytics',
  'reports.export': 'Export reports to external formats',
  
  'administrators.view': 'View administrator accounts',
  'administrators.create': 'Create new administrator accounts',
  'administrators.edit': 'Edit administrator permissions',
  'administrators.delete': 'Delete administrator accounts',
  
  'coupons.view': 'View coupons and discount codes',
  'coupons.create': 'Create new discount coupons',
  'coupons.edit': 'Edit existing coupons',
  'coupons.delete': 'Delete coupons from the system',
  
  'members.view': 'View membership information'
};

// Icons for permission groups
const groupIcons: Record<string, React.ReactNode> = {
  'USERS': <Users size={18} />,
  'EVENTS': <Calendar size={18} />,
  'TEAMS': <Users size={18} />,
  'GAMES': <Award size={18} />,
  'SCORES': <PieChart size={18} />,
  'FINANCES': <DollarSign size={18} />,
  'SETTINGS': <Settings size={18} />,
  'REPORTS': <FileText size={18} />,
  'ADMINISTRATORS': <Shield size={18} />,
  'COUPONS': <DollarSign size={18} />,
  'MEMBERS': <Users size={18} />
};

// Action icons for permissions
const actionIcons: Record<string, React.ReactNode> = {
  'view': <Eye size={16} />,
  'create': <Plus size={16} />,
  'edit': <Edit size={16} />,
  'delete': <Trash size={16} />,
  'approve': <CheckIcon size={16} />,
  'export': <FileText size={16} />
};

// Create mapping between permissions and UI component selectors
const permissionComponentMap: Record<string, string> = {
  'users.view': '.user-list, .admin-user-section',
  'users.create': '.user-create-button, .add-user-form',
  'users.edit': '.user-edit-button, .user-profile-edit',
  'users.delete': '.user-delete-button',
  
  'events.view': '.event-list, .event-details',
  'events.create': '.event-create-button, .add-event-form',
  'events.edit': '.event-edit-button, .edit-event-modal',
  'events.delete': '.event-delete-button',
  
  'teams.view': '.team-list, .team-details, .team-roster',
  'teams.create': '.team-create-button, .add-team-form',
  'teams.edit': '.team-edit-button, .edit-team-modal, .team-status-button',
  'teams.delete': '.team-delete-button',
  
  'games.view': '.game-list, .schedule-view',
  'games.create': '.game-create-button, .schedule-create',
  'games.edit': '.game-edit-button, .edit-game-modal',
  'games.delete': '.game-delete-button',
  
  'scores.view': '.scores-section, .score-details',
  'scores.create': '.score-create-button, .add-score-form',
  'scores.edit': '.score-edit-button, .edit-score-modal',
  'scores.delete': '.score-delete-button',
  
  'finances.view': '.finances-section, .payment-history',
  'finances.create': '.payment-create-button, .add-payment-form',
  'finances.edit': '.finance-edit-button, .edit-payment-modal',
  'finances.delete': '.finance-delete-button',
  'finances.approve': '.payment-approve-button, .refund-approve-button',
  
  'settings.view': '.settings-section, .app-settings',
  'settings.edit': '.settings-edit-button, .edit-settings-form',
  
  'reports.view': '.reports-section, .analytics-dashboard',
  'reports.export': '.export-button, .download-report-button',
  
  'administrators.view': '.admin-list, .admin-details',
  'administrators.create': '.admin-create-button, .add-admin-form',
  'administrators.edit': '.admin-edit-button, .edit-admin-modal',
  'administrators.delete': '.admin-delete-button',
  
  'coupons.view': '.coupon-list, .coupon-details',
  'coupons.create': '.coupon-create-button, .add-coupon-form',
  'coupons.edit': '.coupon-edit-button, .edit-coupon-modal',
  'coupons.delete': '.coupon-delete-button',
  
  'members.view': '.members-section, .membership-details'
};

// Create mapping between permission groups and UI component selectors
const permissionGroupComponentMap: Record<string, string> = {
  'USERS': '.user-list, .admin-user-section, .user-create-button, .add-user-form, .user-edit-button, .user-profile-edit, .user-delete-button',
  'EVENTS': '.event-list, .event-details, .event-create-button, .add-event-form, .event-edit-button, .edit-event-modal, .event-delete-button',
  'TEAMS': '.team-list, .team-details, .team-roster, .team-create-button, .add-team-form, .team-edit-button, .edit-team-modal, .team-status-button, .team-delete-button',
  'GAMES': '.game-list, .schedule-view, .game-create-button, .schedule-create, .game-edit-button, .edit-game-modal, .game-delete-button',
  'SCORES': '.scores-section, .score-details, .score-create-button, .add-score-form, .score-edit-button, .edit-score-modal, .score-delete-button',
  'FINANCES': '.finances-section, .payment-history, .payment-create-button, .add-payment-form, .finance-edit-button, .edit-payment-modal, .finance-delete-button, .payment-approve-button, .refund-approve-button',
  'SETTINGS': '.settings-section, .app-settings, .settings-edit-button, .edit-settings-form',
  'REPORTS': '.reports-section, .analytics-dashboard, .export-button, .download-report-button',
  'ADMINISTRATORS': '.admin-list, .admin-details, .admin-create-button, .add-admin-form, .admin-edit-button, .edit-admin-modal, .admin-delete-button',
  'COUPONS': '.coupon-list, .coupon-details, .coupon-create-button, .add-coupon-form, .coupon-edit-button, .edit-coupon-modal, .coupon-delete-button',
  'MEMBERS': '.members-section, .membership-details'
};

// Custom CSS class for highlighted elements
const highlightClass = 'permission-highlight';

const RolePermissionsManager = () => {
  const [activeRole, setActiveRole] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<{[key: number]: string[]}>({});
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'detailed' | 'simplified'>('detailed');
  const [hoveredPermission, setHoveredPermission] = useState<string | null>(null);
  
  // Add CSS for highlighting
  useEffect(() => {
    document.head.insertAdjacentHTML('beforeend', `
      <style>
        .permission-highlight {
          box-shadow: 0 0 0 2px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.5) !important;
          position: relative;
          z-index: 10;
          transition: all 0.3s ease;
        }
      </style>
    `);
    
    return () => {
      // Cleanup function to remove style when component unmounts
      const styleElement = document.head.querySelector('style:last-child');
      if (styleElement && styleElement.textContent?.includes('permission-highlight')) {
        styleElement.remove();
      }
    };
  }, []);
  
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
      console.log('Sending update request:', { roleId, permissions });
      
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions }),
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server responded with error:', errorData);
        throw new Error(errorData.error || 'Failed to update permissions');
      }
      
      const result = await response.json();
      console.log('Server responded with success:', result);
      return result;
    },
    onSuccess: (data) => {
      // Force a full refetch of all related data
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', activeRole] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      
      // Update local state with the saved permissions
      if (activeRole && data.permissions) {
        setSelectedPermissions((prev) => ({
          ...prev,
          [activeRole]: [...data.permissions]
        }));
      }
      
      toast({
        title: "Permissions Updated",
        description: "Role permissions have been updated successfully.",
      });
      
      // Force reload the page to ensure all data is refreshed
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
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
        },
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset permissions');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Force a full refetch of all related data
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', activeRole] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
      
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
    setExpandedGroups([]); // Collapse all groups when switching roles
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
  
  // Get formatted permission name for UI display
  const getFormattedPermissionName = (permission: string) => {
    const parts = permission.split('.');
    if (parts.length !== 2) return permission;
    
    return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  };
  
  // Get the icon for an action type
  const getActionIcon = (permission: string) => {
    const action = permission.split('.')[1];
    return actionIcons[action] || null;
  };
  
  // Toggle accordion expansion state
  const toggleAccordion = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group) 
        : [...prev, group]
    );
  };
  
  // Get permission description for tooltip
  const getPermissionDescription = (permission: string) => {
    return permissionDescriptions[permission] || `Permission to ${permission.split('.')[1]} ${permission.split('.')[0]}`;
  };
  
  // Handle highlighting UI elements when hovering on a permission
  const handlePermissionMouseEnter = (permission: string) => {
    setHoveredPermission(permission);
    
    // Find the UI elements that match this permission and add the highlight class
    const selector = permissionComponentMap[permission];
    if (selector) {
      console.log(`Highlighting permission ${permission} with selector: ${selector}`);
      const elements = document.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements to highlight`);
      elements.forEach(element => {
        element.classList.add(highlightClass);
      });
    }
  };
  
  // Handle highlighting UI elements when hovering on a permission group
  const handlePermissionGroupMouseEnter = (group: string) => {
    setHoveredPermission(group);
    
    // Find the UI elements that match this permission group and add the highlight class
    const selector = permissionGroupComponentMap[group];
    if (selector) {
      console.log(`Highlighting permission group ${group} with selector: ${selector}`);
      const elements = document.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements to highlight`);
      elements.forEach(element => {
        element.classList.add(highlightClass);
      });
    }
  };
  
  // Remove highlighting when mouse leaves
  const handlePermissionMouseLeave = () => {
    setHoveredPermission(null);
    
    // Clear all highlighted elements
    const highlightedElements = document.querySelectorAll(`.${highlightClass}`);
    console.log(`Removing highlight from ${highlightedElements.length} elements`);
    highlightedElements.forEach(element => {
      element.classList.remove(highlightClass);
    });
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
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Role Permissions Manager</CardTitle>
              <CardDescription>
                Configure specific permissions for each admin role in the system
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="view-mode" className="text-sm">Simplified View</Label>
              <Switch 
                id="view-mode" 
                checked={viewMode === 'simplified'}
                onCheckedChange={(checked) => setViewMode(checked ? 'simplified' : 'detailed')}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted/50 rounded-md border border-muted">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">How Permissions Work</h4>
                <p className="text-sm text-muted-foreground">
                  Each role can be assigned specific permissions that determine what actions administrators with that role can perform. 
                  Select a role tab below, then check or uncheck permissions as needed. The changes will apply to all users with that role.
                </p>
              </div>
            </div>
          </div>
          
          <Tabs 
            defaultValue={rolesData?.roles?.[0]?.id?.toString()} 
            onValueChange={(value) => handleRoleSelect(parseInt(value))}
          >
            <TabsList className="mb-4 flex flex-wrap h-auto py-1">
              {rolesData?.roles?.map((role: Role) => (
                <TabsTrigger key={role.id} value={role.id.toString()} className="capitalize px-4 py-2 mb-1">
                  <div className="flex flex-col items-center text-center">
                    <span>{role.name.replace('_', ' ')}</span>
                    <Badge variant="outline" className="mt-1 text-xs px-2">
                      {selectedPermissions[role.id]?.length || role.permissions.length} permissions
                    </Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {rolesData?.roles?.map((role: Role) => (
              <TabsContent key={role.id} value={role.id.toString()} className="border rounded-md p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium capitalize">{role.name.replace('_', ' ')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {role.description || `Manage permissions for the ${role.name.replace('_', ' ')} role.`}
                  </p>
                  {role.name === 'super_admin' && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                      <span className="font-semibold">Note:</span> Super Admin permissions can be viewed but not fully restricted for security reasons.
                    </div>
                  )}
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
                ) : viewMode === 'detailed' ? (
                  // Detailed view with accordions
                  <Accordion 
                    type="multiple" 
                    className="w-full"
                    value={expandedGroups}
                    onValueChange={setExpandedGroups}
                  >
                    {roleDetail && Object.entries(roleDetail.permissionGroups).map(([group, permissions]) => (
                      <AccordionItem key={group} value={group} className="border rounded-md mb-2 overflow-hidden">
                        <AccordionTrigger 
                          className="flex items-center px-4 py-3 hover:bg-muted/50"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleAccordion(group);
                          }}
                          onMouseEnter={() => handlePermissionGroupMouseEnter(group)}
                          onMouseLeave={handlePermissionMouseLeave}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <Checkbox 
                              id={`group-${group}`}
                              checked={getGroupCheckState(permissions as string[])}
                              onCheckedChange={(checked) => handleGroupToggle(permissions as string[], checked === true)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 w-5"
                            />
                            <div className="flex items-center space-x-2">
                              <span className="p-1 bg-muted rounded-md">
                                {groupIcons[group] || <Shield size={18} />}
                              </span>
                              <span className="font-medium capitalize">{group.toLowerCase()} Permissions</span>
                            </div>
                            <Badge variant="outline" className="ml-auto">
                              {(permissions as string[]).filter(p => 
                                selectedPermissions[activeRole!]?.includes(p)
                              ).length} / {(permissions as string[]).length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/20 border-t">
                          <div className="p-4 grid gap-3">
                            {(permissions as string[]).map((permission) => (
                              <Tooltip key={permission}>
                                <TooltipTrigger asChild>
                                  <div 
                                  className="flex items-center p-2 hover:bg-muted/40 rounded-md group"
                                  onMouseEnter={() => handlePermissionMouseEnter(permission)}
                                  onMouseLeave={handlePermissionMouseLeave}
                                >
                                    <Checkbox 
                                      id={permission}
                                      checked={selectedPermissions[activeRole!]?.includes(permission) || false}
                                      onCheckedChange={(checked) => handlePermissionToggle(permission, checked === true)}
                                      className="h-5 w-5 mr-3"
                                    />
                                    <div className="flex items-center space-x-2">
                                      <span className="p-1 bg-muted/50 rounded-md">
                                        {getActionIcon(permission)}
                                      </span>
                                      <label htmlFor={permission} className="text-sm font-medium cursor-pointer">
                                        {getFormattedPermissionName(permission)}
                                      </label>
                                    </div>
                                    <Info className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p>{getPermissionDescription(permission)}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  // Simplified view with a flat list of permissions by group
                  <div className="space-y-6">
                    {roleDetail && Object.entries(roleDetail.permissionGroups).map(([group, permissions]) => (
                      <div key={group} className="space-y-2">
                        <div 
                          className="flex items-center space-x-2 mb-2"
                          onMouseEnter={() => handlePermissionGroupMouseEnter(group)}
                          onMouseLeave={handlePermissionMouseLeave}
                        >
                          <span className="p-1 bg-muted rounded-md">
                            {groupIcons[group] || <Shield size={18} />}
                          </span>
                          <h4 className="font-medium capitalize">{group.toLowerCase()}</h4>
                          <Separator className="flex-1 mx-2" />
                          <Badge variant="outline">
                            {(permissions as string[]).filter(p => 
                              selectedPermissions[activeRole!]?.includes(p)
                            ).length} / {(permissions as string[]).length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-8">
                          {(permissions as string[]).map((permission) => (
                            <Tooltip key={permission}>
                              <TooltipTrigger asChild>
                                <div 
                                  className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/20 group"
                                  onMouseEnter={() => handlePermissionMouseEnter(permission)}
                                  onMouseLeave={handlePermissionMouseLeave}
                                >
                                  <Checkbox 
                                    id={`simplified-${permission}`}
                                    checked={selectedPermissions[activeRole!]?.includes(permission) || false}
                                    onCheckedChange={(checked) => handlePermissionToggle(permission, checked === true)}
                                  />
                                  <label htmlFor={`simplified-${permission}`} className="text-sm cursor-pointer">
                                    {getFormattedPermissionName(permission)}
                                  </label>
                                  <Info className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p>{getPermissionDescription(permission)}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between pt-6 border-t">
          <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={!activeRole || rolesData?.roles?.find((r: Role) => r.id === activeRole)?.name === 'super_admin'}
              >
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
            disabled={
              !hasChanges() || 
              updatePermissionsMutation.isPending || 
              rolesData?.roles?.find((r: Role) => r.id === activeRole)?.name === 'super_admin'
            }
            className="ml-auto"
          >
            {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
};

export default RolePermissionsManager;