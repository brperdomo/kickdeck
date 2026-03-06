import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentResult {
  teamId: number;
  paymentIntentId: string;
  amount: number;
  teamName?: string;
  eventName?: string;
}

export default function PaymentSuccess() {
  const [location] = useLocation();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract session_id and team_id from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sessionId = urlParams.get('session_id');
  const teamId = urlParams.get('team_id');

  const processPaymentSuccess = async () => {
    if (!sessionId || !teamId) {
      setError('Missing payment session information');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Process the successful payment
      const response = await fetch('/api/payments/checkout-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process payment confirmation');
      }

      const result = await response.json();
      setPaymentResult(result);
      
      toast({
        title: "Payment Successful!",
        description: "Your team registration has been approved.",
      });

    } catch (err) {
      console.error('Error processing payment success:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
      toast({
        title: "Payment Processing Error",
        description: "Your payment was successful, but there was an issue confirming it. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    processPaymentSuccess();
  }, [sessionId, teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <h2 className="text-lg font-semibold mb-2">Processing Your Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>Payment Processing Issue</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-700">{error}</p>
            <div className="bg-red-50 p-3 rounded text-sm text-red-800">
              <strong>Important:</strong> Your payment was likely successful. Please contact support at support@kickdeck.io with your team ID ({teamId}) for assistance.
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your tournament registration has been completed</p>
        </div>

        {/* Success Card */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800">Registration Confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {paymentResult && (
              <>
                {/* Payment Details */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Team ID:</span>
                      <span className="font-medium">#{paymentResult.teamId}</span>
                    </div>
                    {paymentResult.teamName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Team Name:</span>
                        <span className="font-medium">{paymentResult.teamName}</span>
                      </div>
                    )}
                    {paymentResult.eventName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tournament:</span>
                        <span className="font-medium">{paymentResult.eventName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-mono text-xs">{paymentResult.paymentIntentId}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600 font-medium">Amount Paid:</span>
                      <span className="font-bold text-green-600">
                        ${(paymentResult.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">1</span>
                      You'll receive a confirmation email with your payment receipt
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">2</span>
                      Your team status has been updated to "Approved"
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">3</span>
                      Tournament schedules and updates will be sent to your email
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Return to Home
              </Button>
              <Button 
                onClick={() => window.close()}
                variant="outline"
                className="flex-1"
              >
                Close Window
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Questions? Contact support at support@kickdeck.io</p>
        </div>
      </div>
    </div>
  );
}