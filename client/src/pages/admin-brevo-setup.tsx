import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrevoSetupWizard } from '@/components/admin/BrevoSetupWizard';

export default function AdminBrevoSetup() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Email Configuration</h1>
            <p className="text-muted-foreground">
              Configure Brevo for email delivery across your application
            </p>
          </div>
        </div>

        <BrevoSetupWizard />
      </div>
    </div>
  );
}
