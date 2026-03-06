/**
 * Platform Fee Report Dashboard
 * 
 * Comprehensive breakdown of KickDeck revenue vs Stripe fees
 * from all processed transactions.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Download,
  Calendar,
  CreditCard,
  Link,
  Building2
} from 'lucide-react';

interface PlatformFeeData {
  reportMetadata: {
    generatedAt: string;
    dateRange: { startDate: string | null; endDate: string | null };
    eventFilter: string | null;
  };
  summary: {
    totalTransactions: number;
    totalEvents: number;
    totalTournamentCosts: number;
    totalChargedToCustomers: number;
    totalPlatformFeesCollected: number;
    totalStripeFeespaid: number;
    totalKickDeckNetRevenue: number;
    avgKickDeckRevenuePerTransaction: number;
    platformFeeRate: number;
    stripeFeeRate: number;
    kickdeckMarginRate: number;
  };
  paymentMethodBreakdown: {
    linkPayments: {
      count: number;
      revenue: number;
      avgRevenuePerPayment: number;
    };
    cardPayments: {
      count: number;
      revenue: number;
      avgRevenuePerPayment: number;
    };
  };
  eventBreakdown: Array<{
    eventId: string;
    eventName: string;
    teamCount: number;
    tournamentCosts: number;
    totalCharged: number;
    platformFees: number;
    stripeFees: number;
    kickdeckRevenue: number;
    avgRevenuePerTeam: number;
  }>;
  transactions: Array<{
    teamId: number;
    teamName: string;
    eventName: string;
    tournamentCostCents: number;
    totalChargedAmount: number;
    platformFeeAmount: number;
    stripeFeeAmount: number;
    kickdeckRevenue: number;
    tournamentReceives: number;
    paymentMethodType: string;
    paymentIntentId: string;
    approvedAt: string;
    createdAt: string;
  }>;
}

export default function PlatformFeeReportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  // Fetch platform fee data
  const { data: platformFeeData, isLoading, error, refetch } = useQuery<PlatformFeeData>({
    queryKey: ['platform-fee-report', startDate, endDate, selectedEventId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedEventId) params.append('eventId', selectedEventId);

      const response = await fetch(`/api/platform-fee-report?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch platform fee data');
      }
      return response.json();
    }
  });

  // Fetch events for filter dropdown
  const { data: events } = useQuery({
    queryKey: ['events-list'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading platform fee report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Error loading platform fee report: {error.message}
        </div>
      </div>
    );
  }

  const data = platformFeeData!;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Fee Report</h1>
          <p className="text-muted-foreground">
            KickDeck revenue breakdown and Stripe fee analysis
          </p>
        </div>
        <Button onClick={() => refetch()}>
          <Download className="mr-2 h-4 w-4" />
          Refresh Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventFilter">Event Filter</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Events</SelectItem>
                  {events?.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.summary.totalEvents} events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charged to Customers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalChargedToCustomers)}</div>
            <p className="text-xs text-muted-foreground">
              Tournament: {formatCurrency(data.summary.totalTournamentCosts)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KickDeck Net Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalKickDeckNetRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.summary.avgKickDeckRevenuePerTransaction)} per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Fees Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary.totalStripeFeespaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(data.summary.stripeFeeRate)} of total charged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Fee Breakdown</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="events">Event Analysis</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Fee Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Platform Fee Rate:</span>
                    <Badge variant="secondary">{formatPercentage(data.summary.platformFeeRate)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Collected:</span>
                    <span className="font-semibold">{formatCurrency(data.summary.totalPlatformFeesCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KickDeck Margin:</span>
                    <Badge variant="secondary">{formatPercentage(data.summary.kickdeckMarginRate)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stripe Fee Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Effective Rate:</span>
                    <Badge variant="outline">{formatPercentage(data.summary.stripeFeeRate)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(data.summary.totalStripeFeespaid)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    2.9% + $0.30 per transaction
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tournaments:</span>
                    <span className="font-semibold">{formatCurrency(data.summary.totalTournamentCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KickDeck:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(data.summary.totalKickDeckNetRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stripe:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(data.summary.totalStripeFeespaid)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Card Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Transaction Count:</span>
                    <span className="font-semibold">{data.paymentMethodBreakdown.cardPayments.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.paymentMethodBreakdown.cardPayments.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg per Payment:</span>
                    <span>{formatCurrency(data.paymentMethodBreakdown.cardPayments.avgRevenuePerPayment)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Link className="mr-2 h-5 w-5" />
                  Link Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Transaction Count:</span>
                    <span className="font-semibold">{data.paymentMethodBreakdown.linkPayments.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.paymentMethodBreakdown.linkPayments.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg per Payment:</span>
                    <span>{formatCurrency(data.paymentMethodBreakdown.linkPayments.avgRevenuePerPayment)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Event Revenue Breakdown
              </CardTitle>
              <CardDescription>
                KickDeck revenue by event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead className="text-right">Teams</TableHead>
                    <TableHead className="text-right">Tournament Costs</TableHead>
                    <TableHead className="text-right">Total Charged</TableHead>
                    <TableHead className="text-right">KickDeck Revenue</TableHead>
                    <TableHead className="text-right">Avg per Team</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.eventBreakdown.map((event) => (
                    <TableRow key={event.eventId}>
                      <TableCell className="font-medium">{event.eventName}</TableCell>
                      <TableCell className="text-right">{event.teamCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(event.tournamentCosts)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(event.totalCharged)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {formatCurrency(event.kickdeckRevenue)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(event.avgRevenuePerTeam)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Individual transaction breakdown showing KickDeck revenue and Stripe fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Tournament Cost</TableHead>
                    <TableHead className="text-right">Total Charged</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Stripe Fee</TableHead>
                    <TableHead className="text-right">KickDeck Revenue</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.slice(0, 50).map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{transaction.teamName}</TableCell>
                      <TableCell>{transaction.eventName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.tournamentCostCents)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.totalChargedAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.platformFeeAmount)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(transaction.stripeFeeAmount)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {formatCurrency(transaction.kickdeckRevenue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.paymentMethodType === 'Link' ? 'secondary' : 'default'}>
                          {transaction.paymentMethodType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.approvedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.transactions.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Showing first 50 transactions. Use filters to narrow results.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}