import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReactNode, useEffect, useState } from 'react';

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  useEffect(() => {
    // Fetch the publishable key from backend to avoid exposing in client code
    const fetchPublishableKey = async () => {
      try {
        const response = await fetch('/api/payments/config');
        if (!response.ok) {
          throw new Error('Failed to load Stripe configuration');
        }
        const { publishableKey } = await response.json();
        
        if (!publishableKey) {
          console.error('No Stripe publishable key found.');
          return;
        }
        
        console.log('Initializing Stripe with publishable key');
        const stripe = loadStripe(publishableKey);
        setStripePromise(stripe);
      } catch (error) {
        console.error('Error loading Stripe configuration:', error);
      }
    };

    fetchPublishableKey();
  }, []);

  if (!stripePromise) {
    return <div className="p-4 text-center">Loading payment system...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}