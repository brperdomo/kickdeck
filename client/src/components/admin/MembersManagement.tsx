import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Search, UserCircle, Filter, CheckCircle, XCircle, RotateCw, Users, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';

export function MemberManagement() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('lastName');
  const [order, setOrder] = useState('asc');
  const [selectedEvent, setSelectedEvent] = useState<string>(''); // State for event filtering
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Query events for the dropdown
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    }
  });

  // Query members with search, pagination and sorting
  const { data: membersData, isLoading, isError } = useQuery({
    queryKey: ['members', search, page, pageSize, sort, order, selectedEvent],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (search) searchParams.append('search', search);
      if (selectedEvent) searchParams.append('eventId', selectedEvent); // Append selected event
      searchParams.append('page', page.toString());
      searchParams.append('limit', pageSize.toString());
      searchParams.append('sort', sort);
      searchParams.append('order', order);

      const response = await fetch(`/api/admin/members?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      return response.json();
    }
  });

  // Function to export members to CSV
  const exportMembersToCSV = async () => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.append('search', search);
    if (selectedEvent) searchParams.append('eventId', selectedEvent); // Filter by selected event

    try {
      const response = await fetch(`/api/admin/members/export?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export members');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'members.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Export successful",
        description: "Members have been exported to CSV.",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  // Query member details when a member is selected
  const { data: memberDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['member', selectedMember?.id],
    queryFn: async () => {
      if (!selectedMember?.id) return null;

      const response = await fetch(`/api/admin/members/${selectedMember.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch member details');
      }
      return response.json();
    },
    enabled: !!selectedMember?.id
  });

  // Query registration details when a registration is selected
  const { data: registrationDetails, isLoading: isLoadingRegistration } = useQuery({
    queryKey: ['registration', selectedRegistration?.team?.id],
    queryFn: async () => {
      if (!selectedRegistration?.team?.id) return null;

      const response = await fetch(`/api/admin/members/registration/${selectedRegistration.team.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch registration details');
      }
      return response.json();
    },
    enabled: !!selectedRegistration?.team?.id
  });

  // Mutation for resending payment confirmation
  const resendConfirmationMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await fetch(`/api/admin/members/registration/${teamId}/resend-confirmation`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend confirmation');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Confirmation email sent",
        description: "Payment confirmation email was successfully sent",
      });
      setIsResendDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Calculate pagination 
  const totalPages = membersData?.pagination?.totalPages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSort = (column: string) => {
    if (sort === column) {
      // Toggle order if same column
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSort(column);
      setOrder('asc');
    }
  };

  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setSelectedRegistration(null);
  };

  const handleRegistrationClick = (registration: any) => {
    setSelectedRegistration(registration);
  };

  const handleResendConfirmation = () => {
    if (selectedRegistration?.team?.id) {
      resendConfirmationMutation.mutate(selectedRegistration.team.id);
    }
  };

  // Display status badge with appropriate color
  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'registered':
        return <Badge className="bg-blue-500">Registered</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Member Management</h2>
          <p className="text-sm text-muted-foreground">
            View and manage all registered members in the system
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/member-merge')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Member Merge
          </Button>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Select onValueChange={setSelectedEvent} value={selectedEvent}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Events</SelectItem>
                {eventsData?.events?.map((event: { id: string; name: string }) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-8 w-[250px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
          </form>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportMembersToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Failed to load members. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : membersData?.members?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No members found. Try a different search term or event.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('lastName')}
                  >
                    Name {sort === 'lastName' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    Email {sort === 'email' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead 
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort('createdAt')}
                  >
                    Joined {sort === 'createdAt' && (order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersData?.members?.map((member: any) => (
                  <TableRow key={member.id} className={selectedMember?.id === member.id ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{member.phone || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(member.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMemberClick(member)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setPage(1); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <Pagination>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center justify-center px-2 text-sm">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </Pagination>
            </div>
          </CardFooter>
        </Card>
      )}

      {selectedMember && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Member Details</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedMember(null)}
              >
                <XCircle className="h-4 w-4 mr-1" /> Close
              </Button>
            </div>
            <CardDescription>
              View details and registrations for {selectedMember.firstName} {selectedMember.lastName}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoadingDetails ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !memberDetails ? (
              <p>Failed to load member details</p>
            ) : (
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Member Info</TabsTrigger>
                  <TabsTrigger value="registrations">
                    Registrations ({memberDetails.registrations?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                      <p>{memberDetails.member.firstName} {memberDetails.member.lastName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                      <p>{memberDetails.member.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                      <p>{memberDetails.member.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Account Created</h3>
                      <p>{formatDate(memberDetails.member.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Admin Status</h3>
                      <p>{memberDetails.member.isAdmin ? 'Administrator' : 'Regular Member'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Player Count</h3>
                      <p>{memberDetails.playerCount} players registered</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="registrations">
                  {memberDetails.registrations?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No registrations found for this member
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="border rounded-lg divide-y">
                        {memberDetails.registrations?.map((reg: any) => (
                          <div 
                            key={reg.team.id} 
                            className={`p-4 hover:bg-muted/50 cursor-pointer ${selectedRegistration?.team?.id === reg.team.id ? 'bg-muted/50' : ''}`}
                            onClick={() => handleRegistrationClick(reg)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{reg.team.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {reg.event.name} - {reg.ageGroup.ageGroup}
                                </p>
                                <p className="text-xs">
                                  Registered: {formatDate(reg.team.createdAt)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                {getStatusBadge(reg.team.status)}
                                {reg.team.registrationFee && (
                                  <span className="text-sm font-medium">
                                    {formatCurrency(reg.team.registrationFee)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {selectedRegistration && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Registration Details</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedRegistration(null)}
              >
                <XCircle className="h-4 w-4 mr-1" /> Close
              </Button>
            </div>
            <CardDescription>
              Team: {selectedRegistration.team.name} | Event: {selectedRegistration.event.name}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoadingRegistration ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !registrationDetails ? (
              <p>Failed to load registration details</p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
                    <p>{formatDate(registrationDetails.registration.team.createdAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <div>{getStatusBadge(registrationDetails.registration.team.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Age Group</h3>
                    <p>{registrationDetails.registration.ageGroup.ageGroup}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Registration Fee</h3>
                    <p>{formatCurrency(registrationDetails.registration.team.registrationFee)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Terms Acknowledged</h3>
                    <p>
                      {registrationDetails.registration.team.termsAcknowledged ? (
                        <span className="flex items-center"><CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Yes</span>
                      ) : (
                        <span className="flex items-center"><XCircle className="h-4 w-4 mr-1 text-red-500" /> No</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Terms Acknowledged At</h3>
                    <p>
                      {registrationDetails.registration.team.termsAcknowledgedAt ? 
                        formatDate(registrationDetails.registration.team.termsAcknowledgedAt) : 
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Team Contact Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Head Coach</h4>
                      <p>{registrationDetails.registration.team.headCoachName}</p>
                      <p className="text-sm">{registrationDetails.registration.team.headCoachEmail}</p>
                      <p className="text-sm">{registrationDetails.registration.team.headCoachPhone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Team Manager</h4>
                      <p>{registrationDetails.registration.team.managerName}</p>
                      <p className="text-sm">{registrationDetails.registration.team.managerEmail}</p>
                      <p className="text-sm">{registrationDetails.registration.team.managerPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Players ({registrationDetails.players?.length || 0})</h3>
                  </div>

                  {registrationDetails.players?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Jersey #</TableHead>
                          <TableHead className="hidden md:table-cell">Date of Birth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrationDetails.players.map((player: any) => (
                          <TableRow key={player.id}>
                            <TableCell>{player.firstName} {player.lastName}</TableCell>
                            <TableCell>{player.jerseyNumber || 'N/A'}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(player.dateOfBirth)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No players found for this team
                    </p>
                  )}
                </div>

                <div className="border-t pt-4 flex justify-end">
                  <Button
                    onClick={() => setIsResendDialogOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Resend Payment Confirmation
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialog for resending payment email */}
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Payment Confirmation</DialogTitle>
            <DialogDescription>
              This will send a payment confirmation email to the member who submitted this registration.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p><strong>Team:</strong> {selectedRegistration?.team?.name}</p>
            <p><strong>Event:</strong> {selectedRegistration?.event?.name}</p>
            <p><strong>Recipient:</strong> {registrationDetails?.submitter?.email || selectedRegistration?.team?.managerEmail}</p>
            <p><strong>Amount:</strong> {formatCurrency(selectedRegistration?.team?.registrationFee)}</p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsResendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResendConfirmation}
              disabled={resendConfirmationMutation.isPending}
            >
              {resendConfirmationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>Send Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}