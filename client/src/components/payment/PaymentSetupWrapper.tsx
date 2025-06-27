import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payment';
import { SetupPaymentForm } from './SetupPaymentForm';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Global cache to store setup intents by team ID to prevent duplicates
const setupIntentCache = new Map<string, { clientSecret: string; setupIntentId: string }>();

// Function to clear completed setup intents from cache
export function clearSetupIntentCache(teamId: string | number, expectedAmount: number) {
  const cacheKey = `${teamId}-${expectedAmount}`;
  setupIntentCache.delete(cacheKey);
  console.log(`🧹 Cleared setup intent cache for team ${teamId}`);
}

interface PaymentSetupWrapperProps {
  teamId: number | string;
  expectedAmount: number;
  onSuccess: (setupIntentId: string, paymentMethodId: string) => void;
  onError?: (error: Error) => void;
  teamName?: string;
  eventName?: string;
  returnUrl?: string;
  hideSubmitButton?: boolean;
}

export function PaymentSetupWrapper({
  teamId,
  expectedAmount,
  onSuccess,
  onError,
  teamName = '',
  eventName = '',
  returnUrl = '',
  hideSubmitButton = false
}: PaymentSetupWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingSetupIntent, setIsCreatingSetupIntent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const createOrReuseSetupIntent = async () => {
      setIsCreatingSetupIntent(true);
      
      // Create a unique cache key for this team/amount combination
      const cacheKey = `${teamId}-${expectedAmount}`;
      
      // Check if we already have a setup intent for this team
      const cached = setupIntentCache.get(cacheKey);
      if (cached) {
        console.log(`🔄 Reusing existing setup intent for team ${teamId}: ${cached.setupIntentId}`);
        setClientSecret(cached.clientSecret);
        setIsCreatingSetupIntent(false);
        return;
      }
      
      try {
        console.log(`🎯 Creating setup intent for payment form initialization`);
        console.log(`🎯 Team ID: ${teamId} Amount: ${expectedAmount} Team Name: ${teamName}`);
        
        const response = await fetch('/api/payments/create-setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            expectedAmount,
            teamName,
            eventName,
            returnUrl
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create setup intent');
        }

        const data = await response.json();
        
        // Cache the setup intent for reuse
        setupIntentCache.set(cacheKey, {
          clientSecret: data.clientSecret,
          setupIntentId: data.setupIntentId
        });
        
        console.log(`🎯 Setup intent created successfully: ${data.setupIntentId}`);
        console.log(`🎯 Client secret received, length: ${data.clientSecret?.length || 0}`);
        
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating setup intent:', error);
        if (onError) {
          onError(error as Error);
        } else {
          toast({
            title: 'Payment Setup Error',
            description: 'Failed to initialize payment setup. Please try again.',
            variant: 'destructive'
          });
        }
      } finally {
        setIsCreatingSetupIntent(false);
      }
    };

    createOrReuseSetupIntent();
  }, [teamId, expectedAmount, teamName, eventName, returnUrl, onError, toast]);

  if (isCreatingSetupIntent || !clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setting up payment...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Initializing secure payment...</span>
        </CardContent>
      </Card>
    );
  }

  const stripe = getStripe();

  if (!stripe) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment System Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Unable to load payment system. Please refresh the page and try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
          },
        },
      }}
    >
      <SetupPaymentForm
        teamId={teamId}
        expectedAmount={expectedAmount}
        onSuccess={onSuccess}
        onError={onError}
        teamName={teamName}
        eventName={eventName}
        returnUrl={returnUrl}
        hideSubmitButton={hideSubmitButton}
      />
    </Elements>
  );
}