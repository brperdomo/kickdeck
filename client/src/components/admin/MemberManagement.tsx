import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

interface Registration {
  id: number;
  teamName: string;
  eventName: string;
  ageGroup: string;
  registrationDate: string;
  status: string;
  amountPaid: number;
  termsAccepted: boolean;
  termsAcceptedAt: string;
}

interface MemberDetails {
  member: Member;
  registrations: Registration[];
}

const MemberDetails: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberDetailsOpen, setMemberDetailsOpen] = useState(false);
  const [confirmResendOpen, setConfirmResendOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Query to fetch members with pagination and search
  const membersQuery = useQuery({
    queryKey: ['/api/admin/members', currentPage, pageSize, searchTerm],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/members?page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      return response.json();
    },
    // Replace keepPreviousData with staleTime
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query to fetch a specific member's details (lazy loaded)
  const memberDetailsQuery = useQuery({
    queryKey: ['/api/admin/members', selectedMemberId],
    queryFn: async () => {
      if (!selectedMemberId) return null;
      const response = await fetch(`/api/admin/members/${selectedMemberId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch member details');
      }
      return response.json();
    },
    enabled: !!selectedMemberId,
  });

  // Mutation for resending payment confirmation
  const resendPaymentMutation = useMutation({
    mutationFn: async (registrationId: number) => {
      const response = await fetch(`/api/admin/members/registrations/${registrationId}/resend-payment-confirmation`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend payment confirmation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Payment confirmation email has been resent successfully.",
        variant: "default",
      });
      setConfirmResendOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenMemberDetails = (memberId: number) => {
    setSelectedMemberId(memberId);
    setMemberDetailsOpen(true);
  };

  const handleResendPaymentConfirmation = (registration: Registration) => {
    setSelectedRegistration(registration);
    setConfirmResendOpen(true);
  };

  const confirmResendPaymentConfirmation = () => {
    if (selectedRegistration) {
      resendPaymentMutation.mutate(selectedRegistration.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Assuming amount is stored in cents
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-[300px]">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage and track all members, their registrations, and payment information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="mt-2 text-sm text-muted-foreground">Loading members...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : membersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <span className="mt-2 text-sm text-destructive">Error loading members</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : membersQuery.data?.members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">No members found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                membersQuery.data?.members.map((member: Member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone || 'N/A'}</TableCell>
                    <TableCell>{formatDate(member.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenMemberDetails(member.id)}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {membersQuery.data?.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((old) => Math.max(old - 1, 1))}
                disabled={currentPage === 1 || membersQuery.isPending}
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {membersQuery.data?.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((old) => Math.min(old + 1, membersQuery.data?.totalPages || 1))}
                disabled={currentPage === membersQuery.data?.totalPages || membersQuery.isPending}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={memberDetailsOpen} onOpenChange={setMemberDetailsOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {memberDetailsQuery.isPending ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : memberDetailsQuery.isError ? (
            <div className="text-center py-8 text-destructive">
              Error loading member details
            </div>
          ) : memberDetailsQuery.data ? (
            <div className="space-y-6">
              {/* Member Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Full Name</div>
                      <div className="font-medium">
                        {memberDetailsQuery.data.member.firstName} {memberDetailsQuery.data.member.lastName}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {memberDetailsQuery.data.member.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {memberDetailsQuery.data.member.phone || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Member Since</div>
                      <div className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(memberDetailsQuery.data.member.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registrations */}
              <div>
                <h3 className="text-lg font-medium mb-4">Registrations</h3>
                {memberDetailsQuery.data.registrations.length === 0 ? (
                  <div className="text-center py-8 bg-muted rounded-md">
                    <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No registrations found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Age Group</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberDetailsQuery.data.registrations.map((registration: Registration) => (
                        <TableRow key={registration.id}>
                          <TableCell>{registration.teamName}</TableCell>
                          <TableCell>{registration.eventName}</TableCell>
                          <TableCell>{registration.ageGroup}</TableCell>
                          <TableCell>
                            <Badge variant={registration.status === 'approved' ? 'default' : 'outline'}>
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(registration.amountPaid)}</TableCell>
                          <TableCell>{formatDate(registration.registrationDate)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendPaymentConfirmation(registration)}
                            >
                              Resend Receipt
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Resend Payment Dialog */}
      <Dialog open={confirmResendOpen} onOpenChange={setConfirmResendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Payment Confirmation</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to resend the payment confirmation email for{' '}
            <span className="font-medium">{selectedRegistration?.teamName}</span> in the{' '}
            <span className="font-medium">{selectedRegistration?.eventName}</span> event?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmResendOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResendPaymentConfirmation} disabled={resendPaymentMutation.isPending}>
              {resendPaymentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                'Resend Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberDetails;