import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Loader2, CreditCard, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamInfo {
  id: number;
  name: string;
  totalAmount: number;
  paymentStatus: string;
  managerEmail: string;
  eventName?: string;
}

interface FeeBreakdown {
  baseAmount: number;
  platformFeePercentage: number;
  platformFeeFixed: number;
  totalPlatformFees: number;
  totalAmount: number;
}

export default function PaymentRetry() {
  const [match, params] = useRoute('/payment/retry/:teamId');
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { toast } = useToast();

  const teamId = params?.teamId ? parseInt(params.teamId) : null;

  const fetchTeamInfo = async () => {
    if (!teamId) {
      setError('Invalid team ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch team info and fee breakdown simultaneously
      const [teamResponse, feeResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}/payment-info`),
        fetch(`/api/payments/fees/${teamId}`)
      ]);
      
      if (!teamResponse.ok) {
        throw new Error('Failed to fetch team information');
      }
      
      const teamData = await teamResponse.json();
      setTeamInfo(teamData);
      
      // Fee breakdown is optional
      if (feeResponse.ok) {
        const feeData = await feeResponse.json();
        setFeeBreakdown(feeData);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamInfo();
  }, [teamId]);

  const handleStripeCheckout = async () => {
    if (!teamId) return;
    
    try {
      setIsProcessing(true);
      
      // Create Stripe Checkout session
      const response = await fetch(`/api/payments/create-checkout/${teamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const { checkoutUrl } = await response.json();
      
      if (checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start payment process');
      toast({
        title: "Payment Error",
        description: "Could not start payment process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading payment information...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !teamInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>Payment Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Team information could not be loaded'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span>Payment Successful</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              Your payment has been processed successfully. Your team is now approved for the tournament.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <img 
            src="/api/placeholder/120/40" 
            alt="MatchPro"
            className="mx-auto mb-4 h-10"
          />
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Secure tournament registration payment</p>
        </div>

        {/* Payment Card */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Team Registration Payment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Team Information</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Team Name:</span>
                  <span className="font-medium">{teamInfo.name}</span>
                </div>
                {teamInfo.eventName && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Tournament:</span>
                    <span className="font-medium">{teamInfo.eventName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-blue-700">Status:</span>
                  <Badge variant={teamInfo.paymentStatus === 'payment_failed' ? 'destructive' : 'secondary'}>
                    {teamInfo.paymentStatus.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            {feeBreakdown && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration Fee:</span>
                    <span>${(feeBreakdown.baseAmount / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee (4%):</span>
                    <span>${(feeBreakdown.platformFeePercentage / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee:</span>
                    <span>${(feeBreakdown.platformFeeFixed / 100).toFixed(2)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span>${(feeBreakdown.totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <div className="pt-4">
              <Button 
                onClick={handleStripeCheckout}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay with Stripe
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
                <Shield className="w-3 h-3 mr-1" />
                Secure payment powered by Stripe
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-600">
          <p>Having trouble? Contact support at support@matchpro.ai</p>
        </div>
      </div>
    </div>
  );
}

      const result = await response.json();
      
      if (result.success) {
        setPaymentComplete(true);
        toast({
          title: "Payment Completed Successfully!",
          description: "Your team has been approved and you should receive a confirmation email shortly.",
        });
      } else {
        throw new Error(result.error || 'Failed to update team status');
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      toast({
        title: "Payment Processed but Status Update Failed",
        description: "Your payment was successful, but there was an issue updating your team status. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading payment information...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !teamInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Unable to load team payment information'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Payment Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left">
              <div className="text-sm text-green-800 font-medium mb-2">Payment Receipt</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Team:</span>
                  <span className="font-medium text-green-900">{teamInfo.name}</span>
                </div>
                {teamInfo.eventName && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Event:</span>
                    <span className="font-medium text-green-900">{teamInfo.eventName}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-green-700 font-medium">Amount Paid:</span>
                  <span className="font-bold text-green-900">
                    ${(teamInfo.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Your team status has been updated to "Approved" and you should receive a confirmation email shortly.
            </p>
            
            <p className="text-sm text-gray-500">
              You can now close this window.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* MatchPro Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MatchPro</h1>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Payment Center</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Team Information Card */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Payment Retry Required
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-yellow-700">Team:</span>
                    <span className="font-medium text-yellow-900">{teamInfo.name}</span>
                  </div>
                  {teamInfo.eventName && (
                    <div className="flex justify-between mb-2">
                      <span className="text-yellow-700">Event:</span>
                      <span className="font-medium text-yellow-900">{teamInfo.eventName}</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2">
                    <span className="text-yellow-700">Status:</span>
                    <span className="font-medium text-yellow-900">{teamInfo.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-200">
                    <span className="text-yellow-700 font-medium">Amount Due:</span>
                    <span className="font-bold text-yellow-900">
                      ${(teamInfo.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="mb-2">Your previous payment attempt failed. Common reasons include:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Insufficient funds</li>
                  <li>Card declined by bank</li>
                  <li>Incorrect card information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Payment Form */}
          <StripeProvider>
            <div className="bg-white rounded-lg shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg">
                <h3 className="font-semibold">Secure Payment Processing</h3>
                <p className="text-sm opacity-90">Your payment information is encrypted and secure</p>
              </div>
              <div className="p-1">
                <PaymentForm
                  amount={teamInfo.totalAmount}
                  onSuccess={handlePaymentSuccess}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  teamId={teamInfo.id}
                  description={`Payment retry for ${teamInfo.name}`}
                />
              </div>
            </div>
          </StripeProvider>
        </div>
      </div>
    </div>
  );
}