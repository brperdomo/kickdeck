import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CreditCard, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createSetupIntent, confirmSetup } from '@/lib/payment';

interface SetupPaymentFormProps {
  teamId: number | string;
  expectedAmount: number;
  onSuccess: (setupIntentId: string, paymentMethodId: string) => void;
  onError?: (error: Error) => void;
  teamName?: string;
  eventName?: string;
  returnUrl?: string;
}

export function SetupPaymentForm({
  teamId,
  expectedAmount,
  onSuccess,
  onError,
  teamName = 'Team Registration',
  eventName = 'Event',
  returnUrl = window.location.origin + '/payment-setup-confirmation'
}: SetupPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);

  // Create a setup intent when the component loads
  useEffect(() => {
    const initializeSetupIntent = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await createSetupIntent(teamId, {
          teamName,
          eventName,
          expectedAmount: expectedAmount.toString()
        });

        if (response.clientSecret) {
          setClientSecret(response.clientSecret);
          setSetupIntentId(response.setupIntentId);
        } else {
          throw new Error('No client secret returned from server');
        }
      } catch (error) {
        console.error('Error creating setup intent:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize payment setup');
        if (onError) onError(error instanceof Error ? error : new Error('Failed to initialize payment setup'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeSetupIntent();
  }, [teamId, expectedAmount, teamName, eventName, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      // Stripe.js has not loaded yet or client secret is missing
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Confirm setup intent without redirect to keep user on the form
      const { getStripe } = await import('@/lib/payment');
      const stripeInstance = await getStripe();
      
      if (!stripeInstance) {
        throw new Error('Stripe failed to load');
      }

      const result = await stripeInstance.confirmSetup({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required' // Only redirect if absolutely necessary
      });

      if (result.error) {
        // Handle errors from Stripe
        setErrorMessage(result.error.message || 'An error occurred with your payment method');
        if (onError) onError(new Error(result.error.message || 'Payment setup failed'));
      } else if (result.setupIntent && result.setupIntent.status === 'succeeded') {
        // Verify payment method is actually attached
        if (!result.setupIntent.payment_method) {
          setErrorMessage('Payment method was not properly saved. Please try again.');
          if (onError) onError(new Error('Payment method not saved'));
          return;
        }
        
        // Handle success - setupIntent is available on the result object
        toast({
          title: 'Payment Method Saved',
          description: 'Your payment information has been securely saved.',
        });
        if (onSuccess) onSuccess(result.setupIntent.id, result.setupIntent.payment_method as string);
      } else {
        // Handle other statuses or missing setupIntent
        setErrorMessage(`Payment setup incomplete. Status: ${result.setupIntent?.status || 'unknown'}`);
        if (onError) onError(new Error('Payment setup not completed'));
      }
    } catch (error) {
      console.error('Error confirming setup:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      if (onError) onError(error instanceof Error ? error : new Error('Payment setup failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-48">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Initializing payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment Information</CardTitle>
        <CardDescription>
          Enter your payment details to secure your registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            Your card will not be charged now. We are only collecting your payment information.
            You will only be charged after your team registration is approved.
            The expected amount is ${(expectedAmount / 100).toFixed(2)}.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-accent/10 rounded-lg">
            <PaymentElement 
              options={{
                paymentMethodOrder: ['card'],
                wallets: {
                  amazonPay: 'never'
                }
              }}
            />
          </div>
          
          {errorMessage && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
              {errorMessage}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Save Payment Information
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}