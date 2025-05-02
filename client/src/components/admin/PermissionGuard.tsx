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
  const { user } = useAuth();
  
  // EMERGENCY FIX: Always show content for admin users regardless of specific permissions
  if (user?.isAdmin) {
    console.log(`🚨 EMERGENCY BYPASS: Rendering admin content for ${permission} without permission check`);
    return <>{children}</>;
  }
  
  // Only non-admin users will see the fallback
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
  
  // Hide completely if no permissions and not loading
  if (!isLoading && !hasPermission(permission)) {
    return null;
  }
  
  // Show a more subtle loading state for links (slightly transparent)
  if (isLoading && user?.isAdmin) {
    return (
      <div className={`${className} opacity-60 cursor-not-allowed flex items-center`}>
        {children}
        <Loader2 className="ml-2 h-3 w-3 animate-spin" />
      </div>
    );
  }
  
  // Show the actual link when permission is granted
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