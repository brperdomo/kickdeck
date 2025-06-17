import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  ArrowLeft, 
  DollarSign, 
  Loader2,
  Users,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface EventRegistrationReportProps {
  eventId: string;
}

export default function EventRegistrationReport({ eventId }: EventRegistrationReportProps) {
  const [_, navigate] = useLocation();
  
  // Query event registration data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['eventFinancialReport', eventId],
    queryFn: async () => {
      console.log('🔍 Starting API call for event:', eventId);
      
      const response = await fetch(`/api/reports/events/${eventId}/financial`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response content-type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Error response text:', responseText);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
      const responseText = await response.text();
      console.log('📄 Full response text:', responseText);
      console.log('📄 Response text length:', responseText.length);
      console.log('📄 First 100 chars:', responseText.substring(0, 100));
      
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('❌ Received HTML instead of JSON');
        throw new Error('Server returned HTML page instead of JSON data');
      }
      
      try {
        const parsed = JSON.parse(responseText);
        console.log('✅ Successfully parsed JSON:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Response was:', responseText);
        throw new Error('Invalid JSON response from server');
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  const reportData = data?.data;

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      waitlisted: { variant: "outline", icon: AlertTriangle, label: "Waitlisted" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Helper function to get payment status badge
  const getPaymentStatusBadge = (team: any) => {
    if (team.payment_status === 'paid') {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Paid
      </Badge>;
    } else if (team.setup_intent_id || team.payment_method_id) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <CreditCard className="h-3 w-3" />
        Ready to Charge
      </Badge>;
    } else {
      return <Badge variant="outline" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        No Payment Method
      </Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col space-y-6 p-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/events')}
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Error loading registration report: {error?.message}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { event, registrationSummary, financialProjection, teamRegistrations, ageGroupBreakdown, registrationTimeline } = reportData;

  return (
    <div className="flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/events')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">
              {event.name} Registration Report
            </h1>
            {event.is_archived && (
              <Badge variant="outline">Archived</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Registration status and financial projections for tournament organizers
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrationSummary.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              {registrationSummary.approvedTeams} approved, {registrationSummary.pendingApproval} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrationSummary.withPaymentInfo}</div>
            <p className="text-xs text-muted-foreground">
              {((registrationSummary.withPaymentInfo / registrationSummary.totalRegistrations) * 100).toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialProjection.expectedRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(financialProjection.chargeableRevenue)} ready to charge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialProjection.estimatedNetPayout)}</div>
            <p className="text-xs text-muted-foreground">
              After {formatCurrency(financialProjection.estimatedStripeFees)} in fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Team Details</TabsTrigger>
          <TabsTrigger value="age-groups">Age Groups</TabsTrigger>
          <TabsTrigger value="timeline">Registration Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registration Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Status</CardTitle>
                <CardDescription>Current approval and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Approved Teams
                    </span>
                    <span className="font-semibold">{registrationSummary.approvedTeams}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Pending Approval
                    </span>
                    <span className="font-semibold">{registrationSummary.pendingApproval}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Waitlisted
                    </span>
                    <span className="font-semibold">{registrationSummary.waitlistedTeams}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Rejected
                    </span>
                    <span className="font-semibold">{registrationSummary.rejectedTeams}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Collection Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Collection</CardTitle>
                <CardDescription>Payment method collection progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      Payment Methods Collected
                    </span>
                    <span className="font-semibold">{registrationSummary.withPaymentInfo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-gray-600" />
                      No Payment Method
                    </span>
                    <span className="font-semibold">{registrationSummary.withoutPaymentInfo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Already Paid
                    </span>
                    <span className="font-semibold">{registrationSummary.alreadyPaid}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Collection Rate</span>
                      <span>{((registrationSummary.withPaymentInfo / registrationSummary.totalRegistrations) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Projection */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Projection</CardTitle>
              <CardDescription>Expected revenue and fee breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(financialProjection.expectedRevenue)}</div>
                  <div className="text-sm text-muted-foreground">Expected Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">-{formatCurrency(financialProjection.estimatedStripeFees)}</div>
                  <div className="text-sm text-muted-foreground">Estimated Stripe Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(financialProjection.estimatedNetPayout)}</div>
                  <div className="text-sm text-muted-foreground">Net Payout</div>
                </div>
              </div>
              {financialProjection.actualCollected > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Already Collected:</div>
                  <div className="flex justify-between">
                    <span>Payments Processed: {formatCurrency(financialProjection.actualCollected)}</span>
                    <span>Actual Fees: {formatCurrency(financialProjection.actualStripeFees)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Registration Details</CardTitle>
              <CardDescription>Individual team status and payment collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Registration Fee</TableHead>
                      <TableHead>Approval Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamRegistrations.map((team: any) => (
                      <TableRow key={team.team_id}>
                        <TableCell className="font-medium">{team.team_name}</TableCell>
                        <TableCell>{team.age_group} {team.gender}</TableCell>
                        <TableCell>{formatCurrency(parseInt(team.registration_fee) || 0)}</TableCell>
                        <TableCell>{getStatusBadge(team.approval_status)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(team)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="age-groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Age Group Breakdown</CardTitle>
              <CardDescription>Registration and revenue by age group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Total Teams</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Payment Methods</TableHead>
                      <TableHead>Expected Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ageGroupBreakdown.map((group: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{group.age_group} {group.gender}</TableCell>
                        <TableCell>{group.team_count || 0}</TableCell>
                        <TableCell>{group.approved_count || 0}</TableCell>
                        <TableCell>{group.pending_count || 0}</TableCell>
                        <TableCell>{group.with_payment_method || 0}</TableCell>
                        <TableCell>{formatCurrency(parseInt(group.age_group_revenue) || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Timeline</CardTitle>
              <CardDescription>Daily registration and payment collection progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={registrationTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="registration_date" 
                      tickFormatter={(value) => formatDate(value)}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value)}
                      formatter={(value, name) => [value, name === 'daily_registrations' ? 'Registrations' : 'With Payment Info']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="daily_registrations" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      name="Daily Registrations"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="with_payment_info" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="With Payment Info"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}