import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge, TeamStatusBadge } from '@/components/ui/payment-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Registration {
  id: number;
  teamName: string;
  eventName: string;
  eventId: string;
  ageGroup: string;
  registeredAt: string;
  status: 'registered' | 'approved' | 'rejected' | 'withdrawn';
  amount: number;
  paymentId?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentDate?: string;
  cardLastFour?: string;
  errorCode?: string;
  errorMessage?: string;
  payLater?: boolean;
  setupIntentId?: string; // If this exists, the user has provided payment info
  cardDetails?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  };
}

export default function UserRegistrationsView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'registrations'],
    queryFn: async () => {
      const response = await fetch('/api/user/registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      return response.json();
    }
  });
  
  // Extract registrations array from the response
  const registrations = data?.registrations || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load your registrations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Alert className="bg-card/50 border-primary/20">
        <AlertCircle className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary">No Registrations Found</AlertTitle>
        <AlertDescription className="mt-2">
          You haven't registered for any events yet. Browse our events and register your team today!
        </AlertDescription>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {registrations.map((registration: Registration, index: number) => (
          <Card 
            key={registration.id} 
            className="member-card w-full h-full overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <CardHeader className="pb-2 member-card-header">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                    {registration.teamName}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {registration.eventName} | {registration.ageGroup}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1">
                  <TeamStatusBadge 
                    status={registration.status} 
                    payLater={registration.payLater} 
                    setupIntentId={registration.setupIntentId} 
                  />
                  <PaymentStatusBadge status={registration.paymentStatus} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center bg-primary/5 px-2 py-1 rounded">
                  <span className="text-muted-foreground">Registered:</span>
                  <span className="font-medium">{formatDate(registration.registeredAt)}</span>
                </div>
                
                {/* Show payment details when available */}
                {registration.paymentStatus === 'paid' && (
                  <>
                    <div className="flex justify-between items-center px-2 py-1">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-medium text-primary/90">{registration.paymentId || 'N/A'}</span>
                    </div>
                    {registration.paymentDate && (
                      <div className="flex justify-between items-center px-2 py-1">
                        <span className="text-muted-foreground">Payment Date:</span>
                        <span>{formatDate(registration.paymentDate)}</span>
                      </div>
                    )}
                    {registration.cardLastFour && (
                      <div className="flex justify-between items-center px-2 py-1">
                        <span className="text-muted-foreground">Card:</span>
                        <span>••••{registration.cardLastFour}</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Show error message if payment failed */}
                {registration.paymentStatus === 'failed' && registration.errorMessage && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                    <p className="font-medium">Payment Error:</p>
                    <p>{registration.errorMessage}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center bg-primary/5 px-2 py-1 rounded">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-primary">${(registration.amount / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <div className="flex flex-col w-full gap-2">
                <div className="flex justify-between gap-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/events/${registration.eventId}`}>View Event</Link>
                  </Button>
                  
                  {/* Only show payment button if payment is still pending AND user hasn't provided card yet */}
                  {(registration.paymentStatus === 'pending' || !registration.paymentStatus) && 
                    registration.amount > 0 && 
                    !registration.setupIntentId && // Don't show if card details already provided
                    !registration.payLater && // Don't show if they selected pay later
                    (
                      <Button variant="default" size="sm" className="w-full" asChild>
                        <Link href={`/events/${registration.eventId}/pay/${registration.id}`}>Pay Now</Link>
                      </Button>
                    )
                  }
                </div>
                
                {/* Show card info if it exists */}
                {registration.setupIntentId && registration.cardDetails?.last4 && (
                  <div className="text-sm text-center text-muted-foreground border rounded p-2 flex items-center justify-center bg-muted/30">
                    <CreditCard className="h-3.5 w-3.5 mr-2 text-primary/70" />
                    {registration.cardDetails.brand 
                      ? `${registration.cardDetails.brand.charAt(0).toUpperCase() + registration.cardDetails.brand.slice(1)} ending in ${registration.cardDetails.last4}`
                      : `Card ending in ${registration.cardDetails.last4}`
                    }
                    {registration.cardDetails.expMonth && registration.cardDetails.expYear && 
                      ` (exp. ${registration.cardDetails.expMonth}/${registration.cardDetails.expYear.toString().slice(-2)})`
                    }
                  </div>
                )}
                
                {/* Show "Payment Info Provided" message with appropriate explanation */}
                {registration.setupIntentId && (
                  <div className="text-xs text-center text-muted-foreground">
                    <span className="font-medium">Note:</span> Your card will be charged after your registration is approved.
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}