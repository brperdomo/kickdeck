import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import MemberDetails from './MemberDetails';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Members: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canViewMembers = hasPermission('view_members');

  if (!canViewMembers) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to view the members section.
        </AlertDescription>
      </Alert>
    );
  }

  return <MemberDetails />;
};

export default Members;