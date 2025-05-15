/**
 * Stripe Connect Panel
 * 
 * UI component for managing a club's Stripe Connect account
 */

import React from 'react';
import { useStripeConnect } from '@/hooks/use-stripe-connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Loader2,
  UserCircle, 
  Building2 
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface StripeConnectPanelProps {
  clubId: number;
  clubName: string;
}

export function StripeConnectPanel({ clubId, clubName }: StripeConnectPanelProps) {
  const [businessType, setBusinessType] = React.useState<'individual' | 'company'>('company');
  
  const { 
    accountStatus, 
    isLoading,
    createAccount,
    isCreating,
    generateAccountLink,
    isGeneratingAccountLink,
    openDashboard,
    isOpeningDashboard
  } = useStripeConnect(clubId);
  
  const handleCreateAccount = () => {
    createAccount({ clubId, businessType });
  };
  
  const handleContinueOnboarding = () => {
    generateAccountLink(clubId);
  };
  
  const handleOpenDashboard = () => {
    openDashboard(clubId);
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>Loading account information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // No account exists yet
  if (!accountStatus?.hasConnectAccount) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Set up Stripe Connect</CardTitle>
          <CardDescription>
            Allow {clubName} to receive payments directly to their bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account setup required</AlertTitle>
            <AlertDescription>
              This club does not have a Stripe Connect account yet. Set up an account to enable direct payments.
            </AlertDescription>
          </Alert>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Business type</h3>
            <RadioGroup 
              defaultValue={businessType} 
              onValueChange={(value) => setBusinessType(value as 'individual' | 'company')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Individual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4" />
                  Company/Organization
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleCreateAccount} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Stripe Connect Account
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Account exists but setup is not complete
  if (!accountStatus?.accountStatus?.detailsSubmitted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Stripe Connect</CardTitle>
            <Badge variant="outline" className="ml-2">
              Setup Pending
            </Badge>
          </div>
          <CardDescription>
            Complete the onboarding process to enable payments for {clubName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account setup incomplete</AlertTitle>
            <AlertDescription>
              The Stripe Connect account has been created, but the setup process needs to be completed.
              Click the button below to continue the onboarding process.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-destructive mr-2" />
              <span>Account details not submitted</span>
            </div>
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-destructive mr-2" />
              <span>Bank account not connected</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleContinueOnboarding} 
            disabled={isGeneratingAccountLink}
            className="w-full"
          >
            {isGeneratingAccountLink ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Continue Onboarding
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Account exists and setup is complete, but not fully activated yet
  if (!accountStatus?.accountStatus?.chargesEnabled || !accountStatus?.accountStatus?.payoutsEnabled) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Stripe Connect</CardTitle>
            <Badge variant="outline" className="ml-2">
              Pending Verification
            </Badge>
          </div>
          <CardDescription>
            Stripe is verifying the account details for {clubName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification in progress</AlertTitle>
            <AlertDescription>
              The account setup is complete, but Stripe is still verifying some details.
              This usually takes 1-2 business days.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-success mr-2" />
              <span>Account details submitted</span>
            </div>
            <div className="flex items-center">
              {accountStatus?.accountStatus?.chargesEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-success mr-2" />
              ) : (
                <RefreshCw className="h-5 w-5 text-muted-foreground mr-2" />
              )}
              <span>Charges {accountStatus?.accountStatus?.chargesEnabled ? 'enabled' : 'pending'}</span>
            </div>
            <div className="flex items-center">
              {accountStatus?.accountStatus?.payoutsEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-success mr-2" />
              ) : (
                <RefreshCw className="h-5 w-5 text-muted-foreground mr-2" />
              )}
              <span>Payouts {accountStatus?.accountStatus?.payoutsEnabled ? 'enabled' : 'pending'}</span>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="text-sm text-muted-foreground">
            {accountStatus?.accountStatus?.requirements?.currently_due?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-foreground mb-1">Requirements needed:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {accountStatus.accountStatus.requirements.currently_due.map((req, i) => (
                    <li key={i}>{req.split('_').join(' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleContinueOnboarding} 
            disabled={isGeneratingAccountLink}
            className="w-full"
          >
            {isGeneratingAccountLink ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Update Account Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleOpenDashboard} 
            disabled={isOpeningDashboard}
            className="w-full"
          >
            {isOpeningDashboard ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Open Stripe Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Account is fully activated and ready to go
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Stripe Connect</CardTitle>
          <Badge className="ml-2 bg-green-100 text-green-800">
            Active
          </Badge>
        </div>
        <CardDescription>
          {clubName} can now receive payments directly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Account fully activated</AlertTitle>
            <AlertDescription>
              The Stripe Connect account for {clubName} is active and ready to process payments.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span>Account details verified</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span>Charges enabled</span>
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span>Payouts enabled</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={handleOpenDashboard} 
          disabled={isOpeningDashboard}
          className="w-full"
        >
          {isOpeningDashboard ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              Open Stripe Dashboard
              <ExternalLink className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}