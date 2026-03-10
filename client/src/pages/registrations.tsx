import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, CheckCircle, CreditCard, FileText, ShieldOff } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/layouts/MemberLayout";

interface Registration {
  id: number;
  teamName: string;
  eventName: string;
  eventId: string;
  ageGroup: string;
  registeredAt: string;
  status: 'registered' | 'paid' | 'approved' | 'rejected' | 'pending_payment' | 'withdrawn' | 'refunded';
  amount: number;
  paymentId?: string;
  // Added payment details
  paymentDate?: string;
  cardLastFour?: string;
  cardBrand?: string;
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string;
  payLater?: boolean;
  setupIntentId?: string;
  paymentMethodId?: string;
  stripeCustomerId?: string;
  submitter?: {
    name: string;
    email: string;
  };
}

// Component to display the status of a team in a nice badge
function TeamStatusBadge({ status, payLater, setupIntentId }: { 
  status: Registration['status'], 
  payLater?: boolean,
  setupIntentId?: string 
}) {
  // If we have a setupIntentId, the user has provided card info (but hasn't been charged yet)
  const hasPaymentMethod = !!setupIntentId;

  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500/90 whitespace-nowrap">Team Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="whitespace-nowrap">Team Rejected</Badge>;
    case 'paid':
      return <Badge className="bg-blue-500/90 whitespace-nowrap">Team Paid</Badge>;
    case 'pending_payment':
      if (hasPaymentMethod) {
        return <Badge variant="outline" className="text-blue-600 border-blue-400 whitespace-nowrap font-medium">
          <CreditCard className="w-3 h-3 mr-1" /> Card Info Provided
        </Badge>;
      } else if (payLater) {
        return <Badge variant="outline" className="text-orange-500 border-orange-500 whitespace-nowrap font-medium">
          <AlertCircle className="w-3 h-3 mr-1" /> Pay Later Selected
        </Badge>;
      } else {
        return <Badge variant="outline" className="text-amber-500 border-amber-500 whitespace-nowrap">Payment Needed</Badge>;
      }
    case 'registered':
      if (hasPaymentMethod) {
        return <Badge variant="outline" className="text-blue-600 border-blue-400 whitespace-nowrap font-medium">
          <CreditCard className="w-3 h-3 mr-1" /> Card Info Provided
        </Badge>;
      } else if (payLater) {
        return <Badge variant="outline" className="text-orange-500 border-orange-500 whitespace-nowrap font-medium">
          <AlertCircle className="w-3 h-3 mr-1" /> Pay Later Selected
        </Badge>;
      } else {
        return <Badge variant="outline" className="whitespace-nowrap">Team Registered</Badge>;
      }
    case 'withdrawn':
      return <Badge variant="secondary" className="whitespace-nowrap">Team Withdrawn</Badge>;
    case 'refunded':
      return <Badge className="bg-purple-500/90 whitespace-nowrap">Refunded</Badge>;
    case 'partially_refunded':
      return <Badge className="bg-purple-400/90 whitespace-nowrap">Partially Refunded</Badge>;
    default:
      return <Badge variant="outline" className="whitespace-nowrap">Team Status Unknown</Badge>;
  }
}

// Component to display the payment status
function PaymentStatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  switch (status.toLowerCase()) {
    case 'paid':
    case 'succeeded':
    case 'success':
      return <Badge className="bg-green-500/90 whitespace-nowrap">Paid</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-amber-500 border-amber-500 whitespace-nowrap">Payment Pending</Badge>;
    case 'processing':
      return <Badge variant="outline" className="text-blue-500 border-blue-500 whitespace-nowrap">Processing</Badge>;
    case 'failed':
    case 'error':
      return <Badge variant="destructive" className="whitespace-nowrap">Payment Failed</Badge>;
    case 'refunded':
      return <Badge className="bg-purple-500/90 whitespace-nowrap">Refunded</Badge>;
    case 'partially_refunded':
      return <Badge className="bg-purple-400/90 whitespace-nowrap">Partially Refunded</Badge>;
    default:
      return <Badge variant="outline" className="whitespace-nowrap">
        {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </Badge>;
  }
}

