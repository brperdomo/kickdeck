import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  teamId?: number;
  eventId?: string;
  ageGroupId?: number;
  description?: string;
}

export default function PaymentForm({
  amount,
  onSuccess,
  isProcessing,
  setIsProcessing,
  teamId,
  eventId,
  ageGroupId,
  description = 'Team Registration Fee'
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Create a payment intent when the component loads
  useEffect(() => {
    // Prevent duplicate intent creation if we already have one
    if (clientSecret || paymentIntentId) return;
    
    const createIntent = async () => {
      if (amount <= 0) {
        console.log('PaymentForm: Skipping payment intent creation - amount is 0 or negative:', amount);
        return;
      }
      
      if (!teamId) {
        console.log('PaymentForm: Skipping payment intent creation - teamId is missing:', teamId);
        setError('Team ID is required for payment processing');
        return;
      }

      try {
        const metadata: Record<string, string> = {};
        
        if (teamId) metadata.teamId = String(teamId);
        if (eventId) metadata.eventId = String(eventId);
        if (ageGroupId) metadata.ageGroupId = String(ageGroupId);
        
        const requestBody = {
          amount,
          currency: 'usd',
          description,
          metadata,
          eventId,
          ageGroupId,
          teamId // Include teamId directly in the request body for duplicate payment prevention
        };
        
        console.log('PaymentForm: Creating payment intent with request:', requestBody);
        
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle the specific case where payment was already made
          if (errorData.error === 'This registration has already been paid for') {
            // Show a more user-friendly message
            toast({
              title: 'Already Paid',
              description: 'This registration has already been processed and paid for. You will not be charged again.',
              variant: 'default'
            });
            
            // If there's an existing payment ID, we can consider this a success
            if (errorData.existingPaymentId && teamId) {
              onSuccess(errorData.existingPaymentId);
              return;
            }
          } else {
            throw new Error(errorData.error || 'Failed to create payment intent');
          }
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        setError('Error creating payment: ' + (err instanceof Error ? err.message : 'Unknown error'));
        toast({
          title: 'Payment Error',
          description: 'Could not initialize payment. Please try again later.',
          variant: 'destructive'
        });
      }
    };

    createIntent();
  }, [amount, description, teamId, eventId, ageGroupId, clientSecret, paymentIntentId]);

  // Track if the form has been submitted to prevent multiple submissions
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate form submissions
    if (isProcessing || isSubmitted || !stripe || !elements || !clientSecret) {
      return;
    }

    // Mark as processing and submitted immediately
    setIsProcessing(true);
    setIsSubmitted(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        setError(error.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: error.message || 'An error occurred while processing your payment.',
          variant: 'destructive'
        });
        // Allow retrying if there's an error
        setIsSubmitted(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully.',
          variant: 'default'
        });
        
        if (paymentIntentId) {
          onSuccess(paymentIntentId);
        }
      } else {
        setError('Payment status: ' + (paymentIntent?.status || 'unknown'));
        toast({
          title: 'Payment Status',
          description: 'Payment status: ' + (paymentIntent?.status || 'unknown'),
          variant: 'default'
        });
        // Allow retrying for unclear statuses
        setIsSubmitted(false);
      }
    } catch (err) {
      setError('Error processing payment: ' + (err instanceof Error ? err.message : 'Unknown error'));
      toast({
        title: 'Payment Processing Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive'
      });
      // Allow retrying after errors
      setIsSubmitted(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Please enter your card information to complete your payment of ${(amount / 100).toFixed(2)}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} id="payment-form">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card Information
            </label>
            <div className="p-3 border rounded-md bg-background">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm mb-4">
              {error}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          form="payment-form"
          disabled={!stripe || !elements || isProcessing || !clientSecret || isSubmitted}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isSubmitted ? (
            "Payment submitted"
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}