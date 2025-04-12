import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  AlertCircle,
  Calendar,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MemberLayout } from "@/components/layouts/MemberLayout";
import { motion } from "framer-motion";

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
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: string;
  submitter?: {
    name: string;
    email: string;
  };
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
  const registrations = data?.registrations || [];

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending_payment':
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-700 border-amber-500">
          <Clock className="w-3 h-3 mr-1" /> Payment Pending
        </Badge>;
      case 'withdrawn':
        return <Badge variant="outline" className="border-slate-500 text-slate-700">
          <XCircle className="w-3 h-3 mr-1" /> Withdrawn
        </Badge>;
      case 'refunded':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">
          <CreditCard className="w-3 h-3 mr-1" /> Refunded
        </Badge>;
      case 'registered':
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} · ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <MemberLayout>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container space-y-6 py-8"
        >
          <h1 className="text-3xl font-bold">My Registrations</h1>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </MemberLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <MemberLayout>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container space-y-6 py-8"
        >
          <h1 className="text-3xl font-bold">My Registrations</h1>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-2">Error Loading Registrations</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                We encountered an error while loading your registrations. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
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
          <TabsList className="grid grid-cols-4 mb-6">
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
            <TabsTrigger value="issues">
              Issues
              <Badge variant="outline" className="ml-2">{problemPayments.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
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
            <Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Completed Payments</CardTitle>
                <CardDescription>
                  Successfully paid and approved registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Completed Payments</h3>
                    <p className="text-muted-foreground">
                      You don't have any completed payments yet.
                    </p>
                  </div>
                ) : (
                  <RegistrationsList registrations={completedPayments} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>Payment Issues</CardTitle>
                <CardDescription>
                  Registrations with payment problems or rejections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {problemPayments.length === 0 ? (
                  <div className="text-center py-10">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Payment Issues</h3>
                    <p className="text-muted-foreground">
                      Great! You don't have any payment issues.
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

// Component to display registrations list with accordion for payment details
function RegistrationsList({ registrations }: { registrations: Registration[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} · ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending_payment':
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-700 border-amber-500">
          <Clock className="w-3 h-3 mr-1" /> Payment Pending
        </Badge>;
      case 'withdrawn':
        return <Badge variant="outline" className="border-slate-500 text-slate-700">
          <XCircle className="w-3 h-3 mr-1" /> Withdrawn
        </Badge>;
      case 'refunded':
        return <Badge variant="outline" className="border-purple-500 text-purple-700">
          <CreditCard className="w-3 h-3 mr-1" /> Refunded
        </Badge>;
      case 'registered':
      default:
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {registrations.map((registration) => (
          <AccordionItem key={registration.id} value={`registration-${registration.id}`}>
            <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-lg">
              <div className="flex w-full justify-between items-center">
                <div className="text-left">
                  <p className="font-medium">{registration.teamName}</p>
                  <p className="text-sm text-muted-foreground">{registration.eventName} - {registration.ageGroup}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(registration.status)}
                  <span className="font-semibold">{formatCurrency(registration.amount)}</span>
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-4 pb-4">
              <div className="bg-muted/30 p-4 rounded-lg space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Registration Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Registered on: {formatDate(registration.registeredAt)}
                    </p>
                    {registration.submitter && (
                      <p className="text-sm text-muted-foreground">
                        Submitted by: {registration.submitter.name} ({registration.submitter.email})
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Payment Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Amount: <span className="font-medium">{formatCurrency(registration.amount)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {getStatusBadge(registration.status)}
                    </p>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">
                        {registration.paymentId || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {registration.paymentDate ? formatDate(registration.paymentDate) : 'Not paid yet'}
                      </TableCell>
                      <TableCell>
                        {registration.cardLastFour ? (
                          <span className="flex items-center">
                            <CreditCard className="h-3 w-3 mr-1" />
                            •••• {registration.cardLastFour}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {registration.paymentStatus || registration.status}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(registration.amount)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Display error message if exists */}
                    {registration.errorCode && (
                      <TableRow className="bg-red-50">
                        <TableCell colSpan={5} className="text-red-700">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold">Error {registration.errorCode}:</span>{" "}
                              {registration.errorMessage || "An error occurred with this payment"}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                <div className="flex justify-end gap-2">
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
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}