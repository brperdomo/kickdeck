import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CreditCard, X, ChevronDown, Calendar, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatusBadge, TeamStatusBadge } from '@/components/ui/payment-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useMemo } from 'react';

interface Registration {
  id: number;
  teamName: string;
  eventName: string;
  eventId: string;
  ageGroup: string;
  registeredAt: string;
  status: 'registered' | 'approved' | 'rejected' | 'withdrawn';
  amount: number;
  paymentId?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentDate?: string;
  cardLastFour?: string;
  errorCode?: string;
  errorMessage?: string;
  payLater?: boolean;
  setupIntentId?: string; // If this exists, the user has provided payment info
  cardDetails?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  };
}

export default function UserRegistrationsView() {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Debug logging
  console.log('UserRegistrationsView render - detailsDialogOpen:', detailsDialogOpen);
  console.log('UserRegistrationsView render - selectedRegistration:', selectedRegistration?.teamName);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

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
    console.log('Show details clicked for registration:', registration);
    setSelectedRegistration(registration);
    setDetailsDialogOpen(true);
    console.log('Dialog should be open now, detailsDialogOpen:', true);
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
      {viewMode === 'grouped' && selectedEvent === 'all' ? (
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
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {filteredRegistrations.map((registration: Registration) => (
            <RegistrationCard 
              key={registration.id} 
              registration={registration} 
              onShowDetails={showRegistrationDetails} 
            />
          ))}
        </div>
      )}

      {/* Registration Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl">
          <DialogHeader>
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
            <div className="space-y-6">
              {/* Team & Event Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Team Information</h3>
                  <div className="bg-muted rounded-md p-3">
                    <p className="font-semibold text-lg">{selectedRegistration.teamName}</p>
                    <p className="text-sm text-muted-foreground">Age Group: {selectedRegistration.ageGroup}</p>
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
                    <span>Registration Fee:</span>
                    <span className="font-semibold">${(selectedRegistration.amount / 100).toFixed(2)}</span>
                  </div>
                  
                  {selectedRegistration.paymentStatus && (
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <PaymentStatusBadge status={selectedRegistration.paymentStatus} />
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
                          {selectedRegistration.cardDetails.expMonth && selectedRegistration.cardDetails.expYear && 
                            ` (exp. ${selectedRegistration.cardDetails.expMonth}/${selectedRegistration.cardDetails.expYear.toString().slice(-2)})`
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

                  {selectedRegistration.setupIntentId && (
                    <div className="mt-2 p-2 border border-primary/20 bg-primary/5 rounded-md text-sm">
                      <p className="font-medium text-primary">Payment Method Saved</p>
                      <p className="text-muted-foreground">Your card will be charged after your registration is approved by the event organizer.</p>
                    </div>
                  )}
                </div>
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
  return (
    <Card 
      className="member-card w-full h-full overflow-hidden relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="pb-2 member-card-header">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
              {registration.teamName}
            </CardTitle>
            <CardDescription className="text-sm">
              {registration.eventName} | {registration.ageGroup}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1">
            <TeamStatusBadge 
              status={registration.status} 
              payLater={registration.payLater} 
              setupIntentId={registration.setupIntentId} 
            />
            <PaymentStatusBadge status={registration.paymentStatus} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center bg-primary/5 px-2 py-1 rounded">
            <span className="text-muted-foreground">Registered:</span>
            <span className="font-medium">{formatDate(registration.registeredAt)}</span>
          </div>
          
          {/* Show payment details when available */}
          {registration.paymentStatus === 'paid' && (
            <>
              <div className="flex justify-between items-center px-2 py-1">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-medium text-primary/90">{registration.paymentId || 'N/A'}</span>
              </div>
              {registration.paymentDate && (
                <div className="flex justify-between items-center px-2 py-1">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span>{formatDate(registration.paymentDate)}</span>
                </div>
              )}
              {registration.cardLastFour && (
                <div className="flex justify-between items-center px-2 py-1">
                  <span className="text-muted-foreground">Card:</span>
                  <span>••••{registration.cardLastFour}</span>
                </div>
              )}
            </>
          )}
          
          {/* Show error message if payment failed */}
          {registration.paymentStatus === 'failed' && registration.errorMessage && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              <p className="font-medium">Payment Error:</p>
              <p>{registration.errorMessage}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center bg-primary/5 px-2 py-1 rounded">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-bold text-primary">${(registration.amount / 100).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex flex-col w-full gap-2">
          <div className="flex justify-between gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => onShowDetails(registration)}
            >
              View Registration Details
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}