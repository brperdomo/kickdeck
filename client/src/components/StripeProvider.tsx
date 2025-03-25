import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/payments/config');
        
        if (!response.ok) {
          throw new Error('Failed to load Stripe configuration');
        }
        
        const { publishableKey } = await response.json();
        
        if (!publishableKey) {
          throw new Error('Stripe publishable key not found');
        }
        
        setStripePromise(loadStripe(publishableKey));
      } catch (err) {
        console.error('Error loading Stripe:', err);
        setError('Could not initialize payment system. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  if (loading) {
    return <div className="p-4">
      <Skeleton className="h-10 w-full mb-4" />
      <Skeleton className="h-40 w-full" />
    </div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}