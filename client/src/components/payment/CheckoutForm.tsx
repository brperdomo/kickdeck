import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  totalAmount?: number;
}

export default function CheckoutForm({ 
  onSuccess, 
  onError, 
  buttonText = 'Submit Payment',
  totalAmount 
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded yet. Please try again.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation`,
        },
        redirect: 'if_required',
      });
      
      if (error) {
        // Show error to customer
        setErrorMessage(error.message || 'An unexpected error occurred.');
        if (onError) onError(error.message || 'Payment failed');
        
        toast({
          title: 'Payment Failed',
          description: error.message || 'Your payment could not be processed.',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment success!
        if (onSuccess) onSuccess(paymentIntent.id);
        
        toast({
          title: 'Payment Successful',
          description: 'Thank you for your payment!',
        });
      } else {
        // Payment requires additional steps or is still processing
        toast({
          title: 'Payment Processing',
          description: 'Your payment is being processed. Please wait...',
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred during payment processing.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-accent/10 rounded-lg mb-4">
        {totalAmount && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">Total</span>
            <span className="text-lg font-bold">${(totalAmount / 100).toFixed(2)}</span>
          </div>
        )}
        
        <PaymentElement />
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
        ) : buttonText}
      </Button>
    </form>
  );
}