import React from 'react';
import { Shield } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import MemberDetails from './MemberDetails';

const Members: React.FC = () => {
  const { hasPermission } = usePermissions();

  // Check if user has permission to view members
  if (!hasPermission('view_members')) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to view member information. Please contact an administrator if you believe you should have access.
        </p>
      </div>
    );
  }

  return <MemberDetails />;
};

export default Members;