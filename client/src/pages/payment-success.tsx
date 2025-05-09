import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Check, Home } from 'lucide-react';
import { useLocation } from 'wouter';

export default function PaymentSuccess() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-green-50 to-white">
      <Card className="w-full max-w-md shadow-lg border-green-100">
        <CardHeader className="pb-4">
          <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <div className="text-center space-y-1 mt-4">
            <h1 className="text-2xl font-bold text-green-700">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your payment has been processed successfully
            </p>
          </div>
        </CardHeader>
        <CardContent className="text-center pb-6 text-sm text-muted-foreground">
          <p>
            Thank you for your payment. A confirmation has been sent to your email
            address. Please keep this for your records.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}