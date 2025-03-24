import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  description?: string;
  metadata?: Record<string, string>;
  eventId?: string;
  ageGroupId?: string;
}

export default function PaymentForm({
  amount,
  onSuccess,
  isProcessing,
  setIsProcessing,
  description = 'Team Registration Fee',
  metadata = {},
  eventId,
  ageGroupId
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded
      setError('Payment system is still loading. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create payment intent on the server
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount, // amount is in cents
          currency: 'usd',
          description,
          metadata,
          eventId,
          ageGroupId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
      
      const { clientSecret, paymentIntentId } = await response.json();
      
      // Confirm the payment with the card element
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });
      
      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess(paymentIntentId);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>
          Payment amount: ${(amount / 100).toFixed(2)}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="mb-4">
            <div className="border p-3 rounded-md bg-background">
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
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={!stripe || isProcessing} 
            className="w-full"
          >
            {isProcessing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}