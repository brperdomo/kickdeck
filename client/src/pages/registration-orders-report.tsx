import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Download, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Define the type for a single transaction record
interface Transaction {
  id: number;
  transactionType: string;
  amount: number;
  formattedAmount: string;
  status: string;
  cardBrand: string | null;
  cardLastFour: string | null;
  paymentMethodType: string | null;
  paymentIntentId: string | null;
  datePaid: string | null;
  dateSettled: string | null;
  teamId: number | null;
  teamName: string | null;
  orderSubmitter: string | null;
  eventId: number | null;
  eventName: string | null;
  eventStartDate: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
}

// Define the type for API response
interface RegistrationOrdersResponse {
  success: boolean;
  data: Transaction[];
}

function TransactionStatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'success' | 'destructive' | 'secondary' | 'outline' = 'default';
  
  switch (status) {
    case 'succeeded':
      variant = 'success';
      break;
    case 'failed':
      variant = 'destructive';
      break;
    case 'pending':
    case 'processing':
      variant = 'secondary';
      break;
    case 'refunded':
    case 'partial_refund':
    case 'chargeback':
      variant = 'outline';
      break;
  }
  
  return <Badge variant={variant}>{status}</Badge>;
}

function formatPaymentMethod(transaction: Transaction) {
  if (!transaction.paymentMethodType) return 'N/A';
  
  if (transaction.paymentMethodType === 'card' && transaction.cardBrand && transaction.cardLastFour) {
    return `${transaction.cardBrand.toUpperCase()} •••• ${transaction.cardLastFour}`;
  }
  
  return transaction.paymentMethodType;
}

export default function RegistrationOrdersReport() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Get the data from the API
  const { data, isLoading, error, refetch } = useQuery<RegistrationOrdersResponse>({
    queryKey: ['registration-orders-report'],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const url = `/api/financial/reports/registration-orders${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading report',
        description: 'There was a problem fetching the registration orders data.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  // Filter function for searching
  const filteredData = data?.data.filter(transaction => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (transaction.teamName?.toLowerCase().includes(searchLower) || false) ||
      (transaction.eventName?.toLowerCase().includes(searchLower) || false) ||
      (transaction.orderSubmitter?.toLowerCase().includes(searchLower) || false) ||
      (transaction.paymentIntentId?.toLowerCase().includes(searchLower) || false) ||
      (transaction.formattedAmount.toLowerCase().includes(searchLower))
    );
  });
  
  // Apply filters and refetch data
  const applyFilters = () => {
    refetch();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter('');
    setSearchQuery('');
    refetch();
  };
  
  // Function to export data as CSV
  const exportToCsv = () => {
    if (!data?.data.length) {
      toast({
        title: 'No data to export',
        description: 'There is currently no data available to export.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // CSV headers
      const headers = [
        'ID',
        'Transaction Type',
        'Amount',
        'Status',
        'Payment Method',
        'Date Paid',
        'Date Settled',
        'Team Name',
        'Order Submitter',
        'Event Name',
        'Event Start Date'
      ];
      
      // Convert data to CSV rows
      const csvRows = [
        headers.join(','),
        ...filteredData!.map(t => [
          t.id,
          t.transactionType,
          t.formattedAmount,
          t.status,
          formatPaymentMethod(t),
          t.datePaid || 'N/A',
          t.dateSettled || 'N/A',
          t.teamName ? `"${t.teamName.replace(/"/g, '""')}"` : 'N/A',
          t.orderSubmitter ? `"${t.orderSubmitter.replace(/"/g, '""')}"` : 'N/A',
          t.eventName ? `"${t.eventName.replace(/"/g, '""')}"` : 'N/A',
          t.eventStartDate || 'N/A'
        ].join(','))
      ];
      
      // Create CSV content
      const csvContent = csvRows.join('\n');
      
      // Create Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `registration-orders-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: 'Export Successful',
        description: 'The report has been exported to CSV format.',
      });
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'There was a problem exporting the data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Registration Orders Report</h1>
        <p className="text-muted-foreground mt-2">View and analyze all payment transactions for team registrations</p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Filter the report data by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setIsStartDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setIsEndDateOpen(false);
                    }}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="partial_refund">Partial Refund</SelectItem>
                  <SelectItem value="chargeback">Chargeback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Search</label>
              <Input
                type="text"
                placeholder="Search by team, event, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
              
              <Button onClick={resetFilters} variant="outline" className="w-full md:w-auto">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Registration Order Transactions</CardTitle>
            <CardDescription>
              {filteredData ? `Showing ${filteredData.length} transactions` : 'Loading transaction data...'}
            </CardDescription>
          </div>
          
          <Button
            onClick={exportToCsv}
            disabled={isLoading || !data?.data.length || isExporting}
            className="ml-auto"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading report data...</span>
            </div>
          ) : !data?.data.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No transactions found</h3>
              <p className="text-muted-foreground max-w-md">
                There are no transaction records matching your current filters. Try changing your filter criteria or check back later.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableCaption>List of all registration order transactions</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredData && filteredData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.datePaid || 'N/A'}</TableCell>
                      <TableCell>
                        <TransactionStatusBadge status={transaction.status} />
                      </TableCell>
                      <TableCell>{transaction.formattedAmount}</TableCell>
                      <TableCell>{formatPaymentMethod(transaction)}</TableCell>
                      <TableCell>{transaction.teamName || 'N/A'}</TableCell>
                      <TableCell>{transaction.eventName || 'N/A'}</TableCell>
                      <TableCell>{transaction.orderSubmitter || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs">{transaction.paymentIntentId || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredData ? `Showing ${filteredData.length} of ${data?.data.length} transactions` : ''}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}