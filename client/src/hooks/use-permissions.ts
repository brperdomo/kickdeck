import { useAuth } from './use-auth';
import { useQuery } from '@tanstack/react-query';

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
  | 'emulate_users'
  | 'manage_system';

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
  const { data: userPermissions, isLoading, refetch } = useQuery({
    queryKey: ['user-permissions', user?.id, emulationToken],
    queryFn: async () => {
      if (!user || !user.isAdmin) return null;
      
      const headers: HeadersInit = {};
      if (emulationToken) {
        headers['x-emulation-token'] = emulationToken;
      }
      
      console.log('Fetching permissions, emulation token:', emulationToken ? 'present' : 'not present');
      
      const response = await fetch('/api/admin/permissions/me', {
        headers,
        cache: 'no-cache' // Ensure we don't get a cached response
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }
      
      const data = await response.json() as { permissions: Permission[], roles: Role[] };
      console.log('Fetched permissions:', data);
      return data;
    },
    enabled: !!user?.isAdmin,
    staleTime: 10000, // Consider data fresh for 10 seconds
    refetchOnWindowFocus: true, // Refetch when the window regains focus
  });

  /**
   * Check if the current user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    // If permissions are still loading, be conservative and deny access
    if (isLoading || !userPermissions) {
      return false;
    }
    
    // Super admins always have all permissions
    if (userPermissions.roles.includes('super_admin')) {
      return true;
    }
    
    // Check if the user has the specified permission
    return userPermissions.permissions.includes(permission);
  };

  /**
   * Check if the user has permission to access a specific section
   */
  const canAccessSection = (section: string): boolean => {
    // Account section is accessible to all authenticated admins
    if (section === 'account') {
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