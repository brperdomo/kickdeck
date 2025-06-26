import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CreditCard, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createSetupIntent, confirmSetup } from '@/lib/payment';
import { getStripe } from '@/lib/payment';

interface SetupPaymentFormProps {
  teamId: number | string;
  expectedAmount: number;
  onSuccess: (paymentMethodId: string) => void;
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
  teamName = 'Team Registration',
  eventName = 'Event',
  returnUrl = window.location.origin + '/payment-setup-confirmation',
  hideSubmitButton = false
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

        console.log('🎯 Creating setup intent for payment form initialization');
        console.log('🎯 Team ID:', teamId, 'Amount:', expectedAmount, 'Team Name:', teamName);
        
        const response = await createSetupIntent(teamId, {
          teamName,
          eventName,
          expectedAmount: expectedAmount.toString()
        });

        if (response.clientSecret) {
          console.log('🎯 Setup intent created successfully:', response.setupIntentId);
          console.log('🎯 Client secret received, length:', response.clientSecret.length);
          
          // Store the setup intent ID globally for registration use
          (window as any).lastSetupIntentId = response.setupIntentId;
          
          // Set states in the correct order
          setSetupIntentId(response.setupIntentId);
          setClientSecret(response.clientSecret);
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

      // Then confirm the setup intent with billing details
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: returnUrl,

        },
        redirect: 'if_required'
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
        
        console.log('✅ PAYMENT SETUP SUCCESS:', {
          setupIntentId: result.setupIntent.id,
          paymentMethodId: result.setupIntent.payment_method,
          status: result.setupIntent.status
        });

        // Handle success - setupIntent is available on the result object
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
          
          onSuccess(result.setupIntent.payment_method as string);
        }
      } else {
        // Handle other statuses or missing setupIntent
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
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      if (onError) onError(error instanceof Error ? error : new Error('Payment setup failed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Inner component always has clientSecret available

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
          
          {errorMessage && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
              {errorMessage}
            </div>
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
  const stripePromise = getStripe();

  useEffect(() => {
    const initializeSetupIntent = async () => {
      try {
        setIsLoading(true);

        console.log('🎯 Creating setup intent for payment form initialization');
        console.log('🎯 Team ID:', props.teamId, 'Amount:', props.expectedAmount, 'Team Name:', props.teamName);
        
        const response = await createSetupIntent(props.teamId, {
          teamName: props.teamName,
          eventName: props.eventName,
          expectedAmount: props.expectedAmount.toString()
        });

        if (response.clientSecret) {
          console.log('🎯 Setup intent created successfully:', response.setupIntentId);
          console.log('🎯 Client secret received, length:', response.clientSecret.length);
          
          // Store the setup intent ID globally for registration use
          (window as any).lastSetupIntentId = response.setupIntentId;
          
          setSetupIntentId(response.setupIntentId);
          setClientSecret(response.clientSecret);
        } else {
          throw new Error('No client secret returned from server');
        }
      } catch (error) {
        console.error('Failed to create setup intent:', error);
        if (props.onError) props.onError(error instanceof Error ? error : new Error('Setup intent creation failed'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeSetupIntent();
  }, [props.teamId, props.expectedAmount, props.teamName, props.eventName, props.onError]);

  if (isLoading || !clientSecret) {
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