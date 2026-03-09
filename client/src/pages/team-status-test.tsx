import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';

export default function TeamStatusTest() {
  const [teamId, setTeamId] = useState('');
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const queryClient = useQueryClient();

  // Clear error/success messages when inputs change
  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, [teamId, status, notes]);

  // Query to fetch team details
  const { data: team, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const response = await fetch(`/api/admin/teams/${teamId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch team: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!teamId && teamId.length > 0,
    retry: false
  });

  // Mutation to update team status
  const updateMutation = useMutation({
    mutationFn: async ({ id, newStatus, notes }: { id: string; newStatus: string; notes: string }) => {
      const response = await fetch(`/api/admin/teams/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes,
        }),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorText = response.statusText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || errorText;
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSuccessMessage(`Team status updated to ${data.team.status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
    onError: (error: Error) => {
      setErrorMessage(`Failed to update team status: ${error.message}`);
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/admin/teams/${id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
        }),
      });

      if (!response.ok) {
        let errorText = response.statusText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || errorText;
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSuccessMessage(`Team refunded successfully!`);
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
    onError: (error: Error) => {
      setErrorMessage(`Failed to process refund: ${error.message}`);
    },
  });

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !status) {
      setErrorMessage('Team ID and status are required');
      return;
    }
    
    updateMutation.mutate({ 
      id: teamId, 
      newStatus: status, 
      notes 
    });
  };

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) {
      setErrorMessage('Team ID is required');
      return;
    }
    
    refundMutation.mutate({ 
      id: teamId, 
      reason: notes 
    });
  };

  return (
    <AdminPageWrapper
      title="Team Status Management"
      backUrl="/admin"
      backLabel="Back to Dashboard"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Team Search & Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Find Team</CardTitle>
              <CardDescription>Enter a team ID to view its details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  placeholder="Team ID" 
                  value={teamId} 
                  onChange={(e) => setTeamId(e.target.value)}
                />
                <Button onClick={() => refetch()} variant="secondary">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Fetch'
                  )}
                </Button>
              </div>
              
              {isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error instanceof Error ? error.message : 'Failed to load team details'}
                  </AlertDescription>
                </Alert>
              )}
              
              {team && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-lg font-semibold">Team Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Name:</div>
                    <div>{team.team.name}</div>
                    
                    <div className="font-medium">Status:</div>
                    <div className="capitalize">{team.team.status}</div>
                    
                    <div className="font-medium">Event:</div>
                    <div>{team.event?.name || 'N/A'}</div>
                    
                    <div className="font-medium">Manager:</div>
                    <div>{team.team.managerName} ({team.team.managerEmail})</div>
                    
                    <div className="font-medium">Created:</div>
                    <div>{new Date(team.team.createdAt).toLocaleDateString()}</div>
                    
                    {team.team.totalAmount && (
                      <>
                        <div className="font-medium">Payment:</div>
                        <div>${(team.team.totalAmount / 100).toFixed(2)}</div>
                      </>
                    )}
                    
                    {team.team.notes && (
                      <>
                        <div className="font-medium">Notes:</div>
                        <div>{team.team.notes}</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Status Update & Refund Controls */}
        <div className="space-y-6">
          {/* Status Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>Change the team's status</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Status:</label>
                  <Select 
                    value={status} 
                    onValueChange={(value) => setStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes:</label>
                  <Textarea 
                    placeholder="Add notes about this status change" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpdateStatus}
                disabled={updateMutation.isPending || !teamId || !status}
                className="w-full"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Refund Form */}
          <Card>
            <CardHeader>
              <CardTitle>Process Refund</CardTitle>
              <CardDescription>Refund a paid team registration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Refund Reason:</label>
                <Textarea 
                  placeholder="Reason for the refund" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleRefund}
                disabled={refundMutation.isPending || !teamId}
                variant="destructive"
                className="w-full"
              >
                {refundMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Refund...
                  </>
                ) : (
                  'Process Refund'
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success</AlertTitle>
              <AlertDescription className="text-green-700">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {errorMessage && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}