import { useAuth } from './use-auth';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

// Define the permission types based on our permission schema
export type Permission = 
  | 'view_events'
  | 'create_events'
  | 'edit_events'
  | 'delete_events'
  | 'view_teams'
  | 'create_teams'
  | 'edit_teams'
  | 'delete_teams'
  | 'view_administrators'
  | 'create_administrators'
  | 'edit_administrators'
  | 'delete_administrators'
  | 'view_organization_settings'
  | 'edit_organization_settings'
  | 'view_households'
  | 'edit_households'
  | 'delete_households'
  | 'view_reports'
  | 'export_reports'
  | 'view_financials'
  | 'process_payments'
  | 'issue_refunds'
  | 'view_complexes'
  | 'create_complexes'
  | 'edit_complexes'
  | 'delete_complexes'
  | 'view_scheduling'
  | 'create_schedule'
  | 'edit_schedule'
  | 'view_files'
  | 'upload_files'
  | 'delete_files'
  | 'manage_folders'
  | 'view_coupons'
  | 'create_coupons'
  | 'edit_coupons'
  | 'delete_coupons'
  | 'view_form_templates'
  | 'create_form_templates'
  | 'edit_form_templates'
  | 'delete_form_templates'
  | 'view_role_permissions'
  | 'edit_role_permissions'
  | 'view_members'
  | 'emulate_users'
  | 'manage_system'
  | 'access_admin_dashboard';

// Define a map of navigation sections to required permissions
export const SECTION_PERMISSIONS: Record<string, Permission[]> = {
  'events': ['view_events'],
  'teams': ['view_teams'],
  'administrators': ['view_administrators'],
  'settings': ['view_organization_settings'],
  'households': ['view_households'],
  'reports': ['view_reports'],
  'complexes': ['view_complexes'],
  'scheduling': ['view_scheduling'],
  'files': ['view_files'],
  'coupons': ['view_coupons'],
  'formTemplates': ['view_form_templates'],
  'roles': ['view_role_permissions'],
  'members': ['view_members'],
  // Account can be viewed by any authenticated admin
  'account': []
};

// Define the roles
export type Role = 'super_admin' | 'tournament_admin' | 'score_admin' | 'finance_admin';

