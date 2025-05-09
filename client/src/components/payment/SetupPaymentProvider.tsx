import { useState, useEffect, ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import { getStripe } from '@/lib/payment';
import { useToast } from '@/hooks/use-toast';

interface SetupPaymentProviderProps {
  children: ReactNode;
  clientSecret: string | null;
}

/**
 * A provider component that sets up the Stripe context for collecting
 * payment method information without charging (Setup Intent flow).
 */
export function SetupPaymentProvider({ 
  children,
  clientSecret
}: SetupPaymentProviderProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadStripe = async () => {
      try {
        setIsLoading(true);
        const stripe = getStripe();
        setStripePromise(stripe);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        toast({
          title: 'Payment Setup Error',
          description: 'Could not initialize the payment system. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStripe();
  }, [toast]);

  // Configure Stripe Elements
  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7c3aed', // Primary color (purple)
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  if (isLoading || !stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Initializing payment system...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 border rounded-md text-center">
        <p className="text-muted-foreground">Payment setup not initialized. Please try again.</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}