import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CreditCard, X, ChevronDown, Calendar, Filter, RotateCcw, FileCheck, Receipt, CheckCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge, TeamStatusBadge } from '@/components/ui/payment-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

// Helper functions for fee calculation
function calculateTournamentCost(totalAmountCents: number): number {
  // Total amount includes 4% platform fee
  // So tournament cost = total / 1.04
  return Math.round(totalAmountCents / 1.04);
}

function calculatePlatformFee(totalAmountCents: number): number {
  const tournamentCost = calculateTournamentCost(totalAmountCents);
  return totalAmountCents - tournamentCost;
}

interface Registration {
  id: number;
  teamName: string;
  eventName: string;
  eventId: string;
  ageGroup: string;
  registeredAt: string;
  status: 'registered' | 'approved' | 'rejected' | 'withdrawn' | 'waitlisted' | 'pending_payment' | 'refunded';
  amount: number;
  paymentId?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_refunded' | 'payment_info_provided';
  paymentDate?: string;
  errorCode?: string;
  errorMessage?: string;
  payLater?: boolean;
  setupIntentId?: string;
  cardDetails?: {
    brand?: string;
    last4?: string;
  };
  // Refund details
  refundAmount?: number;
  totalRefunded?: number;
  refundDate?: string;
  refundReason?: string;
  isFullRefund?: boolean;
  // Transaction history
  transactions?: {
    id: number;
    type: string;
    amount: number;
    status: string;
    date: string;
    cardBrand?: string;
    cardLast4?: string;
    notes?: string;
  }[];
  // Terms acknowledgment
  termsAcknowledged?: boolean;
  termsAcknowledgedAt?: string;
  // Enhanced team information
  headCoachName?: string;
  headCoachEmail?: string;
  headCoachPhone?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  clubName?: string;
  bracketName?: string;
  playerCount?: number;
  initialRosterComplete?: boolean;
  rosterUploadedAt?: string;
  eventStartDate?: string;
  submitter?: {
    name: string;
    email: string;
  };
}

