import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CreditCard, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createSetupIntent, confirmSetup } from '@/lib/payment';
import { getStripe, resetStripeLoader } from '@/lib/payment';
import { StripeConnectionDiagnostics } from './StripeConnectionDiagnostics';

interface SetupPaymentFormProps {
  teamId: number | string;
  expectedAmount: number;
  onSuccess: (setupIntentId: string, paymentMethodId: string) => void;
  onError?: (error: Error) => void;
  teamName?: string;
  eventName?: string;
  returnUrl?: string;
  hideSubmitButton?: boolean;
}

function SetupPaymentFormInner({
  teamId,
  expectedAmount,
  onSuccess,
  onError,
  teamName = '',
  eventName = '',
  returnUrl = '',
  hideSubmitButton = false,
  clientSecret
}: SetupPaymentFormProps & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasStripeConnectivityError, setHasStripeConnectivityError] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      toast({
        title: 'Payment Setup Error',
        description: 'Payment form is not ready. Please wait and try again.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // First validate the payment element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Payment element validation error:', submitError);
        setErrorMessage(submitError.message || 'Please check your payment information');
        return;
      }

      console.log('🎯 Confirming setup intent with client secret:', clientSecret);
      
      // Confirm the setup intent with the payment method
      const result = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required'
      });
      
      console.log('🎯 Setup intent confirmation result:', {
        error: result.error,
        setupIntentStatus: result.setupIntent?.status,
        setupIntentId: result.setupIntent?.id,
        paymentMethodId: result.setupIntent?.payment_method
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

        // Show success message
        toast({
          title: 'Payment Method Saved',
          description: 'Your payment information has been securely saved.',
        });
        
        // Pass both setup intent ID and payment method ID to parent
        if (onSuccess) {
          // Store setup intent ID in global scope for registration use
          (window as any).lastSetupIntentId = result.setupIntent.id;
          (window as any).lastPaymentMethodId = result.setupIntent.payment_method as string;
          
          console.log('🎯 Payment setup completed successfully');
          console.log('🎯 Stored Setup Intent ID:', result.setupIntent.id);
          console.log('🎯 Stored Payment Method ID:', result.setupIntent.payment_method);
          
          onSuccess(result.setupIntent.id, result.setupIntent.payment_method as string);
        }
      } else {
        const status = result.setupIntent?.status || 'unknown';
        console.log('❌ PAYMENT SETUP FAILED:', {
          status: status,
          hasSetupIntent: !!result.setupIntent,
          hasPaymentMethod: !!result.setupIntent?.payment_method
        });
        setErrorMessage(`Payment setup incomplete. Please ensure your card information is complete and try again. Status: ${status}`);
        if (onError) onError(new Error(`Payment setup not completed. Status: ${status}`));
      }
    } catch (error) {
      console.error('Error confirming setup:', error);
      
      // Check if this is a Stripe connectivity error
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (errorMessage.includes('Failed to fetch') && errorMessage.includes('stripe.com')) {
        setHasStripeConnectivityError(true);
        setErrorMessage('Unable to connect to payment servers. Please check your network connection and try again.');
      } else if (errorMessage.includes('Failed to load Stripe')) {
        setHasStripeConnectivityError(true);
        setErrorMessage('Payment system is having connectivity issues. Please try the suggestions below.');
      } else {
        setErrorMessage(errorMessage);
      }
      
      if (onError) onError(error instanceof Error ? error : new Error('Payment setup failed'));
    } finally {
      setIsLoading(false);
    }
  };

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
                  applePay: 'never',
                  googlePay: 'never'
                }
              }}
            />
          </div>
          
          {errorMessage && !hasStripeConnectivityError && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
              {errorMessage}
            </div>
          )}
          
          {hasStripeConnectivityError && (
            <StripeConnectionDiagnostics 
              onConnectionRestored={() => {
                setHasStripeConnectivityError(false);
                setErrorMessage(null);
                setRetryAttempt(prev => prev + 1);
              }}
            />
          )}
          
          {!hideSubmitButton && (
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
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function SetupPaymentForm(props: SetupPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  // Initialize Stripe with retry logic
  useEffect(() => {
    const initStripe = async () => {
      try {
        if (retryCount > 0) {
          resetStripeLoader();
        }
        const stripe = getStripe();
        setStripePromise(stripe);
        setStripeError(null);
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('stripe.com') || errorMessage.includes('Failed to load Stripe')) {
          setStripeError('Unable to connect to payment servers. Please check your network connection.');
        } else {
          setStripeError('Failed to load payment system.');
        }
      }
    };
    
    initStripe();
  }, [retryCount]);

  useEffect(() => {
    const initializeSetupIntent = async () => {
      try {
        setIsLoading(true);

        // CRITICAL FIX: Check if we already have a completed Setup Intent for this session
        const lastSetupIntentId = (window as any).lastSetupIntentId;
        const lastClientSecret = (window as any).lastClientSecret;
        const lastTeamId = (window as any).lastTeamId;
        const lastAmount = (window as any).lastAmount;
        
        // If we have a cached Setup Intent for the same team and amount, reuse it
        if (lastSetupIntentId && lastClientSecret && 
            lastTeamId === props.teamId && 
            lastAmount === props.expectedAmount) {
          console.log('🔄 Reusing existing Setup Intent for team', props.teamId, ':', lastSetupIntentId);
          console.log('🔄 Client secret length:', lastClientSecret.length);
          
          setSetupIntentId(lastSetupIntentId);
          setClientSecret(lastClientSecret);
          setIsLoading(false);
          return;
        }

        console.log('🎯 Creating setup intent for payment form initialization');
        console.log('🎯 Team ID:', props.teamId, 'Amount:', props.expectedAmount, 'Team Name:', props.teamName);
        
        const response = await createSetupIntent(props.teamId, {
          teamName: props.teamName || '',
          eventName: props.eventName || '',
          expectedAmount: props.expectedAmount.toString()
        });

        if (response.clientSecret) {
          console.log('🎯 Setup intent created successfully:', response.setupIntentId);
          console.log('🎯 Client secret received, length:', response.clientSecret.length);
          
          // Store the setup intent details globally for session reuse
          (window as any).lastSetupIntentId = response.setupIntentId;
          (window as any).lastClientSecret = response.clientSecret;
          (window as any).lastTeamId = props.teamId;
          (window as any).lastAmount = props.expectedAmount;
          
          setSetupIntentId(response.setupIntentId);
          setClientSecret(response.clientSecret);
        } else {
          throw new Error('No client secret returned from server');
        }
      } catch (error) {
        console.error('Failed to create setup intent:', error);
        const errorMessage = error instanceof Error ? error.message : 'Setup intent creation failed';
        
        // Check if this is a connectivity error
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          setStripeError('Unable to connect to payment servers. Please check your network connection.');
        } else {
          setStripeError(errorMessage);
        }
        
        if (props.onError) props.onError(error instanceof Error ? error : new Error('Setup intent creation failed'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeSetupIntent();
  }, [props.teamId, props.expectedAmount, props.teamName, props.eventName, props.onError]);

  if (stripeError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Payment System Error</h3>
              <p className="text-muted-foreground mb-4">{stripeError}</p>
            </div>
            <StripeConnectionDiagnostics 
              onConnectionRestored={() => setRetryCount(prev => prev + 1)}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !clientSecret || !stripePromise) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-48">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Preparing payment form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#007AFF',
          },
        },
      }}
    >
      <SetupPaymentFormInner {...props} clientSecret={clientSecret} />
    </Elements>
  );
}