/**
 * Simple Age Group Eligibility Management Page
 * 
 * This page provides a clean interface to toggle age group eligibility
 * without any database constraint violations.
 */

import { SimpleEligibilityManager } from '@/components/admin/SimpleEligibilityManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function SimpleEligibilityPage() {
  // Get event ID from URL - for now using your event ID
  const eventId = '1408614908';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Age Group Eligibility</h1>
          <p className="text-muted-foreground">
            Safely toggle age groups for registration without database errors
          </p>
        </div>
      </div>

      <SimpleEligibilityManager eventId={eventId} />
      
      <Card>
        <CardHeader>
          <CardTitle>How This Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium">Safe Toggling</p>
              <p className="text-sm text-muted-foreground">
                Age groups are hidden from registration forms, never deleted from the database
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium">No Constraint Violations</p>
              <p className="text-sm text-muted-foreground">
                Existing brackets and teams stay linked to their age groups
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium">Instant Updates</p>
              <p className="text-sm text-muted-foreground">
                Changes take effect immediately in registration forms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}