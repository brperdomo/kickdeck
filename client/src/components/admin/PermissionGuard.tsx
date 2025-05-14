import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Permission } from '@/hooks/use-permissions';

/**
 * PermissionGuard Component
 * 
 * A wrapper component that handles permission checks with appropriate loading states.
 * Shows a loading spinner for admins while permissions are loading.
 */
interface PermissionGuardProps {
  /** Permission required to view the content */
  permission: Permission;
  /** Content to show if user has permission */
  children: React.ReactNode;
  /** Optional content to show if user doesn't have permission */
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();
  const { user } = useAuth();
  
  // Special case: Admin users will see a loading indicator during the initial permissions load
  if (isLoading && user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }
  
  // Check if the user has the required permission
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  // If no fallback is provided, return null
  if (!fallback) {
    return null;
  }
  
  // Otherwise, render the fallback content
  return <>{fallback}</>;
}

/**
 * PermissionAwareLink Component
 * 
 * A link component that only appears when the user has the required permission.
 * Shows a loading state while permissions are being loaded.
 */
interface PermissionAwareLinkProps {
  /** Permission required to view the link */
  permission: Permission;
  /** Link content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Href value */
  href?: string;
}

export function PermissionAwareLink({
  permission,
  children,
  className = '',
  onClick,
  href
}: PermissionAwareLinkProps) {
  const { hasPermission, isLoading } = usePermissions();
  const { user } = useAuth();
  
  // Show a more subtle loading state for links (slightly transparent)
  if (isLoading && user?.isAdmin) {
    return (
      <div className={`${className} opacity-60 cursor-not-allowed flex items-center`}>
        {children}
        <Loader2 className="ml-2 h-3 w-3 animate-spin" />
      </div>
    );
  }
  
  // Only show the link if the user has the required permission
  if (hasPermission(permission)) {
    if (href) {
      return (
        <a href={href} className={className} onClick={onClick}>
          {children}
        </a>
      );
    }
    
    return (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    );
  }
  
  // No permission, don't render anything
  return null;
}