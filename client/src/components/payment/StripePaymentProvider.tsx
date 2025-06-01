import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing Stripe public key. Payment functionality will not work properly.');
}

// Load Stripe outside of component render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface StripePaymentProviderProps {
  children: React.ReactNode;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
  teamId?: number;
  eventId?: string;
  ageGroupId?: string;
}

export default function StripePaymentProvider({
  children,
  amount,
  currency = 'usd',
  description,
  metadata = {},
  teamId,
  eventId,
  ageGroupId,
}: StripePaymentProviderProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create payment intent when the component mounts
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Skip creating payment intent if amount is 0
        if (amount <= 0) {
          setIsLoading(false);
          return;
        }

        // Create a payment intent on the server
        const response = await apiRequest('POST', '/api/payments/create-intent', {
          amount,
          currency,
          description,
          metadata: {
            ...metadata,
            description: description || 'Team registration payment',
          },
          teamId,
          eventId,
          ageGroupId,
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to create payment intent');
        }

        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from the server');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
        
        toast({
          title: 'Payment Error',
          description: err instanceof Error ? err.message : 'Failed to initialize payment',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, currency, description, metadata, teamId, eventId, ageGroupId, toast]);

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
    paymentMethodOrder: ['card'],
    wallets: {
      amazonPay: 'never'
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        <h3 className="font-semibold mb-2">Payment Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading || !stripePromise || !clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Initializing payment system...</p>
      </div>
    );
  }

  // Skip payment UI if amount is 0
  if (amount <= 0) {
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}