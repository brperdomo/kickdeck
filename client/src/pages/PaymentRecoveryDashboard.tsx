import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Send, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Users,
  Mail,
  ExternalLink
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

interface TeamWithPaymentIssue {
  id: number;
  name: string;
  amount: number;
  eventName: string;
  ageGroup: string;
  contactEmail: string;
  status: string;
  paymentLink: string;
}

export default function PaymentRecoveryDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch teams needing payment completion
  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['/api/payment-completion/incomplete-teams'],
    queryFn: async () => {
      const response = await fetch('/api/payment-completion/incomplete-teams');
      if (!response.ok) {
        throw new Error('Failed to fetch teams with payment issues');
      }
      return response.json();
    },
  });

  // Send payment completion emails
  const sendEmailsMutation = useMutation({
    mutationFn: async ({ teamIds, testMode }: { teamIds: number[]; testMode?: boolean }) => {
      const response = await fetch('/api/payment-completion/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamIds, testMode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send payment notifications');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment notifications sent",
        description: `Successfully sent ${data.sent} payment completion emails`,
      });
      setSelectedTeams([]);
      queryClient.invalidateQueries({ queryKey: ['/api/payment-completion/incomplete-teams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending notifications",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Export payment links
  const exportLinksMutation = useMutation({
    mutationFn: async ({ teamIds }: { teamIds: number[] }) => {
      const response = await fetch('/api/payment-completion/export-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to export payment links');
      }

      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-completion-links-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Payment links exported",
        description: "CSV file has been downloaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const teams = teamsData?.teams || [];
  const summary = teamsData?.summary || { totalTeams: 0, totalAmount: 0 };

  // Filter teams based on search and exclude $0 amounts
  const filteredTeams = teams.filter((team: TeamWithPaymentIssue) => {
    // Exclude teams with $0 payment amounts
    if (team.amount <= 0) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      team.name.toLowerCase().includes(searchLower) ||
      team.eventName.toLowerCase().includes(searchLower) ||
      team.contactEmail.toLowerCase().includes(searchLower) ||
      team.ageGroup.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectTeam = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeams.length === filteredTeams.length) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams(filteredTeams.map(team => team.id));
    }
  };

  const selectedTeamsWithPositiveAmount = selectedTeams.filter(teamId => {
    const team = teams.find(t => t.id === teamId);
    return team && team.amount > 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading payment recovery dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load payment recovery data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Recovery Dashboard</h1>
          <p className="text-muted-foreground">
            Manage teams that need to complete their payment setup
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Requiring Payment</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTeams.length}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalTeams - filteredTeams.length} teams with $0 amount excluded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uncollected Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredTeams.reduce((sum, team) => sum + team.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From teams with payment methods needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Teams</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedTeamsWithPositiveAmount.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for payment notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${selectedTeamsWithPositiveAmount.reduce((sum, teamId) => {
                const team = teams.find(t => t.id === teamId);
                return sum + (team?.amount || 0);
              }, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From selected teams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Search teams by name, event, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportLinksMutation.mutate({ teamIds: selectedTeamsWithPositiveAmount })}
            disabled={selectedTeamsWithPositiveAmount.length === 0 || exportLinksMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Links ({selectedTeamsWithPositiveAmount.length})
          </Button>

          <Button
            onClick={() => sendEmailsMutation.mutate({ teamIds: selectedTeamsWithPositiveAmount })}
            disabled={selectedTeamsWithPositiveAmount.length === 0 || sendEmailsMutation.isPending}
          >
            {sendEmailsMutation.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Send Notifications ({selectedTeamsWithPositiveAmount.length})
          </Button>
        </div>
      </div>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Teams Requiring Payment Setup</CardTitle>
              <CardDescription>
                Teams with registration fees that need to complete payment method setup
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedTeams.length === filteredTeams.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">All teams have completed payment setup</h3>
              <p className="text-muted-foreground">
                No teams currently need payment completion assistance
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTeams.map((team: TeamWithPaymentIssue) => (
                <div
                  key={team.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedTeams.includes(team.id) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => handleSelectTeam(team.id)}
                        className="rounded"
                      />
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{team.eventName}</span>
                          {team.ageGroup && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {team.ageGroup}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{team.contactEmail}</span>
                          <span>•</span>
                          <Badge variant={team.status === 'registered' ? 'default' : 'secondary'}>
                            {team.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${team.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Registration fee
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(team.paymentLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Link
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}