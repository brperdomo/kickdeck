import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { AlertCircle, Check, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface Registration {
  id: number;
  teamName: string;
  eventName: string;
  ageGroup: string;
  registrationDate: string;
  status: string;
  amountPaid: number;
  termsAccepted: boolean;
  termsAcceptedAt: string;
}

export default function UserRegistrationsView() {
  const { toast } = useToast();

  // Fetch user registrations
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['userRegistrations'],
    queryFn: async () => {
      const response = await fetch('/api/user/registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" /> Error Loading Registrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load your registrations. Please try again later.</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.registrations || data.registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Registrations</CardTitle>
          <CardDescription>
            You haven't registered any teams yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            No registrations found. Register for an event to get started.
          </p>
          <div className="flex justify-center mt-4">
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get registration status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-500"><Check className="mr-1 h-3 w-3" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Registrations</h2>
        <div className="text-sm text-muted-foreground">
          {data.playerCount} players across {data.registrations.length} teams
        </div>
      </div>
      
      <div className="grid gap-4">
        {data.registrations.map((registration: Registration) => (
          <Card key={registration.id} className="overflow-hidden">
            <CardHeader className="bg-muted/40 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{registration.teamName}</CardTitle>
                  <CardDescription>{registration.eventName}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(registration.status)}
                  <div className="text-sm text-muted-foreground">
                    {formatDate(registration.registrationDate)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Age Group</p>
                  <p className="text-sm text-muted-foreground">{registration.ageGroup}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount Paid</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(registration.amountPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Terms Accepted</p>
                  <p className="text-sm text-muted-foreground">
                    {registration.termsAccepted ? (
                      <span className="text-green-600 flex items-center">
                        <Check className="mr-1 h-3 w-3" /> 
                        {formatDate(registration.termsAcceptedAt)}
                      </span>
                    ) : 'Not accepted'}
                  </p>
                </div>
                <div className="self-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toast({
                      title: "Coming Soon",
                      description: "Team details view will be available soon.",
                    })}
                  >
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}