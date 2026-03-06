import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payment';
import { SetupPaymentForm } from './SetupPaymentForm';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Persistent cache to store setup intents by team ID to prevent duplicates
const CACHE_PREFIX = 'kickdeck_setup_intent_';
const SESSION_PREFIX = 'kickdeck_session_setup_';

function getCacheKey(teamId: string | number, expectedAmount: number): string {
  return `${CACHE_PREFIX}${teamId}-${expectedAmount}`;
}

function getSessionCacheKey(teamId: string | number): string {
  return `${SESSION_PREFIX}${teamId}`;
}

function getCachedSetupIntent(teamId: string | number, expectedAmount: number) {
  try {
    // First check session-specific cache (more strict, for this session only)
    const sessionKey = getSessionCacheKey(teamId);
    const sessionCached = sessionStorage.getItem(sessionKey);
    if (sessionCached) {
      const data = JSON.parse(sessionCached);
      console.log('🔄 Reusing SESSION cached setup intent:', data.setupIntentId);
      return { clientSecret: data.clientSecret, setupIntentId: data.setupIntentId };
    }
    
    // Fall back to localStorage cache with amount validation
    const cacheKey = getCacheKey(teamId, expectedAmount);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (less than 1 hour old)
      if (Date.now() - data.timestamp < 60 * 60 * 1000) {
        console.log('🔄 Reusing LOCAL cached setup intent:', data.setupIntentId);
        // Also store in session cache for faster future access
        sessionStorage.setItem(sessionKey, JSON.stringify({
          clientSecret: data.clientSecret,
          setupIntentId: data.setupIntentId
        }));
        return { clientSecret: data.clientSecret, setupIntentId: data.setupIntentId };
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.log('Error reading setup intent cache:', error);
  }
  return null;
}

function setCachedSetupIntent(teamId: string | number, expectedAmount: number, clientSecret: string, setupIntentId: string) {
  try {
    // Store in localStorage with amount validation
    const cacheKey = getCacheKey(teamId, expectedAmount);
    const data = {
      clientSecret,
      setupIntentId,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    // ALSO store in sessionStorage for strict session-based reuse
    const sessionKey = getSessionCacheKey(teamId);
    const sessionData = {
      clientSecret,
      setupIntentId
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
    
    console.log('💾 Setup intent cached in both localStorage and sessionStorage:', setupIntentId);
  } catch (error) {
    console.log('Error caching setup intent:', error);
  }
}

// Function to clear completed setup intents from cache
export function clearSetupIntentCache(teamId: string | number, expectedAmount: number) {
  try {
    const cacheKey = getCacheKey(teamId, expectedAmount);
    localStorage.removeItem(cacheKey);
    console.log(`🧹 Cleared setup intent cache for team ${teamId}`);
  } catch (error) {
    console.log('Error clearing setup intent cache:', error);
  }
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
      // ALWAYS check cache first before any state changes
      const cached = getCachedSetupIntent(teamId, expectedAmount);
      if (cached) {
        console.log(`🔄 Reusing cached setup intent for team ${teamId}: ${cached.setupIntentId}`);
        setClientSecret(cached.clientSecret);
        setIsCreatingSetupIntent(false);
        return;
      }
      
      setIsCreatingSetupIntent(true);
      
      try {
        console.log(`🎯 Creating setup intent for payment form initialization`);
        console.log(`🎯 Team ID: ${teamId} Amount: ${expectedAmount}`);
        
        const response = await fetch('/api/payments/create-setup-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            expectedAmount
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create setup intent');
        }

        const data = await response.json();
        
        // Cache the setup intent for reuse
        setCachedSetupIntent(teamId, expectedAmount, data.clientSecret, data.setupIntentId);
        
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
  }, [teamId, expectedAmount]); // ONLY depend on essential variables

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