import { IncompleteRegistrationsManager } from '@/components/admin/IncompleteRegistrationsManager';

export default function IncompleteRegistrationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Incomplete Registrations</h1>
        <p className="text-muted-foreground mt-2">
          Manage and send reminder emails to users with incomplete team registrations
        </p>
      </div>
      
      <IncompleteRegistrationsManager />
    </div>
  );
}