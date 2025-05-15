/**
 * Club Stripe Connect Page
 * 
 * Example page that demonstrates how to use the StripeConnectPanel
 * This would typically be included as a tab or section on the club management page
 */

import React from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { StripeConnectPanel } from '@/components/stripe/StripeConnectPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface ClubStripeConnectPageProps {
  clubId?: number;
}

export function ClubStripeConnectPage({ clubId: propClubId }: ClubStripeConnectPageProps) {
  const [location] = useLocation();
  
  // If clubId is not provided via props, extract it from the URL
  const urlClubId = !propClubId ? parseInt(location.split('/').pop() || '0') : undefined;
  const clubId = propClubId || urlClubId;
  
  // Fetch club data
  const { data: club, isLoading, error } = useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/clubs/${clubId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch club data');
      }
      return response.json();
    },
    enabled: !!clubId && clubId > 0,
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !club) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Club</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load club data'}
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clubs
        </Button>
        
        <h1 className="text-3xl font-bold">{club.name}</h1>
        <p className="text-muted-foreground">Payment Processing Configuration</p>
      </div>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="prose dark:prose-invert max-w-none mb-6">
            <h2>Stripe Connect Integration</h2>
            <p>
              Stripe Connect allows {club.name} to receive payments directly to their bank account.
              As the platform administrator, you can help them set up and manage their Stripe Connect 
              account.
            </p>
            <h3>Benefits</h3>
            <ul>
              <li>Direct deposits to the club's bank account</li>
              <li>Automated payouts on the club's preferred schedule</li>
              <li>Detailed reporting and transaction history</li>
              <li>Simplified tax compliance with automated 1099 forms</li>
            </ul>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <StripeConnectPanel clubId={clubId} clubName={club.name} />
        </div>
      </div>
    </div>
  );
}

export default ClubStripeConnectPage;