import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Loader2, 
  RefreshCw, 
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  RotateCcw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import DatePicker from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Get the payment status badge variant
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'succeeded':
      return { variant: 'default' as const, label: 'Succeeded' };
    case 'pending':
      return { variant: 'outline' as const, label: 'Pending' };
    case 'failed':
      return { variant: 'destructive' as const, label: 'Failed' };
    case 'refunded':
    case 'partial_refund':
      return { variant: 'secondary' as const, label: 'Refunded' };
    case 'chargeback':
      return { variant: 'destructive' as const, label: 'Chargeback' };
    default:
      return { variant: 'outline' as const, label: status.charAt(0).toUpperCase() + status.slice(1) };
  }
};

export default function BookkeepingReport() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all-transactions');
  
  // Date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  
  // Additional filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [showSettledOnly, setShowSettledOnly] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Query bookkeeping report data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['bookkeepingReport', activeTab, startDate, endDate, showSettledOnly],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (showSettledOnly) params.append('settledOnly', 'true');
      params.append('reportType', activeTab);
      
      const response = await fetch(`/api/reports/bookkeeping?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookkeeping report');
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
  
  // Ensure transactions is always an array
  const transactions = Array.isArray(data?.transactions) 
    ? data.transactions 
    : (data?.transactions?.count > 0 ? data.transactions.rows : []);
  
  const events = eventsData?.events || [];
  
  // Calculate summary statistics
  const summary = data?.summary || {
    totalTransactions: 0,
    totalAmount: 0,
    stripeFees: 0,
    netAmount: 0
  };

  // Apply client-side filters (beyond the date range and tab filters)
  const filteredTransactions = Array.isArray(transactions) ? transactions.filter((transaction: any) => {
    // Text search
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const searchFields = [
      transaction.team_name || '',
      transaction.event_name || '',
      transaction.manager_name || '',
      transaction.manager_email || '',
      transaction.age_group || '',
      transaction.payment_method || '',
      transaction.status || '',
      transaction.payment_intent_id || '',
      transaction.club_name || ''
    ].map(field => field.toLowerCase());
    
    const matchesSearch = searchTerms.every(term => 
      searchFields.some(field => field.includes(term))
    );
    
    // Status filter
    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    
    // Payment method filter
    const matchesPaymentMethod = !paymentMethodFilter || transaction.payment_method === paymentMethodFilter;
    
    // Event filter
    const matchesEvent = !selectedEventId || transaction.event_id === selectedEventId;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesEvent;
  }) : [];

  // Get unique payment methods and statuses for filters
  const statusMap: Record<string, boolean> = {};
  const paymentMethodMap: Record<string, boolean> = {};
  
  if (Array.isArray(transactions)) {
    transactions.forEach((t: any) => {
      if (t.status) statusMap[t.status] = true;
      if (t.payment_method) paymentMethodMap[t.payment_method] = true;
    });
  }
  
  const uniqueStatuses = Object.keys(statusMap);
  const uniquePaymentMethods = Object.keys(paymentMethodMap);

  // Handle export function for the current view
  const handleExport = () => {
    if (!filteredTransactions.length) return;
    
    try {
      // Define CSV headers based on active tab
      let headers = [
        "Transaction ID", 
        "Date", 
        "Team Name",
        "Event Name",
        "Payment Method", 
        "Gross Amount", 
        "Stripe Fee",
        "Net Amount",
        "Status", 
        "Settlement Date",
        "Manager Email"
      ];
      
      if (activeTab === 'refunds') {
        headers = [
          "Transaction ID",
          "Original Payment ID", 
          "Date", 
          "Team Name",
          "Event Name",
          "Refund Amount", 
          "Refund Reason",
          "Refund Type",
          "Original Amount"
        ];
      } else if (activeTab === 'chargebacks') {
        headers = [
          "Transaction ID", 
          "Original Payment ID",
          "Date", 
          "Team Name",
          "Event Name",
          "Chargeback Amount", 
          "Dispute Status",
          "Dispute Reason"
        ];
      } else if (activeTab === 'pending-payments') {
        headers = [
          "Transaction ID", 
          "Date", 
          "Team Name",
          "Event Name",
          "Amount Due", 
          "Status",
          "Manager Email",
          "Manager Phone"
        ];
      }
      
      // Create CSV rows based on active tab
      const rows = filteredTransactions.map((transaction: any) => {
        if (activeTab === 'refunds') {
          return [
            transaction.id,
            transaction.original_payment_id || 'N/A',
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            formatCurrency(transaction.amount),
            transaction.refund_reason || 'N/A',
            transaction.is_partial ? 'Partial' : 'Full',
            formatCurrency(transaction.original_amount || 0)
          ];
        } else if (activeTab === 'chargebacks') {
          return [
            transaction.id,
            transaction.original_payment_id || 'N/A',
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            formatCurrency(transaction.amount),
            transaction.dispute_status || 'N/A',
            transaction.dispute_reason || 'N/A'
          ];
        } else if (activeTab === 'pending-payments') {
          return [
            transaction.id,
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            formatCurrency(transaction.amount_due),
            transaction.status,
            transaction.manager_email || 'N/A',
            transaction.manager_phone || 'N/A'
          ];
        } else {
          // All transactions tab
          return [
            transaction.id,
            formatDate(transaction.created_at),
            transaction.team_name || 'N/A',
            transaction.event_name || 'N/A',
            transaction.payment_method || 'N/A',
            formatCurrency(transaction.amount),
            formatCurrency(transaction.stripe_fee || 0),
            formatCurrency((transaction.amount || 0) - (transaction.stripe_fee || 0)),
            transaction.status,
            transaction.settled_date ? formatDate(transaction.settled_date) : 'N/A',
            transaction.manager_email || 'N/A'
          ];
        }
      });
      
      // Convert to CSV
      const csvContent = [
        headers.join(","),
        ...rows.map((row: (string | number)[]) => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
        ).join(","))
      ].join("\n");
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      // Name the file based on the active tab
      const tabNames: Record<string, string> = {
        'all-transactions': 'all-transactions',
        'refunds': 'refunds',
        'chargebacks': 'chargebacks',
        'pending-payments': 'pending-payments'
      };
      
      link.setAttribute('download', `${tabNames[activeTab]}-${formatDate(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Report has been exported to CSV",
        variant: "default",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report",
        variant: "destructive",
      });
    }
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
            <p className="text-muted-foreground text-lg">Loading bookkeeping report...</p>
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
            {error instanceof Error ? error.message : 'Failed to load bookkeeping report. Please try again.'}
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
          <h1 className="text-2xl font-bold mb-1">Bookkeeping Report</h1>
          <p className="text-muted-foreground">
            Comprehensive financial data for accounting and bookkeeping
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
                <SheetTitle>Filter Transactions</SheetTitle>
                <SheetDescription>
                  Apply filters to narrow down results
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 flex flex-col space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="start-date" className="w-24">Start Date:</Label>
                      <DatePicker 
                        id="start-date"
                        date={startDate} 
                        setDate={setStartDate} 
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="end-date" className="w-24">End Date:</Label>
                      <DatePicker 
                        id="end-date"
                        date={endDate} 
                        setDate={setEndDate} 
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event">Event</Label>
                  <Select 
                    value={selectedEventId || ''} 
                    onValueChange={(value) => setSelectedEventId(value || null)}
                  >
                    <SelectTrigger id="event">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Events</SelectItem>
                      {events.map((event: any) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Transaction Status</Label>
                  <Select 
                    value={statusFilter || ''} 
                    onValueChange={(value) => setStatusFilter(value || null)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {uniqueStatuses.map((status: string) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select 
                    value={paymentMethodFilter || ''} 
                    onValueChange={(value) => setPaymentMethodFilter(value || null)}
                  >
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="All Payment Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Payment Methods</SelectItem>
                      {uniquePaymentMethods.map((method: string) => (
                        <SelectItem key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="settled-only" 
                    checked={showSettledOnly}
                    onCheckedChange={(checked) => {
                      setShowSettledOnly(checked === true);
                    }}
                  />
                  <Label htmlFor="settled-only">Show settled transactions only</Label>
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button
                    onClick={() => {
                      setStatusFilter(null);
                      setPaymentMethodFilter(null);
                      setSelectedEventId(null);
                      setShowSettledOnly(false);
                      // Reset date to last 30 days
                      setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
                      setEndDate(new Date());
                    }}
                    variant="outline"
                  >
                    Reset Filters
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Date Range Display */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          {startDate && endDate
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : 'All time'}
        </span>
        {showSettledOnly && (
          <Badge variant="outline" className="ml-2">Settled Only</Badge>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Total Transactions</span>
              <span className="text-2xl font-bold">{summary.totalTransactions}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Gross Amount</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Stripe Fees</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.stripeFees)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm mb-1">Net Amount</span>
              <span className="text-2xl font-bold">{formatCurrency(summary.netAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Settlement Info - only show for "all-transactions" tab when there are transactions */}
      {activeTab === 'all-transactions' && filteredTransactions.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Settlement Information
            </CardTitle>
            <CardDescription>
              Stripe typically deposits funds within 2 business days of successful payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="mb-2">
                <strong>Payment processing:</strong> Stripe collects a fee of 2.9% + 30¢ per transaction.
              </p>
              <p>
                <strong>Estimated next deposit:</strong> Payments from {formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))} and earlier should be deposited today.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0 text-xs text-muted-foreground">
            Note: Settlement estimates are for reference only. Actual deposit dates may vary based on Stripe's processing schedule and holidays.
          </CardFooter>
        </Card>
      )}
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by team, manager, event..."
          className="pl-10 w-full md:max-w-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Tabs for different reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="all-transactions" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden md:inline">All Transactions</span>
            <span className="md:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-1">
            <RotateCcw className="h-4 w-4" />
            <span>Refunds</span>
          </TabsTrigger>
          <TabsTrigger value="chargebacks" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span>Chargebacks</span>
          </TabsTrigger>
          <TabsTrigger value="pending-payments" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Pending Payments</span>
            <span className="md:hidden">Pending</span>
          </TabsTrigger>
        </TabsList>
        
        {/* All Transactions Tab */}
        <TabsContent value="all-transactions">
          <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
            <div className="p-6 bg-gradient-to-r from-indigo-50/30 to-white">
              <h3 className="text-lg font-medium">All Transactions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All financial transactions for the selected date range
              </p>
            </div>
            
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Transaction ID</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Date</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Event</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Gross Amount</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Stripe Fee</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Net Amount</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Payment Method</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Status</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Settlement Date</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => {
                        const statusBadge = getStatusBadge(transaction.status);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{transaction.id}</TableCell>
                            <TableCell>{formatDate(transaction.created_at)}</TableCell>
                            <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                            <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                            <TableCell>{formatCurrency(transaction.stripe_fee || 0)}</TableCell>
                            <TableCell>{formatCurrency((transaction.amount || 0) - (transaction.stripe_fee || 0))}</TableCell>
                            <TableCell>{transaction.payment_method || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.settled_date ? formatDate(transaction.settled_date) : 'N/A'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-muted-foreground">No transactions found for the selected filters.</p>
                  <div className="max-w-md mx-auto text-sm text-muted-foreground space-y-2">
                    <p>Try adjusting your filters or date range to see more results.</p>
                    <div className="bg-muted/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Bookkeeping Tips:</h4>
                      <ul className="list-disc list-inside space-y-1 text-left">
                        <li>Export reports monthly for accounting records</li>
                        <li>Reconcile with Stripe dashboard for accuracy</li>
                        <li>Track settlement dates for cash flow management</li>
                        <li>Monitor refund and chargeback activity</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {transactions.length} total transactions
                </p>
              </div>
            </div>
        </TabsContent>
        
        {/* Refunds Tab */}
        <TabsContent value="refunds">
          <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
            <div className="p-6 bg-gradient-to-r from-indigo-50/30 to-white">
              <h3 className="text-lg font-medium">Refund Transactions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All refunds issued for the selected date range
              </p>
            </div>
            
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Refund ID</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Original Payment</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Date</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Event</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Refund Amount</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Refund Type</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Original Amount</TableHead>
                      <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Reason</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.original_payment_id || 'N/A'}</TableCell>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                          <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.is_partial ? 'secondary' : 'outline'}>
                              {transaction.is_partial ? 'Partial' : 'Full'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(transaction.original_amount || 0)}</TableCell>
                          <TableCell>{transaction.refund_reason || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-muted-foreground">No refunds found for the selected filters.</p>
                  <div className="max-w-md mx-auto text-sm text-muted-foreground space-y-2">
                    <p>Try adjusting your date range to include periods when refunds were processed.</p>
                    <div className="bg-muted/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Refund Policy Reminders:</h4>
                      <ul className="list-disc list-inside space-y-1 text-left">
                        <li>Full refunds are available up to 14 days before an event</li>
                        <li>Partial refunds may be issued at the administrator's discretion</li>
                        <li>All refunds should include a documented reason</li>
                        <li>Refunds typically process within 5-7 business days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {transactions.length} total refunds
                </p>
              </div>
            </div>
        </TabsContent>
        
        {/* Chargebacks Tab */}
        <TabsContent value="chargebacks">
          <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
            <div className="p-6 bg-gradient-to-r from-indigo-50/30 to-white">
              <h3 className="text-lg font-medium">Chargeback Transactions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All chargebacks received for the selected date range
              </p>
            </div>
            
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Chargeback ID</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Original Payment</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Date</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Event</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Amount</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Status</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Dispute Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.original_payment_id || 'N/A'}</TableCell>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                          <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.dispute_status === 'won' ? 'default' : 'destructive'}>
                              {transaction.dispute_status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.dispute_reason || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-muted-foreground">No chargebacks found for the selected filters.</p>
                  <div className="max-w-md mx-auto text-sm text-muted-foreground space-y-2">
                    <p>Chargebacks are rare - this is a good thing! They only appear when a customer disputes a charge.</p>
                    <div className="bg-muted/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Chargeback Guidelines:</h4>
                      <ul className="list-disc list-inside space-y-1 text-left">
                        <li>Respond promptly to all chargeback notifications</li>
                        <li>Provide evidence of service delivery when disputing</li>
                        <li>Document all customer communications</li>
                        <li>Chargebacks may incur additional fees from Stripe</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {transactions.length} total chargebacks
                </p>
              </div>
            </div>
        </TabsContent>
        
        {/* Pending Payments Tab */}
        <TabsContent value="pending-payments">
          <div className="shadow-md rounded-xl overflow-hidden border border-gray-200">
            <div className="p-6 bg-gradient-to-r from-indigo-50/30 to-white">
              <h3 className="text-lg font-medium">Pending Payments</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All registrations with pending payments (Pay Later submissions)
              </p>
            </div>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team ID</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Registration Date</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Team Name</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Event</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Amount Due</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Status</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Manager</TableHead>
                        <TableHead className="font-semibold py-4 text-indigo-900 dark:text-blue-100">Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.team_name || 'N/A'}</TableCell>
                          <TableCell>{transaction.event_name || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount_due)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.manager_name || 'N/A'}</TableCell>
                          <TableCell>
                            {transaction.manager_email && <p className="text-xs">{transaction.manager_email}</p>}
                            {transaction.manager_phone && <p className="text-xs">{transaction.manager_phone}</p>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <p className="text-muted-foreground">No pending payments found for the selected filters.</p>
                  <div className="max-w-md mx-auto text-sm text-muted-foreground space-y-2">
                    <p>Pending payments are created when teams choose the "Pay Later" option during registration.</p>
                    <div className="bg-muted/30 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Pending Payment Follow-up:</h4>
                      <ul className="list-disc list-inside space-y-1 text-left">
                        <li>Contact teams regularly about outstanding balances</li>
                        <li>Consider setting payment deadlines before event</li>
                        <li>Maintain detailed records of all communications</li>
                        <li>Teams with pending payments can be found in the "Teams" dashboard</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {transactions.length} total pending payments
                </p>
              </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}