import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payment';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface URLParams {
  setup_intent: string;
  team_id: string;
}

function PaymentCompletionForm({ clientSecret, teamId }: { clientSecret: string; teamId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Failed to submit payment information');
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/complete-payment?team_id=${teamId}&success=true`,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        setError(confirmError.message || 'Failed to confirm payment method');
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        setIsComplete(true);
        toast({
          title: "Payment Method Saved",
          description: "Your payment information has been securely saved. Processing payment...",
        });
        
        // Now process the actual payment
        await processTeamPayment(teamId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const processTeamPayment = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/complete-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Payment Processed",
          description: `Payment of $${result.amount} has been successfully processed.`,
        });
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Error",
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: "destructive"
      });
    }
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Payment Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your payment method has been saved and your registration payment has been processed.
          </p>
          <p className="text-sm text-gray-500">
            You can now close this window. You should receive a confirmation email shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Complete Payment Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-md">
            <PaymentElement />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || !elements || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Payment Setup'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CompletePayment() {
  const [location] = useLocation();
  const [params, setParams] = useState<URLParams | null>(null);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get URL parameters from window.location.search instead of wouter location
    const urlParams = new URLSearchParams(window.location.search);
    const setupIntent = urlParams.get('setup_intent');
    const teamId = urlParams.get('team_id');

    console.log('CompletePayment URL parsing:', {
      fullUrl: window.location.href,
      search: window.location.search,
      setupIntent,
      teamId,
      allParams: Object.fromEntries(urlParams.entries())
    });

    if (!setupIntent || !teamId) {
      console.error('Missing required parameters:', { setupIntent, teamId });
      setError('Invalid payment link. Please check the URL and try again.');
      setLoading(false);
      return;
    }

    setParams({ setup_intent: setupIntent, team_id: teamId });

    // Fetch team information using the public payment info endpoint
    fetch(`/api/teams/${teamId}/payment-info`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setTeamInfo({
          id: data.teamId,
          name: data.teamName,
          eventName: data.eventName,
          totalAmount: data.totalAmount,
          paymentStatus: data.paymentStatus
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching team info:', err);
        setError('Failed to load team information');
        setLoading(false);
      });
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading payment setup...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !params) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-800">Payment Setup Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Invalid payment link'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stripe = getStripe();

  if (!stripe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Payment system unavailable. Please try again later.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {teamInfo && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Payment for {teamInfo.name}
            </h1>
            <p className="text-gray-600">
              Please provide your payment information to complete your team registration.
            </p>
          </div>
        )}
        
        <Elements
          stripe={stripe}
          options={{
            clientSecret: params.setup_intent,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#2563eb',
              },
            },
          }}
        >
          <PaymentCompletionForm 
            clientSecret={params.setup_intent} 
            teamId={params.team_id}
          />
        </Elements>
      </div>
    </div>
  );
}