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
import { Label } from "@/components/ui/label";
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
  Edit,
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
  const [pageSize] = useState(15);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Query to fetch members with pagination and search
  const membersQuery = useQuery({
    queryKey: ['members', currentPage, pageSize, searchTerm],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (searchTerm) searchParams.append('search', searchTerm);
      searchParams.append('page', currentPage.toString());
      searchParams.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/admin/members?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      return response.json();
    },
  });

  // Query to fetch a specific member's details (lazy loaded)
  const memberDetailsQuery = useQuery({
    queryKey: ['member', selectedMemberId],
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

  // Mutation for updating member email
  const updateEmailMutation = useMutation({
    mutationFn: async ({ memberId, newEmail }: { memberId: number; newEmail: string }) => {
      const response = await fetch(`/api/admin/members/${memberId}/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newEmail }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update email');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Updated",
        description: `Member email updated successfully. Updated ${data.updatedTeams.submitterTeams + data.updatedTeams.managerTeams + data.updatedTeams.coachTeams} team records.`,
        variant: "default",
      });
      setEditEmailOpen(false);
      setNewEmail('');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['member', selectedMemberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
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

  const handleEditEmail = () => {
    if (memberDetailsQuery.data?.member) {
      setNewEmail(memberDetailsQuery.data.member.email);
      setEditEmailOpen(true);
    }
  };

  const confirmEmailUpdate = () => {
    if (selectedMemberId && newEmail.trim()) {
      updateEmailMutation.mutate({ 
        memberId: selectedMemberId, 
        newEmail: newEmail.trim() 
      });
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
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">All Members</h3>
          <p className="text-sm text-muted-foreground">
            View and manage all registered members in the system.
          </p>
        </div>
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
      <Card className="border shadow-sm">
        <CardHeader className="bg-card">
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage and track all members, their registrations, and payment information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersQuery.isLoading ? (
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
          {membersQuery.data?.pagination && (
            <div className="flex items-center justify-between border-t border-border py-4 px-1 mt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{((membersQuery.data.pagination.page - 1) * membersQuery.data.pagination.limit) + 1}</span> to <span className="font-medium">{Math.min(membersQuery.data.pagination.page * membersQuery.data.pagination.limit, membersQuery.data.pagination.total)}</span> of <span className="font-medium">{membersQuery.data.pagination.total}</span> members
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((old) => Math.max(old - 1, 1))}
                  disabled={currentPage === 1 || membersQuery.isLoading}
                  className="h-8 flex items-center px-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  Prev
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {membersQuery.data.pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((old) => Math.min(old + 1, membersQuery.data.pagination.totalPages || 1))}
                  disabled={currentPage === membersQuery.data.pagination.totalPages || membersQuery.isLoading}
                  className="h-8 flex items-center px-3"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-4 w-4"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </Button>
              </div>
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
          {memberDetailsQuery.isLoading ? (
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
                      <div className="font-medium flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {memberDetailsQuery.data.member.email}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditEmail}
                          className="text-xs p-1 h-auto"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
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

      {/* Edit Email Dialog */}
      <Dialog open={editEmailOpen} onOpenChange={setEditEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Member Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will update the member's email address in their account and all associated team registrations.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditEmailOpen(false);
                setNewEmail('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmEmailUpdate} 
              disabled={updateEmailMutation.isPending || !newEmail.trim()}
            >
              {updateEmailMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberDetails;