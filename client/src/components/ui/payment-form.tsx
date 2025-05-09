import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import { PaymentStatusBadge } from './payment-status-badge';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { createPaymentIntent, getStripe } from '@/lib/payment';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

// Payment states for the form
type PaymentStatus = 'initial' | 'processing' | 'success' | 'error';

interface PaymentFormProps {
  amount: number;
  teamId: number;
  returnUrl: string;
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onPaymentError?: (error: Error) => void;
  teamName?: string;
  eventName?: string;
}

// Inner form component that handles payment submission
const PaymentFormContent = ({ 
  amount, 
  teamId, 
  returnUrl,
  onPaymentSuccess,
  onPaymentError
}: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('initial');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setPaymentStatus('processing');
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required'
      });
      
      if (error) {
        console.error('Payment failed:', error);
        setPaymentStatus('error');
        setErrorMessage(error.message || 'An error occurred during payment processing');
        if (onPaymentError) onPaymentError(new Error(error.message || 'Payment failed'));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        if (onPaymentSuccess) onPaymentSuccess(paymentIntent.id);
      } else {
        // Check if we need additional actions like 3D Secure
        const paymentStatus = paymentIntent?.status || 'unknown';
        if (paymentStatus === 'requires_action') {
          // Redirect will happen automatically by Stripe
          setErrorMessage('Additional verification required. Please complete the secure authentication.');
        } else {
          setPaymentStatus('error');
          setErrorMessage(`Payment status: ${paymentStatus}. Please try again.`);
        }
      }
    } catch (error: any) {
      console.error('Payment submission error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
      if (onPaymentError) onPaymentError(error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {paymentStatus === 'error' && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {paymentStatus === 'success' && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Payment Successful</AlertTitle>
          <AlertDescription>Your payment has been processed successfully.</AlertDescription>
        </Alert>
      )}
      
      {paymentStatus !== 'success' && (
        <div className="space-y-6">
          <PaymentElement />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || !elements || paymentStatus === 'processing'}
          >
            {paymentStatus === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)}`
            )}
          </Button>
        </div>
      )}
    </form>
  );
};

// Outer component that loads Stripe and creates the payment intent
export const PaymentForm = ({ 
  amount, 
  teamId, 
  returnUrl,
  onPaymentSuccess,
  onPaymentError,
  teamName,
  eventName
}: PaymentFormProps) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load the Stripe instance
    setStripePromise(getStripe());
    
    // Create a payment intent
    const createIntent = async () => {
      try {
        setIsLoading(true);
        const { clientSecret } = await createPaymentIntent(amount, teamId, {
          teamName: teamName || 'Team Registration',
          eventName: eventName || 'Event'
        });
        setClientSecret(clientSecret);
      } catch (err: any) {
        console.error('Failed to create payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
        if (onPaymentError) onPaymentError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    createIntent();
  }, [amount, teamId]);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-48">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Initializing payment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
          <CardDescription>We encountered a problem setting up your payment</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to Initialize Payment</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!clientSecret) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment Information</CardTitle>
        <CardDescription>
          {teamName && eventName 
            ? `Register ${teamName} for ${eventName}`
            : 'Provide your payment information securely'}
        </CardDescription>
        <div className="mt-2 py-2 px-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-sm">
          <p><strong>Important:</strong> Your payment method will be securely stored but not charged at this time. Payment will only be processed after your team registration is approved by the event administrators.</p>
        </div>
      </CardHeader>
      <CardContent>
        <Elements 
          stripe={stripePromise} 
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#0f766e',
              }
            }
          }}
        >
          <PaymentFormContent 
            amount={amount} 
            teamId={teamId} 
            returnUrl={returnUrl}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};