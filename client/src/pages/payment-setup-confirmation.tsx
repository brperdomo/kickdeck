import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getSetupStatus } from '@/lib/payment';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SetupStatus {
  status: 'succeeded' | 'processing' | 'failed' | 'cancelled' | 'requires_payment_method' | 'unknown';
  setupIntent: string;
  paymentMethodId?: string;
  cardBrand?: string;
  cardLast4?: string;
  teamName?: string;
  eventName?: string;
  errorMessage?: string;
}

export default function PaymentSetupConfirmation() {
  const [, setLocation] = useLocation();
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    status: 'unknown',
    setupIntent: '',
  });

  // Extract setup intent ID from URL parameters
  const params = new URLSearchParams(window.location.search);
  const setupIntentId = params.get('setup_intent');
  const redirectStatus = params.get('redirect_status');

  // Query to get the setup intent status
  const { data, isLoading, error } = useQuery({
    queryKey: ['setupIntent', setupIntentId],
    queryFn: async () => {
      if (!setupIntentId) {
        throw new Error('No setup intent ID found in URL');
      }
      
      const statusData = await getSetupStatus(setupIntentId);
      
      // Extract metadata
      const teamName = statusData.metadata?.teamName || 'Your team';
      const eventName = statusData.metadata?.eventName || 'the event';
      
      // Extract payment method info if available
      let cardBrand, cardLast4;
      if (statusData.paymentMethod) {
        const paymentMethod = await fetch(`/api/payments/payment-method/${statusData.paymentMethod}`).then(res => res.json());
        cardBrand = paymentMethod?.card?.brand;
        cardLast4 = paymentMethod?.card?.last4;
      }
      
      return {
        status: statusData.status || redirectStatus || 'unknown',
        setupIntent: setupIntentId,
        paymentMethodId: statusData.paymentMethod,
        cardBrand,
        cardLast4,
        teamName,
        eventName
      };
    },
    enabled: !!setupIntentId,
    retry: 1
  });

  // Update setup status when data changes
  useEffect(() => {
    if (data) {
      setSetupStatus(data);
    }
  }, [data]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Processing Payment Information</CardTitle>
            <CardDescription>Please wait while we confirm your payment setup...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Processing your payment details</p>
            <p className="text-sm text-muted-foreground mt-2">This should only take a moment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (error || setupStatus.status === 'failed' || setupStatus.status === 'cancelled') {
    return (
      <div className="container max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Setup Failed</CardTitle>
            <CardDescription>We couldn't process your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>There was a problem with your payment method</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 
                 setupStatus.errorMessage || 
                 'Your payment information could not be processed. Please try again.'}
              </AlertDescription>
            </Alert>
            
            <div className="mt-6">
              <p>Some common reasons for payment setup failures:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>The card information entered was incorrect</li>
                <li>The card has insufficient funds or is expired</li>
                <li>The card issuer declined the transaction</li>
                <li>The payment process was cancelled</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Handle success state
  return (
    <div className="container max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader className="bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
            <CardTitle>Payment Information Saved</CardTitle>
          </div>
          <CardDescription>Your payment method has been successfully saved</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Payment setup successful</AlertTitle>
              <AlertDescription>
                Your payment information has been securely stored. You'll only be charged after your team registration is reviewed and approved.
              </AlertDescription>
            </Alert>

            {(setupStatus.cardBrand && setupStatus.cardLast4) && (
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">Payment Method</h3>
                </div>
                <div className="mt-2 pl-7">
                  <p>
                    {setupStatus.cardBrand.charAt(0).toUpperCase() + setupStatus.cardBrand.slice(1)} ending in {setupStatus.cardLast4}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ol className="space-y-3 pl-6 list-decimal">
                <li>Your team registration for {setupStatus.eventName || 'the event'} has been submitted for review.</li>
                <li>Event administrators will review your registration.</li>
                <li>If approved, your card will be charged, and you'll receive a confirmation email.</li>
                <li>You can check the status of your registration in your dashboard.</li>
              </ol>
            </div>

            <Separator />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Registration Reference: {setupStatus.setupIntent}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Button onClick={() => setLocation('/dashboard')} size="lg">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}