export default function UserRegistrationsView() {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const { toast } = useToast();

  // Function to request email receipt from Stripe
  const requestEmailReceipt = async (paymentIntentId: string) => {
    try {
      const response = await fetch('/api/payments/resend-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send receipt');
      }

      toast({
        title: "Receipt Sent",
        description: "Payment receipt has been sent to your email address.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download terms acknowledgment PDF
  const downloadTermsAcknowledgment = async (teamId: number, teamName: string) => {
    try {
      const response = await fetch(`/api/member/teams/${teamId}/terms-acknowledgment`);
      if (!response.ok) throw new Error('Document not available');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `terms-acknowledgment-${teamName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: 'Terms acknowledgment document has been downloaded.' });
    } catch {
      toast({ title: 'Error', description: 'Could not download terms document. Please contact support.', variant: 'destructive' });
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', 'registrations', 'v4'], // Force new cache key
    queryFn: async () => {
      console.log('Fetching registrations with payment details...');
      const response = await fetch(`/api/user/registrations?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      const result = await response.json();
      console.log('Registration API response with payment details:', result);
      return result;
    }
  });
  
  // Extract registrations array from the response
  const registrations = data?.registrations || [];
  
  // Group registrations by event and create filtering options
  const { groupedRegistrations, eventOptions, filteredRegistrations } = useMemo(() => {
    const grouped = registrations.reduce((acc: Record<string, Registration[]>, reg: Registration) => {
      const eventKey = `${reg.eventName}_${reg.eventId}`;
      if (!acc[eventKey]) {
        acc[eventKey] = [];
      }
      acc[eventKey].push(reg);
      return acc;
    }, {});

    const events = Object.keys(grouped).map(eventKey => {
      const [eventName, eventId] = eventKey.split('_');
      return { name: eventName, id: eventId, key: eventKey };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const filtered = selectedEvent === 'all' 
      ? registrations 
      : grouped[selectedEvent] || [];

    return {
      groupedRegistrations: grouped,
      eventOptions: events,
      filteredRegistrations: filtered
    };
  }, [registrations, selectedEvent]);
  
  // Function to show registration details
  const showRegistrationDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load your registrations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Alert className="bg-card/50 border-primary/20">
        <AlertCircle className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary">No Registrations Found</AlertTitle>
        <AlertDescription className="mt-2">
          You haven't registered for any events yet. Browse our events and register your team today!
        </AlertDescription>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events ({registrations.length})</SelectItem>
                {eventOptions.map((event) => (
                  <SelectItem key={event.key} value={event.key}>
                    {event.name} ({groupedRegistrations[event.key]?.length || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Grouped
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredRegistrations.length} of {registrations.length} registrations
        </div>
      </div>

      {/* Registrations Display */}
      {viewMode === 'grouped' ? (
        selectedEvent === 'all' ? (
          /* Multi-event grouped view */
          <div className="space-y-8">
            {eventOptions.map((event) => (
              <div key={event.key} className="space-y-4">
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <Badge variant="secondary">{groupedRegistrations[event.key]?.length || 0} teams</Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 mt-4">
                      {(groupedRegistrations[event.key] || []).map((registration: Registration) => (
                        <RegistrationCard 
                          key={registration.id} 
                          registration={registration} 
                          onShowDetails={showRegistrationDetails} 
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        ) : (
          /* Single event grouped view */
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  {eventOptions.find(e => e.key === selectedEvent)?.name || 'Event'}
                </h3>
                <Badge variant="secondary">{filteredRegistrations.length} teams</Badge>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {filteredRegistrations.map((registration: Registration) => (
                <RegistrationCard 
                  key={registration.id} 
                  registration={registration} 
                  onShowDetails={showRegistrationDetails} 
                />
              ))}
            </div>
          </div>
        )
      ) : (
        /* List view */
        <div className="space-y-3">
          {filteredRegistrations.map((registration: Registration) => (
            <div key={registration.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{registration.teamName}</h4>
                    <TeamStatusBadge status={registration.status} />
                    <PaymentStatusBadge
                      status={registration.paymentStatus}
                      hasPaymentInfo={!!registration.setupIntentId}
                      payLater={registration.payLater}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {registration.eventName} • {registration.ageGroup} • {formatDate(registration.registeredAt)}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => showRegistrationDetails(registration)}>
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Registration Details</span>
              <Button variant="ghost" size="icon" onClick={() => setDetailsDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Registration details for {selectedRegistration?.teamName}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6 overflow-y-auto pr-1 flex-1 min-h-0">
              {/* Team & Event Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Team Information</h3>
                  <div className="bg-muted rounded-md p-3 space-y-2">
                    <p className="font-semibold text-lg">{selectedRegistration.teamName}</p>
                    <p className="text-sm text-muted-foreground">Age Group: {selectedRegistration.ageGroup}</p>
                    {selectedRegistration.clubName && (
                      <p className="text-sm text-muted-foreground">Club: {selectedRegistration.clubName}</p>
                    )}
                    {selectedRegistration.bracketName && (
                      <p className="text-sm text-muted-foreground">Bracket: {selectedRegistration.bracketName}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Event Information</h3>
                  <div className="bg-muted rounded-md p-3">
                    <p className="font-semibold text-lg">{selectedRegistration.eventName}</p>
                    <p className="text-sm text-muted-foreground">Registration Date: {formatDate(selectedRegistration.registeredAt)}</p>
                  </div>
                </div>
              </div>

              {/* Team Contacts */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Team Contacts</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Head Coach */}
                  {selectedRegistration.headCoachName && (
                    <div className="bg-muted rounded-md p-3">
                      <p className="font-medium text-sm text-primary">Head Coach</p>
                      <p className="font-semibold">{selectedRegistration.headCoachName}</p>
                      {selectedRegistration.headCoachEmail && (
                        <p className="text-sm text-muted-foreground">{selectedRegistration.headCoachEmail}</p>
                      )}
                      {selectedRegistration.headCoachPhone && (
                        <p className="text-sm text-muted-foreground">{selectedRegistration.headCoachPhone}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Team Manager */}
                  {selectedRegistration.managerName && (
                    <div className="bg-muted rounded-md p-3">
                      <p className="font-medium text-sm text-primary">Team Manager</p>
                      <p className="font-semibold">{selectedRegistration.managerName}</p>
                      {selectedRegistration.managerEmail && (
                        <p className="text-sm text-muted-foreground">{selectedRegistration.managerEmail}</p>
                      )}
                      {selectedRegistration.managerPhone && (
                        <p className="text-sm text-muted-foreground">{selectedRegistration.managerPhone}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Registration Submitter */}
                  {selectedRegistration.submitter && (
                    <div className="bg-muted rounded-md p-3">
                      <p className="font-medium text-sm text-primary">Registration Submitter</p>
                      <p className="font-semibold">{selectedRegistration.submitter.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedRegistration.submitter.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Roster Information */}
              {(selectedRegistration.playerCount !== undefined || selectedRegistration.initialRosterComplete !== undefined) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Roster Information</h3>
                  <div className="bg-muted rounded-md p-3 space-y-2">
                    {selectedRegistration.playerCount !== undefined && (
                      <div className="flex justify-between">
                        <span>Players:</span>
                        <span className="font-semibold">{selectedRegistration.playerCount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Roster Status:</span>
                      <span className={`font-semibold ${selectedRegistration.initialRosterComplete ? 'text-green-600' : 'text-orange-600'}`}>
                        {selectedRegistration.initialRosterComplete ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                    {selectedRegistration.rosterUploadedAt && (
                      <div className="flex justify-between">
                        <span>Roster Uploaded:</span>
                        <span>{formatDate(selectedRegistration.rosterUploadedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Registration Status */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Registration Status</h3>
                <div className="bg-muted rounded-md p-3 flex items-center justify-between">
                  <span>Status:</span>
                  <TeamStatusBadge 
                    status={selectedRegistration.status} 
                    payLater={selectedRegistration.payLater} 
                    setupIntentId={selectedRegistration.setupIntentId} 
                  />
                </div>
              </div>
              
              {/* Payment Information */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Payment Information</h3>
                <div className="bg-muted rounded-md p-3 space-y-2">
                  <div className="flex justify-between">
                    <span>Total Charged:</span>
                    <span className="font-semibold">${(selectedRegistration.amount / 100).toFixed(2)}</span>
                  </div>

                  {/* Fee Breakdown for paid registrations */}
                  {(selectedRegistration.paymentStatus === 'paid' || selectedRegistration.paymentStatus === 'partially_refunded') && selectedRegistration.amount > 0 && (
                    <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                      <div className="font-medium text-muted-foreground mb-1">Fee Breakdown:</div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground pl-2">Tournament Cost:</span>
                        <span>${(calculateTournamentCost(selectedRegistration.amount) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground pl-2">Platform Fee (4%):</span>
                        <span>${(calculatePlatformFee(selectedRegistration.amount) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Refund summary — show whenever status indicates a refund */}
                  {(selectedRegistration.paymentStatus === 'partially_refunded' || selectedRegistration.paymentStatus === 'refunded') && (() => {
                    // Compute refund amount from multiple possible sources
                    const refundAmt = selectedRegistration.totalRefunded
                      || selectedRegistration.refundAmount
                      || (selectedRegistration.transactions
                        ?.filter(t => t.type === 'refund')
                        .reduce((sum, t) => sum + Math.abs(t.amount), 0))
                      || 0;
                    const isFull = selectedRegistration.isFullRefund === true
                      || (refundAmt > 0 && refundAmt >= selectedRegistration.amount);
                    return (
                      <div className="border-t border-purple-500/30 pt-2 mt-2 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-purple-300 font-medium">
                            <RotateCcw className="h-3.5 w-3.5" />
                            {isFull ? 'Full Refund' : 'Partial Refund'}
                          </span>
                          {refundAmt > 0 && (
                            <span className="font-bold text-purple-300">-${(refundAmt / 100).toFixed(2)}</span>
                          )}
                        </div>
                        {refundAmt > 0 && !isFull && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground pl-5">Remaining Balance:</span>
                            <span className="font-semibold">${((selectedRegistration.amount - refundAmt) / 100).toFixed(2)}</span>
                          </div>
                        )}
                        {selectedRegistration.refundDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground pl-5">Refund Date:</span>
                            <span>{formatDate(selectedRegistration.refundDate)}</span>
                          </div>
                        )}
                        {selectedRegistration.refundReason && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground pl-5">Reason:</span>
                            <span>{selectedRegistration.refundReason}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {selectedRegistration.paymentStatus && (
                    <div className="flex justify-between items-center">
                      <span>Payment Status:</span>
                      <PaymentStatusBadge status={selectedRegistration.paymentStatus} hasPaymentInfo={!!selectedRegistration.setupIntentId} />
                    </div>
                  )}

                  {selectedRegistration.paymentDate && (
                    <div className="flex justify-between">
                      <span>Payment Date:</span>
                      <span>{formatDate(selectedRegistration.paymentDate)}</span>
                    </div>
                  )}

                  {selectedRegistration.cardDetails?.last4 && (
                    <div className="flex justify-between items-center">
                      <span>Payment Method:</span>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        <span>
                          {selectedRegistration.cardDetails.brand
                            ? `${selectedRegistration.cardDetails.brand.charAt(0).toUpperCase() + selectedRegistration.cardDetails.brand.slice(1)} ending in ${selectedRegistration.cardDetails.last4}`
                            : `Card ending in ${selectedRegistration.cardDetails.last4}`
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedRegistration.errorMessage && (
                    <div className="mt-2 p-2 border border-destructive/50 bg-destructive/10 rounded-md text-sm text-destructive">
                      <div className="font-semibold">Payment Error:</div>
                      <div>{selectedRegistration.errorMessage}</div>
                    </div>
                  )}

                  {selectedRegistration.setupIntentId && selectedRegistration.paymentStatus !== 'paid' && selectedRegistration.paymentStatus !== 'refunded' && selectedRegistration.paymentStatus !== 'partially_refunded' && (
                    <div className="mt-2 p-2 border border-primary/20 bg-primary/5 rounded-md text-sm">
                      <p className="font-medium text-primary">Payment Method Saved</p>
                      <p className="text-muted-foreground">Your card will be charged after your registration is approved by the event organizer.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms Acknowledgment */}
              {selectedRegistration.termsAcknowledged && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Terms &amp; Conditions</h3>
                  <div className="bg-muted rounded-md p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Terms Accepted:</span>
                      <span className="flex items-center gap-1 text-green-500 font-medium text-sm">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {selectedRegistration.termsAcknowledgedAt ? formatDate(selectedRegistration.termsAcknowledgedAt) : 'Yes'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => downloadTermsAcknowledgment(selectedRegistration.id, selectedRegistration.teamName)}
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Download Terms &amp; Refund Policy
                    </Button>
                  </div>
                </div>
              )}

              {/* Transaction History */}
              {selectedRegistration.transactions && selectedRegistration.transactions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Transaction History</h3>
                  <div className="bg-muted rounded-md overflow-hidden">
                    <div className="divide-y divide-border">
                      {selectedRegistration.transactions.map((txn) => {
                        const isPayment = txn.type === 'payment' || txn.type === 'charge';
                        const isRefundTxn = txn.type === 'refund';
                        const absAmount = Math.abs(txn.amount);
                        return (
                          <div key={txn.id} className="flex items-center justify-between px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {isPayment ? (
                                <ArrowUpCircle className="h-4 w-4 text-green-500 shrink-0" />
                              ) : isRefundTxn ? (
                                <ArrowDownCircle className="h-4 w-4 text-purple-400 shrink-0" />
                              ) : (
                                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {isPayment ? 'Payment' : isRefundTxn ? 'Refund' : txn.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {txn.date ? formatDate(txn.date) : '—'}
                                  {txn.cardBrand && txn.cardLast4 && ` · ${txn.cardBrand} ····${txn.cardLast4}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${isRefundTxn ? 'text-purple-400' : isPayment ? 'text-green-500' : ''}`}>
                                {isRefundTxn ? '-' : '+'}${(absAmount / 100).toFixed(2)}
                              </p>
                              <p className="text-[10px] text-muted-foreground capitalize">{txn.status}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Email Receipt for paid or refunded */}
                {(selectedRegistration.paymentStatus === 'paid' || selectedRegistration.paymentStatus === 'refunded' || selectedRegistration.paymentStatus === 'partially_refunded') && selectedRegistration.paymentId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => requestEmailReceipt(selectedRegistration.paymentId!)}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Email Payment Receipt
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted Registration Card component for reusability
function RegistrationCard({ registration, onShowDetails }: {
  registration: Registration;
  onShowDetails: (reg: Registration) => void;
}) {
  const hasRefund = registration.paymentStatus === 'refunded' || registration.paymentStatus === 'partially_refunded' || (registration.totalRefunded && registration.totalRefunded > 0);
  // Use server-computed isFullRefund (compares total refunded to amount charged) instead of relying on paymentStatus
  const isFullRefund = registration.isFullRefund === true;
  const isPaid = registration.paymentStatus === 'paid' || hasRefund;

  return (
    <Card className="member-card w-full h-full overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <CardHeader className="pb-2 member-card-header">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
              {registration.teamName}
            </CardTitle>
            <CardDescription className="text-sm">
              {registration.eventName} | {registration.ageGroup}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <TeamStatusBadge
              status={registration.status}
              payLater={registration.payLater}
              setupIntentId={registration.setupIntentId}
            />
            <PaymentStatusBadge
              status={registration.paymentStatus}
              hasPaymentInfo={!!registration.setupIntentId}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center bg-primary/5 px-2 py-1.5 rounded">
            <span className="text-muted-foreground">Registered:</span>
            <span className="font-medium">{formatDate(registration.registeredAt)}</span>
          </div>

          <div className="flex justify-between items-center bg-primary/5 px-2 py-1.5 rounded">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-bold text-primary">${(registration.amount / 100).toFixed(2)}</span>
          </div>

          {/* Refund banner */}
          {hasRefund && (
            <div className="p-2.5 rounded-md bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="font-medium text-purple-300 text-xs">
                  {isFullRefund ? 'Full Refund' : 'Partial Refund'}
                </span>
                {registration.refundAmount && (
                  <span className="text-purple-400 font-bold ml-auto text-xs">
                    ${(registration.refundAmount / 100).toFixed(2)}
                  </span>
                )}
              </div>
              {registration.refundReason && (
                <p className="text-[11px] text-purple-400/80 mt-1 ml-5">{registration.refundReason}</p>
              )}
            </div>
          )}

          {/* Card on file info */}
          {registration.cardDetails?.last4 && (
            <div className="flex justify-between items-center px-2 py-1">
              <span className="text-muted-foreground">Card:</span>
              <span className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {registration.cardDetails.brand
                  ? `${registration.cardDetails.brand.charAt(0).toUpperCase() + registration.cardDetails.brand.slice(1)} ····${registration.cardDetails.last4}`
                  : `····${registration.cardDetails.last4}`
                }
              </span>
            </div>
          )}

          {/* Payment error */}
          {registration.paymentStatus === 'failed' && registration.errorMessage && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
              <p className="font-medium">Payment Error:</p>
              <p>{registration.errorMessage}</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 relative z-10">
        <Button
          variant="outline"
          size="sm"
          className="w-full relative z-20 pointer-events-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShowDetails(registration);
          }}
        >
          View Registration Details
        </Button>
      </CardFooter>
    </Card>
  );
}