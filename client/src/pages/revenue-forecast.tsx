import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { ArrowLeft, Calendar as CalendarIcon, Download, Filter, Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function RevenueForecast() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Query revenue forecast data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['revenueForecast', startDate, endDate, selectedEventId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (selectedEventId) params.append('eventId', selectedEventId);
      
      const response = await fetch(`/api/reports/revenue-forecast?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch revenue forecast');
      }
      return response.json();
    },
  });
  
  // Query available events for filter
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
  });
  
  const events = eventsData?.events || [];
  const summary = data?.summary || {};
  const capturedByEvent = data?.capturedByEvent || [];
  const pendingByEvent = data?.pendingByEvent || [];
  
  const handleExport = async () => {
    // Export functionality would be implemented here
    console.log('Export revenue forecast data');
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/reports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">Loading revenue forecast...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/reports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <Alert variant="destructive" className="my-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load revenue forecast. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="w-full max-w-xs mx-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-6 p-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/reports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <h1 className="text-2xl font-bold mb-1">Revenue Forecast</h1>
          <p className="text-muted-foreground">
            Track captured transactions and forecast future revenue from your "collect now, charge later" flow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[450px]">
              <SheetHeader>
                <SheetTitle>Filter Forecast</SheetTitle>
                <SheetDescription>
                  Apply filters to customize your revenue forecast view
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 flex flex-col space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event</label>
                  <Select value={selectedEventId || ''} onValueChange={(value) => setSelectedEventId(value || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All events</SelectItem>
                      {events.map((event: any) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Captured Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{summary.totalCaptured || 0}</div>
            <p className="text-xs text-muted-foreground">
              Payment methods secured
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Captured Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              ${((summary.totalCapturedAmount || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to charge when approved
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{summary.pendingCharges || 0}</div>
            <p className="text-xs text-muted-foreground">
              Teams awaiting approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecasted Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              ${((summary.forecastedTotal || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total potential revenue
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="captured">Captured Transactions</TabsTrigger>
          <TabsTrigger value="pending">Pending Revenue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Captured vs. potential revenue by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Captured Amount</span>
                    <span className="font-medium">${((summary.totalCapturedAmount || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Potential Revenue</span>
                    <span className="font-medium">${((summary.potentialAmount || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm font-medium">Total Forecast</span>
                    <span className="font-bold">${((summary.forecastedTotal || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs">Est. Stripe Fees</span>
                    <span className="text-xs">-${((summary.estimatedTotalFees || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-medium text-green-600">
                    <span className="text-sm">Net Revenue</span>
                    <span>${((summary.forecastedNetRevenue || 0) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Summary</CardTitle>
                <CardDescription>Current status of captured transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pending</Badge>
                      <span className="text-sm">Awaiting approval</span>
                    </div>
                    <span className="font-medium">{summary.pendingCharges || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Total Captured</Badge>
                      <span className="text-sm">Payment methods saved</span>
                    </div>
                    <span className="font-medium">{summary.totalCaptured || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Potential</Badge>
                      <span className="text-sm">Not yet registered</span>
                    </div>
                    <span className="font-medium">{summary.potentialRegistrations || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="captured">
          <Card>
            <CardHeader>
              <CardTitle>Captured Transactions by Event</CardTitle>
              <CardDescription>Payment methods captured and ready to charge</CardDescription>
            </CardHeader>
            <CardContent>
              {capturedByEvent.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Captured</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Pending Approval</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capturedByEvent.map((event: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{event.eventName}</TableCell>
                        <TableCell>{event.capturedCount}</TableCell>
                        <TableCell>${(event.capturedAmount / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.pendingApprovalCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{event.approvedCount}</Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${(event.netCapturedAmount / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No captured transactions found for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Revenue by Event</CardTitle>
              <CardDescription>Potential revenue from teams not yet registered</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingByEvent.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Pending Teams</TableHead>
                      <TableHead>Potential Revenue</TableHead>
                      <TableHead>Est. Fees</TableHead>
                      <TableHead>Net Potential</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingByEvent.map((event: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{event.eventName}</TableCell>
                        <TableCell>{event.pendingRegistrations}</TableCell>
                        <TableCell>${(event.potentialRevenue / 100).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          ${(event.estimatedStripeFees / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ${(event.netPotentialRevenue / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending revenue opportunities found for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}