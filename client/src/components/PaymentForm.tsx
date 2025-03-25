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
    const createIntent = async () => {
      if (amount <= 0) return;

      try {
        const metadata: Record<string, string> = {};
        
        if (teamId) metadata.teamId = String(teamId);
        if (eventId) metadata.eventId = String(eventId);
        if (ageGroupId) metadata.ageGroupId = String(ageGroupId);
        
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: 'usd',
            description,
            metadata,
            eventId,
            ageGroupId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
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
  }, [amount, description, teamId, eventId, ageGroupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
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
      }
    } catch (err) {
      setError('Error processing payment: ' + (err instanceof Error ? err.message : 'Unknown error'));
      toast({
        title: 'Payment Processing Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive'
      });
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
          disabled={!stripe || !elements || isProcessing || !clientSecret}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}