export function usePermissions() {
  const { user } = useAuth();
  
  // Check for emulation token
  const emulationToken = typeof window !== 'undefined' ? localStorage.getItem('emulationToken') : null;
  
  // Fetch user permissions from the API
  // Force refresh emulation status whenever hook is called
  useEffect(() => {
    const refreshEmulationToken = async () => {
      // Only check if we're logged in and admin
      if (!user?.isAdmin) return;
      
      try {
        // Check if we have a saved token in localStorage
        const existingToken = localStorage.getItem('emulationToken');
        const isEmulationActive = sessionStorage.getItem('emulationActive') === 'true';
        
        if (existingToken) {
          console.log('Checking saved emulation token validity');
          // Send the token to verify it's valid
          const response = await fetch('/api/admin/emulation/status', {
            headers: {
              'X-Emulation-Token': existingToken,
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Emulation status check response:', data);
            
            if (data.emulating === true) {
              // Valid token, ensure localStorage is set
              localStorage.setItem('emulationToken', existingToken);
              sessionStorage.setItem('emulationActive', 'true');
              
              // Store emulated user name if available
              if (data.emulatedAdmin && data.emulatedAdmin.firstName && data.emulatedAdmin.lastName) {
                sessionStorage.setItem('emulatedAdminName', 
                  `${data.emulatedAdmin.firstName} ${data.emulatedAdmin.lastName}`);
              }
            } else {
              // Invalid token, clean up storage
              console.log('Emulation token is invalid or expired, clearing');
              localStorage.removeItem('emulationToken');
              sessionStorage.removeItem('emulationActive');
              sessionStorage.removeItem('emulatedAdminName');
            }
          } else {
            // API error, be cautious and keep token
            console.log('Error checking emulation status, keeping token');
          }
        } else if (isEmulationActive) {
          // Session says we're emulating but token is missing, clear session
          console.log('Emulation session flag exists but token is missing, clearing session');
          sessionStorage.removeItem('emulationActive');
          sessionStorage.removeItem('emulatedAdminName');
        }
      } catch (error) {
        console.error('Error checking emulation status:', error);
      }
    };
    
    refreshEmulationToken();
    
    // Set up interval to refresh token status every 30 seconds
    const intervalId = setInterval(refreshEmulationToken, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);
  
  const { data: userPermissions, isLoading, refetch } = useQuery({
    queryKey: ['user-permissions', user?.id, emulationToken],
    queryFn: async () => {
      if (!user || !user.isAdmin) return null;
      
      const emulToken = localStorage.getItem('emulationToken');
      const headers: HeadersInit = {};
      
      if (emulToken) {
        console.log('Using emulation token for permissions request:', emulToken);
        headers['x-emulation-token'] = emulToken;
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
      }
      
      console.log('Fetching permissions, emulation token:', emulToken ? 'present' : 'not present');
      
      const response = await fetch('/api/admin/permissions/me', {
        headers,
        cache: 'no-cache' // Ensure we don't get a cached response
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }
      
      const data = await response.json() as { permissions: string[], roles: Role[] };
      console.log('Fetched permissions:', data);
      
      // Normalize permissions to our Permission type format  
      const normalizedPermissions: Permission[] = [];
      
      data.permissions.forEach(perm => {
        // Convert from any format to our standard format
        let normalizedPerm = perm.toLowerCase();
        
        // Convert from events.view to view_events format (dot notation from server)
        if (normalizedPerm.includes('.')) {
          const [category, action] = normalizedPerm.split('.');
          normalizedPerm = `${action}_${category}`;
          console.log(`Normalized dot permission "${perm}" to "${normalizedPerm}"`);
        } 
        // Convert from EVENTS_VIEW to view_events format (uppercase constant format)
        else if (normalizedPerm.includes('_')) {
          const parts = normalizedPerm.split('_');
          if (parts.length === 2) {
            const [category, action] = parts;
            normalizedPerm = `${action.toLowerCase()}_${category.toLowerCase()}`;
            console.log(`Normalized underscore permission "${perm}" to "${normalizedPerm}"`);
          }
        }
        
        // Only add if it matches our Permission type
        if (normalizedPerm as Permission) {
          normalizedPermissions.push(normalizedPerm as Permission);
        }
      });
      
      console.log('Final normalized permissions:', normalizedPermissions);
      
      return {
        permissions: normalizedPermissions,
        roles: data.roles
      };
    },
    enabled: !!user?.isAdmin,
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchOnWindowFocus: true, // Refetch when the window regains focus
  });

  /**
   * Determine if the user is a superadmin
   * Special handling to always treat bperdomo@zoho.com as superadmin
   */
  const isUserSuperAdmin = () => {
    // Direct match for the main admin email - always grant access
    if (user?.email === 'bperdomo@zoho.com') {
      return true;
    }
    
    // Check for superadmin role in permissions
    return user?.isAdmin && userPermissions?.roles?.includes('super_admin');
  };

  /**
   * Check if the current user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    try {
      // If user is definitely a super admin, short-circuit and grant access
      if (isUserSuperAdmin()) {
        return true;
      }
      
      // If permissions are still loading but user is logged in as admin, GRANT access temporarily
      // This prevents the flashing "Access Restricted" during loading
      if (isLoading && user?.isAdmin) {
        return true;
      }

      // If permissions failed to load or user isn't logged in, deny access
      if (!userPermissions) {
        return false;
      }
      
      // At this point, we have permissions loaded but user isn't a super_admin
      // Check if the user has the specified permission
      const hasAccess = userPermissions.permissions.includes(permission as Permission);
      return hasAccess;
    } catch (error) {
      // If any error occurs during permission check, log it and default to denying access
      console.error('Error checking permission:', error);
      return false;
    }
  };

  /**
   * Check if the user has permission to access a specific section
   */
  const canAccessSection = (section: string): boolean => {
    // Account section is accessible to all authenticated admins
    if (section === 'account') {
      return true;
    }
    
    // Special handling for main admin
    if (user?.email === 'bperdomo@zoho.com') {
      return true;
    }
    
    // Super admin always has access to all sections
    if (isUserSuperAdmin()) {
      return true;
    }
    
    // For other sections, check if user has at least one of the required permissions
    const requiredPermissions = SECTION_PERMISSIONS[section] || [];
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if the user has a specific role
   */
  const hasRole = (role: Role): boolean => {
    // Special handling for bperdomo@zoho.com - main admin always has super_admin role
    if (user?.email === 'bperdomo@zoho.com' && role === 'super_admin') {
      return true;
    }
    
    if (!userPermissions) {
      return false;
    }
    return userPermissions.roles.includes(role);
  };

  return {
    hasPermission,
    hasRole,
    canAccessSection,
    roles: userPermissions?.roles || [],
    permissions: userPermissions?.permissions || [],
    isLoading
  };
}