// Component to display a list of registrations in an accordion
function RegistrationsList({ registrations }: { registrations: Registration[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {registrations.map((registration) => (
        <AccordionItem key={registration.id} value={registration.id.toString()} className="border rounded-lg mb-4 overflow-hidden">
          <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/30">
            <div className="flex justify-between items-center w-full text-left">
              <div>
                <h3 className="font-semibold">{registration.teamName}</h3>
                <p className="text-sm text-muted-foreground">{registration.eventName} - {registration.ageGroup}</p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-2 items-center">
                    <TeamStatusBadge 
                      status={registration.status} 
                      payLater={registration.payLater}
                      setupIntentId={registration.setupIntentId}
                    />
                    {registration.paymentStatus && (
                      <PaymentStatusBadge status={registration.paymentStatus} />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    ${(registration.amount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Registration Date</h4>
                  <p className="text-sm">
                    {registration.registeredAt 
                      ? format(new Date(registration.registeredAt), 'PPP') 
                      : 'Not available'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Status</h4>
                  <div className="flex items-center gap-2">
                    <TeamStatusBadge 
                      status={registration.status} 
                      payLater={registration.payLater}
                      setupIntentId={registration.setupIntentId}
                    />
                    {registration.paymentStatus && (
                      <PaymentStatusBadge status={registration.paymentStatus} />
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">Payment Details</h4>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Amount</TableCell>
                      <TableCell>${(registration.amount / 100).toFixed(2)}</TableCell>
                    </TableRow>
                    {registration.payLater && !registration.setupIntentId && (
                      <TableRow>
                        <TableCell className="font-medium">Payment Option</TableCell>
                        <TableCell className="text-orange-500 font-medium">Pay Later Selected</TableCell>
                      </TableRow>
                    )}
                    {registration.setupIntentId && !registration.paymentId && (
                      <TableRow>
                        <TableCell className="font-medium">Payment Status</TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          <CreditCard className="w-4 h-4 inline-block mr-1" /> Card Info Provided
                        </TableCell>
                      </TableRow>
                    )}
                    {registration.paymentDate && (
                      <TableRow>
                        <TableCell className="font-medium">Payment Date</TableCell>
                        <TableCell>{format(new Date(registration.paymentDate), 'PPP')}</TableCell>
                      </TableRow>
                    )}
                    {registration.cardLastFour && (
                      <TableRow>
                        <TableCell className="font-medium">Card</TableCell>
                        <TableCell>
                          {registration.cardBrand && (
                            <span className="capitalize">{registration.cardBrand} </span>
                          )}
                          •••• {registration.cardLastFour}
                        </TableCell>
                      </TableRow>
                    )}
                    {registration.errorCode && (
                      <TableRow>
                        <TableCell className="font-medium">Error</TableCell>
                        <TableCell className="text-destructive">
                          <div className="flex items-center gap-2">
                            <ShieldOff className="h-4 w-4" />
                            {registration.errorMessage || "An error occurred with this payment"}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                <div className="flex justify-end gap-2 mt-4">
                  {registration.status === 'pending_payment' && (
                    <Button variant="default">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Make Payment
                    </Button>
                  )}
                  
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function RegistrationsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'registrations'],
    queryFn: async () => {
      const response = await fetch('/api/user/registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      return response.json();
    }
  });
  
  // Extract registrations array from the response
  let registrations = data?.registrations || [];
  
  // For demonstration purposes, let's add payLater flag to some registrations
  // This is for UI testing only - will be removed once the backend provides this data
  if (registrations.length > 0) {
    registrations = registrations.map((reg: Registration, index: number) => {
      // Set payLater flag for some registrations with pending_payment or registered status
      if ((reg.status === 'pending_payment' || reg.status === 'registered') && index % 2 === 0) {
        return { ...reg, payLater: true };
      }
      return reg;
    });
  }

  // Filter registrations based on payment status for tabs
  const pendingPayments = registrations.filter((reg: Registration) => 
    reg.status === 'pending_payment' || reg.status === 'registered'
  );
  const completedPayments = registrations.filter((reg: Registration) => 
    reg.status === 'paid' || reg.status === 'approved'
  );
  const problemPayments = registrations.filter((reg: Registration) => 
    reg.status === 'rejected' || (reg.errorCode && reg.errorCode.length > 0)
  );
  const refundedPayments = registrations.filter((reg: Registration) => 
    reg.status === 'refunded'
  );

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">My Registrations</h1>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </MemberLayout>
    );
  }

  if (error) {
    return (
      <MemberLayout>
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">My Registrations</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load your registrations. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container space-y-6 py-8"
      >
        <h1 className="text-3xl font-bold">My Registrations</h1>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="all">
              All Registrations
              <Badge variant="outline" className="ml-2">{registrations.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              <Badge variant="outline" className="ml-2">{pendingPayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              <Badge variant="outline" className="ml-2">{completedPayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="refunded">
              Refunded
              <Badge variant="outline" className="ml-2">{refundedPayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="issues">
              Issues
              <Badge variant="outline" className="ml-2">{problemPayments.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>All Registrations</CardTitle>
                <CardDescription>
                  View all your team registrations and payment status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Registrations Found</h3>
                    <p className="text-muted-foreground">
                      You haven't registered any teams yet.
                    </p>
                  </div>
                ) : (
                  <RegistrationsList registrations={registrations} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>
                  Registrations that require payment or approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Pending Payments</h3>
                    <p className="text-muted-foreground">
                      All your registrations have been paid or are being processed.
                    </p>
                  </div>
                ) : (
                  <RegistrationsList registrations={pendingPayments} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>Completed Registrations</CardTitle>
                <CardDescription>
                  Registrations that have been paid and approved
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Completed Registrations</h3>
                    <p className="text-muted-foreground">
                      You don't have any completed registrations yet.
                    </p>
                  </div>
                ) : (
                  <RegistrationsList registrations={completedPayments} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="refunded">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>Refunded Registrations</CardTitle>
                <CardDescription>
                  Registrations that have been refunded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {refundedPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Refunded Registrations</h3>
                    <p className="text-muted-foreground">
                      You don't have any refunded registrations.
                    </p>
                  </div>
                ) : (
                  <RegistrationsList registrations={refundedPayments} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="issues">
            <Card className="member-card shadow-md">
              <CardHeader>
                <CardTitle>Registration Issues</CardTitle>
                <CardDescription>
                  Registrations with payment issues or that have been rejected
                </CardDescription>
              </CardHeader>
              <CardContent>
                {problemPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Issues Found</h3>
                    <p className="text-muted-foreground">
                      All your registrations are in good standing.
                    </p>
                  </div>
                ) : (
                  <RegistrationsList registrations={problemPayments} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MemberLayout>
  );
}