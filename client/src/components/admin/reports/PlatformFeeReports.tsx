import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Download, DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { PlatformFeeSummary } from './PlatformFeeSummary';
import { PlatformFeeTransactions } from './PlatformFeeTransactions';
import { AllTransactionsReport } from './AllTransactionsReport';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

interface PlatformFeeReportsProps {
  className?: string;
}

export function PlatformFeeReports({ className }: PlatformFeeReportsProps) {
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null
  });
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Get events for filtering
  const { data: events } = useQuery({
    queryKey: ['/api/admin/my-events'],
    queryFn: () => apiRequest('GET', '/api/admin/my-events').then(res => res.json())
  });

  // Get summary data
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/admin/reports/platform-fees/summary', dateRange, selectedEventId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate.toISOString());
      if (dateRange.endDate) params.append('endDate', dateRange.endDate.toISOString());
      if (selectedEventId) params.append('eventId', selectedEventId);
      
      return apiRequest('GET', `/api/admin/reports/platform-fees/summary?${params}`).then(res => res.json());
    }
  });

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate.toISOString());
      if (dateRange.endDate) params.append('endDate', dateRange.endDate.toISOString());
      if (selectedEventId) params.append('eventId', selectedEventId);
      
      const response = await apiRequest('GET', `/api/admin/reports/transactions/export?${params}`);
      
      // Handle CSV download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `platform-fee-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Fee Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive breakdown of platform fees, MatchPro revenue, and Stripe fees
            </p>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker
                  date={dateRange.startDate}
                  onDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <DatePicker
                  date={dateRange.endDate}
                  onDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Event</label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All events</SelectItem>
                    {events?.map((event: any) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summaryData?.summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summaryData.summary.totalAmount?.toLocaleString() || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {summaryData.summary.totalTransactions || 0} transactions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MatchPro Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${summaryData.summary.totalMatchProRevenue?.toLocaleString() || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  1.1% of tournament costs
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summaryData.summary.totalPlatformFees?.toLocaleString() || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  4% + $0.30 total fee structure
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stripe Fees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summaryData.summary.totalStripeFees?.toLocaleString() || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  2.9% + $0.30 processing fees
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for different reports */}
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary & Breakdown</TabsTrigger>
            <TabsTrigger value="transactions">Platform Fee Transactions</TabsTrigger>
            <TabsTrigger value="all-transactions">All Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <PlatformFeeSummary 
              data={summaryData} 
              loading={summaryLoading}
              dateRange={dateRange}
              eventId={selectedEventId}
            />
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
            <PlatformFeeTransactions 
              dateRange={dateRange}
              eventId={selectedEventId}
            />
          </TabsContent>
          
          <TabsContent value="all-transactions" className="space-y-4">
            <AllTransactionsReport 
              dateRange={dateRange}
              eventId={selectedEventId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}