/**
 * Event Stripe Connect Panel
 * 
 * A component to manage Stripe Connect accounts for events/tournaments
 */

import { useState } from 'react';
import { useEventStripeConnect } from '@/hooks/use-event-stripe-connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface EventStripeConnectPanelProps {
  eventId: number;
  eventName: string;
}

export function EventStripeConnectPanel({ eventId, eventName }: EventStripeConnectPanelProps) {
  const [businessType, setBusinessType] = useState<'individual' | 'company'>('company');
  
  const {
    status,
    isLoading,
    isError,
    error,
    createAccount,
    isCreatingAccount,
    generateAccountLink,
    isGeneratingAccountLink,
    generateDashboardLink,
    isGeneratingDashboardLink,
    refreshStatus
  } = useEventStripeConnect(eventId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Direct payment processing for your tournament</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Direct payment processing for your tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || 'Failed to load Stripe Connect status'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={refreshStatus}>Retry</Button>
        </CardFooter>
      </Card>
    );
  }

  // No Stripe Connect account yet
  if (!status?.hasStripeConnect) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>
            Set up direct payment processing for {eventName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Why Set Up Stripe Connect?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Receive tournament payments directly to your bank account</li>
                <li>Control your own payouts and financial reporting</li>
                <li>No need to wait for platform payouts</li>
                <li>Easy setup process through Stripe's secure onboarding</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Business Type</h3>
              <RadioGroup 
                value={businessType} 
                onValueChange={(value) => setBusinessType(value as 'individual' | 'company')}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company">Company / Organization</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => createAccount(businessType)} 
            disabled={isCreatingAccount}
            className="w-full"
          >
            {isCreatingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Up Stripe Connect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Stripe Connect account exists
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Stripe Connect</CardTitle>
            <CardDescription>Payment processing for {eventName}</CardDescription>
          </div>
          <Badge variant={status.chargesEnabled ? "secondary" : "outline"} className={status.chargesEnabled ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
            {status.chargesEnabled ? "Active" : "Setup Incomplete"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Account ID</p>
              <p className="font-mono text-xs mt-1">{status.accountId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="mt-1 flex items-center">
                {status.detailsSubmitted ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    <span>Details submitted</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
                    <span>Onboarding incomplete</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {!status.detailsSubmitted && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Your Stripe Connect account setup is incomplete. Click "Complete Onboarding" to finish the process.
              </AlertDescription>
            </Alert>
          )}

          {status.chargesEnabled && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your Stripe Connect account is fully set up and ready to receive payments.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!status.detailsSubmitted ? (
          <Button
            onClick={() => generateAccountLink()}
            disabled={isGeneratingAccountLink}
            className="w-full"
          >
            {isGeneratingAccountLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Onboarding
          </Button>
        ) : (
          <Button
            onClick={() => generateDashboardLink()}
            disabled={isGeneratingDashboardLink}
            variant="outline"
            className="w-full"
          >
            {isGeneratingDashboardLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ExternalLink className="mr-2 h-4 w-4" />
            Go to Stripe Dashboard
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}